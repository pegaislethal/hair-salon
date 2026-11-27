'use client';

import React, { useEffect, useState } from 'react';
import { PublicLayout } from '../../layouts/PublicLayout';
import { GalleryDisplayItem, mergeGalleryItems } from '../../data/gallery';
import { galleryService } from '../../services/galleryService';

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryDisplayItem[]>([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    async function loadGallery() {
      try {
        const res = await galleryService.getGallery();
        if (res.success) {
          if (!active) return;
          setItems(mergeGalleryItems(res.data));
        } else {
          if (active) setLoadError(true);
          console.error('Gallery API returned an unsuccessful response.');
        }
      } catch (err) {
        if (active) setLoadError(true);
        console.error('Failed to load gallery:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadGallery();
    return () => { active = false; };
  }, [retryCount]);

  const categories = ['all', ...Array.from(new Set(
    items.map((item) => String(item.category || '').trim()).filter(Boolean)
  ))];
  const filtered = items.filter((item) =>
    selectedCat === 'all' || String(item.category || '').trim().toLowerCase() === selectedCat.toLowerCase()
  );

  return (
    <PublicLayout>
      <section className="bg-champagne-50/50 py-16 border-b border-zinc-100 text-center">
        <div className="max-w-3xl mx-auto px-4 space-y-3">
          <span className="text-xs uppercase tracking-widest text-champagne-700 font-semibold">
            Style Showcase
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-zinc-900">
            Iris Lookbook & Gallery
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
            Browse salon looks and find inspiration for your next visit.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 flex-wrap mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  selectedCat === cat
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {cat === 'all' ? 'All styles' : cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Loading gallery">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} aria-hidden="true" className="aspect-[4/5] rounded-xl bg-zinc-100 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div role={loadError ? 'alert' : undefined} className="rounded-xl border border-zinc-200 bg-zinc-50 py-16 text-center text-sm text-zinc-500">
              {loadError
                ? 'The gallery is temporarily unavailable. Please try again later.'
                : 'No gallery photos are available yet.'}
              {loadError && (
                <div>
                  <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="mt-4 font-semibold text-zinc-900 underline underline-offset-4">
                    Retry
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((item) => (
                <div
                  key={item._id}
                  className="group relative rounded-xl overflow-hidden shadow-sm border border-zinc-200/80 bg-zinc-100 aspect-[4/5]"
                >
                  <img
                    src={item.image}
                    alt={item.title || 'Salon style'}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                    <span className="text-[10px] uppercase tracking-widest text-champagne-300 font-semibold mb-1">
                      {item.category || 'Style'}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-white">{item.title}</h3>
                    {item.description && (
                      <p className="text-xs text-zinc-300 mt-1 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
