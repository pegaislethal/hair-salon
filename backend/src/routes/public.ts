import { Router, Request, Response } from 'express';
import Service from '../models/Service';
import Staff from '../models/Staff';
import Gallery from '../models/Gallery';
import SalonSettings from '../models/SalonSettings';
import { getAvailableSlots } from '../utils/availability';
import { IService } from '../models/Service';
import mongoose from 'mongoose';

const router = Router();

// @route   GET /api/public/salon-info
router.get('/salon-info', async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await SalonSettings.findOne();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   GET /api/public/services
router.get('/services', async (req: Request, res: Response): Promise<void> => {
  try {
    const services = await Service.find({ isActive: true }).sort({ category: 1, name: 1 });
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   GET /api/public/staff
router.get('/staff', async (req: Request, res: Response): Promise<void> => {
  try {
    const staff = await Staff.find({ isActive: true }).populate('user', 'fullName profileImage isActive').populate('services', 'name');
    res.json({ success: true, data: staff.filter((member) => (member.user as unknown as { isActive?: boolean })?.isActive) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.get('/available-staff', async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceId, date } = req.query;
    if (typeof serviceId !== 'string' || !mongoose.isValidObjectId(serviceId) || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ success: false, message: 'A valid serviceId and YYYY-MM-DD date are required.' }); return;
    }
    const service = await Service.findById(serviceId) as unknown as import('../models/Service').IService | null;
    if (!service?.isActive) { res.status(404).json({ success: false, message: 'Service not found.' }); return; }
    if (!Number.isFinite(new Date(`${date}T00:00:00.000Z`).getTime()) || new Date(`${date}T00:00:00.000Z`).toISOString().slice(0, 10) !== date) {
      res.status(400).json({ success: false, message: 'Invalid calendar date.' }); return;
    }
    const staff = await Staff.find({ isActive: true })
      .populate('user', 'fullName profileImage isActive')
      .populate('services', 'name');
    const availableStaff = await Promise.all(staff.map(async (barber) => {
      const user = barber.user as unknown as { isActive?: boolean };
      if (!user?.isActive) return null;
      return (await getAvailableSlots(service, date, barber._id.toString())).length ? barber._id.toString() : null;
    }));
    res.json({ success: true, data: availableStaff.filter((id): id is string => Boolean(id)) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load barber availability.' });
  }
});

// @route   GET /api/public/gallery
router.get('/gallery', async (req: Request, res: Response): Promise<void> => {
  try {
    const gallery = await Gallery.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, data: gallery });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   GET /api/public/available-slots?serviceId=&date=&staffId=
router.get('/available-slots', async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceId, date, staffId } = req.query;
    if (typeof serviceId !== 'string' || !mongoose.isValidObjectId(serviceId) || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ success: false, message: 'A valid serviceId and YYYY-MM-DD date are required.' }); return;
    }
    const service = await Service.findById(String(serviceId)) as unknown as IService | null;
    if (!service) { res.status(404).json({ success: false, message: 'Service not found.' }); return; }
    if (!service.isActive) { res.status(404).json({ success: false, message: 'Service not found.' }); return; }
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ success: false, message: 'date must use YYYY-MM-DD format.' }); return;
    }
    if (!Number.isFinite(new Date(`${date}T00:00:00.000Z`).getTime()) || new Date(`${date}T00:00:00.000Z`).toISOString().slice(0, 10) !== date) {
      res.status(400).json({ success: false, message: 'Invalid calendar date.' }); return;
    }
    const availableSlots = await getAvailableSlots(service, date, typeof staffId === 'string' ? staffId : undefined);
    res.json({ success: true, data: availableSlots });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   GET /api/public/cron/reminders — Scheduled reminder trigger (for Vercel Cron or external ping)
router.get('/cron/reminders', async (req: Request, res: Response): Promise<void> => {
  try {
    const { runReminderCheck } = await import('../jobs/reminders');
    const result = await runReminderCheck();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error executing reminder check.' });
  }
});

export default router;
