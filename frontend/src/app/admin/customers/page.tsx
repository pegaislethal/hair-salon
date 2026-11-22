'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { User } from '../../../types';
import { customerService } from '../../../services/customerService';
import { formatDate } from '../../../utils/format';
import { Search, UserCheck, Shield, Phone, Mail, ToggleLeft, ToggleRight } from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCustomers = async (query = '') => {
    setLoading(true);
    try {
      const res = await customerService.getCustomers({ search: query || undefined });
      if (res.success && res.data) {
        setCustomers(res.data);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(search);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(search);
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await customerService.toggleCustomerStatus(id);
      fetchCustomers(search);
    } catch (err) {
      console.error('Status toggle failed:', err);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['super_admin']}>
      <DashboardLayout
        role="super_admin"
        title="Customer Management"
        subtitle="Directory of registered clients, contact profiles, and account statuses"
      >
        <div className="space-y-6">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-sm flex items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
              <input
                type="text"
                placeholder="Search by client name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-zinc-900 text-white rounded-md text-xs font-semibold uppercase tracking-wider"
              >
                Search
              </button>
            </form>
          </div>

          {/* Customer Table */}
          <div className="bg-white rounded-xl border border-zinc-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">Customer Name</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">Phone</th>
                    <th className="px-6 py-3.5">Member Since</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                        Loading customer records...
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                        No customer accounts found.
                      </td>
                    </tr>
                  ) : (
                    customers.map((c) => (
                      <tr key={c._id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-zinc-900">
                          {c.fullName}
                        </td>
                        <td className="px-6 py-4 text-zinc-600">{c.email}</td>
                        <td className="px-6 py-4 text-zinc-600">{c.phone}</td>
                        <td className="px-6 py-4 text-zinc-500">{formatDate(c.createdAt)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              c.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {c.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleToggleStatus(c._id)}
                            className="px-2.5 py-1 text-[11px] font-medium rounded border border-zinc-200 hover:bg-zinc-100"
                          >
                            {c.isActive ? 'Suspend' : 'Reactivate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
