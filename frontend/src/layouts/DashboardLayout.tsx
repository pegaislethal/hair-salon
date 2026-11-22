'use client';

import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { CustomerSidebar } from '../components/CustomerSidebar';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Bell } from 'lucide-react';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'super_admin' | 'sub_admin' | 'customer';
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  role,
  title,
  subtitle,
  actions,
}) => {
  const { user } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-zinc-50/60 text-zinc-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">
        {role === 'customer' ? <CustomerSidebar /> : <Sidebar />}
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-72 bg-white flex flex-col h-full shadow-2xl">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
            >
              <X className="w-5 h-5" />
            </button>
            {role === 'customer' ? <CustomerSidebar /> : <Sidebar />}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar in Dashboard */}
        <header className="h-16 bg-white border-b border-zinc-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/" className="text-xs uppercase tracking-widest text-champagne-700 font-semibold hover:underline">
              ← Return to Main Site
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-zinc-900">{user?.fullName}</p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider">{user?.role?.replace('_', ' ')}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-champagne-100 text-champagne-900 font-semibold text-xs flex items-center justify-center border border-champagne-200">
              {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
          </div>
        </header>

        {/* Dashboard Title & Actions Header */}
        {(title || actions) && (
          <div className="bg-white border-b border-zinc-200/80 px-4 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {title && <h1 className="text-2xl font-bold font-serif text-zinc-900 tracking-tight">{title}</h1>}
              {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
