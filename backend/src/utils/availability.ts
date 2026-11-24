import mongoose from 'mongoose';
import { IService } from '../models/Service';
import Staff, { IStaff } from '../models/Staff';
import Appointment from '../models/Appointment';
import SalonSettings from '../models/SalonSettings';
import BookingLock from '../models/BookingLock';
import { IAppointment } from '../models/Appointment';

const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
const activeStatuses = ['accepted', 'confirmed'] as const;
// Barber schedules use Nepal local time, while appointment dates are stored as UTC calendar days.
const salonUtcOffsetMinutes = 345;
const isValidTime = (time: string): boolean => /^([01]\d|2[0-3]):[0-5]\d$/.test(time || '');

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const dateBounds = (date: string): { start: Date; end: Date } => {
  const start = new Date(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(start.getTime()) || start.toISOString().slice(0, 10) !== date) {
    return { start: new Date(Number.NaN), end: new Date(Number.NaN) };
  }
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
};

const isWorkingOn = (staff: IStaff, date: Date): boolean => {
  const day = staff.workingHours?.[dayNames[date.getUTCDay()]];
  if (!day?.isWorking) return false;
  return !(staff.daysOff || []).some((off) => new Date(off).toISOString().slice(0, 10) === date.toISOString().slice(0, 10));
};

const serviceAllowed = (staff: IStaff, serviceId: string): boolean =>
  !staff.services.length || staff.services.some((id) => id.toString() === serviceId);

export const getAvailableStaffForSlot = async (
  service: IService,
  date: string,
  startTime: string,
  staffId?: string,
  excludeAppointmentId?: string,
  excludeReservationId?: string
): Promise<IStaff[]> => {
  const { start, end } = dateBounds(date);
  if (!Number.isFinite(start.getTime())) return [];
  const settings = await SalonSettings.findOne();
  const dateKey = start.toISOString().slice(0, 10);
  if (settings?.holidays?.some((holiday) => new Date(holiday.date).toISOString().slice(0, 10) === dateKey)) return [];
  const startMinutes = timeToMinutes(startTime);
  const appointmentTimestamp = start.getTime() + (startMinutes - salonUtcOffsetMinutes) * 60000;
  const minAdvanceHours = settings?.bookingSettings?.minAdvanceHours || 0;
  const advanceBookingDays = settings?.bookingSettings?.advanceBookingDays;
  if (appointmentTimestamp < Date.now() + minAdvanceHours * 3600000) return [];
  if (advanceBookingDays !== undefined && appointmentTimestamp > Date.now() + advanceBookingDays * 86400000) return [];

  const requestedStaff = staffId && mongoose.isValidObjectId(staffId)
    ? await Staff.findById(staffId).populate('user', 'isActive')
    : null;
  if (staffId && !requestedStaff) return [];

  const candidates = requestedStaff
    ? [requestedStaff]
    : await Staff.find({ isActive: true }).populate('user', 'isActive');
  const eligible = candidates.filter((staff) => {
    const user = staff.user as unknown as { isActive?: boolean };
    if (!staff.isActive || !user?.isActive || !serviceAllowed(staff, service._id.toString()) || !isWorkingOn(staff, start)) return false;
    const hours = staff.workingHours[dayNames[start.getUTCDay()]];
    const salonHours = settings?.businessHours?.[dayNames[start.getUTCDay()]];
    if (!hours || !isValidTime(hours.start) || !isValidTime(hours.end) || timeToMinutes(hours.start) >= timeToMinutes(hours.end)) return false;
    const endMinutes = startMinutes + service.duration;
    if (startMinutes < timeToMinutes(hours.start) || endMinutes > timeToMinutes(hours.end)) return false;
    if (salonHours && (salonHours as unknown as { isClosed?: boolean }).isClosed) return false;
    if (salonHours) {
      const { open, close } = salonHours as unknown as { open: string; close: string };
      if (!isValidTime(open) || !isValidTime(close) || timeToMinutes(open) >= timeToMinutes(close)) return false;
      if (startMinutes < timeToMinutes(open) || endMinutes > timeToMinutes(close)) return false;
    }
    if ((staff.breaks || []).some((breakTime) =>
      !isValidTime(breakTime.start) || !isValidTime(breakTime.end) || timeToMinutes(breakTime.start) >= timeToMinutes(breakTime.end)
    )) return false;
    return !(staff.breaks || []).some((breakTime) =>
      startMinutes < timeToMinutes(breakTime.end) && endMinutes > timeToMinutes(breakTime.start)
    );
  });
  if (!eligible.length) return [];

  const staffUserIds = eligible.map((staff) => staff.user as mongoose.Types.ObjectId);
  const [appointmentResults, locks] = await Promise.all([
    Appointment.find({
      $or: [{ staff: { $in: staffUserIds } }, { staff: null }],
      appointmentDate: { $gte: start, $lt: end },
      status: { $in: activeStatuses },
      ...(excludeAppointmentId ? { _id: { $ne: excludeAppointmentId } } : {}),
    }).populate('service', 'bufferDuration'),
    BookingLock.find({
      staff: { $in: staffUserIds },
      appointmentDate: start,
      ...(excludeReservationId ? { reservationId: { $ne: excludeReservationId } } : {}),
      minute: {
        $gte: timeToMinutes(startTime),
      $lt: timeToMinutes(startTime) + service.duration + (service.bufferDuration || 0),
      },
    }),
  ]);
  const appointments = appointmentResults as unknown as Array<IAppointment & { service: { bufferDuration?: number } }>;
  const bookedStaff = new Set<string>();
  const candidateStart = timeToMinutes(startTime);
  const candidateEnd = candidateStart + service.duration + (service.bufferDuration || 0);
  for (const appointment of appointments) {
    if (!appointment.staff) {
      for (const staff of eligible) bookedStaff.add((staff.user as mongoose.Types.ObjectId).toString());
      continue;
    }
    const existingStart = timeToMinutes(appointment.startTime);
    const existingService = appointment.service as unknown as { bufferDuration?: number };
    const existingEnd = timeToMinutes(appointment.endTime) + (existingService?.bufferDuration || 0);
    if (candidateStart < existingEnd && candidateEnd > existingStart) bookedStaff.add(appointment.staff!.toString());
  }
  for (const lock of locks) bookedStaff.add(lock.staff.toString());
  return eligible.filter((staff) => !bookedStaff.has((staff.user as mongoose.Types.ObjectId).toString()));
};

export const isVirtualBarberAvailableForSlot = async (
  service: IService,
  date: string,
  startTime: string,
  barberName: string,
  excludeAppointmentId?: string,
  excludeReservationId?: string
): Promise<boolean> => {
  if (barberName !== 'Lycan' || !isValidTime(startTime)) return false;

  const { start, end } = dateBounds(date);
  if (!Number.isFinite(start.getTime())) return false;

  const settings = await SalonSettings.findOne();
  const dateKey = start.toISOString().slice(0, 10);
  if (settings?.holidays?.some((holiday) => new Date(holiday.date).toISOString().slice(0, 10) === dateKey)) return false;

  const day = settings?.businessHours?.[dayNames[start.getUTCDay()]];
  if (!day || day.isClosed || !isValidTime(day.open) || !isValidTime(day.close) || timeToMinutes(day.open) >= timeToMinutes(day.close)) return false;

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + service.duration + (service.bufferDuration || 0);
  if (startMinutes < timeToMinutes(day.open) || endMinutes > timeToMinutes(day.close)) return false;

  const appointmentTimestamp = start.getTime() + (startMinutes - salonUtcOffsetMinutes) * 60000;
  const minAdvanceHours = settings.bookingSettings?.minAdvanceHours || 0;
  const advanceBookingDays = settings.bookingSettings?.advanceBookingDays;
  if (appointmentTimestamp < Date.now() + minAdvanceHours * 3600000) return false;
  if (advanceBookingDays !== undefined && appointmentTimestamp > Date.now() + advanceBookingDays * 86400000) return false;

  const [appointments, locks] = await Promise.all([
    Appointment.find({
      appointmentDate: { $gte: start, $lt: end },
      status: { $in: activeStatuses },
      ...(excludeAppointmentId ? { _id: { $ne: excludeAppointmentId } } : {}),
    }).populate('service', 'bufferDuration'),
    BookingLock.find({
      appointmentDate: start,
      ...(excludeReservationId ? { reservationId: { $ne: excludeReservationId } } : {}),
      minute: { $gte: startMinutes, $lt: endMinutes },
    }),
  ]);

  const candidateEnd = endMinutes;
  const overlapsAppointment = appointments.some((appointment) => {
    const existingService = appointment.service as unknown as { bufferDuration?: number };
    const existingStart = timeToMinutes(appointment.startTime);
    const existingEnd = timeToMinutes(appointment.endTime) + (existingService?.bufferDuration || 0);
    return startMinutes < existingEnd && candidateEnd > existingStart;
  });

  return locks.length === 0 && !overlapsAppointment;
};

export const getAvailableSlots = async (service: IService, date: string, staffId?: string): Promise<string[]> => {
  const { start } = dateBounds(date);
  if (!Number.isFinite(start.getTime())) return [];
  const settings = await SalonSettings.findOne();
  const salonHours = settings?.businessHours?.[dayNames[start.getUTCDay()]];
  if (!settings || (salonHours as unknown as { isClosed?: boolean } | undefined)?.isClosed) return [];
  const { open, close } = salonHours as unknown as { open: string; close: string };
  if (!isValidTime(open) || !isValidTime(close) || timeToMinutes(open) >= timeToMinutes(close)) return [];
  const interval = Math.max(5, settings.bookingSettings?.appointmentSlotInterval || 30);
  const openMinutes = timeToMinutes(open);
  const closeMinutes = timeToMinutes(close);
  const minStart = Math.max(openMinutes, Math.ceil(salonUtcOffsetMinutes + (Date.now() + (settings.bookingSettings?.minAdvanceHours || 0) * 3600000 - start.getTime()) / 60000));
  const slots: string[] = [];
  for (let minute = openMinutes + Math.ceil(Math.max(0, minStart - openMinutes) / interval) * interval; minute + service.duration <= closeMinutes; minute += interval) {
    const time = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
    if ((await getAvailableStaffForSlot(service, date, time, staffId)).length) slots.push(time);
  }
  return slots;
};

export const reserveSlot = async (staffUserId: mongoose.Types.ObjectId, date: Date, startTime: string, duration: number, reservationId: string): Promise<void> => {
  const start = timeToMinutes(startTime);
  const locks = Array.from({ length: duration }, (_, index) => ({
    staff: staffUserId,
    appointmentDate: date,
    minute: start + index,
    reservationId,
  }));
  await BookingLock.insertMany(locks, { ordered: true });
};

export const reserveVirtualBarberSlot = async (
  barberName: string,
  date: Date,
  startTime: string,
  duration: number,
  reservationId: string
): Promise<void> => {
  const start = timeToMinutes(startTime);
  const locks = Array.from({ length: duration }, (_, index) => ({
    barberName,
    appointmentDate: date,
    minute: start + index,
    reservationId,
  }));
  await BookingLock.insertMany(locks, { ordered: true });
};

export const releaseSlot = async (reservationId: string): Promise<void> => {
  await BookingLock.deleteMany({ reservationId });
};
