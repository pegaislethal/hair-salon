import api from './api';
import type { GalleryItem } from '../types';

export interface BulkGalleryEntry {
  title: string;
  description?: string;
  imageUrl?: string;
  file?: File;
}

export interface BulkGalleryResult {
  success: boolean;
  message: string;
  data: Array<{ index: number; item: GalleryItem }>;
  errors: Array<{ index: number; title: string; message: string }>;
}

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

  async getAdminGallery() {
    const res = await api.get<{ success: boolean; data: GalleryItem[] }>('/gallery/admin');
    return res.data;
  },

  async bulkCreateGalleryItems(
    data: { category: string; tags: string[]; isActive: boolean; items: BulkGalleryEntry[] },
    onUploadProgress?: (loaded: number, total?: number) => void,
  ) {
    const formData = new FormData();
    let fileIndex = 0;
    const items = data.items.map((item) => {
      if (item.file) {
        formData.append('images', item.file);
        return { title: item.title, description: item.description, fileIndex: fileIndex++ };
      }
      return { title: item.title, description: item.description, imageUrl: item.imageUrl };
    });
    formData.append('metadata', JSON.stringify({
      category: data.category,
      tags: data.tags,
      isActive: data.isActive,
      items,
    }));

    const res = await api.post<BulkGalleryResult>('/gallery/bulk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => onUploadProgress?.(event.loaded, event.total),
    });
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
