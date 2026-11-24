'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    if (typeof response?.data?.message === 'string') return response.data.message;
  }
  return fallback;
};

export default function CustomerAppointmentDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [responseLoading, setResponseLoading] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
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
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to retrieve appointment details.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  const handleSuggestionResponse = async (response: 'accepted' | 'rejected') => {
    setResponseLoading(true);
    setResponseError(null);
    try {
      const res = await appointmentService.respondToSuggestedTime(id, response);
      if (res.success) {
        await fetchAppointment();
      }
    } catch (err) {
      setResponseError(getErrorMessage(err, 'Could not submit your response.'));
    } finally {
      setResponseLoading(false);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      setRescheduleError('Choose a date and preferred time.');
      return;
    }
    setRescheduling(true);
    setRescheduleError(null);
    try {
      await appointmentService.rescheduleAppointment(id, {
        appointmentDate: rescheduleDate,
        startTime: rescheduleTime,
      });
      setRescheduleOpen(false);
      await fetchAppointment();
    } catch (err) {
      setRescheduleError(getErrorMessage(err, 'Could not request the reschedule.'));
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
              {['pending', 'confirmed', 'accepted'].includes(appointment.status) && !appointment.requestedBarberName && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRescheduleDate(new Date(appointment.appointmentDate).toISOString().slice(0, 10));
                    setRescheduleTime(appointment.startTime);
                    setRescheduleError(null);
                    setRescheduleOpen(true);
                  }}
                >
                  Request Reschedule
                </Button>
              )}
            </div>

            {appointment.suggestedAppointmentDate && appointment.suggestedStartTime && (
              <div className="bg-champagne-50 p-6 rounded-xl border border-champagne-200 space-y-4">
                <div>
                  <h3 className="font-serif font-bold text-zinc-900">Alternative Time Suggested</h3>
                  <p className="text-xs text-zinc-600 mt-1">
                    {appointment.status === 'reschedule_requested'
                      ? 'Your requested time is unavailable. Please accept this alternative or decline it so our team can follow up.'
                      : appointment.suggestionResponse === 'accepted' && ['confirmed', 'accepted'].includes(appointment.status)
                        ? 'You accepted this alternative time and your appointment is confirmed.'
                        : appointment.suggestionResponse === 'rejected'
                          ? 'You declined this alternative time. Our salon team will follow up.'
                          : 'This alternative time is no longer waiting for a response.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-6 text-sm">
                  <span><strong>Date:</strong> {formatDate(appointment.suggestedAppointmentDate)}</span>
                  <span><strong>Time:</strong> {formatTime12(appointment.suggestedStartTime)}</span>
                </div>
                {responseError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded">
                    {responseError}
                  </div>
                )}
                {appointment.status === 'reschedule_requested' && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      isLoading={responseLoading}
                      disabled={responseLoading}
                      onClick={() => handleSuggestionResponse('accepted')}
                    >
                      Accept Suggested Time
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={responseLoading}
                      onClick={() => handleSuggestionResponse('rejected')}
                    >
                      Decline Suggestion
                    </Button>
                  </div>
                )}
              </div>
            )}

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
                    <span className="text-zinc-500">Requested Date</span>
                    <span className="font-semibold text-zinc-900">
                      {formatDate(appointment.requestedAppointmentDate || appointment.appointmentDate)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-zinc-500">Requested Time</span>
                    <span className="font-semibold text-zinc-900">
                      {formatTime12(appointment.requestedStartTime || appointment.startTime)}
                    </span>
                  </div>
                  {['confirmed', 'accepted'].includes(appointment.status) && (
                    <>
                      <div className="flex justify-between py-1">
                        <span className="text-zinc-500">Confirmed Date</span>
                        <span className="font-semibold text-zinc-900">{formatDate(appointment.appointmentDate)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-zinc-500">Confirmed Time</span>
                        <span className="font-semibold text-zinc-900">{formatTime12(appointment.startTime)}</span>
                      </div>
                    </>
                  )}
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
                      {appointment.requestedBarberName || appointment.staff?.fullName || '—'}
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

        <Modal
          isOpen={rescheduleOpen}
          onClose={() => setRescheduleOpen(false)}
          title="Request a Reschedule"
        >
          <div className="space-y-4">
            <p className="text-xs text-zinc-600">
              Choose a date and time. The salon team will check availability and review your request.
            </p>
            {rescheduleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded">
                {rescheduleError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="space-y-1.5 text-xs font-semibold text-zinc-700">
                New Date
                <input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={rescheduleDate}
                  onChange={(event) => setRescheduleDate(event.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md"
                />
              </label>
              <label className="space-y-1.5 text-xs font-semibold text-zinc-700">
                Preferred Appointment Time
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(event) => setRescheduleTime(event.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
              <Button variant="outline" size="sm" onClick={() => setRescheduleOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" isLoading={rescheduling} onClick={handleRescheduleSubmit}>
                Send Reschedule Request
              </Button>
            </div>
          </div>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
