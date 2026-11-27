import api from './api';
import { Service } from '../types';

type ServiceListResponse = { success: boolean; data: Service[] };
type ServiceListParams = { category?: string; active?: string };

const serviceCacheDurationMs = 15_000;
const serviceCache = new Map<string, { expiresAt: number; response: ServiceListResponse }>();
const pendingServiceRequests = new Map<string, Promise<ServiceListResponse>>();
let serviceCacheVersion = 0;

const getServiceCacheKey = (params?: ServiceListParams): string =>
  JSON.stringify({ active: params?.active ?? 'true', category: params?.category || '' });

const clearServiceCache = (): void => {
  serviceCacheVersion += 1;
  serviceCache.clear();
  pendingServiceRequests.clear();
};

export const serviceService = {
  async getServices(params?: ServiceListParams): Promise<ServiceListResponse> {
    const key = getServiceCacheKey(params);
    const cached = serviceCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.response;

    const pending = pendingServiceRequests.get(key);
    if (pending) return pending;

    const requestVersion = serviceCacheVersion;
    const request = api.get<ServiceListResponse>('/services', { params })
      .then(({ data }) => {
        if (data.success && requestVersion === serviceCacheVersion) {
          serviceCache.set(key, { response: data, expiresAt: Date.now() + serviceCacheDurationMs });
        }
        return data;
      })
      .finally(() => {
        if (pendingServiceRequests.get(key) === request) pendingServiceRequests.delete(key);
      });
    pendingServiceRequests.set(key, request);
    return request;
  },

  async getServiceById(id: string) {
    const res = await api.get<{ success: boolean; data: Service }>(`/services/${id}`);
    return res.data;
  },

  async createService(data: Partial<Service>) {
    const res = await api.post<{ success: boolean; data: Service }>('/services', data);
    clearServiceCache();
    return res.data;
  },

  async updateService(id: string, data: Partial<Service>) {
    const res = await api.put<{ success: boolean; data: Service }>(`/services/${id}`, data);
    clearServiceCache();
    return res.data;
  },

  async deleteService(id: string) {
    const res = await api.delete<{ success: boolean; message: string }>(`/services/${id}`);
    clearServiceCache();
    return res.data;
  },
};
