'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { useAuth } from '../../../context/AuthContext';
import { authService } from '../../../services/authService';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { getNepalPhoneInputValue, normalizeNepalPhone } from '../../../utils/nepalPhone';
import { User, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

export default function CustomerProfilePage() {
  const { user, updateUser } = useAuth();

  // Profile info state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(getNepalPhoneInputValue(user?.phone || ''));
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [phoneVerificationLoading, setPhoneVerificationLoading] = useState(false);
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneCodeError, setPhoneCodeError] = useState<string | null>(null);
  const [phoneVerificationMessage, setPhoneVerificationMessage] = useState<string | null>(null);
  const [phoneVerificationError, setPhoneVerificationError] = useState<string | null>(null);

  const phoneValidation = normalizeNepalPhone(phone);
  const savedPhoneValidation = normalizeNepalPhone(user?.phone || '');
  const phoneMatchesSavedValue =
    phoneValidation.valid &&
    savedPhoneValidation.valid &&
    phoneValidation.normalized === savedPhoneValidation.normalized;
  const phoneVerified = Boolean(user?.isPhoneVerified && phoneMatchesSavedValue);

  useEffect(() => {
    if (user?.fullName) setFullName(user.fullName);
    if (user?.phone) setPhone(getNepalPhoneInputValue(user.phone));
  }, [user?.fullName, user?.phone]);

  const handlePhoneChange = (value: string) => {
    const nextPhone = getNepalPhoneInputValue(value);
    setPhone(nextPhone);
    setPhoneCodeSent(false);
    setPhoneCode('');
    setPhoneVerificationMessage(null);
    setPhoneVerificationError(null);
    if (phoneTouched) setPhoneError(normalizeNepalPhone(nextPhone).error);
  };

  // Password state
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
    const validatedPhone = normalizeNepalPhone(phone);
    if (!validatedPhone.valid) {
      setPhoneTouched(true);
      setPhoneError(validatedPhone.error);
      return;
    }
    setProfileLoading(true);

    try {
      const res = await authService.updateProfile({ fullName, phone: validatedPhone.normalized });
      if (res.success && res.data) {
        updateUser(res.data);
        setProfileSuccess(true);
        setPhoneError(null);
      } else {
        setProfileError(res.message || 'Failed to update profile.');
      }
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleRequestPhoneVerification = async () => {
    setPhoneVerificationError(null);
    setPhoneVerificationMessage(null);
    const validatedPhone = normalizeNepalPhone(phone);
    if (!validatedPhone.valid) {
      setPhoneTouched(true);
      setPhoneError(validatedPhone.error);
      return;
    }

    setPhoneVerificationLoading(true);
    try {
      if (!user) throw new Error('Please sign in again before verifying your phone.');
      if (user.phone !== validatedPhone.normalized || fullName.trim() !== user.fullName) {
        const profile = await authService.updateProfile({
          fullName: fullName.trim(),
          phone: validatedPhone.normalized,
        });
        if (!profile.success || !profile.data) {
          throw new Error(profile.message || 'Could not save your phone number.');
        }
        updateUser(profile.data);
      }

      const response = await authService.requestPhoneVerification();
      setPhoneCodeSent(true);
      setPhoneVerificationMessage(response.message);
    } catch (err: any) {
      setPhoneVerificationError(
        err.response?.data?.message || err.message || 'Could not send a verification code. Please try again.'
      );
    } finally {
      setPhoneVerificationLoading(false);
    }
  };

  const handleVerifyPhone = async () => {
    setPhoneCodeError(null);
    if (!/^\d{6}$/.test(phoneCode)) {
      setPhoneCodeError('Enter the six-digit verification code.');
      return;
    }

    setPhoneVerificationLoading(true);
    try {
      const response = await authService.verifyPhoneCode(phoneCode);
      if (!response.success || !response.data) {
        setPhoneCodeError(response.message || 'That verification code is invalid or expired.');
        return;
      }
      updateUser(response.data);
      setPhoneCodeSent(false);
      setPhoneCode('');
      setPhoneVerificationMessage('Your phone number is verified.');
    } catch (err: any) {
      setPhoneCodeError(
        err.response?.data?.message || 'That verification code is invalid or expired.'
      );
    } finally {
      setPhoneVerificationLoading(false);
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
    <ProtectedRoute allowedRoles={['customer']}>
      <DashboardLayout
        role="customer"
        title="My Profile"
        subtitle="Manage your personal contact details and account security"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
          {/* Contact Information */}
          <div className="bg-white p-8 rounded-xl border border-zinc-200 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 pb-4">
              <h3 className="font-serif text-lg font-bold text-zinc-900">Personal Information</h3>
              <p className="text-xs text-zinc-500">Update your name and primary phone number</p>
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
                <p className="text-[11px] text-zinc-400">Email cannot be modified directly.</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="profile-phone" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                  Phone Number
                </label>
                <div className={`flex rounded-md border bg-white focus-within:ring-1 focus-within:ring-zinc-900 ${phoneError ? 'border-rose-400 focus-within:ring-rose-500' : 'border-zinc-200'}`}>
                  <span className="inline-flex items-center border-r border-zinc-200 bg-zinc-50 px-3.5 text-sm font-medium text-zinc-600">
                    +977
                  </span>
                  <input
                    id="profile-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={() => {
                      setPhoneTouched(true);
                      setPhoneError(normalizeNepalPhone(phone).error);
                    }}
                    placeholder="98XXXXXXXX"
                    aria-invalid={Boolean(phoneError)}
                    aria-describedby="profile-phone-help"
                    required
                    className="min-w-0 flex-1 rounded-r-md px-3.5 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                  />
                </div>
                {phoneError ? (
                  <p id="profile-phone-help" role="alert" className="text-xs font-medium text-rose-500">{phoneError}</p>
                ) : (
                  <p id="profile-phone-help" className="text-xs text-zinc-500">
                    Enter 10 digits starting with 98 or 97.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                isLoading={profileLoading}
                disabled={!phoneValidation.valid}
                className="w-full sm:w-auto"
              >
                Save Profile Changes
              </Button>
            </form>

            <div className="space-y-3 border-t border-zinc-100 pt-4">
              {phoneVerified ? (
                <p className="flex items-center gap-2 text-xs font-medium text-emerald-700" role="status">
                  <CheckCircle2 className="h-4 w-4" /> Phone number verified.
                </p>
              ) : (
                <>
                  <p className="text-xs text-zinc-500">
                    Phone verification is optional. We will send a one-time code by SMS.
                  </p>
                  {!phoneCodeSent ? (
                    <Button
                      type="button"
                      variant="outline"
                      isLoading={phoneVerificationLoading}
                      disabled={!phoneValidation.valid}
                      onClick={handleRequestPhoneVerification}
                    >
                      Send Verification Code
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Input
                        label="Six-digit SMS code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={phoneCode}
                        onChange={(event) => {
                          const nextCode = event.target.value;
                          setPhoneCode(nextCode);
                          if (phoneCodeError) {
                            setPhoneCodeError(/^\d{6}$/.test(nextCode) ? null : 'Enter the six-digit verification code.');
                          }
                        }}
                        onBlur={() => {
                          if (phoneCode && !/^\d{6}$/.test(phoneCode)) {
                            setPhoneCodeError('Enter the six-digit verification code.');
                          }
                        }}
                        error={phoneCodeError || undefined}
                        placeholder="123456"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          isLoading={phoneVerificationLoading}
                          disabled={!/^\d{6}$/.test(phoneCode)}
                          onClick={handleVerifyPhone}
                        >
                          Verify Phone
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          isLoading={phoneVerificationLoading}
                          disabled={!phoneValidation.valid}
                          onClick={handleRequestPhoneVerification}
                        >
                          Resend Code
                        </Button>
                      </div>
                    </div>
                  )}
                  {phoneVerificationMessage && (
                    <p className="text-xs text-emerald-700" role="status">{phoneVerificationMessage}</p>
                  )}
                  {phoneVerificationError && (
                    <p className="text-xs text-rose-600" role="alert">{phoneVerificationError}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white p-8 rounded-xl border border-zinc-200 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 pb-4">
              <h3 className="font-serif text-lg font-bold text-zinc-900">Security & Password</h3>
              <p className="text-xs text-zinc-500">Ensure your account uses a secure password</p>
            </div>

            {passwordSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Password changed successfully.</span>
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

              <Button type="submit" isLoading={passwordLoading} className="w-full sm:w-auto">
                Update Password
              </Button>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
