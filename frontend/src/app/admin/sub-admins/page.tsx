'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { Staff } from '../../../types';
import { staffService } from '../../../services/staffService';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { ShieldCheck, Plus, Trash2, Mail, Phone, KeyRound } from 'lucide-react';

export default function SubAdminManagementPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSubAdmins = async () => {
    setLoading(true);
    try {
      const res = await staffService.getStaff();
      if (res.success && res.data) {
        setStaffList(res.data);
      }
    } catch (err) {
      console.error('Failed to load sub admins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubAdmins();
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
        setModalOpen(false);
        fetchSubAdmins();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create sub admin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this sub admin?')) return;
    try {
      await staffService.deleteStaff(id);
      fetchSubAdmins();
    } catch (err) {
      console.error('Deactivation failed:', err);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['super_admin']}>
      <DashboardLayout
        role="super_admin"
        title="Sub Admin Management"
        subtitle="Delegate operational control to salon managers and assistant supervisors"
        actions={
          <Button onClick={() => setModalOpen(true)} className="gap-2 text-xs">
            <Plus className="w-4 h-4" /> Provision New Sub Admin
          </Button>
        }
      >
        <div className="bg-white rounded-xl border border-zinc-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Sub Admin Name</th>
                  <th className="px-6 py-3.5">Email / Login</th>
                  <th className="px-6 py-3.5">Phone</th>
                  <th className="px-6 py-3.5">Role Privileges</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                      Loading sub admin directory...
                    </td>
                  </tr>
                ) : staffList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                      No sub admins provisioned yet.
                    </td>
                  </tr>
                ) : (
                  staffList.map((st) => {
                    const u = typeof st.user === 'object' ? (st.user as any) : null;
                    return (
                      <tr key={st._id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-zinc-900">
                          {u?.fullName || 'Sub Admin'}
                        </td>
                        <td className="px-6 py-4 text-zinc-600">{u?.email}</td>
                        <td className="px-6 py-4 text-zinc-600">{u?.phone || '—'}</td>
                        <td className="px-6 py-4">
                          <span className="bg-champagne-100 text-champagne-800 text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
                            Appointments & Customer Care
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              st.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {st.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(st._id)}
                            className="p-1.5 rounded hover:bg-rose-50 text-zinc-400 hover:text-rose-600"
                            title="Deactivate"
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
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Provision Sub Admin"
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
              placeholder="E.g. David Manager"
              required
            />
            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="david@irissalon.com"
              required
            />
            <Input
              label="Contact Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+977-98..."
              required
            />
            <Input
              label="Temporary Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Staff / Operational Role Note
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Front desk manager & weekend shift coordinator"
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <Button variant="outline" size="sm" type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" type="submit" isLoading={submitting}>
                Create Sub Admin
              </Button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
