import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { body, validationResult } from 'express-validator';
import Gallery from '../models/Gallery';
import { authenticate, isAdminOrSubAdmin } from '../middleware/auth';
import { deleteFromCloudinary, uploadToCloudinary } from '../config/cloudinary';
import { logSafeError } from '../utils/logSafeError';

const router = Router();
const MAX_BULK_ITEMS = 20;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const acceptedImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

const bulkImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE, files: MAX_BULK_ITEMS, fieldSize: 256 * 1024 },
});

const parseBulkImages = (req: Request, res: Response, next: NextFunction): void => {
  bulkImageUpload.array('images', MAX_BULK_ITEMS)(req, res, (error) => {
    if (!error) {
      next();
      return;
    }
    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'Each image must be 5 MB or smaller.'
        : 'Upload at most 20 images at a time.';
      res.status(400).json({ success: false, message });
      return;
    }
    next(error);
  });
};

interface BulkGalleryItemInput {
  title?: unknown;
  description?: unknown;
  imageUrl?: unknown;
  fileIndex?: unknown;
}

interface BulkGalleryMetadata {
  category?: unknown;
  tags?: unknown;
  isActive?: unknown;
  items?: unknown;
}

const isValidImageUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

// @route   GET /api/gallery — Public
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.query;
    const filter: any = { isActive: true };
    if (category) filter.category = category;
    res.set('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=120');
    const gallery = await Gallery.find(filter)
      .select('_id title description image category tags order isActive createdAt updatedAt')
      .sort({ order: 1, createdAt: -1 })
      .lean();
    res.json({ success: true, data: gallery });
  } catch (error) {
    logSafeError('GALLERY Failed to load public gallery', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.get('/admin', authenticate, isAdminOrSubAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const gallery = await Gallery.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: gallery });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load gallery items.' });
  }
});

router.post('/bulk', authenticate, isAdminOrSubAdmin, parseBulkImages, async (req: Request, res: Response): Promise<void> => {
  let parsedMetadata: unknown;
  try {
    parsedMetadata = JSON.parse(req.body.metadata);
  } catch {
    res.status(400).json({ success: false, message: 'Bulk gallery metadata must be valid JSON.' });
    return;
  }
  if (!parsedMetadata || typeof parsedMetadata !== 'object' || Array.isArray(parsedMetadata)) {
    res.status(400).json({ success: false, message: 'Bulk gallery metadata must be a JSON object.' });
    return;
  }
  const metadata = parsedMetadata as BulkGalleryMetadata;

  const files = (req.files || []) as Express.Multer.File[];
  const items = metadata.items;
  if (!Array.isArray(items) || items.length < 1 || items.length > MAX_BULK_ITEMS) {
    res.status(400).json({ success: false, message: 'Add between 1 and 20 gallery items.' });
    return;
  }

  const category = typeof metadata.category === 'string' ? metadata.category.trim() : '';
  const isActive = typeof metadata.isActive === 'boolean' ? metadata.isActive : true;
  if (!category || category.length > 60) {
    res.status(400).json({ success: false, message: 'Category is required and must be 60 characters or fewer.' });
    return;
  }
  if (metadata.isActive !== undefined && typeof metadata.isActive !== 'boolean') {
    res.status(400).json({ success: false, message: 'Visibility must be a boolean value.' });
    return;
  }
  const tags = metadata.tags === undefined ? [] : metadata.tags;
  if (!Array.isArray(tags) || tags.length > 10 || tags.some((tag) => typeof tag !== 'string' || tag.trim().length > 30)) {
    res.status(400).json({ success: false, message: 'Tags must contain up to 10 values of 30 characters or fewer.' });
    return;
  }

  const errors: Array<{ index: number; title: string; message: string }> = [];
  const validatedItems: Array<{
    index: number;
    title: string;
    description: string;
    imageUrl?: string;
    file?: Express.Multer.File;
  }> = [];
  const referencedFiles = new Set<number>();

  items.forEach((value: BulkGalleryItemInput, index: number) => {
    const item = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const title = typeof item.title === 'string' ? item.title.trim() : '';
    const description = typeof item.description === 'string' ? item.description.trim() : '';
    const hasUrl = item.imageUrl !== undefined;
    const hasFileIndex = item.fileIndex !== undefined;
    const fail = (message: string) => errors.push({ index, title, message });

    if (!title || title.length > 120) {
      fail('Title is required and must be 120 characters or fewer.');
      return;
    }
    if (item.description !== undefined && typeof item.description !== 'string') {
      fail('Caption must be text.');
      return;
    }
    if (description.length > 500) {
      fail('Caption must be 500 characters or fewer.');
      return;
    }
    if (hasUrl === hasFileIndex) {
      fail('Provide exactly one image URL or uploaded image.');
      return;
    }

    if (hasUrl) {
      if (typeof item.imageUrl !== 'string') {
        fail('Image URL must be text.');
        return;
      }
      const imageUrl = (item.imageUrl as string).trim();
      if (!imageUrl || imageUrl.length > 2048 || !isValidImageUrl(imageUrl)) {
        fail('Enter a valid HTTP or HTTPS image URL.');
        return;
      }
      validatedItems.push({ index, title, description, imageUrl });
      return;
    }

    const fileIndex = item.fileIndex as number;
    const file = files[fileIndex];
    if (!Number.isInteger(fileIndex) || fileIndex < 0 || !file) {
      fail('Uploaded image reference is invalid.');
      return;
    }
    if (referencedFiles.has(fileIndex)) {
      fail('An uploaded image can only be used once.');
      return;
    }
    referencedFiles.add(fileIndex);
    if (!acceptedImageExtensions.has(path.extname(file.originalname).toLowerCase()) || !acceptedImageTypes.has(file.mimetype)) {
      fail('Use a JPG, PNG, GIF, or WebP image.');
      return;
    }
    validatedItems.push({ index, title, description, file });
  });

  files.forEach((file, fileIndex) => {
    if (!referencedFiles.has(fileIndex)) {
      errors.push({ index: items.length + fileIndex, title: file.originalname, message: 'Uploaded image is not assigned to a gallery item.' });
    }
  });

  const created: Array<{ index: number; item: unknown }> = [];
  for (const item of validatedItems) {
    let uploaded: { url: string; publicId: string } | undefined;
    try {
      let image = item.imageUrl;
      if (item.file) {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
          throw new Error('Image uploads are not configured. Add Cloudinary credentials or use image URLs.');
        }
        uploaded = await uploadToCloudinary(item.file.buffer, 'iris-salon/gallery');
        image = uploaded.url;
      }
      const galleryItem = await Gallery.create({
        title: item.title,
        description: item.description || undefined,
        image,
        category,
        tags: tags.map((tag: string) => tag.trim()).filter(Boolean),
        isActive,
      });
      created.push({ index: item.index, item: galleryItem });
    } catch (error) {
      if (uploaded) {
        try {
          await deleteFromCloudinary(uploaded.publicId);
        } catch (cleanupError) {
          console.error('[GALLERY] Unable to clean up failed bulk upload:', cleanupError);
        }
      }
      errors.push({
        index: item.index,
        title: item.title,
        message: error instanceof Error ? error.message : 'Unable to create gallery item.',
      });
    }
  }

  res.status(errors.length ? 207 : 201).json({
    success: errors.length === 0,
    message: errors.length
      ? `Created ${created.length} of ${items.length} gallery items.`
      : `Created ${created.length} gallery items.`,
    data: created,
    errors,
  });
});

// @route   POST /api/gallery — Admin
router.post('/', authenticate, isAdminOrSubAdmin, [
  body('title').trim().notEmpty(),
  body('image').trim().notEmpty(),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return; }
  try {
    const item = await Gallery.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PUT /api/gallery/:id — Admin
router.put('/:id', authenticate, isAdminOrSubAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await Gallery.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) { res.status(404).json({ success: false, message: 'Gallery item not found.' }); return; }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   DELETE /api/gallery/:id — Admin
router.delete('/:id', authenticate, isAdminOrSubAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await Gallery.findByIdAndDelete(req.params.id);
    if (!item) { res.status(404).json({ success: false, message: 'Gallery item not found.' }); return; }
    res.json({ success: true, message: 'Gallery item deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

export default router;
