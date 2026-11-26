'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { DashboardLayout } from '../../../layouts/DashboardLayout';
import type { GalleryItem } from '../../../types';
import { galleryService } from '../../../services/galleryService';
import type { BulkGalleryResult } from '../../../services/galleryService';
import axios from 'axios';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Plus, Trash2, Image as ImageIcon, Images, X } from 'lucide-react';
import { toast } from 'sonner';

const MAX_BULK_ITEMS = 20;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const allowedImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

interface BulkFileEntry {
  file: File;
  title: string;
  description: string;
}

interface BulkUrlEntry {
  url: string;
  title: string;
  description: string;
}

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('Men');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<'files' | 'urls'>('files');
  const [bulkFiles, setBulkFiles] = useState<BulkFileEntry[]>([]);
  const [bulkUrls, setBulkUrls] = useState<BulkUrlEntry[]>([]);
  const [bulkUrlDraft, setBulkUrlDraft] = useState('');
  const [bulkCategory, setBulkCategory] = useState('Men');
  const [bulkTags, setBulkTags] = useState('');
  const [bulkIsActive, setBulkIsActive] = useState(true);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ loaded: number; total?: number } | null>(null);
  const [bulkValidationError, setBulkValidationError] = useState('');
  const [bulkResult, setBulkResult] = useState<BulkGalleryResult | null>(null);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const res = await galleryService.getAdminGallery();
      if (res.success && res.data) {
        setItems(res.data);
        setLoadError('');
      }
    } catch (err) {
      console.error('Failed to load gallery:', err);
      setLoadError('Unable to load gallery items. Please refresh and try again.');
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
      await fetchGallery();
      toast.success('Gallery photo added.');
    } catch (err) {
      console.error('Failed to add gallery item:', err);
      toast.error('Unable to add gallery photo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this gallery photo?')) return;
    try {
      await galleryService.deleteGalleryItem(id);
      await fetchGallery();
      toast.success('Gallery photo deleted.');
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Unable to delete gallery photo.');
    }
  };

  const openBulkModal = () => {
    setBulkMode('files');
    setBulkFiles([]);
    setBulkUrls([]);
    setBulkUrlDraft('');
    setBulkCategory('Men');
    setBulkTags('');
    setBulkIsActive(true);
    setBulkProgress(null);
    setBulkValidationError('');
    setBulkResult(null);
    setIsBulkModalOpen(true);
  };

  const handleBulkFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles?.length) return;
    const newFiles = Array.from(selectedFiles);
    if (bulkFiles.length + newFiles.length > MAX_BULK_ITEMS) {
      setBulkValidationError(`You can add up to ${MAX_BULK_ITEMS} items at a time.`);
      return;
    }
    const invalidFile = newFiles.find((file) => {
      const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      return !allowedImageExtensions.has(extension)
        || !allowedImageTypes.has(file.type)
        || file.size > MAX_IMAGE_SIZE;
    });
    if (invalidFile) {
      setBulkValidationError(`${invalidFile.name} must be a JPG, PNG, GIF, or WebP image no larger than 5 MB.`);
      return;
    }
    setBulkValidationError('');
    setBulkFiles((current) => [
      ...current,
      ...newFiles.map((file) => ({
        file,
        title: file.name.replace(/\.[^.]+$/, '').trim(),
        description: '',
      })),
    ]);
  };

  const addBulkUrl = () => {
    const url = bulkUrlDraft.trim();
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error();
    } catch {
      setBulkValidationError('Enter a valid HTTP or HTTPS image URL.');
      return;
    }
    if (bulkUrls.length >= MAX_BULK_ITEMS) {
      setBulkValidationError(`You can add up to ${MAX_BULK_ITEMS} items at a time.`);
      return;
    }
    setBulkUrls((current) => [...current, {
      url,
      title: `Gallery photo ${current.length + 1}`,
      description: '',
    }]);
    setBulkUrlDraft('');
    setBulkValidationError('');
  };

  const handleBulkSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const entries = bulkMode === 'files' ? bulkFiles : bulkUrls;
    const tags = bulkTags.split(',').map((tag) => tag.trim()).filter(Boolean);
    if (!entries.length || entries.length > MAX_BULK_ITEMS) {
      setBulkValidationError(`Choose between 1 and ${MAX_BULK_ITEMS} images.`);
      return;
    }
    if (entries.some((entry) => !entry.title.trim() || entry.title.trim().length > 120 || entry.description.length > 500)) {
      setBulkValidationError('Each item needs a title of 120 characters or fewer and a caption of 500 characters or fewer.');
      return;
    }
    if (bulkMode === 'urls' && bulkUrlDraft.trim()) {
      setBulkValidationError('Add the pending URL to the batch or clear the URL field before submitting.');
      return;
    }
    if (tags.length > 10 || tags.some((tag) => tag.length > 30)) {
      setBulkValidationError('Use up to 10 tags, each no longer than 30 characters.');
      return;
    }
    if (bulkMode === 'urls' && bulkUrls.some((entry) => {
      try {
        const url = new URL(entry.url);
        return (url.protocol !== 'http:' && url.protocol !== 'https:') || entry.url.length > 2048;
      } catch {
        return true;
      }
    })) {
      setBulkValidationError('Each item needs a valid HTTP or HTTPS image URL.');
      return;
    }
    if (bulkMode === 'files' && bulkFiles.some(({ file }) => (
      !allowedImageTypes.has(file.type)
      || !allowedImageExtensions.has(file.name.slice(file.name.lastIndexOf('.')).toLowerCase())
      || file.size > MAX_IMAGE_SIZE
    ))) {
      setBulkValidationError('All files must be JPG, PNG, GIF, or WebP images no larger than 5 MB.');
      return;
    }

    setBulkSubmitting(true);
    setBulkProgress({ loaded: 0 });
    setBulkValidationError('');
    setBulkResult(null);
    try {
      const result = await galleryService.bulkCreateGalleryItems({
        category: bulkCategory,
        tags,
        isActive: bulkIsActive,
        items: entries.map((entry) => bulkMode === 'files'
          ? {
            title: entry.title.trim(),
            description: entry.description.trim(),
            file: (entry as BulkFileEntry).file,
          }
          : {
            title: entry.title.trim(),
            description: entry.description.trim(),
            imageUrl: (entry as BulkUrlEntry).url,
          }),
      }, (loaded, total) => setBulkProgress({ loaded, total }));
      setBulkResult(result);
      await fetchGallery();
      if (result.errors.length) {
        toast.error(result.message);
      } else {
        toast.success(result.message);
        setIsBulkModalOpen(false);
      }
    } catch (error) {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message || 'Unable to submit gallery items.'
        : 'Unable to submit gallery items.';
      setBulkValidationError(message);
      toast.error(message);
    } finally {
      setBulkSubmitting(false);
      setBulkProgress(null);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['super_admin']}>
      <DashboardLayout
        role="super_admin"
        title="Gallery Management"
        subtitle="Upload and manage salon portfolio photography and client transformations"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={openBulkModal} className="gap-2 text-xs">
              <Images className="w-4 h-4" /> Bulk Add
            </Button>
            <Button onClick={() => setIsModalOpen(true)} className="gap-2 text-xs">
              <Plus className="w-4 h-4" /> Add Photo
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {loadError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{loadError}</p>}
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
                      aria-label={`Delete ${item.title}`}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-rose-600 shadow hover:bg-white transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {!item.isActive && <span className="absolute bottom-2 left-2 rounded bg-zinc-900/80 px-2 py-1 text-[10px] font-semibold text-white">Hidden</span>}
                  </div>
                  <div className="p-4 space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-champagne-800 bg-champagne-50 px-2 py-0.5 rounded">
                      {item.category || 'Hair'}
                    </span>
                    <h4 className="font-serif font-bold text-sm text-zinc-900 mt-1">{item.title}</h4>
                    {item.description && (
                      <p className="text-xs text-zinc-500 line-clamp-2">{item.description}</p>
                    )}
                    {!!item.tags?.length && <p className="text-[10px] text-zinc-400">{item.tags.join(', ')}</p>}
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
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Styling & Coloring">Styling &amp; Coloring</option>
                <option value="General">General</option>
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

        <Modal
          isOpen={isBulkModalOpen}
          onClose={() => {
            if (!bulkSubmitting) setIsBulkModalOpen(false);
          }}
          title="Bulk Add Gallery Photos"
          maxWidth="xl"
        >
          <form onSubmit={handleBulkSubmit} className="space-y-5">
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={bulkMode === 'files' ? 'primary' : 'outline'} onClick={() => setBulkMode('files')} disabled={bulkSubmitting}>
                Select image files
              </Button>
              <Button type="button" size="sm" variant={bulkMode === 'urls' ? 'primary' : 'outline'} onClick={() => setBulkMode('urls')} disabled={bulkSubmitting}>
                Add image URLs
              </Button>
            </div>

            {bulkMode === 'files' ? (
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                  Images (up to {MAX_BULK_ITEMS}, 5 MB each)
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
                    disabled={bulkSubmitting}
                    onChange={(event) => {
                      handleBulkFiles(event.currentTarget.files);
                      event.currentTarget.value = '';
                    }}
                    className="mt-2 block w-full rounded-md border border-zinc-200 p-2 text-xs font-normal normal-case"
                  />
                </label>
                {bulkFiles.map((entry, index) => (
                  <div key={`${entry.file.name}-${entry.file.lastModified}-${index}`} className="grid gap-2 rounded-lg border border-zinc-200 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-zinc-800">{entry.file.name}</p>
                      <p className="text-[10px] text-zinc-500">{(entry.file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <input
                        aria-label={`Title for ${entry.file.name}`}
                        value={entry.title}
                        onChange={(event) => setBulkFiles((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))}
                        maxLength={120}
                        placeholder="Item title"
                        className="mt-2 w-full rounded border border-zinc-200 px-2 py-1.5 text-xs"
                      />
                    </div>
                    <textarea
                      aria-label={`Caption for ${entry.file.name}`}
                      value={entry.description}
                      onChange={(event) => setBulkFiles((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item))}
                      maxLength={500}
                      rows={2}
                      placeholder="Optional caption"
                      className="w-full rounded border border-zinc-200 px-2 py-1.5 text-xs"
                    />
                    <button type="button" aria-label={`Remove ${entry.file.name}`} disabled={bulkSubmitting} onClick={() => setBulkFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="self-start rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-rose-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                  Image URL
                  <div className="mt-2 flex gap-2">
                    <input
                      type="url"
                      value={bulkUrlDraft}
                      onChange={(event) => setBulkUrlDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          addBulkUrl();
                        }
                      }}
                      disabled={bulkSubmitting}
                      placeholder="https://example.com/image.jpg"
                      className="min-w-0 flex-1 rounded-md border border-zinc-200 px-3 py-2 text-xs font-normal normal-case"
                    />
                    <Button type="button" size="sm" variant="outline" disabled={bulkSubmitting || !bulkUrlDraft.trim()} onClick={addBulkUrl}>Add URL</Button>
                  </div>
                  <span className="mt-1 block font-normal normal-case text-zinc-500">Add one HTTP or HTTPS image URL at a time (up to {MAX_BULK_ITEMS}).</span>
                </label>
                {bulkUrls.map((entry, index) => (
                  <div key={`${entry.url}-${index}`} className="grid gap-2 rounded-lg border border-zinc-200 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <div className="min-w-0">
                      <p className="truncate text-[10px] text-zinc-500">{entry.url}</p>
                      <input
                        aria-label={`Title for image URL ${index + 1}`}
                        value={entry.title}
                        onChange={(event) => setBulkUrls((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))}
                        maxLength={120}
                        placeholder="Item title"
                        className="mt-2 w-full rounded border border-zinc-200 px-2 py-1.5 text-xs"
                      />
                    </div>
                    <textarea
                      aria-label={`Caption for image URL ${index + 1}`}
                      value={entry.description}
                      onChange={(event) => setBulkUrls((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item))}
                      maxLength={500}
                      rows={2}
                      placeholder="Optional caption"
                      className="w-full rounded border border-zinc-200 px-2 py-1.5 text-xs"
                    />
                    <button type="button" aria-label={`Remove image URL ${index + 1}`} disabled={bulkSubmitting} onClick={() => setBulkUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="self-start rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-rose-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                Shared category
                <select value={bulkCategory} onChange={(event) => setBulkCategory(event.target.value)} disabled={bulkSubmitting} className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs font-normal normal-case">
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Styling & Coloring">Styling &amp; Coloring</option>
                  <option value="General">General</option>
                </select>
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-700">
                Shared tags (comma-separated)
                <input value={bulkTags} onChange={(event) => setBulkTags(event.target.value)} disabled={bulkSubmitting} placeholder="balayage, curls, summer" className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs font-normal normal-case" />
              </label>
            </div>
            <label className="flex items-center gap-2 text-xs text-zinc-700">
              <input type="checkbox" checked={bulkIsActive} onChange={(event) => setBulkIsActive(event.target.checked)} disabled={bulkSubmitting} />
              Visible on the public gallery
            </label>

            {bulkValidationError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{bulkValidationError}</p>}
            {bulkProgress && (
              <div role="status" className="space-y-1 text-xs text-zinc-600">
                <p>Uploading and creating {bulkMode === 'files' ? bulkFiles.length : bulkUrls.length} items...</p>
                <progress className="w-full accent-zinc-900" value={bulkProgress.loaded} max={bulkProgress.total || 1} />
                {bulkProgress.total && <p>{Math.round((bulkProgress.loaded / bulkProgress.total) * 100)}% uploaded</p>}
              </div>
            )}
            {bulkResult && (
              <div className="space-y-2 rounded-lg border border-zinc-200 p-3 text-xs">
                <p className="font-semibold">{bulkResult.message}</p>
                {bulkResult.data.map(({ index, item }) => <p key={item._id} className="text-emerald-700">Item {index + 1}: {item.title} created.</p>)}
                {bulkResult.errors.map((error, index) => <p key={`${error.index}-${index}`} className="text-rose-700">Item {error.index + 1} ({error.title || 'Untitled'}): {error.message}</p>)}
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3">
              <Button variant="outline" size="sm" type="button" disabled={bulkSubmitting} onClick={() => setIsBulkModalOpen(false)}>Cancel</Button>
              <Button size="sm" type="submit" isLoading={bulkSubmitting}>
                Add {bulkMode === 'files' ? bulkFiles.length : bulkUrls.length} Items
              </Button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
