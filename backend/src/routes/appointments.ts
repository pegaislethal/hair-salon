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
import {
  bookingPendingTemplate,
  bookingConfirmationTemplate,
  bookingRejectionTemplate,
  bookingCancellationTemplate,
  bookingRescheduleTemplate,
  newAppointmentAdminTemplate,
} from '../utils/emailTemplates';
import { randomUUID } from 'crypto';
import { dateBounds, getAvailableStaffForSlot, releaseSlot, reserveSlot, timeToMinutes } from '../utils/availability';

const router = Router();

// @route   POST /api/appointments — Customer books an appointment
router.post('/', authenticate, [
  body('serviceId').isMongoId().withMessage('Valid service ID is required'),
  body('appointmentDate').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must use YYYY-MM-DD format'),
  body('startTime').matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Start time must be HH:MM'),
  body('staffId').optional().isMongoId(),
  body('customerNotes').optional().isLength({ max: 500 }),
], async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return; }
  try {
    const { serviceId, appointmentDate, startTime, staffId, customerNotes } = req.body;
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) { res.status(404).json({ success: false, message: 'Service not found.' }); return; }
    const { start } = dateBounds(appointmentDate);
    if (!Number.isFinite(start.getTime()) || timeToMinutes(startTime) >= 1440) {
      res.status(400).json({ success: false, message: 'Invalid appointment date or time.' }); return;
    }
    const availableStaff = await getAvailableStaffForSlot(service, appointmentDate, startTime, staffId);
    if (!availableStaff.length) {
      res.status(409).json({ success: false, message: 'That time is no longer available. Please choose another slot.' }); return;
    }
    const reservationId = randomUUID();
    let staffUserId: import('mongoose').Types.ObjectId | undefined;
    for (const candidate of availableStaff) {
      const candidateUserId = candidate.user as unknown as import('mongoose').Types.ObjectId;
      try {
        await reserveSlot(candidateUserId, start, startTime, service.duration + (service.bufferDuration || 0), reservationId);
        staffUserId = candidateUserId;
        break;
      } catch (error) {
        await releaseSlot(reservationId);
        if ((error as { code?: number }).code !== 11000) throw error;
      }
    }
    if (!staffUserId) {
      res.status(409).json({ success: false, message: 'That time was just booked. Please choose another slot.' }); return;
    }
    const totalMins = timeToMinutes(startTime) + service.duration;
    const endTime = `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`;
    const bookingReference = generateBookingReference();
    let appointment;
    try {
      appointment = await Appointment.create({
        bookingReference,
        customer: req.user!.id,
        service: serviceId,
        staff: staffUserId,
        appointmentDate: start,
        startTime,
        endTime,
        duration: service.duration,
        priceSnapshot: service.price,
        reservationId,
        customerNotes,
        status: 'pending',
      });
    } catch (error) {
      await releaseSlot(reservationId);
      throw error;
    }
    // Notify customer after the appointment is persisted
    await Notification.create({ recipient: req.user!.id, type: 'booking_created', title: 'Booking Request Sent', message: `Your appointment (${bookingReference}) is pending confirmation.`, appointment: appointment._id });
    const customer = await User.findById(req.user!.id);
    if (customer?.email) {
      await sendEmail({
        to: customer.email,
        subject: `Booking Request Received — ${bookingReference}`,
        html: bookingPendingTemplate({ customerName: customer.fullName, bookingRef: bookingReference, serviceName: service.name, date: appointmentDate, time: startTime, price: service.price }),
        deduplicationKey: `appointment:${bookingReference}:pending`,
        type: 'appointment_pending',
      });
    }
    appointment.notifications.bookingRequestSent = true;
    await appointment.save();
    // Notify Super Admin; sub-admin in-app notifications remain unchanged
    const admins = await User.find({ role: { $in: ['super_admin', 'sub_admin'] }, isActive: true });
    for (const admin of admins) {
      await Notification.create({ recipient: admin._id, type: 'new_booking', title: 'New Appointment Request', message: `New booking ${bookingReference} for ${service.name}.`, appointment: appointment._id });
      if (admin.role === 'super_admin') {
        await sendEmail({
          to: admin.email,
          subject: `New Booking Request — ${bookingReference}`,
          html: newAppointmentAdminTemplate({ customerName: customer?.fullName || 'Customer', bookingRef: bookingReference, serviceName: service.name, date: appointmentDate, time: startTime }),
          deduplicationKey: `appointment:${bookingReference}:admin_new`,
          type: 'appointment_admin_new',
        });
      }
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
    await sendEmail({
      to: customer.email,
      subject: `Appointment Confirmed — ${appointment.bookingReference}`,
      html: bookingConfirmationTemplate({ customerName: customer.fullName, bookingRef: appointment.bookingReference, serviceName: (appointment.service as any)?.name || 'Salon service', date: appointment.appointmentDate.toISOString().slice(0, 10), time: appointment.startTime, price: appointment.priceSnapshot }),
      deduplicationKey: `appointment:${appointment.bookingReference}:accepted`,
      type: 'appointment_accepted',
    });
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
    if (appointment.reservationId) await releaseSlot(appointment.reservationId);
    const customer = appointment.customer as any;
    await Notification.create({ recipient: customer._id, type: 'booking_rejected', title: 'Appointment Not Available', message: `Your appointment ${appointment.bookingReference} was not accepted. Reason: ${appointment.rejectionReason}`, appointment: appointment._id });
    await sendEmail({
      to: customer.email,
      subject: `Appointment Update — ${appointment.bookingReference}`,
      html: bookingRejectionTemplate({ customerName: customer.fullName, bookingRef: appointment.bookingReference, serviceName: (appointment.service as any)?.name || 'Salon service', date: appointment.appointmentDate.toISOString().slice(0, 10), time: appointment.startTime, reason: appointment.rejectionReason }),
      deduplicationKey: `appointment:${appointment.bookingReference}:rejected`,
      type: 'appointment_rejected',
    });
    res.json({ success: true, message: 'Appointment rejected.', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PATCH /api/appointments/:id/cancel — Customer or Admin
router.patch('/:id/cancel', authenticate, [body('reason').optional().isString()], async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('customer', 'fullName email phone').populate('service', 'name');
    if (!appointment) { res.status(404).json({ success: false, message: 'Appointment not found.' }); return; }
    const customer = appointment.customer as any;
    if (req.user!.role === 'customer' && customer._id.toString() !== req.user!.id) { res.status(403).json({ success: false, message: 'Access denied.' }); return; }
    if (!['pending', 'accepted'].includes(appointment.status)) { res.status(400).json({ success: false, message: 'This appointment cannot be cancelled.' }); return; }
    appointment.status = 'cancelled';
    appointment.cancellationReason = req.body.reason || 'Cancelled by user.';
    appointment.cancelledBy = req.user!.id as any;
    appointment.notifications.cancellationSent = true;
    await appointment.save();
    if (appointment.reservationId) await releaseSlot(appointment.reservationId);
    await Notification.create({ recipient: customer._id, type: 'booking_cancelled', title: 'Appointment Cancelled', message: `Your appointment ${appointment.bookingReference} has been cancelled.`, appointment: appointment._id });
    await sendEmail({
      to: customer.email,
      subject: `Appointment Cancelled — ${appointment.bookingReference}`,
      html: bookingCancellationTemplate({ customerName: customer.fullName, bookingRef: appointment.bookingReference, serviceName: (appointment.service as any)?.name || 'Salon service', date: appointment.appointmentDate.toISOString().slice(0, 10), time: appointment.startTime, reason: appointment.cancellationReason }),
      deduplicationKey: `appointment:${appointment.bookingReference}:cancelled`,
      type: 'appointment_cancelled',
    });
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
    if (appointment.reservationId) await releaseSlot(appointment.reservationId);
    res.json({ success: true, message: 'Appointment marked as completed.', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PATCH /api/appointments/:id/reschedule — Customer or Admin
router.patch('/:id/reschedule', authenticate, [
  body('appointmentDate').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must use YYYY-MM-DD format'),
  body('startTime').matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Start time must be HH:MM'),
], async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return; }
  try {
    const appointment = await Appointment.findById(req.params.id).populate('customer', 'fullName email').populate('service');
    if (!appointment) { res.status(404).json({ success: false, message: 'Appointment not found.' }); return; }
    if (req.user!.role === 'customer' && appointment.customer.toString() !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Access denied.' }); return;
    }
    if (['cancelled', 'completed', 'rejected'].includes(appointment.status)) {
      res.status(400).json({ success: false, message: 'Cannot reschedule a completed, cancelled or rejected appointment.' }); return;
    }
    const { appointmentDate, startTime, staffId } = req.body;
    const duration = appointment.duration;
    const service = appointment.service as unknown as import('../models/Service').IService;
    const availableStaff = await getAvailableStaffForSlot(service, appointmentDate, startTime, staffId, appointment._id.toString(), appointment.reservationId);
    if (!availableStaff.length) { res.status(409).json({ success: false, message: 'That time is not available for the selected barber.' }); return; }
    const { start } = dateBounds(appointmentDate);
    const totalMins = timeToMinutes(startTime) + duration;
    const endTime = `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`;
    const staffUserId = availableStaff[0].user as unknown as import('mongoose').Types.ObjectId;
    const previousReservationId = appointment.reservationId;
    const previousStaffId = appointment.staff as import('mongoose').Types.ObjectId;
    const previousDate = appointment.appointmentDate;
    const previousStartTime = appointment.startTime;
    const sameReservation = previousReservationId
      && previousStaffId?.toString() === staffUserId.toString()
      && previousDate.toISOString().slice(0, 10) === start.toISOString().slice(0, 10)
      && previousStartTime === startTime;
    const reservationId = sameReservation ? previousReservationId : randomUUID();
    if (!sameReservation) {
      if (previousReservationId) await releaseSlot(previousReservationId);
      try {
        await reserveSlot(staffUserId, start, startTime, duration + (service.bufferDuration || 0), reservationId);
      } catch (error) {
        await releaseSlot(reservationId);
        if (previousReservationId && previousStaffId) {
          await reserveSlot(previousStaffId, previousDate, previousStartTime, duration + (service.bufferDuration || 0), previousReservationId);
        }
        if ((error as { code?: number }).code === 11000) {
          res.status(409).json({ success: false, message: 'That time was just booked. Please choose another slot.' }); return;
        }
        throw error;
      }
    }

    appointment.rescheduledFrom = {
      date: appointment.appointmentDate,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
    };
    appointment.appointmentDate = start;
    appointment.startTime = startTime;
    appointment.endTime = endTime;
    appointment.staff = staffUserId;
    appointment.reservationId = reservationId;
    appointment.status = 'pending';
    try {
      await appointment.save();
    } catch (error) {
      if (!sameReservation) {
        await releaseSlot(reservationId);
        if (previousReservationId && previousStaffId) {
          await reserveSlot(previousStaffId, previousDate, previousStartTime, duration + (service.bufferDuration || 0), previousReservationId);
        }
      }
      throw error;
    }

    const customer = appointment.customer as any;
    const rescheduledService = appointment.service as any;
    if (customer?.email && !appointment.notifications.rescheduledSent) {
      await sendEmail({
        to: customer.email,
        subject: `Appointment Rescheduled — ${appointment.bookingReference}`,
        html: bookingRescheduleTemplate({
          customerName: customer.fullName,
          bookingRef: appointment.bookingReference,
          serviceName: rescheduledService?.name || 'Salon service',
          date: appointmentDate,
          time: startTime,
          previousDate: previousDate.toISOString().slice(0, 10),
          previousTime: previousStartTime,
        }),
        deduplicationKey: `appointment:${appointment.bookingReference}:rescheduled:${appointmentDate}:${startTime}`,
        type: 'appointment_rescheduled',
      });
      appointment.notifications.rescheduledSent = true;
      await appointment.save();
    }

    res.json({ success: true, message: 'Appointment rescheduled successfully.', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

export default router;
