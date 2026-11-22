'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Calendar, CalendarPlus, User as UserIcon, LogOut, Sparkles } from 'lucide-react';

export const CustomerSidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = [
    { name: 'Dashboard', href: '/customer/dashboard', icon: LayoutDashboard },
    { name: 'Book Appointment', href: '/book', icon: CalendarPlus },
    { name: 'My Appointments', href: '/customer/appointments', icon: Calendar },
    { name: 'My Profile', href: '/customer/profile', icon: UserIcon },
  ];

  return (
    <aside className="w-64 bg-white border-r border-zinc-200 min-h-screen flex flex-col justify-between shrink-0 shadow-sm">
      <div>
        <div className="p-6 border-b border-zinc-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-champagne-100 border border-champagne-300 flex items-center justify-center text-champagne-800">
            <Sparkles className="w-4 h-4 text-champagne-700" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg text-zinc-900 tracking-tight">IRIS SALON</h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Client Portal</p>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-champagne-300' : 'text-zinc-400'}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-zinc-100 bg-champagne-50/30">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-champagne-200 text-champagne-900 font-semibold text-xs flex items-center justify-center">
            {user?.fullName ? user.fullName[0].toUpperCase() : 'C'}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-zinc-900 truncate">{user?.fullName}</p>
            <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
