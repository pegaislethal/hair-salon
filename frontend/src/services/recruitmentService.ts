import api from './api';

export interface Vacancy {
  _id: string;
  title: string;
  description: string;
  requirements: string[];
  experience: string;
  applicationDeadline?: string;
  isActive: boolean;
}

export interface JobApplication {
  _id: string;
  vacancy: Vacancy | string;
  name: string;
  email: string;
  phone: string;
  experience: string;
  skills: string[];
  cvUrl: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export const recruitmentService = {
  async getPublic() {
    const response = await api.get<{ success: boolean; data: { isHiring: boolean; vacancies: Vacancy[] } }>('/recruitment/public');
    return response.data;
  },
  async apply(form: FormData) {
    const response = await api.post<{ success: boolean; message: string }>('/recruitment/apply', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  async getSettings() {
    const response = await api.get<{ success: boolean; data: { isHiring: boolean } }>('/recruitment/admin/settings');
    return response.data;
  },
  async updateSettings(isHiring: boolean) {
    const response = await api.put('/recruitment/admin/settings', { isHiring });
    return response.data;
  },
  async getVacancies() {
    const response = await api.get<{ success: boolean; data: Vacancy[] }>('/recruitment/admin/vacancies');
    return response.data;
  },
  async saveVacancy(data: Partial<Vacancy>) {
    const response = data._id
      ? await api.put(`/recruitment/admin/vacancies/${data._id}`, data)
      : await api.post('/recruitment/admin/vacancies', data);
    return response.data;
  },
  async deactivateVacancy(id: string) {
    const response = await api.patch(`/recruitment/admin/vacancies/${id}/deactivate`);
    return response.data;
  },
  async getApplications() {
    const response = await api.get<{ success: boolean; data: JobApplication[] }>('/recruitment/admin/applications');
    return response.data;
  },
  async decide(applicationId: string, status: 'accepted' | 'rejected') {
    const response = await api.patch(`/recruitment/admin/applications/${applicationId}/decision`, { status });
    return response.data;
  },
};
