import api from './api';
import { SalonSettings } from '../types';

export const settingsService = {
  async getSettings() {
    const res = await api.get<{ success: boolean; data: SalonSettings }>('/settings');
    return res.data;
  },

  async updateSettings(data: Partial<SalonSettings>) {
    const res = await api.put<{ success: boolean; data: SalonSettings; message: string }>('/settings', data);
    return res.data;
  },
};
