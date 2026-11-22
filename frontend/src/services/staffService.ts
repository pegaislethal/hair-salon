import api from './api';
import { Staff } from '../types';

export const staffService = {
  async getStaff() {
    const res = await api.get<{ success: boolean; data: Staff[] }>('/staff');
    return res.data;
  },

  async getStaffById(id: string) {
    const res = await api.get<{ success: boolean; data: Staff }>(`/staff/${id}`);
    return res.data;
  },
  async getAvailableStaff(serviceId: string, date: string) {
    const res = await api.get<{ success: boolean; data: string[] }>('/public/available-staff', { params: { serviceId, date } });
    return res.data;
  },
  async getStaffManagement() {
    const res = await api.get<{ success: boolean; data: Staff[] }>('/staff/management');
    return res.data;
  },

  async createStaff(data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    bio?: string;
    profileImage?: string;
    specializations?: string[];
    services?: string[];
    workingHours?: Staff['workingHours'];
    breaks?: Staff['breaks'];
    daysOff?: string[];
  }) {
    const res = await api.post<{ success: boolean; data: any }>('/staff', data);
    return res.data;
  },

  async updateStaff(id: string, data: Partial<Staff>) {
    const res = await api.put<{ success: boolean; data: Staff }>(`/staff/${id}`, data);
    return res.data;
  },

  async deleteStaff(id: string) {
    const res = await api.delete<{ success: boolean; message: string }>(`/staff/${id}`);
    return res.data;
  },
};
