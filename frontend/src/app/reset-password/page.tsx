'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PublicLayout } from '../../layouts/PublicLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await authService.resetPassword({ token, password });
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.message || 'Reset failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl border border-zinc-200/80 shadow-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-champagne-100 border border-champagne-300 flex items-center justify-center text-champagne-800 mx-auto">
          <Sparkles className="w-5 h-5 text-champagne-700" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-zinc-900">Set New Password</h1>
        <p className="text-xs text-zinc-500">Create a secure new password for your Iris account</p>
      </div>

      {success ? (
        <div className="p-6 rounded-xl bg-champagne-50 border border-champagne-300 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-zinc-900">Password Updated</h3>
          <p className="text-xs text-zinc-600">Your password has been reset successfully.</p>
          <Button onClick={() => router.push('/login')} className="w-full">
            Sign In with New Password
          </Button>
        </div>
      ) : (
        <>
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              minLength={6}
            />
            <Button type="submit" isLoading={loading} className="w-full">
              Update Password
            </Button>
          </form>

          <div className="pt-4 border-t border-zinc-100 text-center">
            <Link href="/login" className="text-xs text-zinc-600 hover:text-zinc-900">
              ← Cancel and Return to Login
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <PublicLayout>
      <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 bg-zinc-50/50">
        <Suspense fallback={<div className="text-xs text-zinc-500">Loading form...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </PublicLayout>
  );
}
