'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PublicLayout } from '../../layouts/PublicLayout';
import { Service } from '../../types';
import { serviceService } from '../../services/serviceService';
import { formatPrice } from '../../utils/format';
import { Clock, ArrowRight, Sparkles } from 'lucide-react';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await serviceService.getServices();
        if (res.success && res.data) {
          setServices(res.data);
        }
      } catch (err) {
        console.error('Failed to load services:', err);
        setLoadError('We could not load the service menu. Please try again shortly.');
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

  const categories = ['all', ...Array.from(new Set(services.map((s) => s.category || 'General')))];

  const filteredServices =
    selectedCategory === 'all'
      ? services
      : services.filter((s) => (s.category || 'General') === selectedCategory);

  return (
    <PublicLayout>
      <section className="bg-champagne-50/50 py-16 border-b border-zinc-100 text-center">
        <div className="max-w-3xl mx-auto px-4 space-y-3">
          <span className="text-xs uppercase tracking-widest text-champagne-700 font-semibold">
            Treatments & Rituals
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-zinc-900">
            Salon Services & Pricing
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
            Explore our curated menu of hair cuts, dimensional coloring, scalp therapies, facials, and beauty packages.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filter Pills */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  selectedCategory === cat
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-champagne-300 border-t-zinc-900 rounded-full animate-spin mx-auto" />
              <p className="text-xs text-zinc-500">Loading service catalog...</p>
            </div>
          ) : loadError ? (
            <div className="text-center py-16 border rounded-xl border-dashed border-zinc-200">
              <p className="text-sm font-semibold text-zinc-800">{loadError}</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-16 border rounded-xl border-dashed border-zinc-200">
              <Sparkles className="w-8 h-8 text-champagne-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-800">No services found in this category.</p>
              <p className="text-xs text-zinc-500 mt-1">Please select another category or check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredServices.map((service) => (
                <div
                  key={service._id}
                  className="bg-white rounded-xl border border-zinc-200/80 p-6 flex flex-col justify-between hover:border-champagne-300 hover:shadow-lg transition-all"
                >
                  <div className="space-y-4">
                    {service.image && (
                      <img src={service.image} alt={service.name} className="w-full h-48 rounded-lg object-cover" />
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-champagne-800 bg-champagne-50 px-2.5 py-0.5 rounded">
                        {service.category || 'General'}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{service.duration} mins</span>
                      </div>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-zinc-900">{service.name}</h3>
                    <p className="text-xs text-zinc-600 leading-relaxed">{service.description}</p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-medium">Price</span>
                      <span className="text-base font-bold text-zinc-900">{formatPrice(service.price)}</span>
                    </div>
                    <Link
                      href={`/book?service=${service._id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md bg-champagne-100 text-champagne-900 hover:bg-champagne-200 border border-champagne-300 transition-colors"
                    >
                      Book Now <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
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
