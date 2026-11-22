import api from './api';
import { NotificationItem } from '../types';

export const notificationService = {
  async getNotifications(params?: { unreadOnly?: boolean; page?: number; limit?: number }) {
    const res = await api.get<{
      success: boolean;
      data: NotificationItem[];
      unreadCount: number;
      pagination: { total: number; page: number; limit: number };
    }>('/notifications', {
      params: {
        ...params,
        unreadOnly: params?.unreadOnly ? 'true' : undefined,
      },
    });
    return res.data;
  },

  async markAsRead(id: string) {
    const res = await api.patch<{ success: boolean; data: NotificationItem }>(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllAsRead() {
    const res = await api.patch<{ success: boolean; message: string }>('/notifications/read-all');
    return res.data;
  },
};
