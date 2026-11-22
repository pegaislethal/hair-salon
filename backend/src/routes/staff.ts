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
      .populate('user', 'fullName profileImage isActive')
      .populate('services', 'name price duration category');
    res.json({ success: true, data: staff.filter((member) => (member.user as unknown as { isActive?: boolean })?.isActive) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   GET /api/staff/management — Admin and sub-admin schedule view
router.get('/management', authenticate, isAdminOrSubAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staff = await Staff.find()
      .populate('user', 'fullName email phone profileImage isActive')
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
      .populate('user', 'fullName profileImage')
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
    const { fullName, email, phone, password, bio, profileImage, specializations, services, workingHours, breaks, daysOff } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) { res.status(400).json({ success: false, message: 'Email already in use.' }); return; }
    const user = await User.create({ fullName, email, phone, password, role: 'sub_admin', isEmailVerified: true });
    const staff = await Staff.create({ user: user._id, bio, profileImage, specializations, services, workingHours, breaks, daysOff });
    res.status(201).json({ success: true, data: { user, staff } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PUT /api/staff/:id — Admin
router.put('/:id', authenticate, isSuperAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profileFields = ['bio', 'profileImage', 'specializations', 'services', 'workingHours', 'breaks', 'daysOff', 'isActive'];
    const update: Record<string, unknown> = {};
    for (const field of profileFields) if (req.body[field] !== undefined) update[field] = req.body[field];
    const staffRecord = await Staff.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    const staff = await staffRecord?.populate('services', 'name');
    if (!staff) { res.status(404).json({ success: false, message: 'Staff not found.' }); return; }
    const userUpdate: Record<string, unknown> = {};
    for (const field of ['fullName', 'email', 'phone']) if (req.body[field] !== undefined) userUpdate[field] = req.body[field];
    if (typeof req.body.isActive === 'boolean') userUpdate.isActive = req.body.isActive;
    if (req.body.email) userUpdate.email = String(req.body.email).toLowerCase();
    if (req.body.profileImage !== undefined) userUpdate.profileImage = req.body.profileImage;
    if (Object.keys(userUpdate).length) await User.findByIdAndUpdate(staff.user, userUpdate, { runValidators: true });
    await staff.populate('user', 'fullName email phone profileImage isActive');
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
