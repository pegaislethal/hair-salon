'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { Appointment } from '../../../types';
import { appointmentService } from '../../../services/appointmentService';
import { formatTime12 } from '../../../utils/format';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function SubAdminCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  useEffect(() => {
    async function loadAppointments() {
      setLoading(true);
      try {
        const res = await appointmentService.getAppointments({ limit: 100 });
        if (res.success && res.data) {
          setAppointments(res.data);
        }
      } catch (err) {
        console.error('Failed to load appointments:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAppointments();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const apptsByDate: Record<string, Appointment[]> = {};
  appointments.forEach((appt) => {
    const dStr = new Date(appt.appointmentDate).toISOString().split('T')[0];
    if (!apptsByDate[dStr]) apptsByDate[dStr] = [];
    apptsByDate[dStr].push(appt);
  });

  return (
    <ProtectedRoute allowedRoles={['sub_admin', 'super_admin']}>
      <DashboardLayout
        role="sub_admin"
        title="Stylist Appointment Calendar"
        subtitle="Visual monthly layout of scheduled treatments"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2 border border-zinc-200 rounded-lg bg-white hover:bg-zinc-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-serif font-bold text-sm text-zinc-900 px-3 min-w-[140px] text-center">
              {monthName} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 border border-zinc-200 rounded-lg bg-white hover:bg-zinc-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        }
      >
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50 text-center py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-zinc-100">
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`blank-${idx}`} className="min-h-[110px] bg-zinc-50/40 p-2" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayAppts = apptsByDate[dateStr] || [];
              const isToday = new Date().toISOString().split('T')[0] === dateStr;

              return (
                <div
                  key={dayNum}
                  className={`min-h-[110px] p-2 ${
                    isToday ? 'bg-champagne-50/40' : 'bg-white hover:bg-zinc-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday ? 'bg-zinc-900 text-white' : 'text-zinc-700'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayAppts.length > 0 && (
                      <span className="text-[10px] font-bold text-champagne-700 bg-champagne-100 px-1.5 rounded">
                        {dayAppts.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-[85px]">
                    {dayAppts.slice(0, 3).map((appt) => (
                      <div
                        key={appt._id}
                        className="p-1 rounded bg-zinc-100 border border-zinc-200/80 text-[10px] leading-tight"
                      >
                        <p className="font-semibold text-zinc-900 truncate">
                          {formatTime12(appt.startTime)} • {appt.service?.name}
                        </p>
                        <p className="text-zinc-500 truncate">
                          {appt.customer?.fullName || 'Client'}
                        </p>
                      </div>
                    ))}
                    {dayAppts.length > 3 && (
                      <p className="text-[10px] text-zinc-400 font-medium text-center">
                        +{dayAppts.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
