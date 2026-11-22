'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { Staff } from '../../../types';
import { staffService } from '../../../services/staffService';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Users, Plus, Trash2, Mail, Phone, ShieldCheck } from 'lucide-react';

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await staffService.getStaff();
      if (res.success && res.data) {
        setStaffList(res.data);
      }
    } catch (err) {
      console.error('Failed to load staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await staffService.createStaff({
        fullName,
        email,
        phone,
        password,
        bio,
      });
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
        title="Staff & Stylist Management"
        subtitle="Manage salon stylists, schedules, and active staff profiles"
        actions={
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 text-xs">
            <Plus className="w-4 h-4" /> Add Stylist / Sub Admin
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
                            onClick={() => handleDelete(st._id)}
                            className="p-1.5 rounded hover:bg-rose-50 text-zinc-400 hover:text-rose-600"
                            title="Deactivate staff"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
          title="Add Stylist / Sub Admin"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded">
                {errorMsg}
              </div>
            )}
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="E.g. Elena Smith"
              required
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="elena@irissalon.com"
              required
            />
            <Input
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+977-98..."
              required
            />
            <Input
              label="Initial Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
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
                Create Stylist
              </Button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
