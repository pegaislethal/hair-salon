'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { Service } from '../../../types';
import { serviceService } from '../../../services/serviceService';
import { formatPrice } from '../../../utils/format';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Plus, Edit2, Trash2, Scissors, Clock } from 'lucide-react';

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | string>('');
  const [duration, setDuration] = useState<number | string>('');
  const [category, setCategory] = useState('Hair');
  const [saving, setSaving] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await serviceService.getServices({ active: 'false' });
      if (res.success && res.data) {
        setServices(res.data);
      }
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openCreateModal = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setPrice('');
    setDuration('');
    setCategory('Hair');
    setIsModalOpen(true);
  };

  const openEditModal = (s: Service) => {
    setEditingService(s);
    setName(s.name);
    setDescription(s.description);
    setPrice(s.price);
    setDuration(s.duration);
    setCategory(s.category || 'Hair');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        description,
        price: Number(price),
        duration: Number(duration),
        category,
      };

      if (editingService) {
        await serviceService.updateService(editingService._id, payload);
      } else {
        await serviceService.createService(payload);
      }
      setIsModalOpen(false);
      fetchServices();
    } catch (err) {
      console.error('Failed to save service:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this service?')) return;
    try {
      await serviceService.deleteService(id);
      fetchServices();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['super_admin']}>
      <DashboardLayout
        role="super_admin"
        title="Service Management"
        subtitle="Configure salon treatments, duration, and pricing"
        actions={
          <Button onClick={openCreateModal} className="gap-2 text-xs">
            <Plus className="w-4 h-4" /> Add New Service
          </Button>
        }
      >
        <div className="bg-white rounded-xl border border-zinc-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Service Name</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Duration</th>
                  <th className="px-6 py-3.5">Price</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                      Loading services...
                    </td>
                  </tr>
                ) : services.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                      No services configured yet.
                    </td>
                  </tr>
                ) : (
                  services.map((s) => (
                    <tr key={s._id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-zinc-900 block">{s.name}</span>
                        <span className="text-[11px] text-zinc-500 line-clamp-1">{s.description}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-champagne-100 text-champagne-800 text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
                          {s.category || 'Hair'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-600 font-medium">{s.duration} mins</td>
                      <td className="px-6 py-4 font-bold text-zinc-900">{formatPrice(s.price)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            s.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
                          }`}
                        >
                          {s.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(s)}
                            className="p-1.5 rounded hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s._id)}
                            className="p-1.5 rounded hover:bg-rose-50 text-zinc-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingService ? 'Edit Service' : 'Add New Service'}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Service Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g. Precision Haircut & Styling"
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Full service description..."
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Price (NPR)"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="800"
                required
              />
              <Input
                label="Duration (Minutes)"
                type="number"
                min={5}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="45"
                required
              />
            </div>

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
                <option value="Hair Color">Hair Color</option>
                <option value="Hair Treatment">Hair Treatment</option>
                <option value="Skin Care">Skin Care</option>
                <option value="Nails">Nails</option>
                <option value="Beauty">Beauty</option>
                <option value="Bridal">Bridal</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" type="submit" isLoading={saving}>
                {editingService ? 'Save Changes' : 'Create Service'}
              </Button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
