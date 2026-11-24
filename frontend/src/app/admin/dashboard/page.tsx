'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { DashboardReport, Appointment } from '../../../types';
import { reportService } from '../../../services/reportService';
import { appointmentService } from '../../../services/appointmentService';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { formatPrice, formatDate, formatTime12 } from '../../../utils/format';
import {
  Users,
  CalendarCheck,
  Clock,
  TrendingUp,
  Scissors,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      const res = await reportService.getDashboardReport();
      if (res.success && res.data) {
        setReport(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleQuickStatus = async (id: string, action: 'accept' | 'reject' | 'complete') => {
    try {
      if (action === 'accept') await appointmentService.acceptAppointment(id);
      if (action === 'reject') await appointmentService.rejectAppointment(id, 'Admin quick rejected');
      if (action === 'complete') await appointmentService.completeAppointment(id);
      loadDashboard();
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['super_admin']}>
      <DashboardLayout
        role="super_admin"
        title="Admin Control Center"
        subtitle="Real-time performance, booking pipeline, and revenue tracking"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/appointments"
              className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-zinc-800"
            >
              Manage All Appointments
            </Link>
          </div>
        }
      >
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-xl border border-zinc-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Total Revenue</p>
                <p className="font-serif text-2xl font-bold text-zinc-900 mt-1">
                  {formatPrice(report?.monthlyRevenue || 0)}
                </p>
                <p className="text-[11px] text-emerald-600 mt-1 font-medium">This month</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-champagne-100 flex items-center justify-center text-champagne-800">
                <TrendingUp className="w-6 h-6 text-champagne-700" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-zinc-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Total Bookings</p>
                <p className="font-serif text-2xl font-bold text-zinc-900 mt-1">
                  {report?.totalAppointments || 0}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">Lifetime total</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-champagne-100 flex items-center justify-center text-champagne-800">
                <CalendarCheck className="w-6 h-6 text-champagne-700" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-zinc-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Pending Requests</p>
                <p className="font-serif text-2xl font-bold text-amber-600 mt-1">
                  {report?.pendingAppointments || 0}
                </p>
                <p className="text-[11px] text-amber-600 font-medium mt-1">Needs confirmation</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-700">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-zinc-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Active Clients</p>
                <p className="font-serif text-2xl font-bold text-zinc-900 mt-1">
                  {report?.totalCustomers || 0}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">Registered customers</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-champagne-100 flex items-center justify-center text-champagne-800">
                <Users className="w-6 h-6 text-champagne-700" />
              </div>
            </div>
          </div>

          {/* Recent Appointments with Quick Actions */}
          <div className="bg-white rounded-xl border border-zinc-200/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-zinc-900">Recent Booking Pipeline</h3>
                <p className="text-xs text-zinc-500">Latest appointment submissions across the salon</p>
              </div>
              <Link
                href="/admin/appointments"
                className="text-xs font-semibold text-zinc-900 hover:text-champagne-700 underline"
              >
                Full Appointment Table →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">Ref / Client</th>
                    <th className="px-6 py-3.5">Service</th>
                    <th className="px-6 py-3.5">Date & Time</th>
                    <th className="px-6 py-3.5">Price</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-zinc-400">
                        Loading recent requests...
                      </td>
                    </tr>
                  ) : !report?.recentAppointments || report.recentAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-zinc-400">
                        No appointments found.
                      </td>
                    </tr>
                  ) : (
                    report.recentAppointments.map((appt: any) => (
                      <tr key={appt._id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-zinc-900 block">
                            {appt.bookingReference}
                          </span>
                          <span className="text-zinc-600 font-medium">
                            {appt.customer?.fullName || 'Client'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-900">
                          {appt.service?.name}
                        </td>
                        <td className="px-6 py-4 text-zinc-600">
                          <span>{formatDate(appt.appointmentDate)}</span>
                          <span className="block text-[11px] text-zinc-400">
                            {formatTime12(appt.startTime)}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-zinc-900">
                          {formatPrice(appt.priceSnapshot)}
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
                                  title="Accept Booking"
                                  className="p-1.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleQuickStatus(appt._id, 'reject')}
                                  title="Reject Booking"
                                  className="p-1.5 rounded bg-rose-50 text-rose-700 hover:bg-rose-100"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {['confirmed', 'accepted'].includes(appt.status) && (
                              <button
                                onClick={() => handleQuickStatus(appt._id, 'complete')}
                                className="px-2.5 py-1 rounded bg-zinc-900 text-white text-[11px] font-medium hover:bg-zinc-800"
                              >
                                Mark Completed
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
