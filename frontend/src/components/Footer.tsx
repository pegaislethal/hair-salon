import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail, Clock, Instagram, Facebook } from 'lucide-react';

export const Footer: React.FC = () => {
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
              Experience the pinnacle of luxury hair styling, beauty therapies, and personalized salon care in a sanctuary designed for your comfort and timeless elegance.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-champagne-300 hover:bg-zinc-700 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-champagne-300 hover:bg-zinc-700 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
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
              <li className="flex justify-between py-1 border-b border-zinc-800">
                <span>Monday – Friday</span>
                <span className="text-white font-medium">9:00 AM – 7:00 PM</span>
              </li>
              <li className="flex justify-between py-1 border-b border-zinc-800">
                <span>Saturday</span>
                <span className="text-white font-medium">9:00 AM – 6:00 PM</span>
              </li>
              <li className="flex justify-between py-1">
                <span>Sunday</span>
                <span className="text-champagne-300 font-medium">10:00 AM – 5:00 PM</span>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-white font-serif text-base font-semibold tracking-wide uppercase mb-4 border-l-2 border-champagne-400 pl-3">
              Get in Touch
            </h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-champagne-400 shrink-0 mt-0.5" />
                <span>Kathmandu, Nepal</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-champagne-400 shrink-0" />
                <span>+977-9800000000</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-champagne-400 shrink-0" />
                <span>info@irissalon.com</span>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-champagne-400 shrink-0" />
                <span>Walk-ins & Appointments Welcome</span>
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
