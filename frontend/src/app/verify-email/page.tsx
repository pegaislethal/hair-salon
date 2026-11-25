'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PublicLayout } from '../../layouts/PublicLayout';
import { ResendVerificationForm } from '../../components/ResendVerificationForm';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { readBookingDraft } from '../../utils/bookingDraft';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  useEffect(() => {
    setError(token ? null : 'No verification link was provided. Enter the email and code from your message.');
  }, [token]);

  const completeVerification = (result: Awaited<ReturnType<typeof authService.verifyEmail>>) => {
    if (result.success && result.data?.user && result.data.accessToken && result.data.refreshToken) {
      login(result.data.accessToken, result.data.refreshToken, result.data.user);
      setSuccess(true);
      router.replace(readBookingDraft() ? '/book' : '/customer/dashboard');
      return;
    }
    setError(result.message || 'Verification failed. Please try again.');
  };

  const handleVerifyLink = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      completeVerification(await authService.verifyEmail(token));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired token.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      completeVerification(await authService.verifyEmailWithCode(email, otp));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl border border-zinc-200/80 shadow-xl text-center space-y-6">
      <div className="w-10 h-10 rounded-full bg-champagne-100 border border-champagne-300 flex items-center justify-center text-champagne-800 mx-auto">
        <Sparkles className="w-5 h-5 text-champagne-700" />
      </div>

      <h1 className="font-serif text-2xl font-bold text-zinc-900">Email Verification</h1>

      {loading ? (
        <div className="py-6 space-y-3">
          <div className="w-8 h-8 border-2 border-champagne-300 border-t-zinc-900 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-500">Verifying your Iris account...</p>
        </div>
      ) : success ? (
        <div className="space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <p className="text-sm text-zinc-700">Your email is verified. You are signed in and being redirected.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {error ? (
            <>
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <p className="text-sm text-rose-600">{error}</p>
            </>
          ) : (
            <p className="text-sm text-zinc-600">Confirm below to verify your email and sign in.</p>
          )}
          {token && (
            <Button type="button" onClick={handleVerifyLink} isLoading={loading} className="w-full">
              Verify email
            </Button>
          )}
          <div className="border-t border-zinc-100 pt-4 text-left">
            <p className="mb-3 text-xs text-zinc-600">Or enter the six-digit code from your email.</p>
            <form onSubmit={handleVerifyCode} className="space-y-3">
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
              <Input
                label="Verification code"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
              />
              <Button type="submit" variant="outline" isLoading={loading} className="w-full">
                Verify with code
              </Button>
            </form>
          </div>
          {error && <ResendVerificationForm initialEmail={email} />}
          <Link href="/login" className="inline-block text-xs font-semibold text-zinc-900 hover:underline">
            Return to Sign In
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <PublicLayout>
      <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 bg-zinc-50/50">
        <Suspense fallback={<div className="text-xs text-zinc-500">Loading...</div>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </PublicLayout>
  );
}
