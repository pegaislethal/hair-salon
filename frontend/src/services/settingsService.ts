import api from './api';
import { PublicSalonInfo, SalonSettings } from '../types';

let publicSalonInfo: { response: { success: boolean; data: PublicSalonInfo | null }; expiresAt: number } | null = null;
let publicSalonInfoRequest: Promise<{ success: boolean; data: PublicSalonInfo | null }> | null = null;

export const settingsService = {
  async getPublicSalonInfo() {
    if (publicSalonInfo && publicSalonInfo.expiresAt > Date.now()) return publicSalonInfo.response;
    if (publicSalonInfoRequest) return publicSalonInfoRequest;

    const request = api.get<{ success: boolean; data: PublicSalonInfo | null }>('/public/salon-info')
      .then(({ data }) => {
        if (data.success) publicSalonInfo = { response: data, expiresAt: Date.now() + 60_000 };
        return data;
      })
      .finally(() => {
        if (publicSalonInfoRequest === request) publicSalonInfoRequest = null;
      });
    publicSalonInfoRequest = request;
    return request;
  },

  async getSettings() {
    const res = await api.get<{ success: boolean; data: SalonSettings }>('/settings');
    return res.data;
  },

  async updateSettings(data: Partial<SalonSettings>) {
    const res = await api.put<{ success: boolean; data: SalonSettings; message: string }>('/settings', data);
    publicSalonInfo = null;
    return res.data;
  },
};
