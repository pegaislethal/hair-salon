'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('super_admin' | 'sub_admin' | 'customer')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        const destination = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        router.replace(`/login?redirect=${encodeURIComponent(destination)}`);
      } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        if (user.role === 'super_admin') {
          router.replace('/admin/dashboard');
        } else if (user.role === 'sub_admin') {
          router.replace('/sub-admin/dashboard');
        } else {
          router.replace('/customer/dashboard');
        }
      }
    }
  }, [loading, isAuthenticated, user, allowedRoles, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-champagne-300 border-t-zinc-900 rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Loading Iris Salon...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (allowedRoles && user && !allowedRoles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
};
