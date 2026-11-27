'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail, Clock, Instagram, Facebook } from 'lucide-react';
import { settingsService } from '../services/settingsService';
import type { PublicSalonInfo } from '../types';
import { formatSalonTime, getSalonAddress, salonBusinessDays } from '../utils/salonInfo';

const getSocialUrl = (value?: string): string | null => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
};

export const Footer: React.FC = () => {
  const [salonInfo, setSalonInfo] = useState<PublicSalonInfo | null>(null);

  useEffect(() => {
    settingsService.getPublicSalonInfo()
      .then((response) => {
        if (response.success) setSalonInfo(response.data);
      })
      .catch((error) => console.error('Unable to load public salon information:', error));
  }, []);

  const address = getSalonAddress(salonInfo);
  const socialLinks = [
    { href: getSocialUrl(salonInfo?.socialMedia?.instagram), label: 'Instagram', Icon: Instagram },
    { href: getSocialUrl(salonInfo?.socialMedia?.facebook), label: 'Facebook', Icon: Facebook },
  ].filter((link): link is typeof link & { href: string } => Boolean(link.href));

  return (
    <footer className="bg-zinc-900 text-zinc-300 pt-16 pb-12 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-zinc-800">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src="/iris-logo.png"
                alt="Iris Salon of Hair & Beauty Academy"
                width={468}
                height={368}
                sizes="72px"
                quality={100}
                className="h-14 w-[72px] rounded-full border border-champagne-300 object-cover"
              />
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Explore salon services, browse available looks, and reserve an appointment with Iris Hair Cut and Salon.
            </p>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3 pt-2">
                {socialLinks.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-champagne-300 hover:bg-zinc-700 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-serif text-base font-semibold tracking-wide uppercase mb-4 border-l-2 border-champagne-400 pl-3">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-champagne-300 transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-champagne-300 transition-colors">Services & Pricing</Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-champagne-300 transition-colors">Style Gallery</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-champagne-300 transition-colors">About Us</Link>
              </li>
              <li>
                <Link href="/join-us" className="hover:text-champagne-300 transition-colors">Join Our Team</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-champagne-300 transition-colors">Contact & Hours</Link>
              </li>
              <li>
                <Link href="/book" className="text-champagne-300 font-semibold hover:underline">Book Online</Link>
              </li>
            </ul>
          </div>

          {/* Salon Hours */}
          <div>
            <h4 className="text-white font-serif text-base font-semibold tracking-wide uppercase mb-4 border-l-2 border-champagne-400 pl-3">
              Working Hours
            </h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              {salonBusinessDays.map((day) => {
                const hours = salonInfo?.businessHours[day];
                return (
                  <li key={day} className="flex justify-between gap-3 py-1 border-b border-zinc-800 last:border-0">
                    <span>{day[0].toUpperCase() + day.slice(1)}</span>
                    <span className="text-right text-white font-medium">
                      {!hours ? 'Not listed' : hours.isClosed ? 'Closed' : `${formatSalonTime(hours.open)} – ${formatSalonTime(hours.close)}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-white font-serif text-base font-semibold tracking-wide uppercase mb-4 border-l-2 border-champagne-400 pl-3">
              Get in Touch
            </h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              {address && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-champagne-400 shrink-0 mt-0.5" />
                  <span>{address}</span>
                </li>
              )}
              {salonInfo?.contactPhone && (
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-champagne-400 shrink-0" />
                  <a href={`tel:${salonInfo.contactPhone}`} className="hover:text-white">{salonInfo.contactPhone}</a>
                </li>
              )}
              {salonInfo?.contactEmail && (
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-champagne-400 shrink-0" />
                  <a href={`mailto:${salonInfo.contactEmail}`} className="break-all hover:text-white">{salonInfo.contactEmail}</a>
                </li>
              )}
              {!address && !salonInfo?.contactPhone && !salonInfo?.contactEmail && (
                <li className="text-zinc-500">Contact details are not listed yet.</li>
              )}
              <li className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-champagne-400 shrink-0" />
                <Link href="/contact" className="hover:text-white">View salon contact information</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>© {new Date().getFullYear()} Iris Hair Cut and Salon. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
