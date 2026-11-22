'use client';

import React, { useState } from 'react';
import { PublicLayout } from '../../layouts/PublicLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <PublicLayout>
      <section className="bg-champagne-50/50 py-16 border-b border-zinc-100 text-center">
        <div className="max-w-3xl mx-auto px-4 space-y-3">
          <span className="text-xs uppercase tracking-widest text-champagne-700 font-semibold">
            Connect With Us
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-zinc-900">
            Contact & Location
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
            Have questions about a treatment, consultation, or bridal package? We are always here to assist.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Contact Information */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <h3 className="font-serif text-2xl font-bold text-zinc-900 mb-2">Our Salon Sanctuary</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Located in the heart of Kathmandu, our salon is equipped with private consultation lounges, comfortable styling chairs, and ambient acoustic music.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-xl border border-zinc-100 bg-champagne-50/30">
                  <div className="w-10 h-10 rounded-full bg-champagne-100 flex items-center justify-center text-champagne-800 shrink-0">
                    <MapPin className="w-5 h-5 text-champagne-700" />
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-semibold text-zinc-900">Address</h4>
                    <p className="text-sm text-zinc-600 mt-1">Kathmandu, Nepal</p>
                    <p className="text-xs text-zinc-400">Valet & designated parking available</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl border border-zinc-100 bg-champagne-50/30">
                  <div className="w-10 h-10 rounded-full bg-champagne-100 flex items-center justify-center text-champagne-800 shrink-0">
                    <Phone className="w-5 h-5 text-champagne-700" />
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-semibold text-zinc-900">Phone</h4>
                    <p className="text-sm text-zinc-600 mt-1">+977-9800000000</p>
                    <p className="text-xs text-zinc-400">Lines open 9:00 AM – 7:00 PM</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl border border-zinc-100 bg-champagne-50/30">
                  <div className="w-10 h-10 rounded-full bg-champagne-100 flex items-center justify-center text-champagne-800 shrink-0">
                    <Mail className="w-5 h-5 text-champagne-700" />
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-semibold text-zinc-900">Email</h4>
                    <p className="text-sm text-zinc-600 mt-1">info@irissalon.com</p>
                    <p className="text-xs text-zinc-400">Replies typically within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl border border-zinc-100 bg-champagne-50/30">
                  <div className="w-10 h-10 rounded-full bg-champagne-100 flex items-center justify-center text-champagne-800 shrink-0">
                    <Clock className="w-5 h-5 text-champagne-700" />
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-semibold text-zinc-900">Salon Hours</h4>
                    <p className="text-sm text-zinc-600 mt-1">Mon – Fri: 9:00 AM – 7:00 PM</p>
                    <p className="text-sm text-zinc-600">Sat: 9:00 AM – 6:00 PM</p>
                    <p className="text-sm text-champagne-700 font-medium">Sun: 10:00 AM – 5:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Inquiries Form */}
            <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-2xl border border-zinc-200 shadow-sm">
              <h3 className="font-serif text-2xl font-bold text-zinc-900 mb-2">Send an Inquiry</h3>
              <p className="text-xs text-zinc-500 mb-8">
                Fill out the message form below and our salon concierge will promptly respond.
              </p>

              {submitted ? (
                <div className="p-8 text-center bg-champagne-50 rounded-xl border border-champagne-200 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="font-serif text-xl font-bold text-zinc-900">Message Received</h4>
                  <p className="text-xs text-zinc-600 max-w-md mx-auto">
                    Thank you for reaching out to Iris Hair Cut and Salon. A concierge specialist will contact you shortly.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input label="Full Name" placeholder="Jane Doe" required />
                    <Input label="Email Address" type="email" placeholder="jane@example.com" required />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input label="Phone Number" placeholder="+977-98..." required />
                    <Input label="Subject" placeholder="Bridal styling inquiry" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                      Your Message
                    </label>
                    <textarea
                      rows={5}
                      required
                      placeholder="Tell us what you are looking for..."
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                    />
                  </div>
                  <Button type="submit" isLoading={loading} className="w-full sm:w-auto px-8">
                    <Send className="w-4 h-4 mr-2" />
                    Submit Inquiry
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
