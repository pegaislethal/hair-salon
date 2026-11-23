'use client';

import React, { useEffect, useState } from 'react';
import { PublicLayout } from '../../layouts/PublicLayout';
import { GalleryItem } from '../../types';
import { galleryService } from '../../services/galleryService';

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<'Men' | 'Women'>('Men');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGallery() {
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
    }
    loadGallery();
  }, []);

  const categories: Array<'Men' | 'Women'> = ['Men', 'Women'];
  const filtered = items.filter((item) =>
    String(item.category || '').trim().toLowerCase() === selectedCat.toLowerCase()
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
            Real transformations created by our master stylists. Be inspired for your next salon visit.
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
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-zinc-500">Loading gallery...</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 py-16 text-center text-sm text-zinc-500">
              No {selectedCat.toLowerCase()} gallery photos are available yet.
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
