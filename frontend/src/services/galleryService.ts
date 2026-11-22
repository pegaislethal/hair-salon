import api from './api';
import { GalleryItem } from '../types';

export const galleryService = {
  async getGallery(category?: string) {
    const res = await api.get<{ success: boolean; data: GalleryItem[] }>('/gallery', {
      params: category ? { category } : undefined,
    });
    return res.data;
  },

  async createGalleryItem(data: { title: string; image: string; category?: string; description?: string }) {
    const res = await api.post<{ success: boolean; data: GalleryItem }>('/gallery', data);
    return res.data;
  },

  async updateGalleryItem(id: string, data: Partial<GalleryItem>) {
    const res = await api.put<{ success: boolean; data: GalleryItem }>(`/gallery/${id}`, data);
    return res.data;
  },

  async deleteGalleryItem(id: string) {
    const res = await api.delete<{ success: boolean; message: string }>(`/gallery/${id}`);
    return res.data;
  },
};
