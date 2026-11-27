'use client';

import React, { useEffect, useState } from 'react';
import { PublicLayout } from '../../layouts/PublicLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import type { PublicSalonInfo } from '../../types';
import { formatSalonTime, getSalonAddress, salonBusinessDays } from '../../utils/salonInfo';

export default function ContactPage() {
  const [salonInfo, setSalonInfo] = useState<PublicSalonInfo | null>(null);
  const [settingsError, setSettingsError] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState('');

  useEffect(() => {
    settingsService.getPublicSalonInfo()
      .then((response) => {
        if (response.success) setSalonInfo(response.data);
      })
      .catch((error) => {
        console.error('Unable to load public salon information:', error);
        setSettingsError(true);
      });
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const contactEmail = salonInfo?.contactEmail?.trim();
    if (!contactEmail) {
      setSubmissionMessage('Email contact is not configured yet. Please use the salon phone number if it is listed.');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const subject = String(formData.get('subject') || '').trim();
    const message = [
      `Name: ${String(formData.get('name') || '').trim()}`,
      `Email: ${String(formData.get('email') || '').trim()}`,
      `Phone: ${String(formData.get('phone') || '').trim() || 'Not provided'}`,
      '',
      String(formData.get('message') || '').trim(),
    ].join('\n');

    window.location.href = `mailto:${encodeURIComponent(contactEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    setSubmissionMessage('Your email app should open with this inquiry. Send the message there to contact the salon.');
  };

  const address = getSalonAddress(salonInfo);

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
                <h3 className="font-serif text-2xl font-bold text-zinc-900 mb-2">{salonInfo?.businessName || 'Iris Hair Cut and Salon'}</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  For appointment questions and service inquiries, contact the salon using the current details below.
                </p>
              </div>

              <div className="space-y-6">
                {address && (
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-zinc-100 bg-champagne-50/30">
                    <div className="w-10 h-10 rounded-full bg-champagne-100 flex items-center justify-center text-champagne-800 shrink-0">
                      <MapPin className="w-5 h-5 text-champagne-700" />
                    </div>
                    <div>
                      <h4 className="text-xs uppercase tracking-wider font-semibold text-zinc-900">Address</h4>
                      <p className="text-sm text-zinc-600 mt-1">{address}</p>
                    </div>
                  </div>
                )}

                {salonInfo?.contactPhone && (
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-zinc-100 bg-champagne-50/30">
                    <div className="w-10 h-10 rounded-full bg-champagne-100 flex items-center justify-center text-champagne-800 shrink-0">
                      <Phone className="w-5 h-5 text-champagne-700" />
                    </div>
                    <div>
                      <h4 className="text-xs uppercase tracking-wider font-semibold text-zinc-900">Phone</h4>
                      <a href={`tel:${salonInfo.contactPhone}`} className="text-sm text-zinc-600 mt-1 inline-block hover:text-zinc-900">{salonInfo.contactPhone}</a>
                    </div>
                  </div>
                )}

                {salonInfo?.contactEmail && (
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-zinc-100 bg-champagne-50/30">
                    <div className="w-10 h-10 rounded-full bg-champagne-100 flex items-center justify-center text-champagne-800 shrink-0">
                      <Mail className="w-5 h-5 text-champagne-700" />
                    </div>
                    <div>
                      <h4 className="text-xs uppercase tracking-wider font-semibold text-zinc-900">Email</h4>
                      <a href={`mailto:${salonInfo.contactEmail}`} className="text-sm text-zinc-600 mt-1 inline-block hover:text-zinc-900 break-all">{salonInfo.contactEmail}</a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4 p-4 rounded-xl border border-zinc-100 bg-champagne-50/30">
                  <div className="w-10 h-10 rounded-full bg-champagne-100 flex items-center justify-center text-champagne-800 shrink-0">
                    <Clock className="w-5 h-5 text-champagne-700" />
                  </div>
                  <div className="w-full">
                    <h4 className="text-xs uppercase tracking-wider font-semibold text-zinc-900">Salon Hours</h4>
                    <ul className="mt-2 space-y-1">
                      {salonBusinessDays.map((day) => {
                        const hours = salonInfo?.businessHours[day];
                        return (
                          <li key={day} className="flex justify-between gap-3 text-sm text-zinc-600">
                            <span>{day[0].toUpperCase() + day.slice(1)}</span>
                            <span>{!hours ? 'Not listed' : hours.isClosed ? 'Closed' : `${formatSalonTime(hours.open)} – ${formatSalonTime(hours.close)}`}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
                {settingsError && <p role="status" className="text-xs text-zinc-500">Salon details could not be loaded. Please try again later.</p>}
              </div>
            </div>

            {/* Inquiries Form */}
            <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-2xl border border-zinc-200 shadow-sm">
              <h3 className="font-serif text-2xl font-bold text-zinc-900 mb-2">Send an Inquiry</h3>
              <p className="text-xs text-zinc-500 mb-8">
                Complete the details below to open an email to the salon.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input name="name" label="Full Name" placeholder="Your name" required />
                  <Input name="email" label="Email Address" type="email" placeholder="you@example.com" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input name="phone" label="Phone Number" placeholder="Your phone number" />
                  <Input name="subject" label="Subject" placeholder="How can we help?" required />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="contact-message" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                    Your Message
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    required
                    placeholder="Tell us what you are looking for..."
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                  />
                </div>
                {submissionMessage && <p role="status" className="text-sm text-zinc-600">{submissionMessage}</p>}
                <Button type="submit" className="w-full sm:w-auto px-8">
                  <Send className="w-4 h-4 mr-2" />
                  Open Email
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
