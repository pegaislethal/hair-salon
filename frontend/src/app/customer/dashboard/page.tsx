'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { useAuth } from '../../../context/AuthContext';
import { Appointment } from '../../../types';
import { appointmentService } from '../../../services/appointmentService';
import { Badge } from '../../../components/ui/Badge';
import { formatPrice, formatDate, formatTime12 } from '../../../utils/format';
import {
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Scissors,
  UserCheck,
  CheckCircle,
} from 'lucide-react';

export default function CustomerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Do not fetch until auth has fully initialized
    if (authLoading) return;

    async function loadData() {
      try {
        const res = await appointmentService.getAppointments({ limit: 5 });
        if (res.success && res.data) {
          setAppointments(res.data);
        }
      } catch (err) {
        console.error('Failed to load appointments:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [authLoading]);

  const upcoming = appointments.filter((a) => ['pending', 'reschedule_requested', 'confirmed', 'accepted'].includes(a.status));
  const past = appointments.filter((a) => ['completed', 'cancelled', 'rejected'].includes(a.status));

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <DashboardLayout
        role="customer"
        title={`Welcome, ${user?.fullName || 'Client'}`}
        subtitle="Manage your personal hair and beauty appointments"
        actions={
          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm"
          >
            <Calendar className="w-4 h-4 text-champagne-300" />
            Book New Appointment
          </Link>
        }
      >
        <div className="space-y-8">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-xl border border-zinc-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-champagne-100 flex items-center justify-center text-champagne-800">
                <Calendar className="w-6 h-6 text-champagne-700" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Active Bookings</p>
                <p className="font-serif text-2xl font-bold text-zinc-900 mt-0.5">{upcoming.length}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-zinc-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-champagne-100 flex items-center justify-center text-champagne-800">
                <Scissors className="w-6 h-6 text-champagne-700" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Past Visits</p>
                <p className="font-serif text-2xl font-bold text-zinc-900 mt-0.5">{past.length}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-zinc-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Client Status</p>
                <p className="text-sm font-bold text-zinc-900 mt-1">Verified Member</p>
              </div>
            </div>
          </div>

          {/* Upcoming Appointments List */}
          <div className="bg-white rounded-xl border border-zinc-200/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-zinc-900">Upcoming Appointments</h3>
                <p className="text-xs text-zinc-500">Your scheduled visits awaiting or confirmed</p>
              </div>
              <Link
                href="/customer/appointments"
                className="text-xs font-semibold text-zinc-900 hover:text-champagne-700 underline"
              >
                View All
              </Link>
            </div>

            <div className="divide-y divide-zinc-100">
              {loading ? (
                <div className="p-8 text-center text-xs text-zinc-400">Loading appointments...</div>
              ) : upcoming.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Calendar className="w-10 h-10 text-zinc-300 mx-auto" />
                  <p className="text-sm font-medium text-zinc-700">No active appointments scheduled</p>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Ready to refresh your style? Reserve an appointment with one of our master stylists today.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/book"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-champagne-100 text-champagne-900 hover:bg-champagne-200 text-xs font-semibold uppercase tracking-wider border border-champagne-300"
                    >
                      Book a Service
                    </Link>
                  </div>
                </div>
              ) : (
                upcoming.map((appt) => (
                  <div
                    key={appt._id}
                    className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/50 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded">
                          {appt.bookingReference}
                        </span>
                        <Badge variant={appt.status}>{appt.status}</Badge>
                      </div>
                      <h4 className="font-serif text-base font-bold text-zinc-900">
                        {appt.service?.name || 'Salon Treatment'}
                      </h4>
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <span>{formatDate(appt.appointmentDate)}</span>
                        <span>•</span>
                        <span>{formatTime12(appt.startTime)}</span>
                        <span>•</span>
                        <span>{formatPrice(appt.priceSnapshot)}</span>
                      </div>
                    </div>

                    <Link
                      href={`/customer/appointments/${appt._id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded border border-zinc-200 text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-white transition-colors"
                    >
                      Details & Manage <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
