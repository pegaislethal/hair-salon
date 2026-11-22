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
import { Users, Plus, Trash2, Mail, Phone, ShieldCheck, Edit2 } from 'lucide-react';

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const defaultHours = (): Staff['workingHours'] => Object.fromEntries(days.map((day) => [
  day,
  { start: '09:00', end: '18:00', isWorking: day !== 'sunday' },
])) as Staff['workingHours'];

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      setErrorMsg(err.response?.data?.message || 'Failed to create staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this staff member?')) return;
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
        subtitle="Manage barber profiles, assigned services, working hours, breaks, and holidays"
        actions={
          <Button onClick={openCreateModal} className="gap-2 text-xs">
          <Plus className="w-4 h-4" /> Add Barber
          </Button>
        }
      >
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
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                      Loading staff...
                    </td>
                  </tr>
                ) : staffList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                      No staff members found. Click &quot;Add Stylist&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  staffList.map((st) => {
                    const u = typeof st.user === 'object' ? (st.user as any) : null;
                    return (
                      <tr key={st._id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-champagne-100 text-champagne-900 font-semibold flex items-center justify-center shrink-0">
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
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              st.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
                            }`}
                          >
                            {st.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openEditModal(st)}
                            className="p-1.5 rounded hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900"
                            title="Edit barber profile and schedule"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {st.isActive && <button
                            onClick={() => handleDelete(st._id)}
                            className="p-1.5 rounded hover:bg-rose-50 text-zinc-400 hover:text-rose-600"
                            title="Deactivate staff"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingStaff ? 'Manage Barber & Schedule' : 'Add Barber'}
          maxWidth="xl"
        >
          <form onSubmit={handleSave} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded">
                {errorMsg}
              </div>
            )}
            <>
              <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              {!editingStaff && <Input label="Initial Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />}
            </>
            {editingStaff && <label className="flex items-center gap-2 text-xs text-zinc-700"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Barber is active and bookable</label>}
            <Input label="Profile Image URL" type="url" value={profileImage} onChange={(e) => setProfileImage(e.target.value)} />
            <Input label="Specializations (comma separated)" value={specializations} onChange={(e) => setSpecializations(e.target.value)} placeholder="Fades, coloring, styling" />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-700">Assigned Services</p>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                {services.map((service) => (
                  <label key={service._id} className="flex items-center gap-2 text-xs text-zinc-600">
                    <input type="checkbox" checked={serviceIds.includes(service._id)} onChange={(e) => setServiceIds((current) => e.target.checked ? [...current, service._id] : current.filter((id) => id !== service._id))} />
                    {service.name}
                  </label>
                ))}
              </div>
              <p className="text-[11px] text-zinc-400">Leave all unchecked to allow every active service.</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-700">Weekly Working Hours</p>
              {days.map((day) => (
                <div key={day} className="grid grid-cols-[1fr_auto_1fr_1fr] items-center gap-2 text-xs">
                  <span className="capitalize">{day}</span>
                  <input aria-label={`${day} working`} type="checkbox" checked={workingHours[day]?.isWorking || false} onChange={(e) => setWorkingHours((current) => ({ ...current, [day]: { ...current[day], isWorking: e.target.checked } }))} />
                  <input aria-label={`${day} start`} type="time" value={workingHours[day]?.start || '09:00'} onChange={(e) => setWorkingHours((current) => ({ ...current, [day]: { ...current[day], start: e.target.value } }))} className="border rounded px-2 py-1" disabled={!workingHours[day]?.isWorking} />
                  <input aria-label={`${day} end`} type="time" value={workingHours[day]?.end || '18:00'} onChange={(e) => setWorkingHours((current) => ({ ...current, [day]: { ...current[day], end: e.target.value } }))} className="border rounded px-2 py-1" disabled={!workingHours[day]?.isWorking} />
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-700">Breaks (one per line: 12:00-13:00|Lunch)</label>
                <textarea rows={3} value={breaksText} onChange={(e) => setBreaksText(e.target.value)} className="w-full border rounded-md p-2 text-xs" placeholder="12:00-13:00|Lunch" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-700">Holidays (YYYY-MM-DD, comma separated)</label>
                <textarea rows={3} value={daysOffText} onChange={(e) => setDaysOffText(e.target.value)} className="w-full border rounded-md p-2 text-xs" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Stylist Bio
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Specializes in balayage, editorial hair, and scalp care..."
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" type="submit" isLoading={submitting}>
                {editingStaff ? 'Save Barber' : 'Create Barber'}
              </Button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
