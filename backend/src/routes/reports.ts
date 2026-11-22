import { Router, Response } from 'express';
import Appointment from '../models/Appointment';
import User from '../models/User';
import Service from '../models/Service';
import { authenticate, isAdminOrSubAdmin } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// @route   GET /api/reports/dashboard — Admin
router.get('/dashboard', authenticate, isAdminOrSubAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [
      totalCustomers,
      totalAppointments,
      pendingAppointments,
      todayAppointments,
      monthlyRevenue,
      recentAppointments,
      statusBreakdown,
    ] = await Promise.all([
      User.countDocuments({ role: 'customer', isActive: true }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'pending' }),
      Appointment.countDocuments({ appointmentDate: { $gte: today, $lt: tomorrow } }),
      Appointment.aggregate([
        { $match: { status: 'completed', appointmentDate: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$priceSnapshot' } } },
      ]),
      Appointment.find().sort({ createdAt: -1 }).limit(5).populate('customer', 'fullName email').populate('service', 'name'),
      Appointment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    res.json({
      success: true,
      data: {
        totalCustomers,
        totalAppointments,
        pendingAppointments,
        todayAppointments,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        recentAppointments,
        statusBreakdown: statusBreakdown.reduce((acc: any, s: any) => { acc[s._id] = s.count; return acc; }, {}),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   GET /api/reports/revenue — Admin
router.get('/revenue', authenticate, isAdminOrSubAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const monthlyRevenue = await Appointment.aggregate([
      { $match: { status: 'completed', appointmentDate: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) } } },
      { $group: { _id: { $month: '$appointmentDate' }, revenue: { $sum: '$priceSnapshot' }, count: { $sum: 1 } } },
      { $sort: { '_id': 1 } },
    ]);
    res.json({ success: true, data: monthlyRevenue });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   GET /api/reports/popular-services — Admin
router.get('/popular-services', authenticate, isAdminOrSubAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const popular = await Appointment.aggregate([
      { $match: { status: { $in: ['completed', 'accepted'] } } },
      { $group: { _id: '$service', count: { $sum: 1 }, revenue: { $sum: '$priceSnapshot' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } },
      { $unwind: '$service' },
    ]);
    res.json({ success: true, data: popular });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

export default router;
