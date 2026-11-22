import { Router, Response } from 'express';
import User from '../models/User';
import Appointment from '../models/Appointment';
import { authenticate, isAdminOrSubAdmin } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// @route   GET /api/customers — Admin only
router.get('/', authenticate, isAdminOrSubAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter: any = { role: 'customer' };
    if (search) filter.$or = [{ fullName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }];
    const skip = (Number(page) - 1) * Number(limit);
    const [customers, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).select('-password'),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, data: customers, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   GET /api/customers/:id — Admin only
router.get('/:id', authenticate, isAdminOrSubAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customer = await User.findOne({ _id: req.params.id, role: 'customer' }).select('-password');
    if (!customer) { res.status(404).json({ success: false, message: 'Customer not found.' }); return; }
    const appointments = await Appointment.find({ customer: req.params.id }).sort({ appointmentDate: -1 }).limit(10).populate('service', 'name price');
    res.json({ success: true, data: { customer, appointments } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PATCH /api/customers/:id/toggle-status — Admin only
router.patch('/:id/toggle-status', authenticate, isAdminOrSubAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customer = await User.findOne({ _id: req.params.id, role: 'customer' });
    if (!customer) { res.status(404).json({ success: false, message: 'Customer not found.' }); return; }
    customer.isActive = !customer.isActive;
    await customer.save({ validateBeforeSave: false });
    res.json({ success: true, message: `Customer ${customer.isActive ? 'activated' : 'deactivated'}.`, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

export default router;
