'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PublicLayout } from '../../layouts/PublicLayout';
import { Service } from '../../types';
import { serviceService } from '../../services/serviceService';
import { formatServicePrice } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import { getBookingLoginUrl, showBookingLoginToast } from '../../utils/bookingAuth';
import { Clock, ArrowRight, Sparkles, Scissors, Check, Info } from 'lucide-react';

const CATEGORY_ORDER = [
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

export default function ServicesPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    async function fetchServices() {
      try {
        const res = await serviceService.getServices({ active: 'true' });
        if (res.success) {
          if (!active) return;
          setServices(res.data);
        } else if (active) {
          setLoadError('We could not load the service menu. Please try again.');
        }
      } catch (err) {
        console.error('Failed to load services:', err);
        if (active) setLoadError('We could not load the service menu. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchServices();
    return () => {
      active = false;
    };
  }, [retryCount]);

  // Extract distinct categories, preserving the curated order
  const existingCategories = Array.from(new Set(services.map((s) => s.category || 'General')));
  const orderedCategories = [
    ...CATEGORY_ORDER.filter((c) => existingCategories.includes(c)),
    ...existingCategories.filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  const handleBookNow = (event: React.MouseEvent<HTMLAnchorElement>, serviceId: string) => {
    if (
      authLoading ||
      isAuthenticated ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    event.preventDefault();
    showBookingLoginToast();
    router.push(getBookingLoginUrl(`/book?service=${encodeURIComponent(serviceId)}`));
  };

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-zinc-950 text-white py-20 border-b border-zinc-800 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f4d58d_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-4xl mx-auto px-4 space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-champagne-500/10 border border-champagne-400/30 text-champagne-300 text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-champagne-400" />
            Official Salon Menu & Pricing
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white">
            Iris Hair Cut & Salon
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Experience bespoke hair styling, luxury skin rituals, dimensional coloring, and complete grooming ceremonies. All prices in Nepalese Rupees (Rs.).
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 bg-[#faf9f6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Category Navigation Pills */}
          <div className="sticky top-16 z-30 bg-[#faf9f6]/95 backdrop-blur-md py-4 border-b border-zinc-200">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider shrink-0 transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-zinc-900 text-white shadow'
                    : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300'
                }`}
              >
                All Services ({services.length})
              </button>
              {orderedCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider shrink-0 transition-all ${
                    selectedCategory === cat
                      ? 'bg-zinc-900 text-white shadow'
                      : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Service Display List */}
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-champagne-400 border-t-zinc-900 rounded-full animate-spin mx-auto" />
              <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Loading salon services...</p>
            </div>
          ) : loadError ? (
            <div role="alert" className="text-center py-16 bg-white border rounded-2xl border-rose-200 p-8 space-y-3 max-w-md mx-auto">
              <p className="text-sm font-semibold text-rose-800">{loadError}</p>
              <button
                type="button"
                onClick={() => setRetryCount((c) => c + 1)}
                className="px-5 py-2 rounded-lg bg-zinc-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-zinc-800"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-16">
              {(selectedCategory === 'all' ? orderedCategories : [selectedCategory]).map((categoryName) => {
                const categoryServices = services.filter((s) => (s.category || 'General') === categoryName);
                if (categoryServices.length === 0) return null;

                const catDesc = categoryServices[0]?.categoryDescription;

                return (
                  <div key={categoryName} id={categoryName.replace(/\s+/g, '-').toLowerCase()} className="space-y-6">
                    {/* Category Title Header */}
                    <div className="border-b border-zinc-200 pb-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-champagne-600 shrink-0" />
                        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
                          {categoryName}
                        </h2>
                      </div>
                      {catDesc && (
                        <span className="text-xs text-zinc-500 font-medium italic sm:text-right pl-5 sm:pl-0">
                          {catDesc}
                        </span>
                      )}
                    </div>

                    {/* Services Cards / Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryServices.map((service) => {
                        const isRange = service.priceType === 'range';
                        const isStarting = service.priceType === 'starting';

                        return (
                          <article
                            key={service._id}
                            className={`rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                              categoryName === 'Bridal Package'
                                ? 'border-champagne-300 ring-1 ring-champagne-300/50 bg-gradient-to-br from-white via-champagne-50/20 to-white'
                                : 'border-zinc-200/90 hover:border-champagne-300'
                            }`}
                          >
                            <div className="space-y-4">
                              {/* Service Name & Duration */}
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-serif text-lg sm:text-xl font-bold text-zinc-900 leading-snug">
                                  {service.name}
                                </h3>
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded-full shrink-0">
                                  <Clock className="w-3 h-3" />
                                  {service.duration}m
                                </span>
                              </div>

                              {/* Description / Condition Note */}
                              {service.description && (
                                <p className="text-xs text-zinc-600 leading-relaxed">
                                  {service.description}
                                </p>
                              )}

                              {/* Bridal Package: Included Items List */}
                              {service.includedItems && service.includedItems.length > 0 && (
                                <div className="p-3.5 bg-champagne-50/60 rounded-xl border border-champagne-200/80 space-y-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-champagne-900 block">
                                    Complete Package Includes:
                                  </span>
                                  <ul className="grid grid-cols-2 gap-1.5 text-xs text-zinc-700">
                                    {service.includedItems.map((item, idx) => (
                                      <li key={idx} className="flex items-center gap-1.5 text-[11px]">
                                        <Check className="w-3.5 h-3.5 text-champagne-700 shrink-0" />
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Variable price advisory */}
                              {(isStarting || isRange) && (
                                <p className="text-[11px] text-zinc-400 flex items-center gap-1 italic">
                                  <Info className="w-3 h-3 shrink-0 text-champagne-700" />
                                  Final rate confirmed upon stylist consultation.
                                </p>
                              )}
                            </div>

                            {/* Price & Book Button */}
                            <div className="pt-5 mt-5 border-t border-zinc-100 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-semibold">
                                  {isStarting ? 'Starting Rate' : isRange ? 'Price Range' : 'Exact Price'}
                                </span>
                                <span className="font-serif text-lg sm:text-xl font-bold text-zinc-900">
                                  {formatServicePrice(service)}
                                </span>
                              </div>

                              <Link
                                href={`/book?service=${service._id}`}
                                onClick={(event) => handleBookNow(event, service._id)}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-sm"
                              >
                                Book Now <ArrowRight className="w-3.5 h-3.5 text-champagne-300" />
                              </Link>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
