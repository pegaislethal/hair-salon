import cron from 'node-cron';
import Appointment from '../models/Appointment';
import Notification from '../models/Notification';
import { sendEmail } from '../config/email';
import { sendSMS } from '../config/sms';
import { appointmentReminderTemplate } from '../utils/emailTemplates';

// Core reminder check function (can be invoked by cron or serverless endpoint)
export const runReminderCheck = async (): Promise<{ success: boolean; sent24h: number; sent2h: number; noShows: number }> => {
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const window15m = 15 * 60 * 1000;

    let sent24h = 0;
    let sent2h = 0;

    // 24h reminders
    const appointments24h = await Appointment.find({
      status: 'accepted',
      'notifications.reminder24hSent': false,
      appointmentDate: { $gte: new Date(in24h.getTime() - window15m), $lte: new Date(in24h.getTime() + window15m) },
    }).populate('customer', 'fullName email phone').populate('service', 'name');

    for (const apt of appointments24h) {
      const customer = apt.customer as any;
      const service = apt.service as any;
      if (customer) {
        await Notification.create({
          recipient: customer._id,
          type: 'reminder_24h',
          title: 'Appointment Reminder — Tomorrow',
          message: `Reminder: You have an appointment for ${service?.name} tomorrow at ${apt.startTime}.`,
          appointment: apt._id,
        });
        if (customer.email) {
          await sendEmail({
            to: customer.email,
            subject: 'Appointment Reminder — Iris Salon',
            html: appointmentReminderTemplate({ customerName: customer.fullName, bookingRef: apt.bookingReference, serviceName: service?.name || 'Salon service', date: apt.appointmentDate.toISOString().slice(0, 10), time: apt.startTime, reminderLabel: 'Appointment reminder — tomorrow' }),
            deduplicationKey: `appointment:${apt.bookingReference}:reminder_24h`,
            type: 'appointment_reminder_24h',
          });
        }
        if (customer.phone) {
          await sendSMS(customer.phone, `Reminder: ${service?.name} appointment tomorrow at ${apt.startTime}. Ref: ${apt.bookingReference} — Iris Salon`);
        }
      }
      apt.notifications.reminder24hSent = true;
      await apt.save();
      sent24h++;
    }

    // 2h reminders
    const appointments2h = await Appointment.find({
      status: 'accepted',
      'notifications.reminder2hSent': false,
      appointmentDate: { $gte: new Date(in2h.getTime() - window15m), $lte: new Date(in2h.getTime() + window15m) },
    }).populate('customer', 'fullName email phone').populate('service', 'name');

    for (const apt of appointments2h) {
      const customer = apt.customer as any;
      const service = apt.service as any;
      if (customer) {
        await Notification.create({
          recipient: customer._id,
          type: 'reminder_2h',
          title: 'Appointment in 2 Hours',
          message: `Your ${service?.name} appointment is in about 2 hours at ${apt.startTime}.`,
          appointment: apt._id,
        });
        if (customer.email) {
          await sendEmail({
            to: customer.email,
            subject: 'Appointment in 2 Hours — Iris Salon',
            html: appointmentReminderTemplate({ customerName: customer.fullName, bookingRef: apt.bookingReference, serviceName: service?.name || 'Salon service', date: apt.appointmentDate.toISOString().slice(0, 10), time: apt.startTime, reminderLabel: 'Appointment in 2 hours' }),
            deduplicationKey: `appointment:${apt.bookingReference}:reminder_2h`,
            type: 'appointment_reminder_2h',
          });
        }
        if (customer.phone) {
          await sendSMS(customer.phone, `Your ${service?.name} appointment is in 2 hours at ${apt.startTime}. Ref: ${apt.bookingReference} — Iris Salon`);
        }
      }
      apt.notifications.reminder2hSent = true;
      await apt.save();
      sent2h++;
    }

    // Auto-mark no-shows (appointments that passed 2h ago without being completed)
    const noShowCutoff = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const noShowResult = await Appointment.updateMany(
      { status: 'accepted', appointmentDate: { $lt: noShowCutoff } },
      { status: 'no_show' }
    );

    return { success: true, sent24h, sent2h, noShows: noShowResult.modifiedCount || 0 };
  } catch (error) {
    console.error('[CRON] Reminder job error:', error);
    return { success: false, sent24h: 0, sent2h: 0, noShows: 0 };
  }
};

// Run every 15 minutes to check for upcoming appointments
export const startReminderJobs = (): void => {
  cron.schedule('*/15 * * * *', async () => {
    await runReminderCheck();
  });

  console.log('[CRON] Reminder jobs started');
};
