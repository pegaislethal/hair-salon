'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PublicLayout } from '../layouts/PublicLayout';
import { Service } from '../types';
import { GalleryDisplayItem, mergeGalleryItems, localGalleryItems } from '../data/gallery';
import { serviceService } from '../services/serviceService';
import { galleryService } from '../services/galleryService';
import { formatPrice } from '../utils/format';
import {
  Sparkles,
  Calendar,
  Clock,
  ShieldCheck,
  Star,
  Award,
  Scissors,
  ArrowRight,
  Heart,
} from 'lucide-react';

export default function HomePage() {
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [gallery, setGallery] = useState<GalleryDisplayItem[]>(localGalleryItems);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [servicesRes, galleryRes] = await Promise.allSettled([
          serviceService.getServices(),
          galleryService.getGallery(),
        ]);
        if (servicesRes.status === 'fulfilled' && servicesRes.value.success) {
          setFeaturedServices(servicesRes.value.data.slice(0, 6));
        }
        if (galleryRes.status === 'fulfilled' && galleryRes.value.success) {
          setGallery(mergeGalleryItems(galleryRes.value.data).slice(0, 4));
        }
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-champagne-50/60 via-white to-white py-20 lg:py-32 border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-champagne-100/80 border border-champagne-300 text-champagne-900 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-champagne-700" />
                Timeless Luxury Hair & Beauty
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-900 leading-[1.15] tracking-tight">
                Where Artistry Meets <br />
                <span className="italic font-normal text-champagne-700">Effortless Elegance.</span>
              </h1>
              <p className="text-base sm:text-lg text-zinc-600 max-w-xl leading-relaxed">
                Step into Iris Hair Cut and Salon — an oasis of quiet sophistication. Offering bespoke haircuts, signature color formulations, rejuvenating scalp therapies, and personalized beauty rituals crafted just for you.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  href="/book"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-md text-sm font-semibold tracking-wider uppercase bg-zinc-900 text-white hover:bg-zinc-800 shadow-md transition-all hover:scale-[1.02]"
                >
                  <Calendar className="w-4 h-4 text-champagne-300" />
                  Reserve an Appointment
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-md text-sm font-semibold tracking-wider uppercase bg-champagne-100 text-champagne-900 hover:bg-champagne-200 border border-champagne-300 transition-all"
                >
                  Explore Services
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-8 border-t border-zinc-100 grid grid-cols-3 gap-4">
                <div>
                  <div className="font-serif text-2xl font-bold text-zinc-900">10+</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Years Excellence</div>
                </div>
                <div>
                  <div className="font-serif text-2xl font-bold text-zinc-900">5,000+</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Happy Clients</div>
                </div>
                <div>
                  <div className="font-serif text-2xl font-bold text-zinc-900">4.9 / 5.0</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Client Rating
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Image Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-zinc-100">
                  <img
                    src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80"
                    alt="Iris Salon luxury styling experience"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-white/95 backdrop-blur-sm p-5 rounded-xl border border-zinc-200/80 shadow-xl max-w-xs hidden sm:block">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-champagne-100 flex items-center justify-center text-champagne-800">
                      <Scissors className="w-5 h-5 text-champagne-700" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-900">Master Stylists</p>
                      <p className="text-[11px] text-zinc-500">Dedicated to individual beauty</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase tracking-widest text-champagne-700 font-semibold">
              Curated Treatments
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-zinc-900">
              Signature Salon Offerings
            </h2>
            <p className="text-sm text-zinc-600">
              Precision haircuts, multidimensional color, and restorative treatments designed to elevate your personal style.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredServices.length > 0 ? (
              featuredServices.map((service) => (
                <div
                  key={service._id}
                  className="group bg-white rounded-xl border border-zinc-200/80 hover:border-champagne-300 p-6 transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-champagne-800 bg-champagne-50 px-2.5 py-1 rounded">
                        {service.category || 'Hair'}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{service.duration} mins</span>
                      </div>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-zinc-900 group-hover:text-champagne-700 transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-xs text-zinc-600 leading-relaxed line-clamp-3">
                      {service.description}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-medium">Starting at</span>
                      <span className="text-base font-bold text-zinc-900">{formatPrice(service.price)}</span>
                    </div>
                    <Link
                      href={`/book?service=${service._id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:text-champagne-700 transition-colors"
                    >
                      Book Now <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              // Fallback cards while backend is initially empty
              [
                { title: 'Haircut & Styling', cat: 'Hair', dur: 60, price: 800, desc: 'Signature bespoke cut tailored to your facial contours with wash, blow-dry and polish.' },
                { title: 'Full Balayage & Gloss', cat: 'Color', dur: 120, price: 3000, desc: 'Hand-painted highlights providing multidimensional, naturally sun-kissed hair transformation.' },
                { title: 'Keratin Smoothing', cat: 'Treatment', dur: 150, price: 5000, desc: 'Deep infusion therapy restoring keratin proteins for up to 4 months of silky frizz-free hair.' },
                { title: 'Rejuvenating Scalp Spa', cat: 'Spa', dur: 45, price: 1500, desc: 'Detoxifying scalp scrub, aromatherapeutic steam massage, and deep conditioning repair.' },
                { title: 'Radiance Hydrating Facial', cat: 'Skin', dur: 60, price: 2000, desc: 'Advanced botanical formulation restoring hydration, elasticity, and youthful vibrance.' },
                { title: 'Bridal Couture Styling', cat: 'Bridal', dur: 180, price: 15000, desc: 'Complete luxury bridal hair styling, bespoke veil placement, and makeup artistry.' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-zinc-200/80 p-6 flex flex-col justify-between hover:shadow-lg transition-all"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-champagne-800 bg-champagne-50 px-2.5 py-1 rounded">
                        {item.cat}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.dur} mins</span>
                      </div>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-zinc-900">{item.title}</h3>
                    <p className="text-xs text-zinc-600 leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="pt-6 mt-6 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-medium">Starting at</span>
                      <span className="text-base font-bold text-zinc-900">{formatPrice(item.price)}</span>
                    </div>
                    <Link
                      href="/book"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:text-champagne-700 transition-colors"
                    >
                      Book Now <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-900 hover:text-champagne-700 underline underline-offset-8 transition-colors"
            >
              View Complete Service Menu & Pricing →
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Iris Salon */}
      <section className="py-20 bg-champagne-50/50 border-y border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase tracking-widest text-champagne-700 font-semibold">
              The Iris Standard
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-zinc-900">
              A Refined Salon Experience
            </h2>
            <p className="text-sm text-zinc-600">
              We marry bespoke consultation, world-class organic formulations, and an environment of peaceful luxury.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl border border-zinc-200/70 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-full bg-champagne-100 text-champagne-800 flex items-center justify-center">
                <Award className="w-6 h-6 text-champagne-700" />
              </div>
              <h3 className="font-serif text-lg font-bold text-zinc-900">Certified Stylists</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Our stylists hold advanced certifications in precision cutting, color chemistry, and modern trend styling.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-zinc-200/70 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-full bg-champagne-100 text-champagne-800 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-champagne-700" />
              </div>
              <h3 className="font-serif text-lg font-bold text-zinc-900">Premium Formulations</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                We use strictly cruelty-free, salon-grade hair colors and organic nourishment products for radiant health.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-zinc-200/70 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-full bg-champagne-100 text-champagne-800 flex items-center justify-center">
                <Heart className="w-6 h-6 text-champagne-700" />
              </div>
              <h3 className="font-serif text-lg font-bold text-zinc-900">Personalized Consultations</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Every service begins with a one-on-one session discussing your routine, goals, and customized look.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Gallery Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs uppercase tracking-widest text-champagne-700 font-semibold">Visual Portfolio</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-zinc-900 mt-2">Crafted Looks</h2>
            </div>
            <Link
              href="/gallery"
              className="mt-4 md:mt-0 text-xs font-semibold uppercase tracking-wider text-zinc-900 hover:text-champagne-700 underline underline-offset-4"
            >
              Explore Full Gallery →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(gallery.length > 0 ? gallery : [
              { image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80', title: 'Caramel Balayage' },
              { image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=600&q=80', title: 'Precision Bob' },
              { image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80', title: 'Bridal Updo' },
              { image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80', title: 'Men Fade Styling' },
            ]).map((item: any, idx: number) => (
              <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-100 shadow-sm">
                <img
                  src={item.image}
                  alt={item.title || 'Salon style'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex items-end">
                  <span className="text-white text-xs font-medium tracking-wide">{item.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Callout */}
      <section className="bg-zinc-900 text-white py-16 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6 relative z-10">
          <span className="text-xs uppercase tracking-widest text-champagne-300 font-semibold">
            Reserve Your Time
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight">
            Ready for your transformation?
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Secure your favorite stylist and service in seconds with our instant booking system. We look forward to welcoming you.
          </p>
          <div className="pt-2">
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-champagne-100 text-zinc-900 hover:bg-champagne-200 transition-colors shadow-lg"
            >
              <Calendar className="w-4 h-4 text-champagne-700" />
              Book Your Appointment Now
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
