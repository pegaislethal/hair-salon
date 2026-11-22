'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { GalleryItem } from '../../../types';
import { galleryService } from '../../../services/galleryService';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('Hair');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const res = await galleryService.getGallery();
      if (res.success && res.data) {
        setItems(res.data);
      }
    } catch (err) {
      console.error('Failed to load gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await galleryService.createGalleryItem({
        title,
        image,
        category,
        description,
      });
      setIsModalOpen(false);
      setTitle('');
      setImage('');
      setDescription('');
      fetchGallery();
    } catch (err) {
      console.error('Failed to add gallery item:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this gallery photo?')) return;
    try {
      await galleryService.deleteGalleryItem(id);
      fetchGallery();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['super_admin']}>
      <DashboardLayout
        role="super_admin"
        title="Gallery Management"
        subtitle="Upload and manage salon portfolio photography and client transformations"
        actions={
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 text-xs">
            <Plus className="w-4 h-4" /> Add Photo
          </Button>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {loading ? (
              <div className="col-span-full py-12 text-center text-xs text-zinc-400">
                Loading gallery items...
              </div>
            ) : items.length === 0 ? (
              <div className="col-span-full py-16 text-center text-xs text-zinc-500 bg-white rounded-xl border border-zinc-200">
                <ImageIcon className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                No gallery photos uploaded yet. Click &quot;Add Photo&quot; to showcase your salon works.
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden group"
                >
                  <div className="aspect-[4/3] bg-zinc-100 relative overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-rose-600 shadow hover:bg-white transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-4 space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-champagne-800 bg-champagne-50 px-2 py-0.5 rounded">
                      {item.category || 'Hair'}
                    </span>
                    <h4 className="font-serif font-bold text-sm text-zinc-900 mt-1">{item.title}</h4>
                    {item.description && (
                      <p className="text-xs text-zinc-500 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add Gallery Photo"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Photo Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g. Ash Blonde Balayage"
              required
            />
            <Input
              label="Image URL"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              required
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="Hair">Hair</option>
                <option value="Color">Color</option>
                <option value="Bridal">Bridal</option>
                <option value="Men">Men</option>
                <option value="Skin">Skin</option>
                <option value="Spa">Spa</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details of the look..."
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" type="submit" isLoading={submitting}>
                Add Photo
              </Button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
