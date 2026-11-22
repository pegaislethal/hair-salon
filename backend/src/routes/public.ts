import { Router, Request, Response } from 'express';
import Service from '../models/Service';
import Staff from '../models/Staff';
import Gallery from '../models/Gallery';
import SalonSettings from '../models/SalonSettings';
import Appointment from '../models/Appointment';

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
    const staff = await Staff.find({ isActive: true }).populate('user', 'fullName profileImage').populate('services', 'name');
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
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
    if (!serviceId || !date) { res.status(400).json({ success: false, message: 'serviceId and date are required.' }); return; }
    const service = await Service.findById(serviceId);
    if (!service) { res.status(404).json({ success: false, message: 'Service not found.' }); return; }
    const settings = await SalonSettings.findOne();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDate = new Date(date as string);
    const dayName = days[targetDate.getDay()] as keyof typeof settings.businessHours;
    const hours = settings?.businessHours?.[dayName];
    if (!hours || (hours as any).isClosed) { res.json({ success: true, data: [], message: 'Salon is closed on this day.' }); return; }
    const { open, close } = hours as any;
    const slotInterval = settings?.bookingSettings?.appointmentSlotInterval || 30;
    // Generate slots
    const slots: string[] = [];
    let [sh, sm] = open.split(':').map(Number);
    const [eh, em] = close.split(':').map(Number);
    while (sh * 60 + sm + service.duration <= eh * 60 + em) {
      slots.push(`${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`);
      sm += slotInterval;
      if (sm >= 60) { sh += Math.floor(sm / 60); sm = sm % 60; }
    }
    // Filter booked slots
    const start = new Date(targetDate); start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate); end.setHours(23, 59, 59, 999);
    const filter: any = { appointmentDate: { $gte: start, $lte: end }, status: { $in: ['pending', 'accepted'] } };
    if (staffId) filter.staff = staffId;
    const bookedAppointments = await Appointment.find(filter);
    const bookedTimes = new Set(bookedAppointments.map(a => a.startTime));
    const availableSlots = slots.filter(s => !bookedTimes.has(s));
    res.json({ success: true, data: availableSlots });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

export default router;
