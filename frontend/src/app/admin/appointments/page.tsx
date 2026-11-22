'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { Appointment } from '../../../types';
import { appointmentService } from '../../../services/appointmentService';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { formatPrice, formatDate, formatTime12 } from '../../../utils/format';
import {
  CheckCircle,
  XCircle,
  Check,
  Search,
  Filter,
  AlertCircle,
  Calendar,
} from 'lucide-react';

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchDate, setSearchDate] = useState('');

  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetAppt, setTargetAppt] = useState<Appointment | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchDate) params.date = searchDate;
      const res = await appointmentService.getAppointments(params);
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
  }, [statusFilter, searchDate]);

  const handleAccept = async (id: string) => {
    setActionLoading(true);
    try {
      await appointmentService.acceptAppointment(id);
      fetchAppointments();
    } catch (err) {
      console.error('Accept error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (id: string) => {
    setActionLoading(true);
    try {
      await appointmentService.completeAppointment(id);
      fetchAppointments();
    } catch (err) {
      console.error('Complete error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!targetAppt) return;
    setActionLoading(true);
    try {
      await appointmentService.rejectAppointment(targetAppt._id, rejectReason);
      setRejectModalOpen(false);
      fetchAppointments();
    } catch (err) {
      console.error('Reject error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['super_admin']}>
      <DashboardLayout
        role="super_admin"
        title="Appointment Management"
        subtitle="Review booking requests, assign staff, and update appointment statuses"
      >
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              {['all', 'pending', 'accepted', 'completed', 'cancelled', 'rejected'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                    statusFilter === st
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="px-3 py-1.5 text-xs border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              {searchDate && (
                <button
                  onClick={() => setSearchDate('')}
                  className="text-xs text-zinc-500 hover:text-zinc-900 underline"
                >
                  Clear Date
                </button>
              )}
            </div>
          </div>

          {/* Appointments Table */}
          <div className="bg-white rounded-xl border border-zinc-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">Ref & Created</th>
                    <th className="px-6 py-3.5">Client Info</th>
                    <th className="px-6 py-3.5">Service Details</th>
                    <th className="px-6 py-3.5">Date & Time</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Workflow Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                        Loading appointments...
                      </td>
                    </tr>
                  ) : appointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                        No appointments match current filters.
                      </td>
                    </tr>
                  ) : (
                    appointments.map((appt: any) => (
                      <tr key={appt._id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-zinc-900 block">
                            {appt.bookingReference}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {formatDate(appt.createdAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-zinc-900 block">
                            {appt.customer?.fullName || 'Client'}
                          </span>
                          <span className="text-[11px] text-zinc-500 block">
                            {appt.customer?.phone}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {appt.customer?.email}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-zinc-900 block">
                            {appt.service?.name}
                          </span>
                          <span className="text-zinc-500 text-[11px]">
                            {formatPrice(appt.priceSnapshot)} ({appt.duration}m)
                          </span>
                          {appt.customerNotes && (
                            <span className="block text-[10px] text-zinc-400 italic line-clamp-1 mt-0.5">
                              “{appt.customerNotes}”
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-zinc-900 block">
                            {formatDate(appt.appointmentDate)}
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            {formatTime12(appt.startTime)} - {formatTime12(appt.endTime)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={appt.status}>{appt.status}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {appt.status === 'pending' && (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleAccept(appt._id)}
                                  className="h-7 text-xs bg-emerald-700 hover:bg-emerald-800"
                                >
                                  Accept
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setTargetAppt(appt);
                                    setRejectReason('');
                                    setRejectModalOpen(true);
                                  }}
                                  className="h-7 text-xs text-rose-600 hover:bg-rose-50"
                                >
                                  Reject
                                </Button>
                              </>
                            )}

                            {appt.status === 'accepted' && (
                              <Button
                                size="sm"
                                onClick={() => handleComplete(appt._id)}
                                className="h-7 text-xs bg-zinc-900"
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Reject Modal */}
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          title="Reject Booking Request"
        >
          <div className="space-y-4">
            <p className="text-xs text-zinc-600">
              Provide a reason for declining{' '}
              <strong>{targetAppt?.customer?.fullName}</strong>’s booking for{' '}
              <strong>{targetAppt?.service?.name}</strong>.
            </p>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Reason
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Stylist unavailable, fully booked, maintenance..."
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={actionLoading}
                onClick={handleRejectSubmit}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
