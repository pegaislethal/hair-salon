'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PublicLayout } from '../../layouts/PublicLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { readBookingDraft } from '../../utils/bookingDraft';
import { Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authService.login({ email, password });
      if (res.success && res.data) {
        login(res.data.accessToken, res.data.refreshToken, res.data.user);
        if (res.data.user.role === 'super_admin') {
          router.replace('/admin/dashboard');
        } else if (res.data.user.role === 'sub_admin') {
          router.replace('/sub-admin/dashboard');
        } else {
          router.replace(readBookingDraft() ? '/book' : '/customer/dashboard');
        }
      } else {
        setError('Login failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 bg-zinc-50/50">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl border border-zinc-200/80 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-champagne-100 border border-champagne-300 flex items-center justify-center text-champagne-800 mx-auto">
              <Sparkles className="w-5 h-5 text-champagne-700" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-zinc-900">Welcome Back</h1>
            <p className="text-xs text-zinc-500">Sign in to manage your appointments and profile</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-champagne-700 hover:text-zinc-900 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" isLoading={loading} className="w-full">
              Sign In to Iris Salon
            </Button>
          </form>

          <div className="pt-4 border-t border-zinc-100 text-center">
            <p className="text-xs text-zinc-600">
              Do not have an account?{' '}
              <Link href="/register" className="font-semibold text-zinc-900 hover:text-champagne-700 underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
