'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { reportService } from '../../../services/reportService';
import { formatPrice } from '../../../utils/format';
import { BarChart3, TrendingUp, Scissors, DollarSign } from 'lucide-react';

export default function AdminReportsPage() {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [popularServices, setPopularServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const [revRes, popRes] = await Promise.allSettled([
          reportService.getRevenueReport(),
          reportService.getPopularServices(),
        ]);
        if (revRes.status === 'fulfilled' && revRes.value.success) {
          setRevenueData(revRes.value.data);
        }
        if (popRes.status === 'fulfilled' && popRes.value.success) {
          setPopularServices(popRes.value.data);
        }
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <ProtectedRoute allowedRoles={['super_admin']}>
      <DashboardLayout
        role="super_admin"
        title="Reports & Analytics"
        subtitle="Financial growth metrics, monthly revenue trends, and top service demand"
      >
        <div className="space-y-8">
          {/* Revenue Breakdown */}
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-zinc-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-zinc-900">
                  Annual Revenue by Month ({new Date().getFullYear()})
                </h3>
                <p className="text-xs text-zinc-500">Gross completed booking receipts</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded">
                <TrendingUp className="w-3.5 h-3.5" />
                Active Accounting
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-zinc-400">Loading revenue metrics...</div>
            ) : revenueData.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                No completed appointments registered for revenue computation this calendar year.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {revenueData.map((item) => (
                  <div key={item._id} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-center">
                    <span className="text-xs font-bold uppercase text-zinc-400 block mb-1">
                      {months[item._id - 1]}
                    </span>
                    <span className="font-serif font-bold text-base text-zinc-900 block">
                      {formatPrice(item.revenue)}
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      {item.count} appointments
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Popular Services Table */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100">
              <h3 className="font-serif text-lg font-bold text-zinc-900">Top In-Demand Treatments</h3>
              <p className="text-xs text-zinc-500">Ranked by volume of confirmed client bookings</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">Service</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Total Bookings</th>
                    <th className="px-6 py-3.5 text-right">Cumulative Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-zinc-400">
                        Loading...
                      </td>
                    </tr>
                  ) : popularServices.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-zinc-400">
                        No service analytics recorded yet.
                      </td>
                    </tr>
                  ) : (
                    popularServices.map((p, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50">
                        <td className="px-6 py-4 font-semibold text-zinc-900">
                          {p.service?.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-champagne-100 text-champagne-800 text-[10px] font-semibold px-2 py-0.5 rounded uppercase">
                            {p.service?.category || 'General'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-700">{p.count} bookings</td>
                        <td className="px-6 py-4 text-right font-bold text-zinc-900">
                          {formatPrice(p.revenue)}
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
