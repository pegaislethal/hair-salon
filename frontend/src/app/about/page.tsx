import React from 'react';
import Link from 'next/link';
import { PublicLayout } from '../../layouts/PublicLayout';
import { Sparkles, Award, Scissors, Users, Clock, ShieldCheck, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <PublicLayout>
      {/* Hero Header */}
      <section className="bg-champagne-50/50 py-16 border-b border-zinc-100 text-center">
        <div className="max-w-3xl mx-auto px-4 space-y-3">
          <span className="text-xs uppercase tracking-widest text-champagne-700 font-semibold">
            Our Story & Philosophy
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-zinc-900">
            About Iris Hair Cut & Salon
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
            Founded with a passion for craftsmanship, personal confidence, and gentle self-care in Kathmandu, Nepal.
          </p>
        </div>
      </section>

      {/* Main Narrative */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs uppercase tracking-widest text-champagne-700 font-semibold">
                Since 2014
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-zinc-900">
                A Sanctuary for Beauty, Renewal, and Confidence
              </h2>
              <p className="text-sm text-zinc-600 leading-relaxed">
                At Iris Hair Cut and Salon, we believe that true elegance begins with attentive listening. Hair is a deeply personal form of expression, and every person who walks through our doors deserves personalized care tailored to their hair texture, lifestyle, and aesthetic desires.
              </p>
              <p className="text-sm text-zinc-600 leading-relaxed">
                From our relaxing botanical shampoo rituals to master cut precision and dimensional coloring, our goal is to deliver an experience that refreshes your spirit as much as your look.
              </p>
              <div className="pt-4 grid grid-cols-2 gap-6 border-t border-zinc-100">
                <div>
                  <h4 className="font-serif text-xl font-bold text-zinc-900">Certified Artistry</h4>
                  <p className="text-xs text-zinc-500 mt-1">Ongoing international training & master certification.</p>
                </div>
                <div>
                  <h4 className="font-serif text-xl font-bold text-zinc-900">Ethical Standards</h4>
                  <p className="text-xs text-zinc-500 mt-1">Cruelty-free, gentle formulations that preserve hair integrity.</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-md bg-zinc-100">
                <img
                  src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80"
                  alt="Stylist crafting hair"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-md bg-zinc-100 mt-8">
                <img
                  src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80"
                  alt="Iris salon salon interior"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-champagne-50/40 border-y border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
            <span className="text-xs uppercase tracking-widest text-champagne-700 font-semibold">Core Values</span>
            <h2 className="font-serif text-3xl font-bold text-zinc-900">What Drives Us</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl border border-zinc-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-full bg-champagne-100 flex items-center justify-center text-champagne-800">
                <Heart className="w-5 h-5 text-champagne-700" />
              </div>
              <h3 className="font-serif text-lg font-bold text-zinc-900">Client-First Care</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                We take the time to understand your lifestyle, hair habits, and vision before cutting or coloring.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-zinc-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-full bg-champagne-100 flex items-center justify-center text-champagne-800">
                <Scissors className="w-5 h-5 text-champagne-700" />
              </div>
              <h3 className="font-serif text-lg font-bold text-zinc-900">Meticulous Detail</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Every fade, fringe, and balayage brushstroke is treated with uncompromising devotion to excellence.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-zinc-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-full bg-champagne-100 flex items-center justify-center text-champagne-800">
                <ShieldCheck className="w-5 h-5 text-champagne-700" />
              </div>
              <h3 className="font-serif text-lg font-bold text-zinc-900">Hospitality & Hygeine</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Strict sanitization standards, single-use fresh capes, and warm hospitality from the moment you arrive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white text-center">
        <div className="max-w-2xl mx-auto px-4 space-y-5">
          <h2 className="font-serif text-3xl font-bold text-zinc-900">Visit Iris Salon</h2>
          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
            Find Iris Hair Cut & Salon using the map below, or open directions in Google Maps.
          </p>
          <div className="pt-2">
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-semibold uppercase tracking-wider transition-colors shadow-md"
            >
              Book an Appointment
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-champagne-50/40 py-16 border-t border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-xs uppercase tracking-widest text-champagne-700 font-semibold">Our Location</span>
            <h2 className="font-serif text-3xl font-bold text-zinc-900 mt-2">Find Us</h2>
          </div>
          <div className="rounded-xl overflow-hidden border border-zinc-200 shadow-sm bg-white">
            <iframe
              title="Iris Hair Cut and Salon location map"
              src="https://www.google.com/maps?q=27.6625562,85.3408266&output=embed"
              width="100%"
              height="420"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="border-0"
            />
          </div>
          <div className="text-center mt-6">
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=27.6625562%2C85.3408266"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              Get Directions
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
