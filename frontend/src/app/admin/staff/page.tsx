'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { Service, Staff } from '../../../types';
import { staffService } from '../../../services/staffService';
import { serviceService } from '../../../services/serviceService';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import {
  Users,
  Plus,
  Trash2,
  Mail,
  Phone,
  ShieldCheck,
  Edit3,
  Scissors,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Coffee,
  Check
} from 'lucide-react';

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const dayLabels: Record<typeof days[number], string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun'
};

const defaultHours = (): Staff['workingHours'] => Object.fromEntries(days.map((day) => [
  day,
  { start: '09:00', end: '18:00', isWorking: day !== 'sunday' },
])) as Staff['workingHours'];

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'services' | 'schedule'>('basic');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [specializations, setSpecializations] = useState('');
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [workingHours, setWorkingHours] = useState<Staff['workingHours']>(defaultHours());
  const [breaksText, setBreaksText] = useState('');
  const [daysOffText, setDaysOffText] = useState('');
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const [res, servicesRes] = await Promise.all([
        staffService.getStaffManagement(),
        serviceService.getServices({ active: 'false' }),
      ]);
      if (res.success && res.data) {
        setStaffList(res.data);
      }
      if (servicesRes.success && servicesRes.data) setServices(servicesRes.data.filter((service) => service.isActive));
    } catch (err) {
      console.error('Failed to load staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const openCreateModal = () => {
    setEditingStaff(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setBio('');
    setProfileImage('');
    setSpecializations('');
    setServiceIds([]);
    setWorkingHours(defaultHours());
    setBreaksText('');
    setDaysOffText('');
    setErrorMsg(null);
    setIsActive(true);
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const openEditModal = (staff: Staff) => {
    setEditingStaff(staff);
    const account = typeof staff.user === 'object' ? staff.user : null;
    setFullName(account?.fullName || '');
    setEmail(account?.email || '');
    setPhone(account?.phone || '');
    setPassword('');
    setIsActive(staff.isActive);
    setBio(staff.bio || '');
    setProfileImage(staff.profileImage || '');
    setSpecializations((staff.specializations || []).join(', '));
    setServiceIds(staff.services.map((service) => typeof service === 'string' ? service : service._id));
    setWorkingHours(staff.workingHours || defaultHours());
    setBreaksText((staff.breaks || []).map((item) => `${item.start}-${item.end}|${item.label || 'Break'}`).join('\n'));
    setDaysOffText((staff.daysOff || []).map((date) => date.slice(0, 10)).join(', '));
    setErrorMsg(null);
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const breaks = breaksText.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
        const [hours, label] = line.split('|');
        const [start, end] = hours.split('-');
        return { start, end, label: label || 'Break' };
      });
      const profile = {
        bio,
        profileImage: profileImage || undefined,
        specializations: specializations.split(',').map((item) => item.trim()).filter(Boolean),
        services: serviceIds,
        workingHours,
        breaks,
        daysOff: daysOffText.split(',').map((date) => date.trim()).filter(Boolean),
        isActive,
        fullName,
        email,
        phone,
      };
      const res = editingStaff
        ? await staffService.updateStaff(editingStaff._id, profile)
        : await staffService.createStaff({ ...profile, fullName, email, phone, password });
      if (res.success) {
        setIsModalOpen(false);
        fetchStaff();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to save barber profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this barber account?')) return;
    try {
      await staffService.deleteStaff(id);
      fetchStaff();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['super_admin']}>
      <DashboardLayout
        role="super_admin"
        title="Barber Management"
        subtitle="Manage master stylists, schedules, assignments, and salon availability"
        actions={
          <div className="flex items-center gap-2">
            <div className="bg-zinc-100 p-1 rounded-lg flex text-xs font-medium text-zinc-600">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'cards' ? 'bg-white text-zinc-900 shadow-sm' : 'hover:text-zinc-900'}`}
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white text-zinc-900 shadow-sm' : 'hover:text-zinc-900'}`}
              >
                Table
              </button>
            </div>
            <Button onClick={openCreateModal} className="gap-2 text-xs">
              <Plus className="w-4 h-4" /> Add Barber
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {loading ? (
            <div className="py-20 text-center space-y-3 bg-white rounded-2xl border border-zinc-200/80">
              <div className="w-8 h-8 border-2 border-champagne-300 border-t-zinc-900 rounded-full animate-spin mx-auto" />
              <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Loading barber profiles...</p>
            </div>
          ) : staffList.length === 0 ? (
            <div className="p-12 text-center space-y-4 bg-white rounded-2xl border border-dashed border-zinc-300">
              <div className="w-14 h-14 rounded-full bg-champagne-100 text-champagne-800 flex items-center justify-center mx-auto">
                <Scissors className="w-6 h-6 text-champagne-700" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-zinc-900">No Barbers Registered</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  Add your first stylist profile to manage appointment allocations, working shifts, and assigned treatments.
                </p>
              </div>
              <Button onClick={openCreateModal} className="gap-2 text-xs">
                <Plus className="w-4 h-4" /> Add First Barber
              </Button>
            </div>
          ) : viewMode === 'cards' ? (
            /* Cards View */
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {staffList.map((st) => {
                const u = typeof st.user === 'object' ? (st.user as any) : null;
                const workingDaysCount = days.filter((d) => st.workingHours?.[d]?.isWorking).length;
                return (
                  <article
                    key={st._id}
                    className="group bg-white rounded-2xl border border-zinc-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                  >
                    <div>
                      {/* Header banner */}
                      <div className="h-16 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-950 p-4 flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-champagne-300">
                          Iris Stylist
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            st.isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                              : 'bg-zinc-700 text-zinc-300 border border-zinc-600'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${st.isActive ? 'bg-emerald-400' : 'bg-zinc-400'}`} />
                          {st.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Profile info */}
                      <div className="p-6 -mt-8 space-y-4">
                        <div className="flex items-end justify-between">
                          <div className="relative">
                            {st.profileImage || u?.profileImage ? (
                              <img
                                src={st.profileImage || u?.profileImage}
                                alt={u?.fullName || 'Barber'}
                                className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md bg-white"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-champagne-100 text-champagne-900 font-serif font-bold text-xl flex items-center justify-center border-4 border-white shadow-md">
                                {u?.fullName ? u.fullName[0].toUpperCase() : 'B'}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 text-[10px] font-medium uppercase tracking-wider">
                              Sub Admin
                            </span>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-serif text-lg font-bold text-zinc-900">{u?.fullName || 'Barber'}</h3>
                          <p className="text-xs text-zinc-500 line-clamp-2 mt-1">
                            {st.bio || 'Professional hair stylist and grooming specialist.'}
                          </p>
                        </div>

                        {/* Specializations */}
                        {st.specializations && st.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {st.specializations.map((spec, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-champagne-50 border border-champagne-200/70 text-champagne-900 text-[10px] font-semibold rounded"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Contact details */}
                        <div className="space-y-1.5 pt-2 border-t border-zinc-100 text-xs text-zinc-600">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span className="truncate">{u?.email || '—'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span>{u?.phone || '—'}</span>
                          </div>
                        </div>

                        {/* Summary Badges */}
                        <div className="grid grid-cols-2 gap-2 pt-2 text-center text-xs">
                          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
                            <span className="block text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Services</span>
                            <span className="font-semibold text-zinc-800 text-xs">
                              {st.services?.length ? `${st.services.length} Assigned` : 'All Services'}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
                            <span className="block text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Schedule</span>
                            <span className="font-semibold text-zinc-800 text-xs">{workingDaysCount} Days / Wk</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-3.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                      <button
                        onClick={() => openEditModal(st)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                      </button>
                      {st.isActive && (
                        <button
                          onClick={() => handleDelete(st._id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Deactivate
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-xl border border-zinc-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-3.5">Stylist</th>
                      <th className="px-6 py-3.5">Contact</th>
                      <th className="px-6 py-3.5">Bio</th>
                      <th className="px-6 py-3.5">Assigned Services</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {staffList.map((st) => {
                      const u = typeof st.user === 'object' ? (st.user as any) : null;
                      return (
                        <tr key={st._id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-champagne-100 text-champagne-900 font-semibold flex items-center justify-center shrink-0">
                                {u?.fullName ? u.fullName[0].toUpperCase() : 'S'}
                              </div>
                              <div>
                                <span className="font-semibold text-zinc-900 block">
                                  {u?.fullName || 'Staff Member'}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                                  Sub Admin / Stylist
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-zinc-600">
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{u?.email}</span>
                            </div>
                            {u?.phone && (
                              <div className="flex items-center gap-1.5 mt-0.5 text-zinc-400 text-[11px]">
                                <Phone className="w-3 h-3" />
                                <span>{u.phone}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-zinc-500 max-w-xs truncate">
                            {st.bio || 'Experienced salon stylist'}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-zinc-600">
                              {st.services?.length ? `${st.services.length} services` : 'All Services'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                st.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-zinc-100 text-zinc-500'
                              }`}
                            >
                              {st.isActive ? 'Active' : 'Deactivated'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditModal(st)}
                                className="p-1.5 rounded hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900"
                                title="Edit profile and schedule"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {st.isActive && (
                                <button
                                  onClick={() => handleDelete(st._id)}
                                  className="p-1.5 rounded hover:bg-rose-50 text-zinc-400 hover:text-rose-600"
                                  title="Deactivate staff"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Premium Redesigned Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingStaff ? `Edit Stylist: ${fullName || 'Barber'}` : 'Add Master Stylist & Barber'}
          maxWidth="2xl"
        >
          <form onSubmit={handleSave} className="space-y-6">
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Step / Section Navigation Tabs */}
            <div className="flex border-b border-zinc-100 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`flex-1 py-3 border-b-2 text-center transition-all ${
                  activeTab === 'basic'
                    ? 'border-zinc-900 text-zinc-900 font-bold bg-champagne-50/40'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                1. Account & Profile
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('services')}
                className={`flex-1 py-3 border-b-2 text-center transition-all ${
                  activeTab === 'services'
                    ? 'border-zinc-900 text-zinc-900 font-bold bg-champagne-50/40'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                2. Assigned Services
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('schedule')}
                className={`flex-1 py-3 border-b-2 text-center transition-all ${
                  activeTab === 'schedule'
                    ? 'border-zinc-900 text-zinc-900 font-bold bg-champagne-50/40'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                3. Working Hours & Shifts
              </button>
            </div>

            {/* TAB 1: Account & Profile */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name *"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Lycan Pradhan"
                    required
                  />
                  <Input
                    label="Email Address *"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="barber@irissalon.com"
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Phone Number *"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98XXXXXXXX"
                    required
                  />
                  {!editingStaff ? (
                    <Input
                      label="Initial Login Password *"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      minLength={6}
                      required
                    />
                  ) : (
                    <div className="space-y-1.5 flex flex-col justify-end pb-2">
                      <label className="flex items-center gap-2.5 text-xs font-semibold text-zinc-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                        />
                        <span>Active & Bookable by Clients</span>
                      </label>
                      <p className="text-[11px] text-zinc-400">Uncheck to temporarily hide from customer bookings.</p>
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Profile Photo URL"
                    type="url"
                    value={profileImage}
                    onChange={(e) => setProfileImage(e.target.value)}
                    placeholder="https://..."
                  />
                  <Input
                    label="Specializations"
                    value={specializations}
                    onChange={(e) => setSpecializations(e.target.value)}
                    placeholder="Fade cuts, Beard shaping, Hair Spa"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                    Stylist Bio & Experience
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Share the stylist's signature technique, experience, and background..."
                    className="w-full px-3.5 py-2.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: Services */}
            {activeTab === 'services' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">Service Capabilities</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Select which services this barber is qualified to perform.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setServiceIds(serviceIds.length === services.length ? [] : services.map((s) => s._id))}
                    className="text-xs font-semibold text-champagne-800 hover:text-champagne-900 underline"
                  >
                    {serviceIds.length === services.length ? 'Clear All' : 'Select All'}
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {services.map((service) => {
                    const isChecked = serviceIds.includes(service._id);
                    return (
                      <label
                        key={service._id}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? 'border-zinc-900 bg-champagne-50/50 text-zinc-900 font-medium'
                            : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              setServiceIds((curr) =>
                                e.target.checked ? [...curr, service._id] : curr.filter((id) => id !== service._id)
                              )
                            }
                            className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                          />
                          <span>{service.name}</span>
                        </div>
                        <span className="text-[11px] text-zinc-400">{service.duration}m</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[11px] text-zinc-400 italic">
                  Note: If no specific services are checked, the barber is eligible for all active salon treatments.
                </p>
              </div>
            )}

            {/* TAB 3: Schedule */}
            {activeTab === 'schedule' && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">Weekly Shift Schedule</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Toggle working days and customize start/end hours.</p>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {days.map((day) => {
                    const isWorking = workingHours[day]?.isWorking || false;
                    return (
                      <div
                        key={day}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                          isWorking ? 'border-zinc-200 bg-zinc-50/60' : 'border-zinc-100 bg-zinc-50/20 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3 w-28">
                          <input
                            aria-label={`${day} working`}
                            type="checkbox"
                            checked={isWorking}
                            onChange={(e) =>
                              setWorkingHours((current) => ({
                                ...current,
                                [day]: { ...current[day], isWorking: e.target.checked },
                              }))
                            }
                            className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                          />
                          <span className="font-semibold capitalize text-zinc-800">{dayLabels[day]}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            aria-label={`${day} start`}
                            type="time"
                            value={workingHours[day]?.start || '09:00'}
                            onChange={(e) =>
                              setWorkingHours((current) => ({
                                ...current,
                                [day]: { ...current[day], start: e.target.value },
                              }))
                            }
                            className="border border-zinc-200 rounded-md px-2 py-1 text-xs text-zinc-800 disabled:bg-zinc-100"
                            disabled={!isWorking}
                          />
                          <span className="text-zinc-400">to</span>
                          <input
                            aria-label={`${day} end`}
                            type="time"
                            value={workingHours[day]?.end || '18:00'}
                            onChange={(e) =>
                              setWorkingHours((current) => ({
                                ...current,
                                [day]: { ...current[day], end: e.target.value },
                              }))
                            }
                            className="border border-zinc-200 rounded-md px-2 py-1 text-xs text-zinc-800 disabled:bg-zinc-100"
                            disabled={!isWorking}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                      Daily Breaks
                    </label>
                    <textarea
                      rows={2}
                      value={breaksText}
                      onChange={(e) => setBreaksText(e.target.value)}
                      className="w-full border border-zinc-200 rounded-lg p-2.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                      placeholder="13:00-14:00|Lunch&#10;16:30-17:00|Tea"
                    />
                    <p className="text-[10px] text-zinc-400">Format: START-END|LABEL (one per line)</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                      Upcoming Days Off / Holidays
                    </label>
                    <textarea
                      rows={2}
                      value={daysOffText}
                      onChange={(e) => setDaysOffText(e.target.value)}
                      className="w-full border border-zinc-200 rounded-lg p-2.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                      placeholder="2026-12-25, 2027-01-01"
                    />
                    <p className="text-[10px] text-zinc-400">Comma-separated YYYY-MM-DD dates</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
              <div className="flex gap-2">
                {activeTab !== 'basic' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab(activeTab === 'schedule' ? 'services' : 'basic')}
                  >
                    Back
                  </Button>
                )}
                {activeTab !== 'schedule' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab(activeTab === 'basic' ? 'services' : 'schedule')}
                  >
                    Next Step
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" type="submit" isLoading={submitting}>
                  {editingStaff ? 'Save Changes' : 'Create Stylist'}
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
