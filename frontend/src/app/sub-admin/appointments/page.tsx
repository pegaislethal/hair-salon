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
import { CheckCircle, XCircle } from 'lucide-react';

export default function SubAdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetAppt, setTargetAppt] = useState<Appointment | null>(null);
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
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
  }, [statusFilter]);

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
      await appointmentService.rejectAppointment(targetAppt._id, reason);
      setRejectModalOpen(false);
      fetchAppointments();
    } catch (err) {
      console.error('Reject error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['sub_admin', 'super_admin']}>
      <DashboardLayout
        role="sub_admin"
        title="Appointment Workflow"
        subtitle="Manage daily appointment pipeline, confirmation, and completions"
      >
        <div className="space-y-6">
          {/* Status Tabs */}
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-2 flex-wrap">
            {['all', 'pending', 'reschedule_requested', 'confirmed', 'accepted', 'completed', 'cancelled', 'rejected'].map((st) => (
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

          {/* Table */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">Ref / Time</th>
                    <th className="px-6 py-3.5">Client</th>
                    <th className="px-6 py-3.5">Service</th>
                    <th className="px-6 py-3.5">Price</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
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
                        No appointments found.
                      </td>
                    </tr>
                  ) : (
                    appointments.map((appt: any) => (
                      <tr key={appt._id} className="hover:bg-zinc-50/50">
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-zinc-900 block">
                            {appt.bookingReference}
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            {formatDate(appt.appointmentDate)} at {formatTime12(appt.startTime)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-zinc-900 block">
                            {appt.customer?.fullName || 'Client'}
                          </span>
                          <span className="text-[10px] text-zinc-400">{appt.customer?.phone}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-zinc-900 block">
                            {appt.service?.name}
                          </span>
                          <span className="text-[10px] text-zinc-400">{appt.duration} mins</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-zinc-900">
                          {formatPrice(appt.priceSnapshot)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={appt.status}>{appt.status}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {appt.status === 'pending' && (
                              <>
                                <Button
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
                                    setReason('');
                                    setRejectModalOpen(true);
                                  }}
                                  className="h-7 text-xs text-rose-600 hover:bg-rose-50"
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {['confirmed', 'accepted'].includes(appt.status) && (
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

        {/* Modal */}
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          title="Decline Appointment"
        >
          <div className="space-y-4">
            <p className="text-xs text-zinc-600">
              Provide a reason for declining{' '}
              <strong>{targetAppt?.customer?.fullName}</strong>’s booking:
            </p>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Reason
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Stylist unavailable..."
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" isLoading={actionLoading} onClick={handleRejectSubmit}>
                Confirm Decline
              </Button>
            </div>
          </div>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
