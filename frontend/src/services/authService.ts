import api from './api';
import { User } from '../types';

export const authService = {
  async register(data: { fullName: string; email: string; phone: string; password: string }) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async login(data: { email: string; password: string }) {
    const res = await api.post<{ success: boolean; data: { user: User; accessToken: string; refreshToken: string } }>('/auth/login', data);
    return res.data;
  },

  async logout() {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  async getCurrentUser() {
    const res = await api.get<{ success: boolean; data: User }>('/auth/me');
    return res.data;
  },

  async updateProfile(data: { fullName?: string; phone?: string; profileImage?: string }) {
    const res = await api.put<{ success: boolean; data: User; message: string }>('/auth/profile', data);
    return res.data;
  },

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    const res = await api.put<{ success: boolean; message: string }>('/auth/change-password', data);
    return res.data;
  },

  async forgotPassword(email: string) {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(data: { token: string; password: string }) {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
  },

  async verifyEmail(token: string) {
    const res = await api.post('/auth/verify-email', { token });
    return res.data;
  },
};
