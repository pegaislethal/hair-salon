'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { useAuth } from '../../../context/AuthContext';
import { authService } from '../../../services/authService';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function SubAdminProfilePage() {
  const { user, updateUser } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setProfileLoading(true);

    try {
      const res = await authService.updateProfile({ fullName, phone });
      if (res.success && res.data) {
        updateUser(res.data);
        setProfileSuccess(true);
      }
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await authService.changePassword({ currentPassword, newPassword });
      if (res.success) {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['sub_admin', 'super_admin']}>
      <DashboardLayout
        role="sub_admin"
        title="Stylist / Sub Admin Profile"
        subtitle="Manage your contact information and login credentials"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
          <div className="bg-white p-8 rounded-xl border border-zinc-200 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 pb-4">
              <h3 className="font-serif text-lg font-bold text-zinc-900">Personal Information</h3>
              <p className="text-xs text-zinc-500">Update your public staff profile name & phone</p>
            </div>

            {profileSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Profile updated successfully.</span>
              </div>
            )}

            {profileError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-md text-zinc-500 cursor-not-allowed"
                />
              </div>

              <Input
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+977-98..."
                required
              />

              <Button type="submit" isLoading={profileLoading}>
                Save Changes
              </Button>
            </form>
          </div>

          <div className="bg-white p-8 rounded-xl border border-zinc-200 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 pb-4">
              <h3 className="font-serif text-lg font-bold text-zinc-900">Account Security</h3>
              <p className="text-xs text-zinc-500">Update your account password</p>
            </div>

            {passwordSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Password updated successfully.</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />

              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
              />

              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
                minLength={6}
              />

              <Button type="submit" isLoading={passwordLoading}>
                Update Password
              </Button>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
