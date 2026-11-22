import { Router, Request, Response } from 'express';
import SalonSettings from '../models/SalonSettings';
import { authenticate, isSuperAdmin } from '../middleware/auth';

const router = Router();

// @route   GET /api/settings — Public
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    let settings = await SalonSettings.findOne();
    if (!settings) settings = await SalonSettings.create({});
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PUT /api/settings — SuperAdmin only
router.put('/', authenticate, isSuperAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    let settings = await SalonSettings.findOne();
    if (!settings) {
      settings = await SalonSettings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.json({ success: true, data: settings, message: 'Settings updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

export default router;
