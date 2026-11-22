import api from './api';
import { User, Appointment } from '../types';

export const customerService = {
  async getCustomers(params?: { page?: number; limit?: number; search?: string }) {
    const res = await api.get<{
      success: boolean;
      data: User[];
      pagination: { total: number; page: number; limit: number; pages: number };
    }>('/customers', { params });
    return res.data;
  },

  async getCustomerById(id: string) {
    const res = await api.get<{
      success: boolean;
      data: { customer: User; appointments: Appointment[] };
    }>(`/customers/${id}`);
    return res.data;
  },

  async toggleCustomerStatus(id: string) {
    const res = await api.patch<{ success: boolean; message: string; data: User }>(`/customers/${id}/toggle-status`);
    return res.data;
  },
};
