'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../../components/ProtectedRoute';
import { DashboardLayout } from '../../../../layouts/DashboardLayout';
import { SalonSettings } from '../../../../types';
import { settingsService } from '../../../../services/settingsService';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import { CheckCircle2, AlertCircle, Building, Clock, MapPin, Phone, Mail } from 'lucide-react';

export default function BusinessSettingsPage() {
  const [settings, setSettings] = useState<SalonSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form fields
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Nepal');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notificationEmail, setNotificationEmail] = useState('');
  const [advanceDays, setAdvanceDays] = useState(30);
  const [slotInterval, setSlotInterval] = useState(30);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await settingsService.getSettings();
        if (res.success && res.data) {
          const s = res.data;
          setSettings(s);
          setBusinessName(s.businessName || 'Iris Hair Cut and Salon');
          setAddress(s.address || '');
          setCity(s.city || 'Kathmandu');
          setCountry(s.country || 'Nepal');
          setContactPhone(s.contactPhone || '');
          setContactEmail(s.contactEmail || '');
          setNotificationEmail(s.notificationEmail || '');
          setAdvanceDays(s.bookingSettings?.advanceBookingDays || 30);
          setSlotInterval(s.bookingSettings?.appointmentSlotInterval || 30);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(false);
    setErrorMsg(null);

    try {
      const payload: Partial<SalonSettings> = {
        businessName,
        address,
        city,
        country,
        contactPhone,
        contactEmail,
        notificationEmail,
        bookingSettings: {
          ...settings?.bookingSettings,
          advanceBookingDays: Number(advanceDays),
          appointmentSlotInterval: Number(slotInterval),
          minAdvanceHours: settings?.bookingSettings?.minAdvanceHours || 2,
          maxConcurrentAppointments: settings?.bookingSettings?.maxConcurrentAppointments || 5,
          allowStylistSelection: true,
          cancellationPolicy: settings?.bookingSettings?.cancellationPolicy || 'Standard 24h',
          requireConfirmation: true,
        },
      };

      const res = await settingsService.updateSettings(payload);
      if (res.success) {
        setSuccessMsg(true);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update business settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['super_admin']}>
      <DashboardLayout
        role="super_admin"
        title="Business Configuration"
        subtitle="Manage salon identity, location coordinates, operational hours, and booking constraints"
      >
        <div className="max-w-4xl bg-white p-8 sm:p-10 rounded-xl border border-zinc-200 shadow-sm space-y-6">
          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Salon settings updated successfully.</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Identity */}
            <div className="space-y-4">
              <h4 className="font-serif text-base font-bold text-zinc-900 border-b border-zinc-100 pb-2">
                Salon Identity & Contact
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Business Name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
                <Input
                  label="Contact Phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+977-98..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Contact Email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                />
                <Input
                  label="Notification Dispatch Email"
                  type="email"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Physical Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street / Area"
                  required
                />
                <Input
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
                <Input
                  label="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Booking Rules */}
            <div className="space-y-4 pt-4 border-t border-zinc-100">
              <h4 className="font-serif text-base font-bold text-zinc-900 border-b border-zinc-100 pb-2">
                Booking System Parameters
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Advance Booking Window (Days)"
                  type="number"
                  min={1}
                  max={180}
                  value={advanceDays}
                  onChange={(e) => setAdvanceDays(Number(e.target.value))}
                  required
                />
                <Input
                  label="Slot Interval Step (Minutes)"
                  type="number"
                  min={15}
                  max={120}
                  step={15}
                  value={slotInterval}
                  onChange={(e) => setSlotInterval(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex justify-end">
              <Button type="submit" isLoading={saving} className="px-8">
                Save Business Settings
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
