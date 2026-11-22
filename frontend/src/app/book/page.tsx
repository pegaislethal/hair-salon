'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PublicLayout } from '../../layouts/PublicLayout';
import { Service, Staff } from '../../types';
import { serviceService } from '../../services/serviceService';
import { staffService } from '../../services/staffService';
import { appointmentService } from '../../services/appointmentService';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { formatPrice, formatTime12 } from '../../utils/format';
import {
  Calendar as CalendarIcon,
  Clock,
  User as UserIcon,
  Scissors,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react';

function BookingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedService = searchParams.get('service');
  const { user, isAuthenticated } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loadingServices, setLoadingServices] = useState<boolean>(true);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

  // Default to tomorrow's date
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  // Fetch services and staff
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [servicesRes, staffRes] = await Promise.allSettled([
          serviceService.getServices(),
          staffService.getStaff(),
        ]);
        if (servicesRes.status === 'fulfilled' && servicesRes.value.success) {
          setServices(servicesRes.value.data);
          if (preselectedService) {
            const found = servicesRes.value.data.find((s) => s._id === preselectedService);
            if (found) {
              setSelectedService(found);
              setStep(2);
            }
          }
        }
        if (staffRes.status === 'fulfilled' && staffRes.value.success) {
          setStaffList(staffRes.value.data);
        }
      } catch (err) {
        console.error('Failed to load booking catalog:', err);
      } finally {
        setLoadingServices(false);
      }
    }
    loadInitialData();
  }, [preselectedService]);

  // Fetch available slots when service, date, or staff change
  useEffect(() => {
    if (!selectedService || !selectedDate) return;

    async function fetchSlots() {
      setLoadingSlots(true);
      setError(null);
      try {
        const staffUserId = typeof selectedStaff?.user === 'object' ? (selectedStaff.user as any)?._id : selectedStaff?.user;
        const res = await appointmentService.getAvailableSlots(
          selectedService!._id,
          selectedDate,
          staffUserId
        );
        if (res.success && res.data) {
          setAvailableSlots(res.data);
          if (res.data.length > 0) {
            setSelectedSlot(res.data[0]);
          } else {
            setSelectedSlot('');
          }
        } else {
          // Fallback business slots if backend calculation returns empty
          const fallback = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
          setAvailableSlots(fallback);
          setSelectedSlot('10:00');
        }
      } catch (err) {
        // Fallback default slots
        const fallback = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
        setAvailableSlots(fallback);
        setSelectedSlot('10:00');
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [selectedService, selectedDate, selectedStaff]);

  const handleBookingSubmit = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/book${selectedService ? `?service=${selectedService._id}` : ''}`);
      return;
    }

    if (!selectedService || !selectedDate || !selectedSlot) {
      setError('Please select a service, date, and appointment time slot.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const staffUserId = typeof selectedStaff?.user === 'object' ? (selectedStaff.user as any)?._id : selectedStaff?.user;
      const res = await appointmentService.createAppointment({
        serviceId: selectedService._id,
        appointmentDate: selectedDate,
        startTime: selectedSlot,
        staffId: staffUserId,
        customerNotes: notes,
      });

      if (res.success && res.data) {
        setBookingSuccess(res.data);
      } else {
        setError(res.message || 'Failed to complete booking.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not complete your booking request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Wizard Header */}
      <div className="text-center space-y-2 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-champagne-100 border border-champagne-300 text-champagne-900 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-champagne-700" />
          Bespoke Appointment Booking
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-zinc-900">
          Reserve Your Salon Experience
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500">
          Step-by-step reservation with real-time stylist availability
        </p>
      </div>

      {bookingSuccess ? (
        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-champagne-300 shadow-xl text-center space-y-6 animate-in fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">Booking Confirmed</span>
            <h2 className="font-serif text-3xl font-bold text-zinc-900 mt-1">
              Your Appointment Request is Submitted!
            </h2>
            <p className="text-sm text-zinc-600 mt-2 max-w-md mx-auto leading-relaxed">
              We have received your booking and notified our team. You can view its real-time status in your client portal.
            </p>
          </div>

          <div className="bg-champagne-50/60 p-6 rounded-xl border border-champagne-200/80 max-w-md mx-auto text-left space-y-3">
            <div className="flex justify-between text-xs border-b border-champagne-200/60 pb-2">
              <span className="text-zinc-500">Booking Reference</span>
              <span className="font-mono font-bold text-zinc-900">{bookingSuccess.bookingReference}</span>
            </div>
            <div className="flex justify-between text-xs border-b border-champagne-200/60 pb-2">
              <span className="text-zinc-500">Service</span>
              <span className="font-semibold text-zinc-900">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between text-xs border-b border-champagne-200/60 pb-2">
              <span className="text-zinc-500">Date & Time</span>
              <span className="font-semibold text-zinc-900">
                {selectedDate} at {formatTime12(selectedSlot)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Price Snapshot</span>
              <span className="font-bold text-zinc-900">{formatPrice(selectedService?.price)}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/customer/appointments"
              className="w-full sm:w-auto px-6 py-2.5 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-semibold uppercase tracking-wider"
            >
              View My Appointments
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBookingSuccess(null);
                setStep(1);
                setSelectedService(null);
              }}
            >
              Book Another Service
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-lg overflow-hidden">
          {/* Step Progress Bar */}
          <div className="grid grid-cols-3 border-b border-zinc-100 bg-champagne-50/30">
            <div
              className={`p-4 text-center border-r border-zinc-100 ${
                step === 1 ? 'bg-white font-bold text-zinc-900 border-b-2 border-b-champagne-600' : 'text-zinc-500'
              }`}
            >
              <span className="text-xs uppercase tracking-wider">1. Select Service</span>
            </div>
            <div
              className={`p-4 text-center border-r border-zinc-100 ${
                step === 2 ? 'bg-white font-bold text-zinc-900 border-b-2 border-b-champagne-600' : 'text-zinc-500'
              }`}
            >
              <span className="text-xs uppercase tracking-wider">2. Date & Time</span>
            </div>
            <div
              className={`p-4 text-center ${
                step === 3 ? 'bg-white font-bold text-zinc-900 border-b-2 border-b-champagne-600' : 'text-zinc-500'
              }`}
            >
              <span className="text-xs uppercase tracking-wider">3. Review & Confirm</span>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-3 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: Select Service */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-serif text-xl font-bold text-zinc-900">Choose a Treatment</h3>
                  <p className="text-xs text-zinc-500 mt-1">Select from our signature hair and beauty rituals</p>
                </div>

                {loadingServices ? (
                  <div className="py-12 text-center text-xs text-zinc-500">Loading services...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((s) => {
                      const isSelected = selectedService?._id === s._id;
                      return (
                        <div
                          key={s._id}
                          onClick={() => setSelectedService(s)}
                          className={`p-5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-zinc-900 bg-champagne-50/40 ring-1 ring-zinc-900'
                              : 'border-zinc-200 hover:border-champagne-400 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-champagne-800 bg-champagne-100/80 px-2 py-0.5 rounded">
                                {s.category || 'Hair'}
                              </span>
                              <h4 className="font-serif font-bold text-zinc-900 text-base mt-2">{s.name}</h4>
                              <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{s.description}</p>
                            </div>
                          </div>
                          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1 text-zinc-500">
                              <Clock className="w-3.5 h-3.5" />
                              {s.duration} mins
                            </span>
                            <span className="font-bold text-zinc-900">{formatPrice(s.price)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button
                    disabled={!selectedService}
                    onClick={() => setStep(2)}
                    className="gap-2"
                  >
                    Continue to Schedule <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: Date, Time & Stylist */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-zinc-900">Select Date & Time</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Service: <span className="font-semibold text-zinc-900">{selectedService?.name}</span> ({selectedService?.duration} mins)
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="gap-1">
                    <ChevronLeft className="w-4 h-4" /> Change Service
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Date Picker */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                      Appointment Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-zinc-200 rounded-md text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>

                  {/* Stylist Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                      Preferred Stylist (Optional)
                    </label>
                    <select
                      value={selectedStaff?._id || ''}
                      onChange={(e) => {
                        const st = staffList.find((s) => s._id === e.target.value);
                        setSelectedStaff(st || null);
                      }}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-zinc-200 rounded-md text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    >
                      <option value="">Any Available Senior Stylist</option>
                      {staffList.map((st) => (
                        <option key={st._id} value={st._id}>
                          {typeof st.user === 'object' ? (st.user as any)?.fullName : 'Stylist'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Slots Grid */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                    Available Time Slots on {selectedDate}
                  </label>

                  {loadingSlots ? (
                    <div className="py-8 text-center text-xs text-zinc-500">Checking slot availability...</div>
                  ) : availableSlots.length === 0 ? (
                    <div className="p-4 bg-zinc-50 rounded-lg text-center text-xs text-zinc-500">
                      No open slots on this date. Please pick another date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                      {availableSlots.map((slot) => {
                        const isPicked = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2 px-3 rounded-md text-xs font-medium border transition-all ${
                              isPicked
                                ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                                : 'bg-white text-zinc-700 border-zinc-200 hover:border-champagne-400'
                            }`}
                          >
                            {formatTime12(slot)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4 border-t border-zinc-100">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button disabled={!selectedSlot} onClick={() => setStep(3)} className="gap-2">
                    Review Details <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Review & Confirm */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-serif text-xl font-bold text-zinc-900">Review & Confirm</h3>
                  <p className="text-xs text-zinc-500 mt-1">Confirm your booking details and client information</p>
                </div>

                {/* Summary Card */}
                <div className="p-6 bg-champagne-50/50 rounded-xl border border-champagne-200 space-y-4">
                  <div className="flex justify-between items-start pb-4 border-b border-champagne-200/80">
                    <div>
                      <h4 className="font-serif font-bold text-lg text-zinc-900">{selectedService?.name}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">{selectedService?.description}</p>
                    </div>
                    <span className="font-serif text-lg font-bold text-zinc-900">
                      {formatPrice(selectedService?.price)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-zinc-500 block">Date</span>
                      <span className="font-semibold text-zinc-900">{selectedDate}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Time</span>
                      <span className="font-semibold text-zinc-900">{formatTime12(selectedSlot)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Stylist</span>
                      <span className="font-semibold text-zinc-900">
                        {selectedStaff
                          ? typeof selectedStaff.user === 'object'
                            ? (selectedStaff.user as any)?.fullName
                            : 'Assigned Stylist'
                          : 'Any Senior Stylist'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Notes */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                    Special Requests or Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="E.g. sensitive scalp, preferred haircut references, bridal veil..."
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-zinc-200 rounded-md text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                {!isAuthenticated && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-2">
                    <p className="font-semibold">Sign in required to confirm booking</p>
                    <p>
                      You will be prompted to quickly log in or create an account so your appointment can be linked and verified.
                    </p>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-zinc-100">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button isLoading={submitting} onClick={handleBookingSubmit} className="gap-2 px-8">
                    {isAuthenticated ? 'Confirm Appointment' : 'Sign In & Reserve'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookPage() {
  return (
    <PublicLayout>
      <Suspense fallback={<div className="py-20 text-center text-xs text-zinc-500">Loading booking portal...</div>}>
        <BookingWizard />
      </Suspense>
    </PublicLayout>
  );
}
