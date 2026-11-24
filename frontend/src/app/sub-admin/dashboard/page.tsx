'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { useAuth } from '../../../context/AuthContext';
import { DashboardReport, Appointment } from '../../../types';
import { reportService } from '../../../services/reportService';
import { appointmentService } from '../../../services/appointmentService';
import { Badge } from '../../../components/ui/Badge';
import { formatPrice, formatDate, formatTime12 } from '../../../utils/format';
import {
  CalendarCheck,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Calendar,
  Scissors,
} from 'lucide-react';

export default function SubAdminDashboardPage() {
  const { user } = useAuth();
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await reportService.getDashboardReport();
      if (res.success && res.data) {
        setReport(res.data);
      }
    } catch (err) {
      console.error('Failed to load sub admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickStatus = async (id: string, action: 'accept' | 'reject' | 'complete') => {
    try {
      if (action === 'accept') await appointmentService.acceptAppointment(id);
      if (action === 'reject') await appointmentService.rejectAppointment(id, 'Declined by shift supervisor');
      if (action === 'complete') await appointmentService.completeAppointment(id);
      loadData();
    } catch (err) {
      console.error('Action error:', err);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['sub_admin', 'super_admin']}>
      <DashboardLayout
        role="sub_admin"
        title={`Staff Dashboard • ${user?.fullName || 'Stylist'}`}
        subtitle="Manage daily bookings, customer intake, and scheduled services"
      >
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-xl border border-zinc-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Today&apos;s Appointments</p>
                <p className="font-serif text-2xl font-bold text-zinc-900 mt-1">
                  {report?.todayAppointments || 0}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">Scheduled for today</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-champagne-100 flex items-center justify-center text-champagne-800">
                <Calendar className="w-6 h-6 text-champagne-700" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-zinc-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Pending Approval</p>
                <p className="font-serif text-2xl font-bold text-amber-600 mt-1">
                  {report?.pendingAppointments || 0}
                </p>
                <p className="text-[11px] text-amber-600 font-medium mt-1">Awaiting confirmation</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-700">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-zinc-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">All Bookings</p>
                <p className="font-serif text-2xl font-bold text-zinc-900 mt-1">
                  {report?.totalAppointments || 0}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">Total salon pipeline</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-champagne-100 flex items-center justify-center text-champagne-800">
                <Scissors className="w-6 h-6 text-champagne-700" />
              </div>
            </div>
          </div>

          {/* Pending & Upcoming Appointments */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-zinc-900">Recent Customer Requests</h3>
                <p className="text-xs text-zinc-500">Confirm or complete active salon bookings</p>
              </div>
              <Link
                href="/sub-admin/appointments"
                className="text-xs font-semibold text-zinc-900 hover:text-champagne-700 underline"
              >
                View All Appointments →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">Reference / Client</th>
                    <th className="px-6 py-3.5">Service</th>
                    <th className="px-6 py-3.5">Date & Time</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-zinc-400">
                        Loading recent requests...
                      </td>
                    </tr>
                  ) : !report?.recentAppointments || report.recentAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-zinc-400">
                        No appointments currently queued.
                      </td>
                    </tr>
                  ) : (
                    report.recentAppointments.map((appt: any) => (
                      <tr key={appt._id} className="hover:bg-zinc-50/50">
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-zinc-900 block">
                            {appt.bookingReference}
                          </span>
                          <span className="text-zinc-600 font-medium">
                            {appt.customer?.fullName || 'Client'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-zinc-900">
                          {appt.service?.name}
                        </td>
                        <td className="px-6 py-4 text-zinc-600">
                          <span>{formatDate(appt.appointmentDate)}</span>
                          <span className="block text-[11px] text-zinc-400">
                            {formatTime12(appt.startTime)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={appt.status}>{appt.status}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {appt.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleQuickStatus(appt._id, 'accept')}
                                  title="Accept"
                                  className="p-1.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleQuickStatus(appt._id, 'reject')}
                                  title="Reject"
                                  className="p-1.5 rounded bg-rose-50 text-rose-700 hover:bg-rose-100"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {['confirmed', 'accepted'].includes(appt.status) && (
                              <button
                                onClick={() => handleQuickStatus(appt._id, 'complete')}
                                className="px-2.5 py-1 rounded bg-zinc-900 text-white text-[11px] font-medium"
                              >
                                Mark Done
                              </button>
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
      </DashboardLayout>
    </ProtectedRoute>
  );
}
