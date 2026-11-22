'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PublicLayout } from '../../layouts/PublicLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 bg-zinc-50/50">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl border border-zinc-200/80 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-champagne-100 border border-champagne-300 flex items-center justify-center text-champagne-800 mx-auto">
              <Sparkles className="w-5 h-5 text-champagne-700" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-zinc-900">Reset Password</h1>
            <p className="text-xs text-zinc-500">Enter your email and we will send you a recovery link</p>
          </div>

          {submitted ? (
            <div className="p-6 rounded-xl bg-champagne-50 border border-champagne-300 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="font-serif text-lg font-bold text-zinc-900">Recovery Sent</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                If an account exists with <strong>{email}</strong>, a password reset link has been dispatched to your inbox.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-block text-xs font-semibold text-zinc-900 hover:underline"
                >
                  Return to Sign In
                </Link>
              </div>
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
                  label="Registered Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
                <Button type="submit" isLoading={loading} className="w-full">
                  Send Recovery Link
                </Button>
              </form>

              <div className="pt-4 border-t border-zinc-100 text-center">
                <Link href="/login" className="text-xs font-medium text-zinc-600 hover:text-zinc-900">
                  ← Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
