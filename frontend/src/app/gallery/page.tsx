'use client';

import React, { useEffect, useState } from 'react';
import { PublicLayout } from '../../layouts/PublicLayout';
import { GalleryItem } from '../../types';
import { galleryService } from '../../services/galleryService';
import { Sparkles } from 'lucide-react';

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('all');
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

  const defaultShowcase = [
    { title: 'Honey Balayage Waves', cat: 'Color', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80' },
    { title: 'Architectural Bob Cut', cat: 'Cuts', image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80' },
    { title: 'Bridal Floral Updo', cat: 'Bridal', image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80' },
    { title: 'Executive Textured Crop', cat: 'Men', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80' },
    { title: 'Silky Keratin Treatment', cat: 'Treatment', image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80' },
    { title: 'Platinum Ash Blonde', cat: 'Color', image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80' },
  ];

  const galleryList = items.length > 0 ? items : defaultShowcase;
  const categories = ['all', ...Array.from(new Set(galleryList.map((g: any) => g.category || g.cat || 'Style')))];

  const filtered =
    selectedCat === 'all'
      ? galleryList
      : galleryList.filter((g: any) => (g.category || g.cat || 'Style') === selectedCat);

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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item: any, idx: number) => (
              <div
                key={idx}
                className="group relative rounded-xl overflow-hidden shadow-sm border border-zinc-200/80 bg-zinc-100 aspect-[4/5]"
              >
                <img
                  src={item.image}
                  alt={item.title || 'Salon style'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                  <span className="text-[10px] uppercase tracking-widest text-champagne-300 font-semibold mb-1">
                    {item.category || item.cat || 'Style'}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-white">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs text-zinc-300 mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
