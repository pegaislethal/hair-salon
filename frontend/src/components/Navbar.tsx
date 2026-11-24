'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Calendar, User as UserIcon, LogOut, ChevronDown } from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, isAuthenticated, isSuperAdmin, isSubAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'About Us', href: '/about' },
    { name: 'Join Our Team', href: '/join-us' },
    { name: 'Contact', href: '/contact' },
  ];

  const getDashboardHref = () => {
    if (isSuperAdmin) return '/admin/dashboard';
    if (isSubAdmin) return '/sub-admin/dashboard';
    return '/customer/dashboard';
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-zinc-100 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" aria-label="Iris Salon home" className="flex items-center shrink-0 group">
            <Image
              src="/iris-logo.png"
              alt="Iris Salon of Hair & Beauty Academy"
              width={468}
              height={368}
              sizes="72px"
              quality={100}
              priority
              className="h-14 w-[72px] rounded-full border border-champagne-300 object-cover transition-transform group-hover:scale-[1.03]"
            />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium tracking-wide transition-colors relative py-1 ${
                    isActive ? 'text-zinc-900 font-semibold' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-champagne-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs uppercase tracking-wider font-semibold bg-champagne-100 text-champagne-900 hover:bg-champagne-200 border border-champagne-300 transition-all shadow-sm hover:shadow"
            >
              <Calendar className="w-4 h-4 text-champagne-700" />
              Book Appointment
            </Link>

            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-semibold">
                    {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                  </div>
                  <span className="max-w-[120px] truncate">{user.fullName}</span>
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-zinc-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-zinc-100">
                      <p className="text-xs text-zinc-500">Signed in as</p>
                      <p className="text-sm font-semibold text-zinc-900 truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] rounded bg-champagne-100 text-champagne-800 font-medium uppercase tracking-wider">
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>

                    <Link
                      href={getDashboardHref()}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                    >
                      <UserIcon className="w-4 h-4 text-zinc-500" />
                      Dashboard
                    </Link>

                    {user.role === 'customer' && (
                      <Link
                        href="/customer/appointments"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                      >
                        <Calendar className="w-4 h-4 text-zinc-500" />
                        My Appointments
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-sm"
                >
                  Join Us
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-100 bg-white px-4 pt-3 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === link.href ? 'bg-champagne-50 text-champagne-900 font-semibold' : 'text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-zinc-100 space-y-2">
            <Link
              href="/book"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-champagne-100 text-champagne-900 font-semibold text-sm"
            >
              <Calendar className="w-4 h-4" />
              Book Appointment
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  href={getDashboardHref()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 text-white font-medium text-sm"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-200 text-rose-600 font-medium text-sm"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-2.5 rounded-lg border border-zinc-200 text-zinc-800 text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-medium"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
