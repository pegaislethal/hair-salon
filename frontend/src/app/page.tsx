'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PublicLayout } from '../layouts/PublicLayout';
import { Service } from '../types';
import { GalleryDisplayItem, mergeGalleryItems } from '../data/gallery';
import { serviceService } from '../services/serviceService';
import { galleryService } from '../services/galleryService';
import { formatPrice } from '../utils/format';
import {
  Sparkles,
  Calendar,
  Clock,
  ShieldCheck,
  Award,
  Scissors,
  ArrowRight,
  Heart,
} from 'lucide-react';

export default function HomePage() {
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [gallery, setGallery] = useState<GalleryDisplayItem[]>([]);
  const [servicesLoadError, setServicesLoadError] = useState(false);
  const [galleryLoadError, setGalleryLoadError] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [servicesRetry, setServicesRetry] = useState(0);
  const [galleryRetry, setGalleryRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setServicesLoading(true);
    setServicesLoadError(false);
    serviceService.getServices()
      .then((response) => {
        if (!active) return;
        if (response.success) setFeaturedServices(response.data.slice(0, 6));
        else setServicesLoadError(true);
      })
      .catch((error) => {
        console.error('Unable to load featured services:', error);
        if (active) setServicesLoadError(true);
      })
      .finally(() => {
        if (active) setServicesLoading(false);
      });
    return () => { active = false; };
  }, [servicesRetry]);

  useEffect(() => {
    let active = true;
    setGalleryLoading(true);
    setGalleryLoadError(false);
    galleryService.getGallery()
      .then((response) => {
        if (!active) return;
        if (response.success) setGallery(mergeGalleryItems(response.data).slice(0, 4));
        else setGalleryLoadError(true);
      })
      .catch((error) => {
        console.error('Unable to load featured gallery items:', error);
        if (active) setGalleryLoadError(true);
      })
      .finally(() => {
        if (active) setGalleryLoading(false);
      });
    return () => { active = false; };
  }, [galleryRetry]);

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
                Thoughtful hair and beauty services, a calm space to unwind, and an easy way to reserve a time that works for you.
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

              <div className="pt-8 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">Personal consultation</div>
                  <div className="mt-1 text-xs text-zinc-500">A service chosen around your needs</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-900">Clear service menu</div>
                  <div className="mt-1 text-xs text-zinc-500">Explore treatments and pricing online</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-900">Convenient booking</div>
                  <div className="mt-1 text-xs text-zinc-500">Request your appointment online</div>
                </div>
              </div>
            </div>

            {/* Hero Image Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-zinc-100">
                  <img
                    src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80"
                    alt="Modern salon styling space"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-white/95 backdrop-blur-sm p-5 rounded-xl border border-zinc-200/80 shadow-xl max-w-xs hidden sm:block">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-champagne-100 flex items-center justify-center text-champagne-800">
                      <Scissors className="w-5 h-5 text-champagne-700" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-900">Thoughtful styling</p>
                      <p className="text-[11px] text-zinc-500">A considered approach to every visit</p>
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
            {servicesLoading ? (
              Array.from({ length: 3 }, (_, index) => (
                <div key={index} aria-hidden="true" className="rounded-xl border border-zinc-200/80 p-6 animate-pulse">
                  <div className="flex justify-between">
                    <div className="h-5 w-20 rounded bg-champagne-100" />
                    <div className="h-5 w-16 rounded bg-zinc-100" />
                  </div>
                  <div className="mt-6 h-6 w-3/4 rounded bg-zinc-100" />
                  <div className="mt-4 h-4 w-full rounded bg-zinc-100" />
                  <div className="mt-2 h-4 w-2/3 rounded bg-zinc-100" />
                  <div className="mt-8 border-t border-zinc-100 pt-5 flex justify-between">
                    <div className="h-5 w-20 rounded bg-zinc-100" />
                    <div className="h-5 w-16 rounded bg-champagne-100" />
                  </div>
                </div>
              ))
            ) : featuredServices.length > 0 ? (
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
              <div className="col-span-full rounded-xl border border-dashed border-zinc-200 py-12 text-center text-sm text-zinc-500">
                <p>{servicesLoadError ? 'The service menu is temporarily unavailable.' : 'No services are currently available.'}</p>
                {servicesLoadError && (
                  <button type="button" onClick={() => setServicesRetry((retry) => retry + 1)} className="mt-3 font-semibold text-zinc-900 underline underline-offset-4">
                    Try again
                  </button>
                )}
              </div>
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
              A welcoming space to explore salon services, talk through your goals, and plan your visit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl border border-zinc-200/70 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-full bg-champagne-100 text-champagne-800 flex items-center justify-center">
                <Award className="w-6 h-6 text-champagne-700" />
              </div>
              <h3 className="font-serif text-lg font-bold text-zinc-900">Careful attention</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Discuss the look you want and the services that best suit your personal style.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-zinc-200/70 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-full bg-champagne-100 text-champagne-800 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-champagne-700" />
              </div>
              <h3 className="font-serif text-lg font-bold text-zinc-900">A considered menu</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Review available treatments, service details, and pricing before you book.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-zinc-200/70 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-full bg-champagne-100 text-champagne-800 flex items-center justify-center">
                <Heart className="w-6 h-6 text-champagne-700" />
              </div>
              <h3 className="font-serif text-lg font-bold text-zinc-900">Your visit, your way</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Choose an appointment time online and share any preferences with the salon.
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
            {galleryLoading ? (
              Array.from({ length: 4 }, (_, index) => (
                <div key={index} aria-hidden="true" className="aspect-square rounded-xl bg-zinc-100 animate-pulse" />
              ))
            ) : gallery.length > 0 ? (
              gallery.map((item) => (
                <div key={item._id} className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-100 shadow-sm">
                  <img
                    src={item.image}
                    alt={item.title || 'Salon style'}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex items-end">
                    <span className="text-white text-xs font-medium tracking-wide">{item.title}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full rounded-xl border border-dashed border-zinc-200 py-12 text-center text-sm text-zinc-500">
                <p>{galleryLoadError ? 'The gallery is temporarily unavailable.' : 'No gallery photos are available yet.'}</p>
                {galleryLoadError && (
                  <button type="button" onClick={() => setGalleryRetry((retry) => retry + 1)} className="mt-3 font-semibold text-zinc-900 underline underline-offset-4">
                    Try again
                  </button>
                )}
              </div>
            )}
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
