'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PublicLayout } from '../../layouts/PublicLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ResendVerificationForm } from '../../components/ResendVerificationForm';
import { authService } from '../../services/authService';
import { Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCanResend(false);
    setLoading(true);

    try {
      const res = await authService.register({ fullName, email, phone, password });
      if (res.success) {
        setSuccess(true);
        setEmailSent(res.emailSent === true);
      } else {
        const message = res.message || 'Registration failed.';
        setError(message);
        setCanResend(message.toLowerCase().includes('already registered'));
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed.';
      setError(message);
      setCanResend(err.response?.status === 409);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-[85vh] flex items-center justify-center py-16 px-4 bg-zinc-50/50">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl border border-zinc-200/80 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-champagne-100 border border-champagne-300 flex items-center justify-center text-champagne-800 mx-auto">
              <Sparkles className="w-5 h-5 text-champagne-700" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-zinc-900">Create an Account</h1>
            <p className="text-xs text-zinc-500">Join Iris Salon for effortless online appointments</p>
          </div>

          {success ? (
            <div className="p-6 rounded-xl bg-champagne-50 border border-champagne-300 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="font-serif text-lg font-bold text-zinc-900">Verify Your Email</h3>
              <p className={`text-xs leading-relaxed ${emailSent ? 'text-zinc-600' : 'text-rose-700'}`}>
                {emailSent
                  ? <>We sent a verification link to <span className="font-semibold">{email}</span>. Check your inbox and spam folder. Open the link and confirm on the page to verify your account and sign in automatically.</>
                  : 'Your account was created, but the verification email could not be sent. Please wait a minute, then request another email below.'}
              </p>
              <ResendVerificationForm initialEmail={email} />
              <p className="text-xs text-zinc-500">
                If you started a booking, you will return to it after verification.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}
              {canResend && <ResendVerificationForm initialEmail={email} />}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  required
                />
                <Input
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+977-9800000000"
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                />

                <Button type="submit" isLoading={loading} className="w-full">
                  Create Iris Account
                </Button>
              </form>

              <div className="pt-4 border-t border-zinc-100 text-center">
                <p className="text-xs text-zinc-600">
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-zinc-900 hover:text-champagne-700 underline">
                    Sign In
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
