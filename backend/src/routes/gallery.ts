import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Gallery from '../models/Gallery';
import { authenticate, isAdminOrSubAdmin } from '../middleware/auth';

const router = Router();

// @route   GET /api/gallery — Public
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.query;
    const filter: any = { isActive: true };
    if (category) filter.category = category;
    const gallery = await Gallery.find(filter).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: gallery });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
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
