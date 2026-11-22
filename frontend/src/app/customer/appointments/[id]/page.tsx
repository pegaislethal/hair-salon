'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '../../../../components/ProtectedRoute';
import { DashboardLayout } from '../../../../layouts/DashboardLayout';
import { Appointment } from '../../../../types';
import { appointmentService } from '../../../../services/appointmentService';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Modal } from '../../../../components/ui/Modal';
import { formatDate, formatPrice, formatTime12 } from '../../../../utils/format';
import {
  Calendar,
  Clock,
  User,
  Scissors,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function CustomerAppointmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reschedule state
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const fetchAppointment = async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getAppointmentById(id);
      if (res.success && res.data) {
        setAppointment(res.data);
      } else {
        setError('Appointment not found.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retrieve appointment details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  // Load available slots when reschedule date changes
  useEffect(() => {
    if (!rescheduleDate || !appointment) return;
    async function fetchSlots() {
      try {
        const res = await appointmentService.getAvailableSlots(
          appointment?.service?._id,
          rescheduleDate,
          appointment?.staff?._id
        );
        if (res.success && res.data) {
          setRescheduleSlots(res.data);
          if (res.data.length > 0) setRescheduleSlot(res.data[0]);
        }
      } catch {
        setRescheduleSlots(['10:00', '11:00', '12:00', '14:00', '15:00', '16:00']);
      }
    }
    fetchSlots();
  }, [rescheduleDate, appointment]);

  const handleRescheduleSubmit = async () => {
    if (!rescheduleDate || !rescheduleSlot) {
      setRescheduleError('Please choose a date and time slot.');
      return;
    }
    setRescheduling(true);
    setRescheduleError(null);
    try {
      const res = await appointmentService.rescheduleAppointment(id, {
        appointmentDate: rescheduleDate,
        startTime: rescheduleSlot,
      });
      if (res.success) {
        setRescheduleOpen(false);
        fetchAppointment();
      }
    } catch (err: any) {
      setRescheduleError(err.response?.data?.message || 'Reschedule failed.');
    } finally {
      setRescheduling(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <DashboardLayout
        role="customer"
        title="Appointment Details"
        subtitle="Comprehensive breakdown of your service reservation"
        actions={
          <Link
            href="/customer/appointments"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Appointments
          </Link>
        }
      >
        {loading ? (
          <div className="py-20 text-center text-xs text-zinc-500">Loading details...</div>
        ) : error || !appointment ? (
          <div className="p-8 text-center bg-white rounded-xl border border-zinc-200">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-800">{error || 'Appointment not found'}</p>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl">
            {/* Top Overview Card */}
            <div className="bg-white p-8 rounded-xl border border-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-zinc-900 bg-zinc-100 px-3 py-1 rounded">
                    {appointment.bookingReference}
                  </span>
                  <Badge variant={appointment.status}>{appointment.status}</Badge>
                </div>
                <h2 className="font-serif text-2xl font-bold text-zinc-900">
                  {appointment.service?.name}
                </h2>
                <p className="text-xs text-zinc-500">
                  Created on {formatDate(appointment.createdAt)}
                </p>
              </div>

              {['pending', 'accepted'].includes(appointment.status) && (
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRescheduleDate(new Date(appointment.appointmentDate).toISOString().split('T')[0]);
                      setRescheduleOpen(true);
                    }}
                  >
                    Reschedule Date / Time
                  </Button>
                </div>
              )}
            </div>

            {/* Details Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-4">
                <h4 className="font-serif text-base font-bold text-zinc-900 border-b border-zinc-100 pb-3">
                  Service & Timing
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1">
                    <span className="text-zinc-500">Service</span>
                    <span className="font-semibold text-zinc-900">{appointment.service?.name}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-zinc-500">Duration</span>
                    <span className="font-semibold text-zinc-900">{appointment.duration} minutes</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-zinc-500">Date</span>
                    <span className="font-semibold text-zinc-900">{formatDate(appointment.appointmentDate)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-zinc-500">Time Window</span>
                    <span className="font-semibold text-zinc-900">
                      {formatTime12(appointment.startTime)} – {formatTime12(appointment.endTime)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-t border-zinc-100 pt-3">
                    <span className="text-zinc-500 font-medium">Price Snapshot</span>
                    <span className="font-bold text-zinc-900 text-sm">{formatPrice(appointment.priceSnapshot)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-4">
                <h4 className="font-serif text-base font-bold text-zinc-900 border-b border-zinc-100 pb-3">
                  Stylist & Client Notes
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1">
                    <span className="text-zinc-500">Assigned Stylist</span>
                    <span className="font-semibold text-zinc-900">
                      {appointment.staff?.fullName || 'Senior Stylist Assigned by Iris'}
                    </span>
                  </div>
                  <div className="py-1">
                    <span className="text-zinc-500 block mb-1">Your Special Notes</span>
                    <p className="p-3 rounded-lg bg-zinc-50 text-zinc-700 italic border border-zinc-100">
                      {appointment.customerNotes || 'No special requests submitted.'}
                    </p>
                  </div>
                  {appointment.rejectionReason && (
                    <div className="p-3 rounded bg-rose-50 text-rose-700 border border-rose-200">
                      <strong>Rejection Reason:</strong> {appointment.rejectionReason}
                    </div>
                  )}
                  {appointment.cancellationReason && (
                    <div className="p-3 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                      <strong>Cancellation Reason:</strong> {appointment.cancellationReason}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reschedule Modal */}
        <Modal
          isOpen={rescheduleOpen}
          onClose={() => setRescheduleOpen(false)}
          title="Reschedule Appointment"
        >
          <div className="space-y-4">
            {rescheduleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded">
                {rescheduleError}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                New Date
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                New Time Slot
              </label>
              <div className="grid grid-cols-3 gap-2">
                {rescheduleSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setRescheduleSlot(slot)}
                    className={`py-1.5 px-2 text-xs rounded border ${
                      rescheduleSlot === slot
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-zinc-700 border-zinc-200'
                    }`}
                  >
                    {formatTime12(slot)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
              <Button variant="outline" size="sm" onClick={() => setRescheduleOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" isLoading={rescheduling} onClick={handleRescheduleSubmit}>
                Confirm Reschedule
              </Button>
            </div>
          </div>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
