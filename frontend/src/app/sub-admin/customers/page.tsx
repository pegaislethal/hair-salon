'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { User } from '../../../types';
import { customerService } from '../../../services/customerService';
import { formatDate } from '../../../utils/format';
import { Search, UserCheck } from 'lucide-react';

export default function SubAdminCustomersPage() {
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(search);
  };

  return (
    <ProtectedRoute allowedRoles={['sub_admin', 'super_admin']}>
      <DashboardLayout
        role="sub_admin"
        title="Customer Directory"
        subtitle="Basic client contact details and membership information"
      >
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md w-full">
              <input
                type="text"
                placeholder="Search clients..."
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

          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">Customer Name</th>
                    <th className="px-6 py-3.5">Phone Number</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">Member Since</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-zinc-400">
                        Loading customer records...
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-zinc-400">
                        No customer accounts found.
                      </td>
                    </tr>
                  ) : (
                    customers.map((c) => (
                      <tr key={c._id} className="hover:bg-zinc-50/50">
                        <td className="px-6 py-4 font-semibold text-zinc-900">
                          {c.fullName}
                        </td>
                        <td className="px-6 py-4 text-zinc-700 font-medium">{c.phone}</td>
                        <td className="px-6 py-4 text-zinc-500">{c.email}</td>
                        <td className="px-6 py-4 text-zinc-500">{formatDate(c.createdAt)}</td>
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
