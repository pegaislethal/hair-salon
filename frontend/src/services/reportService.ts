import api from './api';
import { DashboardReport } from '../types';

export const reportService = {
  async getDashboardReport() {
    const res = await api.get<{ success: boolean; data: DashboardReport }>('/reports/dashboard');
    return res.data;
  },

  async getRevenueReport(year?: number) {
    const res = await api.get<{ success: boolean; data: Array<{ _id: number; revenue: number; count: number }> }>('/reports/revenue', {
      params: year ? { year } : undefined,
    });
    return res.data;
  },

  async getPopularServices() {
    const res = await api.get<{ success: boolean; data: Array<{ _id: string; count: number; revenue: number; service: any }> }>('/reports/popular-services');
    return res.data;
  },
};
