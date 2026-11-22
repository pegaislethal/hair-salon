'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { Appointment } from '../../../types';
import { appointmentService } from '../../../services/appointmentService';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { formatDate, formatPrice, formatTime12 } from '../../../utils/format';
import {
  Calendar,
  Clock,
  ArrowRight,
  XCircle,
  CalendarDays,
  AlertCircle,
} from 'lucide-react';

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getAppointments();
      if (res.success && res.data) {
        setAppointments(res.data);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancelSubmit = async () => {
    if (!selectedAppt) return;
    setCancelling(true);
    setErrorMsg(null);
    try {
      const res = await appointmentService.cancelAppointment(selectedAppt._id, cancelReason);
      if (res.success) {
        setCancelModalOpen(false);
        fetchAppointments();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Could not cancel appointment.');
    } finally {
      setCancelling(false);
    }
  };

  const filtered =
    statusFilter === 'all'
      ? appointments
      : appointments.filter((a) => a.status === statusFilter);

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <DashboardLayout
        role="customer"
        title="My Appointments"
        subtitle="View all current, upcoming, and past appointment history"
        actions={
          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider bg-zinc-900 text-white hover:bg-zinc-800"
          >
            <Calendar className="w-3.5 h-3.5 text-champagne-300" />
            Book Appointment
          </Link>
        }
      >
        <div className="space-y-6">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 flex-wrap border-b border-zinc-200 pb-3">
            {['all', 'pending', 'accepted', 'completed', 'cancelled', 'rejected'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                  statusFilter === tab
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Appointments List */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-zinc-500">Loading appointments...</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <CalendarDays className="w-10 h-10 text-zinc-300 mx-auto" />
                <p className="text-sm font-semibold text-zinc-800">No appointments found</p>
                <p className="text-xs text-zinc-500">There are no appointments matching this filter.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {filtered.map((appt) => (
                  <div
                    key={appt._id}
                    className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-50/50 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-zinc-900 bg-zinc-100 px-2.5 py-0.5 rounded">
                          {appt.bookingReference}
                        </span>
                        <Badge variant={appt.status}>{appt.status}</Badge>
                      </div>
                      <h4 className="font-serif text-lg font-bold text-zinc-900">
                        {appt.service?.name || 'Service'}
                      </h4>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(appt.appointmentDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime12(appt.startTime)} - {formatTime12(appt.endTime)}
                        </span>
                        <span className="font-semibold text-zinc-900">{formatPrice(appt.priceSnapshot)}</span>
                      </div>
                      {appt.customerNotes && (
                        <p className="text-xs text-zinc-500 italic">Notes: “{appt.customerNotes}”</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/customer/appointments/${appt._id}`}
                        className="px-3.5 py-2 rounded border border-zinc-200 text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-white"
                      >
                        View Details
                      </Link>
                      {['pending', 'accepted'].includes(appt.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAppt(appt);
                            setCancelReason('');
                            setCancelModalOpen(true);
                          }}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cancellation Modal */}
        <Modal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          title="Cancel Appointment"
        >
          <div className="space-y-4">
            <p className="text-xs text-zinc-600">
              Are you sure you wish to cancel your booking for{' '}
              <strong>{selectedAppt?.service?.name}</strong> on{' '}
              <strong>{formatDate(selectedAppt?.appointmentDate)}</strong> at{' '}
              <strong>{selectedAppt?.startTime}</strong>?
            </p>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Reason for cancellation (Optional)
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Change of schedule, personal reason..."
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setCancelModalOpen(false)}>
                Keep Appointment
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={cancelling}
                onClick={handleCancelSubmit}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
