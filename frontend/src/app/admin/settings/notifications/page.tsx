'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../../components/ProtectedRoute';
import { DashboardLayout } from '../../../../layouts/DashboardLayout';
import { SalonSettings } from '../../../../types';
import { settingsService } from '../../../../services/settingsService';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Bell, Mail, MessageSquare, CheckCircle2 } from 'lucide-react';

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<SalonSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // Reminder toggles
  const [reminder24h, setReminder24h] = useState(true);
  const [reminder2h, setReminder2h] = useState(true);
  const [reminderEmail, setReminderEmail] = useState(true);
  const [reminderSMS, setReminderSMS] = useState(false);
  const [smsProvider, setSmsProvider] = useState('sparrowsms');
  const [smsSenderId, setSmsSenderId] = useState('IRIS');

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await settingsService.getSettings();
        if (res.success && res.data) {
          const s = res.data;
          setSettings(s);
          if (s.reminderSettings) {
            setReminder24h(s.reminderSettings.reminder24hEnabled ?? true);
            setReminder2h(s.reminderSettings.reminder2hEnabled ?? true);
            setReminderEmail(s.reminderSettings.reminderEmail ?? true);
            setReminderSMS(s.reminderSettings.reminderSMS ?? false);
          }
          if (s.smsSettings) {
            setSmsProvider(s.smsSettings.provider || 'sparrowsms');
            setSmsSenderId(s.smsSettings.senderId || 'IRIS');
          }
        }
      } catch (err) {
        console.error('Failed to load notification settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(false);

    try {
      const payload: Partial<SalonSettings> = {
        reminderSettings: {
          reminder24hEnabled: reminder24h,
          reminder2hEnabled: reminder2h,
          reminderEmail,
          reminderSMS,
        },
        smsSettings: {
          provider: smsProvider,
          senderId: smsSenderId,
        },
      };

      const res = await settingsService.updateSettings(payload);
      if (res.success) {
        setSuccessMsg(true);
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['super_admin']}>
      <DashboardLayout
        role="super_admin"
        title="Notification & Reminder Settings"
        subtitle="Automated email triggers, customer appointment alerts, and SMS gateway configuration"
      >
        <div className="max-w-3xl bg-white p-8 sm:p-10 rounded-xl border border-zinc-200 shadow-sm space-y-6">
          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Notification settings saved successfully.</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Automatic Triggers */}
            <div className="space-y-4">
              <h4 className="font-serif text-base font-bold text-zinc-900 border-b border-zinc-100 pb-2">
                Automated Client Reminders
              </h4>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 hover:bg-zinc-50 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-zinc-900">24-Hour Advance Reminder</p>
                    <p className="text-[11px] text-zinc-500">Send an automated reminder 24 hours prior to appointment</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={reminder24h}
                    onChange={(e) => setReminder24h(e.target.checked)}
                    className="w-4 h-4 text-zinc-900 rounded focus:ring-zinc-900"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 hover:bg-zinc-50 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-zinc-900">2-Hour Same-Day Alert</p>
                    <p className="text-[11px] text-zinc-500">Send a quick notice 2 hours before the scheduled time slot</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={reminder2h}
                    onChange={(e) => setReminder2h(e.target.checked)}
                    className="w-4 h-4 text-zinc-900 rounded focus:ring-zinc-900"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 hover:bg-zinc-50 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-zinc-900">Dispatch via Email</p>
                    <p className="text-[11px] text-zinc-500">Transmit confirmation and reminders via configured SMTP</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={reminderEmail}
                    onChange={(e) => setReminderEmail(e.target.checked)}
                    className="w-4 h-4 text-zinc-900 rounded focus:ring-zinc-900"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 hover:bg-zinc-50 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-zinc-900">Dispatch via SMS</p>
                    <p className="text-[11px] text-zinc-500">Send direct SMS notifications to clients via Nepal SMS gateway</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={reminderSMS}
                    onChange={(e) => setReminderSMS(e.target.checked)}
                    className="w-4 h-4 text-zinc-900 rounded focus:ring-zinc-900"
                  />
                </label>
              </div>
            </div>

            {/* SMS Gateway Settings */}
            <div className="space-y-4 pt-4 border-t border-zinc-100">
              <h4 className="font-serif text-base font-bold text-zinc-900 border-b border-zinc-100 pb-2">
                SMS Gateway Parameters
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="SMS Provider"
                  value={smsProvider}
                  onChange={(e) => setSmsProvider(e.target.value)}
                  placeholder="sparrowsms"
                />
                <Input
                  label="Sender ID / Header"
                  value={smsSenderId}
                  onChange={(e) => setSmsSenderId(e.target.value)}
                  placeholder="IRIS"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex justify-end">
              <Button type="submit" isLoading={saving} className="px-8">
                Save Notification Settings
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
