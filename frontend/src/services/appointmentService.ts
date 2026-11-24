import api from './api';
import { Appointment } from '../types';

export const appointmentService = {
  async createAppointment(data: {
    serviceId: string;
    appointmentDate: string;
    startTime: string;
    barberName: 'Lycan';
    customerNotes?: string;
  }) {
    const res = await api.post<{ success: boolean; message: string; data: Appointment }>('/appointments', data);
    return res.data;
  },

  async getAppointments(params?: { status?: string; date?: string; page?: number; limit?: number }) {
    const res = await api.get<{
      success: boolean;
      data: Appointment[];
      pagination: { total: number; page: number; limit: number; pages: number };
    }>('/appointments', { params });
    return res.data;
  },

  async getAppointmentById(id: string) {
    const res = await api.get<{ success: boolean; data: Appointment }>(`/appointments/${id}`);
    return res.data;
  },

  async acceptAppointment(id: string) {
    const res = await api.patch<{ success: boolean; message: string; data: Appointment }>(`/appointments/${id}/accept`);
    return res.data;
  },

  async suggestAlternativeTime(id: string, data: { appointmentDate: string; startTime: string }) {
    const res = await api.patch<{ success: boolean; message: string; data: Appointment }>(`/appointments/${id}/suggest-time`, data);
    return res.data;
  },

  async respondToSuggestedTime(id: string, response: 'accepted' | 'rejected') {
    const res = await api.patch<{ success: boolean; message: string; data: Appointment }>(`/appointments/${id}/respond-suggestion`, { response });
    return res.data;
  },

  async rejectAppointment(id: string, reason?: string) {
    const res = await api.patch<{ success: boolean; message: string; data: Appointment }>(`/appointments/${id}/reject`, { reason });
    return res.data;
  },

  async cancelAppointment(id: string, reason?: string) {
    const res = await api.patch<{ success: boolean; message: string; data: Appointment }>(`/appointments/${id}/cancel`, { reason });
    return res.data;
  },

  async completeAppointment(id: string) {
    const res = await api.patch<{ success: boolean; message: string; data: Appointment }>(`/appointments/${id}/complete`);
    return res.data;
  },

  async rescheduleAppointment(id: string, data: { appointmentDate: string; startTime: string; staffId?: string }) {
    const res = await api.patch<{ success: boolean; message: string; data: Appointment }>(`/appointments/${id}/reschedule`, data);
    return res.data;
  },

  async getAvailableSlots(serviceId: string, date: string, staffId?: string) {
    const res = await api.get<{ success: boolean; data: string[]; message?: string }>('/public/available-slots', {
      params: { serviceId, date, staffId },
    });
    return res.data;
  },
};
