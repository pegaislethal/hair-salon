import api from './api';
import { Service } from '../types';

export const serviceService = {
  async getServices(params?: { category?: string; active?: string }) {
    const res = await api.get<{ success: boolean; data: Service[] }>('/services', { params });
    return res.data;
  },

  async getServiceById(id: string) {
    const res = await api.get<{ success: boolean; data: Service }>(`/services/${id}`);
    return res.data;
  },

  async createService(data: Partial<Service>) {
    const res = await api.post<{ success: boolean; data: Service }>('/services', data);
    return res.data;
  },

  async updateService(id: string, data: Partial<Service>) {
    const res = await api.put<{ success: boolean; data: Service }>(`/services/${id}`, data);
    return res.data;
  },

  async deleteService(id: string) {
    const res = await api.delete<{ success: boolean; message: string }>(`/services/${id}`);
    return res.data;
  },
};
