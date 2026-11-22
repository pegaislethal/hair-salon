import { Router, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import Appointment from '../models/Appointment';
import Service from '../models/Service';
import User from '../models/User';
import Notification from '../models/Notification';
import { authenticate, isAdminOrSubAdmin } from '../middleware/auth';
import { AuthRequest } from '../types';
import { generateBookingReference } from '../utils/generateToken';
import { sendEmail } from '../config/email';

const router = Router();

// @route   POST /api/appointments — Customer books an appointment
router.post('/', authenticate, [
  body('serviceId').notEmpty().withMessage('Service ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid date is required'),
  body('startTime').matches(/^\d{2}:\d{2}$/).withMessage('Start time must be HH:MM'),
  body('staffId').optional().isMongoId(),
  body('customerNotes').optional().isLength({ max: 500 }),
], async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return; }
  try {
    const { serviceId, appointmentDate, startTime, staffId, customerNotes } = req.body;
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) { res.status(404).json({ success: false, message: 'Service not found.' }); return; }
    // Calculate end time
    const [h, m] = startTime.split(':').map(Number);
    const totalMins = h * 60 + m + service.duration;
    const endTime = `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`;
    const bookingReference = generateBookingReference();
    const appointment = await Appointment.create({
      bookingReference,
      customer: req.user!.id,
      service: serviceId,
      staff: staffId || undefined,
      appointmentDate: new Date(appointmentDate),
      startTime,
      endTime,
      duration: service.duration,
      priceSnapshot: service.price,
      customerNotes,
      status: 'pending',
    });
    // Notify customer
    await Notification.create({ recipient: req.user!.id, type: 'booking_created', title: 'Booking Request Sent', message: `Your appointment (${bookingReference}) is pending confirmation.`, appointment: appointment._id });
    // Notify admins
    const admins = await User.find({ role: { $in: ['super_admin', 'sub_admin'] }, isActive: true });
    for (const admin of admins) {
      await Notification.create({ recipient: admin._id, type: 'new_booking', title: 'New Appointment Request', message: `New booking ${bookingReference} for ${service.name}.`, appointment: appointment._id });
      await sendEmail({ to: admin.email, subject: `New Booking Request — ${bookingReference}`, html: `<p>New appointment request <b>${bookingReference}</b> for <b>${service.name}</b> on ${appointmentDate} at ${startTime}.</p>` });
    }
    res.status(201).json({ success: true, message: 'Appointment booked successfully.', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   GET /api/appointments — Customer: own; Admin: all
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, page = 1, limit = 20, date } = req.query;
    const filter: any = {};
    if (req.user!.role === 'customer') filter.customer = req.user!.id;
    if (status) filter.status = status;
    if (date) { const d = new Date(date as string); filter.appointmentDate = { $gte: d, $lt: new Date(d.getTime() + 86400000) }; }
    const skip = (Number(page) - 1) * Number(limit);
    const [appointments, total] = await Promise.all([
      Appointment.find(filter).sort({ appointmentDate: -1 }).skip(skip).limit(Number(limit)).populate('customer', 'fullName email phone').populate('service', 'name price duration').populate('staff', 'fullName email'),
      Appointment.countDocuments(filter),
    ]);
    res.json({ success: true, data: appointments, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   GET /api/appointments/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('customer', 'fullName email phone').populate('service').populate('staff', 'fullName email');
    if (!appointment) { res.status(404).json({ success: false, message: 'Appointment not found.' }); return; }
    if (req.user!.role === 'customer' && appointment.customer._id.toString() !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Access denied.' }); return;
    }
    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PATCH /api/appointments/:id/accept — Admin
router.patch('/:id/accept', authenticate, isAdminOrSubAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('customer', 'fullName email phone').populate('service', 'name');
    if (!appointment) { res.status(404).json({ success: false, message: 'Appointment not found.' }); return; }
    if (appointment.status !== 'pending') { res.status(400).json({ success: false, message: 'Only pending appointments can be accepted.' }); return; }
    appointment.status = 'accepted';
    appointment.acceptedBy = req.user!.id as any;
    appointment.acceptedAt = new Date();
    appointment.notifications.confirmationSent = true;
    await appointment.save();
    const customer = appointment.customer as any;
    await Notification.create({ recipient: customer._id, type: 'booking_accepted', title: 'Appointment Confirmed!', message: `Your appointment ${appointment.bookingReference} has been confirmed.`, appointment: appointment._id });
    await sendEmail({ to: customer.email, subject: `Appointment Confirmed — ${appointment.bookingReference}`, html: `<p>Hi ${customer.fullName},</p><p>Your appointment <b>${appointment.bookingReference}</b> has been <b>confirmed</b>.</p>` });
    res.json({ success: true, message: 'Appointment accepted.', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PATCH /api/appointments/:id/reject — Admin
router.patch('/:id/reject', authenticate, isAdminOrSubAdmin, [body('reason').optional().isString()], async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('customer', 'fullName email phone').populate('service', 'name');
    if (!appointment) { res.status(404).json({ success: false, message: 'Appointment not found.' }); return; }
    if (!['pending', 'accepted'].includes(appointment.status)) { res.status(400).json({ success: false, message: 'Cannot reject this appointment.' }); return; }
    appointment.status = 'rejected';
    appointment.rejectionReason = req.body.reason || 'No reason provided.';
    appointment.notifications.rejectionSent = true;
    await appointment.save();
    const customer = appointment.customer as any;
    await Notification.create({ recipient: customer._id, type: 'booking_rejected', title: 'Appointment Not Available', message: `Your appointment ${appointment.bookingReference} was not accepted. Reason: ${appointment.rejectionReason}`, appointment: appointment._id });
    await sendEmail({ to: customer.email, subject: `Appointment Update — ${appointment.bookingReference}`, html: `<p>Hi ${customer.fullName},</p><p>Unfortunately your appointment was not available. Reason: ${appointment.rejectionReason}</p>` });
    res.json({ success: true, message: 'Appointment rejected.', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PATCH /api/appointments/:id/cancel — Customer or Admin
router.patch('/:id/cancel', authenticate, [body('reason').optional().isString()], async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('customer', 'fullName email phone');
    if (!appointment) { res.status(404).json({ success: false, message: 'Appointment not found.' }); return; }
    const customer = appointment.customer as any;
    if (req.user!.role === 'customer' && customer._id.toString() !== req.user!.id) { res.status(403).json({ success: false, message: 'Access denied.' }); return; }
    if (!['pending', 'accepted'].includes(appointment.status)) { res.status(400).json({ success: false, message: 'This appointment cannot be cancelled.' }); return; }
    appointment.status = 'cancelled';
    appointment.cancellationReason = req.body.reason || 'Cancelled by user.';
    appointment.cancelledBy = req.user!.id as any;
    appointment.notifications.cancellationSent = true;
    await appointment.save();
    await Notification.create({ recipient: customer._id, type: 'booking_cancelled', title: 'Appointment Cancelled', message: `Your appointment ${appointment.bookingReference} has been cancelled.`, appointment: appointment._id });
    res.json({ success: true, message: 'Appointment cancelled.', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PATCH /api/appointments/:id/complete — Admin
router.patch('/:id/complete', authenticate, isAdminOrSubAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) { res.status(404).json({ success: false, message: 'Appointment not found.' }); return; }
    if (appointment.status !== 'accepted') { res.status(400).json({ success: false, message: 'Only accepted appointments can be completed.' }); return; }
    appointment.status = 'completed';
    appointment.completedBy = req.user!.id as any;
    appointment.completedAt = new Date();
    await appointment.save();
    res.json({ success: true, message: 'Appointment marked as completed.', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PATCH /api/appointments/:id/reschedule — Customer or Admin
router.patch('/:id/reschedule', authenticate, [
  body('appointmentDate').isISO8601().withMessage('Valid date is required'),
  body('startTime').matches(/^\d{2}:\d{2}$/).withMessage('Start time must be HH:MM'),
], async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return; }
  try {
    const appointment = await Appointment.findById(req.params.id).populate('service');
    if (!appointment) { res.status(404).json({ success: false, message: 'Appointment not found.' }); return; }
    if (req.user!.role === 'customer' && appointment.customer.toString() !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Access denied.' }); return;
    }
    if (['cancelled', 'completed', 'rejected'].includes(appointment.status)) {
      res.status(400).json({ success: false, message: 'Cannot reschedule a completed, cancelled or rejected appointment.' }); return;
    }
    const { appointmentDate, startTime, staffId } = req.body;
    const duration = appointment.duration;
    const [h, m] = startTime.split(':').map(Number);
    const totalMins = h * 60 + m + duration;
    const endTime = `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`;

    appointment.rescheduledFrom = {
      date: appointment.appointmentDate,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
    };
    appointment.appointmentDate = new Date(appointmentDate);
    appointment.startTime = startTime;
    appointment.endTime = endTime;
    if (staffId !== undefined) appointment.staff = staffId || undefined;
    appointment.status = 'pending';
    await appointment.save();

    res.json({ success: true, message: 'Appointment rescheduled successfully.', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

export default router;
