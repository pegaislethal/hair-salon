import { Router, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import Appointment from '../models/Appointment';
import Service from '../models/Service';
import User from '../models/User';
import Notification from '../models/Notification';
import { authenticate, isAdminOrSubAdmin } from '../middleware/auth';
import { AuthRequest } from '../types';
import { generateBookingReference } from '../utils/generateToken';
import { normalizeNepalPhone } from '../utils/nepalPhone';
import { sendEmail } from '../config/email';
import {
  bookingPendingTemplate,
  bookingConfirmationTemplate,
  bookingRejectionTemplate,
  bookingCancellationTemplate,
  bookingAlternativeTemplate,
  bookingSuggestionResponseTemplate,
  bookingSuggestionResponseAdminTemplate,
  bookingRescheduleTemplate,
  newAppointmentAdminTemplate,
} from '../utils/emailTemplates';
import { randomUUID } from 'crypto';
import {
  dateBounds,
  getAvailableStaffForSlot,
  isVirtualBarberAvailableForSlot,
  releaseSlot,
  reserveSlot,
  reserveVirtualBarberSlot,
  timeToMinutes,
} from '../utils/availability';

const router = Router();

// @route   POST /api/appointments — Customer books an appointment
router.post('/', authenticate, [
  body('serviceId').isMongoId().withMessage('Valid service ID is required'),
  body('appointmentDate').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must use YYYY-MM-DD format'),
  body('startTime').matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Start time must be HH:MM'),
  body('barberName').isIn(['Lycan']).withMessage('Lycan is the only barber currently available for booking.'),
  body('customerNotes').optional().isLength({ max: 500 }),
], async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return; }
  try {
    const { serviceId, appointmentDate, startTime, barberName, customerNotes } = req.body;
    const customer = await User.findById(req.user!.id);
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found.' });
      return;
    }
    const phoneValidation = normalizeNepalPhone(customer.phone);
    if (!phoneValidation.valid) {
      res.status(400).json({
        success: false,
        message: 'Update your profile with a valid Nepal mobile number before booking.',
      });
      return;
    }
    if (customer.phone !== phoneValidation.normalized) {
      customer.phone = phoneValidation.normalized;
      await customer.save({ validateBeforeSave: false });
    }

    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) { res.status(404).json({ success: false, message: 'Service not found.' }); return; }
    const { start } = dateBounds(appointmentDate);
    const requestedTimestamp = start.getTime() + (timeToMinutes(startTime) - 345) * 60000;
    if (!Number.isFinite(start.getTime()) || timeToMinutes(startTime) >= 1440 || requestedTimestamp <= Date.now()) {
      res.status(400).json({ success: false, message: 'Invalid appointment date or time.' }); return;
    }
    const totalMins = timeToMinutes(startTime) + service.duration;
    const endTime = `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`;
    const bookingReference = generateBookingReference();
    const appointment = await Appointment.create({
      bookingReference,
      customer: req.user!.id,
      service: serviceId,
      requestedBarberName: barberName,
      requestedAppointmentDate: start,
      requestedStartTime: startTime,
      appointmentDate: start,
      startTime,
      endTime,
      duration: service.duration,
      priceSnapshot: service.price,
      customerNotes,
      status: 'pending',
    });
    // Notify customer after the appointment is persisted
    await Notification.create({ recipient: req.user!.id, type: 'booking_created', title: 'Booking Request Sent', message: `Your appointment (${bookingReference}) is pending confirmation.`, appointment: appointment._id });
    if (customer?.email) {
      await sendEmail({
        to: customer.email,
        subject: `Booking Request Received — ${bookingReference}`,
        html: bookingPendingTemplate({ customerName: customer.fullName, bookingRef: bookingReference, serviceName: service.name, date: appointmentDate, time: startTime, price: service.price, barberName }),
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
          html: newAppointmentAdminTemplate({
            customerName: customer?.fullName || 'Customer',
            customerEmail: customer?.email,
            customerPhone: customer?.phone,
            bookingRef: bookingReference,
            serviceName: service.name,
            date: appointmentDate,
            time: startTime,
            barberName,
          }),
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
    if (typeof date === 'string') {
      const { start, end } = dateBounds(date);
      if (!Number.isFinite(start.getTime())) {
        res.status(400).json({ success: false, message: 'Invalid appointment date.' });
        return;
      }
      filter.$or = [
        { requestedAppointmentDate: { $gte: start, $lt: end } },
        { requestedAppointmentDate: { $exists: false }, appointmentDate: { $gte: start, $lt: end } },
      ];
    }
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
  let reservationId: string | undefined;
  let reservationCreated = false;
  let priorReservationId: string | undefined;
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('customer', 'fullName email phone')
      .populate('service', 'name price duration bufferDuration');
    if (!appointment) { res.status(404).json({ success: false, message: 'Appointment not found.' }); return; }
    if (appointment.status !== 'pending') { res.status(400).json({ success: false, message: 'Only pending appointments can be accepted.' }); return; }
    priorReservationId = appointment.reservationId;
    const requestedDate = appointment.requestedAppointmentDate || appointment.appointmentDate;
    const requestedTime = appointment.requestedStartTime || appointment.startTime;
    const dateKey = requestedDate.toISOString().slice(0, 10);
    const { start } = dateBounds(dateKey);
    const service = appointment.service as unknown as import('../models/Service').IService;
    const barberName = appointment.requestedBarberName;

    if (barberName) {
      if (!await isVirtualBarberAvailableForSlot(service, dateKey, requestedTime, barberName, appointment._id.toString(), appointment.reservationId)) {
        res.status(409).json({ success: false, message: 'The requested time is unavailable. Suggest another time to the customer.' });
        return;
      }
      reservationId = randomUUID();
      reservationCreated = true;
      await reserveVirtualBarberSlot(barberName, start, requestedTime, appointment.duration + (service.bufferDuration || 0), reservationId);
    } else if (appointment.staff) {
      const availableStaff = await getAvailableStaffForSlot(service, dateKey, requestedTime, undefined, appointment._id.toString(), appointment.reservationId);
      const selectedStaff = availableStaff.find((candidate) =>
        (candidate.user as unknown as import('mongoose').Types.ObjectId).toString() === appointment.staff!.toString()
      );
      if (!selectedStaff) {
        res.status(409).json({ success: false, message: 'The selected barber is unavailable. Suggest another time to the customer.' });
        return;
      }
      const hasMatchingReservation = appointment.reservationId
        && appointment.appointmentDate.toISOString().slice(0, 10) === dateKey
        && appointment.startTime === requestedTime;
      if (hasMatchingReservation) {
        reservationId = appointment.reservationId;
      } else {
        reservationId = randomUUID();
        reservationCreated = true;
        await reserveSlot(appointment.staff, start, requestedTime, appointment.duration + (service.bufferDuration || 0), reservationId);
      }
    } else {
      res.status(409).json({ success: false, message: 'No barber is assigned to this appointment.' });
      return;
    }

    const totalMins = timeToMinutes(requestedTime) + appointment.duration;
    appointment.appointmentDate = start;
    appointment.startTime = requestedTime;
    appointment.endTime = `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`;
    appointment.reservationId = reservationId;
    appointment.status = 'confirmed';
    appointment.acceptedBy = req.user!.id as any;
    appointment.acceptedAt = new Date();
    appointment.notifications.confirmationSent = false;
    try {
      await appointment.save();
    } catch (error) {
      if (reservationCreated) await releaseSlot(reservationId);
      reservationId = undefined;
      reservationCreated = false;
      if ((error as { code?: number }).code === 11000) {
        res.status(409).json({ success: false, message: 'That time was just booked. Suggest another time to the customer.' });
        return;
      }
      throw error;
    }
    const committedReservationId = reservationId;
    reservationId = undefined;
    reservationCreated = false;
    if (priorReservationId && priorReservationId !== committedReservationId) await releaseSlot(priorReservationId);
    const customer = appointment.customer as any;
    await Notification.create({ recipient: customer._id, type: 'booking_accepted', title: 'Appointment Confirmed!', message: `Your appointment ${appointment.bookingReference} has been confirmed.`, appointment: appointment._id });
    if (customer.email) {
      const emailResult = await sendEmail({
        to: customer.email,
        subject: `Appointment Confirmed — ${appointment.bookingReference}`,
        html: bookingConfirmationTemplate({ customerName: customer.fullName, bookingRef: appointment.bookingReference, serviceName: (appointment.service as any)?.name || 'Salon service', date: dateKey, time: requestedTime, price: appointment.priceSnapshot }),
        deduplicationKey: `appointment:${appointment.bookingReference}:confirmed`,
        type: 'appointment_confirmed',
      });
      appointment.notifications.confirmationSent = emailResult.success;
      await appointment.save();
    }
    res.json({ success: true, message: 'Appointment confirmed.', data: appointment });
  } catch (error) {
    if (reservationId && reservationCreated) await releaseSlot(reservationId);
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ success: false, message: 'That time was just booked. Suggest another time to the customer.' });
      return;
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PATCH /api/appointments/:id/suggest-time — Admin
router.patch('/:id/suggest-time', authenticate, isAdminOrSubAdmin, [
  body('appointmentDate').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must use YYYY-MM-DD format'),
  body('startTime').matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Time must be HH:MM'),
], async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return; }
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('customer', 'fullName email phone')
      .populate('service', 'name price duration bufferDuration');
    if (!appointment) { res.status(404).json({ success: false, message: 'Appointment not found.' }); return; }
    if (!['pending', 'reschedule_requested'].includes(appointment.status)) {
      res.status(400).json({ success: false, message: 'Only pending requests can be offered another time.' });
      return;
    }
    if (!appointment.requestedBarberName) {
      res.status(400).json({ success: false, message: 'This appointment has no supported barber selection.' });
      return;
    }

    const { appointmentDate, startTime } = req.body;
    const { start } = dateBounds(appointmentDate);
    if (!Number.isFinite(start.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid appointment date.' });
      return;
    }
    const requestedDate = appointment.requestedAppointmentDate || appointment.appointmentDate;
    const requestedTime = appointment.requestedStartTime || appointment.startTime;
    if (requestedDate.toISOString().slice(0, 10) === appointmentDate && requestedTime === startTime) {
      res.status(400).json({ success: false, message: 'The suggested time must differ from the requested time.' });
      return;
    }
    const service = appointment.service as unknown as import('../models/Service').IService;
    if (!await isVirtualBarberAvailableForSlot(service, appointmentDate, startTime, appointment.requestedBarberName, appointment._id.toString())) {
      res.status(409).json({ success: false, message: 'That alternative time is not available. Choose another date or time.' });
      return;
    }

    const totalMins = timeToMinutes(startTime) + appointment.duration;
    appointment.suggestedAppointmentDate = start;
    appointment.suggestedStartTime = startTime;
    appointment.suggestedEndTime = `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`;
    appointment.suggestionResponse = undefined;
    appointment.suggestedBy = req.user!.id as any;
    appointment.suggestedAt = new Date();
    appointment.status = 'reschedule_requested';
    await appointment.save();

    const customer = appointment.customer as any;
    const serviceName = (appointment.service as any)?.name || 'Salon service';
    await Notification.create({
      recipient: customer._id,
      type: 'appointment_alternative_suggested',
      title: 'Alternative Appointment Time Suggested',
      message: `Please review the alternative time suggested for booking ${appointment.bookingReference}.`,
      appointment: appointment._id,
    });
    if (customer.email) {
      await sendEmail({
        to: customer.email,
        subject: `Alternative Appointment Time — ${appointment.bookingReference}`,
        html: bookingAlternativeTemplate({
          customerName: customer.fullName,
          bookingRef: appointment.bookingReference,
          serviceName,
          date: requestedDate.toISOString().slice(0, 10),
          time: requestedTime,
          suggestedDate: appointmentDate,
          suggestedTime: startTime,
          barberName: appointment.requestedBarberName,
        }),
        deduplicationKey: `appointment:${appointment.bookingReference}:suggestion:${appointmentDate}:${startTime}`,
        type: 'appointment_alternative_suggested',
      });
    }
    res.json({ success: true, message: 'Alternative time sent to the customer.', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PATCH /api/appointments/:id/respond-suggestion — Customer
router.patch('/:id/respond-suggestion', authenticate, [
  body('response').isIn(['accepted', 'rejected']).withMessage('Response must be accepted or rejected'),
], async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return; }
  if (req.user!.role !== 'customer') { res.status(403).json({ success: false, message: 'Only the customer can respond to a suggested time.' }); return; }

  let reservationId: string | undefined;
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('customer', 'fullName email phone')
      .populate('service', 'name price duration bufferDuration');
    if (!appointment) { res.status(404).json({ success: false, message: 'Appointment not found.' }); return; }
    const customer = appointment.customer as any;
    if (customer._id.toString() !== req.user!.id) { res.status(403).json({ success: false, message: 'Access denied.' }); return; }
    if (appointment.status !== 'reschedule_requested' || !appointment.suggestedAppointmentDate || !appointment.suggestedStartTime) {
      res.status(400).json({ success: false, message: 'There is no alternative time waiting for your response.' });
      return;
    }

    const response = req.body.response as 'accepted' | 'rejected';
    const suggestedDate = appointment.suggestedAppointmentDate;
    const suggestedTime = appointment.suggestedStartTime;
    const service = appointment.service as unknown as import('../models/Service').IService;
    if (response === 'accepted') {
      if (!appointment.requestedBarberName || !await isVirtualBarberAvailableForSlot(
        service,
        suggestedDate.toISOString().slice(0, 10),
        suggestedTime,
        appointment.requestedBarberName,
        appointment._id.toString()
      )) {
        res.status(409).json({ success: false, message: 'That suggested time is no longer available. Please contact the salon team.' });
        return;
      }
      reservationId = randomUUID();
      await reserveVirtualBarberSlot(
        appointment.requestedBarberName,
        suggestedDate,
        suggestedTime,
        appointment.duration + (service.bufferDuration || 0),
        reservationId
      );
      appointment.appointmentDate = suggestedDate;
      appointment.startTime = suggestedTime;
      appointment.endTime = appointment.suggestedEndTime || appointment.endTime;
      appointment.reservationId = reservationId;
      appointment.status = 'confirmed';
      appointment.acceptedBy = appointment.suggestedBy;
      appointment.acceptedAt = new Date();
      appointment.notifications.confirmationSent = false;
    } else {
      appointment.status = 'pending';
    }
    appointment.suggestionResponse = response;
    try {
      await appointment.save();
    } catch (error) {
      if (reservationId) {
        await releaseSlot(reservationId);
        reservationId = undefined;
      }
      throw error;
    }
    reservationId = undefined;

    const serviceName = (appointment.service as any)?.name || 'Salon service';
    const suggestedDateText = suggestedDate.toISOString().slice(0, 10);
    await Notification.create({
      recipient: customer._id,
      type: response === 'accepted' ? 'appointment_alternative_accepted' : 'appointment_alternative_declined',
      title: response === 'accepted' ? 'Appointment Confirmed' : 'Alternative Time Declined',
      message: response === 'accepted'
        ? `Your appointment ${appointment.bookingReference} is confirmed for the suggested time.`
        : `Your response for appointment ${appointment.bookingReference} was sent to our salon team.`,
      appointment: appointment._id,
    });

    if (customer.email) {
      if (response === 'accepted') {
        const emailResult = await sendEmail({
          to: customer.email,
          subject: `Appointment Confirmed — ${appointment.bookingReference}`,
          html: bookingConfirmationTemplate({
            customerName: customer.fullName,
            bookingRef: appointment.bookingReference,
            serviceName,
            date: suggestedDateText,
            time: suggestedTime,
            price: appointment.priceSnapshot,
          }),
          deduplicationKey: `appointment:${appointment.bookingReference}:confirmed:${suggestedDateText}:${suggestedTime}`,
          type: 'appointment_confirmed',
        });
        appointment.notifications.confirmationSent = emailResult.success;
        await appointment.save();
      } else {
        await sendEmail({
          to: customer.email,
          subject: `Alternative Time Response Received — ${appointment.bookingReference}`,
          html: bookingSuggestionResponseTemplate({
            customerName: customer.fullName,
            bookingRef: appointment.bookingReference,
            serviceName,
            date: appointment.appointmentDate.toISOString().slice(0, 10),
            time: appointment.startTime,
            suggestedDate: suggestedDateText,
            suggestedTime,
            response,
          }),
          deduplicationKey: `appointment:${appointment.bookingReference}:suggestion_response:${appointment.suggestedAt?.getTime()}:${response}:customer`,
          type: 'appointment_suggestion_response',
        });
      }
    }

    const admins = await User.find({ role: 'super_admin', isActive: true });
    for (const admin of admins) {
      await Notification.create({
        recipient: admin._id,
        type: 'appointment_suggestion_response',
        title: response === 'accepted' ? 'Customer Accepted Alternative Time' : 'Customer Declined Alternative Time',
        message: `${customer.fullName} ${response} the alternative time for booking ${appointment.bookingReference}.`,
        appointment: appointment._id,
      });
      await sendEmail({
        to: admin.email,
        subject: `Customer ${response === 'accepted' ? 'Accepted' : 'Declined'} Alternative Time — ${appointment.bookingReference}`,
        html: bookingSuggestionResponseAdminTemplate({
          customerName: customer.fullName,
          bookingRef: appointment.bookingReference,
          serviceName,
          date: appointment.appointmentDate.toISOString().slice(0, 10),
          time: appointment.startTime,
          suggestedDate: suggestedDateText,
          suggestedTime,
          response,
        }),
        deduplicationKey: `appointment:${appointment.bookingReference}:suggestion_response:${appointment.suggestedAt?.getTime()}:${response}:admin:${admin._id}`,
        type: 'appointment_suggestion_response',
      });
    }

    res.json({ success: true, message: response === 'accepted' ? 'Suggested appointment time accepted.' : 'The salon team has been notified of your response.', data: appointment });
  } catch (error) {
    if (reservationId) await releaseSlot(reservationId);
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ success: false, message: 'That suggested time was just booked. Please contact the salon team.' });
      return;
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PATCH /api/appointments/:id/reject — Admin
router.patch('/:id/reject', authenticate, isAdminOrSubAdmin, [body('reason').optional().isString()], async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('customer', 'fullName email phone').populate('service', 'name');
    if (!appointment) { res.status(404).json({ success: false, message: 'Appointment not found.' }); return; }
    if (!['pending', 'reschedule_requested', 'accepted', 'confirmed'].includes(appointment.status)) { res.status(400).json({ success: false, message: 'Cannot reject this appointment.' }); return; }
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
      html: bookingRejectionTemplate({ customerName: customer.fullName, bookingRef: appointment.bookingReference, serviceName: (appointment.service as any)?.name || 'Salon service', date: (appointment.requestedAppointmentDate || appointment.appointmentDate).toISOString().slice(0, 10), time: appointment.requestedStartTime || appointment.startTime, reason: appointment.rejectionReason }),
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
    if (!['pending', 'reschedule_requested', 'accepted', 'confirmed'].includes(appointment.status)) { res.status(400).json({ success: false, message: 'This appointment cannot be cancelled.' }); return; }
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
    if (!['accepted', 'confirmed'].includes(appointment.status)) { res.status(400).json({ success: false, message: 'Only confirmed appointments can be completed.' }); return; }
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
    if (appointment.requestedBarberName) {
      res.status(400).json({ success: false, message: 'Please respond to the alternative time suggested by the salon team.' });
      return;
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
    appointment.requestedAppointmentDate = start;
    appointment.requestedStartTime = startTime;
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
