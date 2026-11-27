'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { Service } from '../../../types';
import { serviceService } from '../../../services/serviceService';
import { formatServicePrice } from '../../../utils/format';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Plus, Edit2, Trash2, Scissors, Search, Sparkles, Filter } from 'lucide-react';

const CATEGORIES = [
  'Hair Services - Gents',
  'Hair Services - Ladies',
  'Beard Services',
  'Add-On Services',
  'Hair Spa',
  'Oil Massage',
  'Hair Setting',
  'Hair Straightening',
  'Hair Perming',
  'Waxing',
  'Ladies Coloring',
  'VIP Service Men',
  'Threading',
  'Hair Treatment',
  'Gents Coloring',
  'Facial (Normal)',
  'Facial',
  'Manicure & Pedicure',
  'Makeup',
  'Bridal Package',
];

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState<number | string>('');
  const [priceType, setPriceType] = useState<'fixed' | 'range' | 'starting'>('fixed');
  const [maxPrice, setMaxPrice] = useState<number | string>('');
  const [priceUnit, setPriceUnit] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [includedItemsText, setIncludedItemsText] = useState('');
  const [duration, setDuration] = useState<number | string>('45');
  const [image, setImage] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    setCategory(CATEGORIES[0]);
    setPrice('');
    setPriceType('fixed');
    setMaxPrice('');
    setPriceUnit('');
    setCategoryDescription('');
    setIncludedItemsText('');
    setDuration('45');
    setImage('');
    setIsActive(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (s: Service) => {
    setEditingService(s);
    setName(s.name);
    setDescription(s.description);
    setCategory(s.category || CATEGORIES[0]);
    setPrice(s.price);
    setPriceType(s.priceType || 'fixed');
    setMaxPrice(s.maxPrice ?? '');
    setPriceUnit(s.priceUnit || '');
    setCategoryDescription(s.categoryDescription || '');
    setIncludedItemsText((s.includedItems || []).join('\n'));
    setDuration(s.duration);
    setImage(s.image || '');
    setIsActive(s.isActive);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      const includedItems = includedItemsText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

      const payload = {
        name: name.trim(),
        description: description.trim(),
        category,
        price: Number(price),
        priceType,
        maxPrice: priceType === 'range' && maxPrice ? Number(maxPrice) : undefined,
        priceUnit: priceUnit.trim() || undefined,
        categoryDescription: categoryDescription.trim() || undefined,
        includedItems: includedItems.length ? includedItems : undefined,
        duration: Number(duration) || 45,
        image: image.trim() || undefined,
        isActive,
      };

      if (editingService) {
        await serviceService.updateService(editingService._id, payload);
      } else {
        await serviceService.createService(payload);
      }
      setIsModalOpen(false);
      fetchServices();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to save service.');
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

  const distinctCategories = Array.from(new Set(services.map((s) => s.category || 'General')));

  const filteredServices = services.filter((s) => {
    const matchesCategory = categoryFilter === 'all' || (s.category || 'General') === categoryFilter;
    const matchesSearch =
      searchQuery === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <ProtectedRoute allowedRoles={['super_admin']}>
      <DashboardLayout
        role="super_admin"
        title="Service Management"
        subtitle="Manage the complete Iris Hair Cut and Salon service catalog, pricing rules, and categories"
        actions={
          <Button onClick={openCreateModal} className="gap-2 text-xs">
            <Plus className="w-4 h-4" /> Add New Service
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Filters & Search Header */}
          <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search services or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 w-full sm:w-auto"
              >
                <option value="all">All Categories ({services.length})</option>
                {distinctCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Services Table */}
          <div className="bg-white rounded-xl border border-zinc-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">Service Name & Details</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Duration</th>
                    <th className="px-6 py-3.5">Price & Pricing Type</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                        Loading salon services...
                      </td>
                    </tr>
                  ) : filteredServices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                        No services match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredServices.map((s) => (
                      <tr key={s._id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-semibold text-zinc-900 block">{s.name}</span>
                          <span className="text-[11px] text-zinc-500 line-clamp-1">{s.description}</span>
                          {s.includedItems && s.includedItems.length > 0 && (
                            <span className="text-[10px] text-champagne-800 font-medium block mt-0.5">
                              Includes: {s.includedItems.join(', ')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-champagne-100/70 text-champagne-900 border border-champagne-200 text-[10px] font-semibold px-2.5 py-0.5 rounded-full inline-block">
                            {s.category}
                          </span>
                          {s.categoryDescription && (
                            <span className="text-[10px] text-zinc-400 block mt-0.5">
                              {s.categoryDescription}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-zinc-600 font-medium">{s.duration} mins</td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-zinc-900 block">{formatServicePrice(s)}</span>
                          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">
                            {s.priceType || 'fixed'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              s.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-zinc-100 text-zinc-500'
                            }`}
                          >
                            {s.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(s)}
                              className="p-1.5 rounded hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900"
                              title="Edit service"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(s._id)}
                              className="p-1.5 rounded hover:bg-rose-50 text-zinc-400 hover:text-rose-600"
                              title="Deactivate service"
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
        </div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingService ? 'Edit Salon Service' : 'Add New Salon Service'}
          maxWidth="2xl"
        >
          <form onSubmit={handleSave} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {errorMsg}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Service Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g. Fade & Skin Fade Haircut"
                required
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  required
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Description *
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description or conditions (e.g. Under 10 Years, Long/Medium Length, According to length and thickness)"
                className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                required
              />
            </div>

            {/* Pricing Section */}
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                  Pricing Configuration
                </span>
                <div className="flex items-center gap-2 text-xs">
                  {(['fixed', 'starting', 'range'] as const).map((type) => (
                    <label key={type} className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="priceType"
                        value={type}
                        checked={priceType === type}
                        onChange={() => setPriceType(type)}
                        className="text-zinc-900 focus:ring-zinc-900"
                      />
                      <span className="capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label={priceType === 'range' ? 'Min Price (NPR) *' : priceType === 'starting' ? 'Starting Price (NPR) *' : 'Price (NPR) *'}
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="500"
                  required
                />
                {priceType === 'range' && (
                  <Input
                    label="Max Price (NPR) *"
                    type="number"
                    min={Number(price) || 0}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="700"
                    required
                  />
                )}
                <Input
                  label="Price Unit (Optional)"
                  value={priceUnit}
                  onChange={(e) => setPriceUnit(e.target.value)}
                  placeholder="e.g. per braid"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Duration (Minutes) *"
                type="number"
                min={5}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="45"
                required
              />
              <Input
                label="Category Description Note (Optional)"
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                placeholder="e.g. Head & Shoulder, With Beard"
              />
            </div>

            {category === 'Bridal Package' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                  Included Package Services (one per line)
                </label>
                <textarea
                  rows={4}
                  value={includedItemsText}
                  onChange={(e) => setIncludedItemsText(e.target.value)}
                  placeholder="Facial&#10;Waxing&#10;Manicure&#10;Pedicure&#10;Threading&#10;Hand Mehendi&#10;Leg Mehendi"
                  className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
            )}

            <Input
              label="Service Image URL (Optional)"
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
            />

            {editingService && (
              <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                />
                Active & bookable on the public website
              </label>
            )}

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
