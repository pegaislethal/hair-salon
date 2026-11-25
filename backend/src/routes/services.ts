import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Service from '../models/Service';
import { authenticate, isSuperAdmin } from '../middleware/auth';

const router = Router();

// @route   GET /api/services — Public
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, active = 'true' } = req.query;
    const filter: any = {};
    if (active === 'true') filter.isActive = true;
    if (category) filter.category = category;
    const services = await Service.find(filter).sort({ category: 1, name: 1 });
    res.json({ success: true, data: services });
  } catch (error) {
    console.error('[SERVICES] Failed to load service catalog:', error instanceof Error ? error.message : 'Unknown error.');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   GET /api/services/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) { res.status(404).json({ success: false, message: 'Service not found.' }); return; }
    res.json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   POST /api/services — Admin only
router.post('/', authenticate, isSuperAdmin, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('duration').isInt({ min: 5 }).withMessage('Duration must be at least 5 minutes'),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return; }
  try {
    const service = await Service.create(req.body);
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PUT /api/services/:id — Admin only
router.put('/:id', authenticate, isSuperAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!service) { res.status(404).json({ success: false, message: 'Service not found.' }); return; }
    res.json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   DELETE /api/services/:id — Admin only (soft delete)
router.delete('/:id', authenticate, isSuperAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!service) { res.status(404).json({ success: false, message: 'Service not found.' }); return; }
    res.json({ success: true, message: 'Service deactivated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

export default router;
