import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Staff from '../models/Staff';
import User from '../models/User';
import { authenticate, isAdminOrSubAdmin, isSuperAdmin } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// @route   GET /api/staff — Public
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const staff = await Staff.find({ isActive: true })
      .populate('user', 'fullName email profileImage')
      .populate('services', 'name price duration category');
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   GET /api/staff/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const staff = await Staff.findById(req.params.id)
      .populate('user', 'fullName email profileImage')
      .populate('services', 'name price duration');
    if (!staff) { res.status(404).json({ success: false, message: 'Staff not found.' }); return; }
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   POST /api/staff — SuperAdmin only: create sub_admin + staff profile
router.post('/', authenticate, isSuperAdmin, [
  body('fullName').trim().notEmpty(),
  body('email').isEmail(),
  body('phone').trim().notEmpty(),
  body('password').isLength({ min: 6 }),
], async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return; }
  try {
    const { fullName, email, phone, password, bio, services, workingHours } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) { res.status(400).json({ success: false, message: 'Email already in use.' }); return; }
    const user = await User.create({ fullName, email, phone, password, role: 'sub_admin', isEmailVerified: true });
    const staff = await Staff.create({ user: user._id, bio, services, workingHours });
    res.status(201).json({ success: true, data: { user, staff } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PUT /api/staff/:id — Admin
router.put('/:id', authenticate, isAdminOrSubAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('user', 'fullName email').populate('services', 'name');
    if (!staff) { res.status(404).json({ success: false, message: 'Staff not found.' }); return; }
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   DELETE /api/staff/:id — SuperAdmin
router.delete('/:id', authenticate, isSuperAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!staff) { res.status(404).json({ success: false, message: 'Staff not found.' }); return; }
    await User.findByIdAndUpdate(staff.user, { isActive: false });
    res.json({ success: true, message: 'Staff deactivated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

export default router;
