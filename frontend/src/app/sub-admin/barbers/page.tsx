'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { Staff } from '../../../types';
import { staffService } from '../../../services/staffService';

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export default function SubAdminBarbersPage() {
  const [barbers, setBarbers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    staffService.getStaffManagement()
      .then((response) => setBarbers(response.data || []))
      .catch(() => setError('Unable to load barber schedules. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute allowedRoles={['sub_admin']}>
      <DashboardLayout role="sub_admin" title="Barber Schedules" subtitle="View barber profiles, assigned services, and weekly availability">
        {loading ? <p className="text-sm text-zinc-500">Loading barber schedules...</p> : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {barbers.map((barber) => {
              const user = typeof barber.user === 'object' ? barber.user : null;
              return (
                <article key={barber._id} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    {barber.profileImage || user?.profileImage
                      ? <img src={barber.profileImage || user?.profileImage} alt="" className="h-12 w-12 rounded-full object-cover" />
                      : <div className="h-12 w-12 rounded-full bg-champagne-100 flex items-center justify-center font-semibold">{user?.fullName?.[0] || 'B'}</div>}
                    <div>
                      <h2 className="font-semibold text-zinc-900">{user?.fullName || 'Barber'}</h2>
                      <p className="text-xs text-zinc-500">{barber.specializations?.join(', ') || barber.bio || 'Haircut & styling'}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-zinc-600">
                    Services: {barber.services.length ? barber.services.map((service) => typeof service === 'string' ? service : service.name).join(', ') : 'All active services'}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    {days.map((day) => {
                      const hours = barber.workingHours?.[day];
                      return <div key={day} className="flex justify-between rounded bg-zinc-50 px-3 py-2">
                        <span className="capitalize text-zinc-600">{day}</span>
                        <span className="font-medium text-zinc-800">{hours?.isWorking ? `${hours.start}–${hours.end}` : 'Off'}</span>
                      </div>;
                    })}
                  </div>
                  {!!barber.breaks?.length && <p className="mt-3 text-xs text-zinc-500">Breaks: {barber.breaks.map((item) => `${item.start}–${item.end} ${item.label}`).join(', ')}</p>}
                  {!!barber.daysOff?.length && <p className="mt-2 text-xs text-zinc-500">Holidays: {barber.daysOff.map((date) => date.slice(0, 10)).join(', ')}</p>}
                </article>
              );
            })}
            {!barbers.length && <p className="text-sm text-zinc-500">No barber schedules have been added.</p>}
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
