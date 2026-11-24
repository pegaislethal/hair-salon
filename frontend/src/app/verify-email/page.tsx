'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PublicLayout } from '../../layouts/PublicLayout';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { readBookingDraft } from '../../utils/bookingDraft';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const token = searchParams.get('token');
  const verificationStarted = useRef<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verify() {
      if (!token) {
        setError('Missing verification token.');
        setLoading(false);
        return;
      }
      if (verificationStarted.current === token) return;
      verificationStarted.current = token;
      try {
        const res = await authService.verifyEmail(token);
        if (res.success && res.data?.user && res.data.accessToken && res.data.refreshToken) {
          login(res.data.accessToken, res.data.refreshToken, res.data.user);
          setSuccess(true);
          router.replace(readBookingDraft() ? '/book' : '/customer/dashboard');
        } else {
          setError(res.message || 'Verification succeeded, but automatic sign in failed. Please sign in.');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Invalid or expired token.');
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [token, login, router]);

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
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <p className="text-sm text-rose-600">{error || 'Verification failed.'}</p>
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
