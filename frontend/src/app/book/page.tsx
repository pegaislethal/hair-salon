'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PublicLayout } from '../../layouts/PublicLayout';
import { Appointment, Service } from '../../types';
import { serviceService } from '../../services/serviceService';
import { appointmentService } from '../../services/appointmentService';
import { useAuth } from '../../context/AuthContext';
import { getBookingLoginUrl, showBookingLoginToast } from '../../utils/bookingAuth';
import { authService } from '../../services/authService';
import { getNepalPhoneInputValue, normalizeNepalPhone } from '../../utils/nepalPhone';
import {
  BookingDraft,
  BookingStep,
  clearBookingDraft,
  readBookingDraft,
  saveBookingDraft,
} from '../../utils/bookingDraft';
import { Button } from '../../components/ui/Button';
import { formatPrice, formatServicePrice, formatTime12 } from '../../utils/format';
import {
  Clock,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  Scissors,
  Droplets,
  Palette,
  UserRound,
  Package,
  Layers,
  Check,
} from 'lucide-react';

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    if (typeof response?.data?.message === 'string') return response.data.message;
  }
  return fallback;
};

const toDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayDate = (): string => toDateInputValue(new Date());

const getTomorrowDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toDateInputValue(date);
};

const getServiceCategory = (service: Service): string => {
  return service.category || 'General';
};

const getCategoryIcon = (category: string) => {
  if (category === 'Haircuts') return Scissors;
  if (category === 'Hair Styling') return Sparkles;
  if (category === 'Hair Treatments') return Droplets;
  if (category === 'Hair Coloring') return Palette;
  if (category === 'Beard Services') return UserRound;
  if (category === 'Packages and Combos') return Layers;
  return Package;
};

const getServiceImage = (service: Service, category: string): string | undefined => {
  if (service.image) return service.image;

  const name = service.name.toLowerCase();
  if (category === 'Beard Services') return '/services/Gemini_Generated_Image_pl23jwpl23jwpl23.jpg';
  if (category === 'Haircuts' || category === 'Packages and Combos') {
    return /women|bridal/.test(name)
      ? '/services/Gemini_Generated_Image_pl23jwpl23jwpl23 (2).jpg'
      : '/services/Gemini_Generated_Image_pl23jwpl23jwpl23.jpg';
  }
  if (category === 'Hair Styling') return '/services/Gemini_Generated_Image_pl23jwpl23jwpl23 (1).jpg';
  if (category === 'Hair Coloring' || category === 'Hair Treatments') {
    return '/services/Gemini_Generated_Image_pl23jwpl23jwpl23 (3).jpg';
  }
  return undefined;
};

function BookingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedService = searchParams.get('service');
  const { user, isAuthenticated, loading: authLoading, updateUser } = useAuth();

  const [step, setStep] = useState<BookingStep>(1);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<'Lycan'>('Lycan');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [preferredTime, setPreferredTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loadingServices, setLoadingServices] = useState<boolean>(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All Services');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<Appointment | null>(null);
  const [restoredDraft, setRestoredDraft] = useState<BookingDraft | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [bookingPhone, setBookingPhone] = useState(getNepalPhoneInputValue(user?.phone || ''));
  const [bookingPhoneError, setBookingPhoneError] = useState<string | null>(null);
  const [bookingPhoneTouched, setBookingPhoneTouched] = useState(false);
  const bookingPhoneValidation = normalizeNepalPhone(bookingPhone);

  useEffect(() => {
    if (user?.phone) setBookingPhone(getNepalPhoneInputValue(user.phone));
  }, [user?.phone]);

  // Restore a saved booking before loading the service catalog.
  useEffect(() => {
    const draft = readBookingDraft();
    setRestoredDraft(draft);
    if (draft) {
      setSelectedBarber(draft.barberName);
      setSelectedDate(draft.appointmentDate || getTomorrowDate());
      setPreferredTime(draft.preferredTime);
      setNotes(draft.notes);
      setStep(draft.step);
    } else {
      setSelectedDate(getTomorrowDate());
    }
    setDraftReady(true);
  }, []);

  // Only active database services are eligible for booking.
  useEffect(() => {
    if (!draftReady || authLoading) return;
    let cancelled = false;

    async function loadInitialData() {
      setLoadingServices(true);
      setCatalogError(null);
      try {
        const servicesRes = await serviceService.getServices({ active: 'true' });
        if (!servicesRes.success) {
          throw new Error('Unable to load salon services.');
        }
        if (cancelled) return;

        const activeServices = servicesRes.data.filter((service) => service.isActive);
        setServices(activeServices);
        const requestedServiceId = restoredDraft?.serviceId || preselectedService;
        if (!requestedServiceId) return;

        const found = activeServices.find((service) => service._id === requestedServiceId);
        if (!found) {
          setSelectedService(null);
          setError('That service is no longer available. Please choose another active service.');
          if (restoredDraft) clearBookingDraft();
          return;
        }

        setSelectedService(found);
        setStep(restoredDraft?.step ?? 2);
        if (!isAuthenticated) {
          saveBookingDraft({
            serviceId: found._id,
            barberName: restoredDraft?.barberName || 'Lycan',
            appointmentDate: restoredDraft?.appointmentDate || getTomorrowDate(),
            preferredTime: restoredDraft?.preferredTime || '',
            notes: restoredDraft?.notes || '',
            step: restoredDraft?.step ?? 2,
          });
          showBookingLoginToast();
          router.replace(getBookingLoginUrl(`/book?service=${encodeURIComponent(found._id)}`));
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load booking catalog:', err);
          setCatalogError('Unable to load salon services. Please refresh and try again.');
        }
      } finally {
        if (!cancelled) setLoadingServices(false);
      }
    }
    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [authLoading, draftReady, isAuthenticated, preselectedService, restoredDraft, router]);

  useEffect(() => {
    if (!draftReady || !selectedService || bookingSuccess) return;
    saveBookingDraft({
      serviceId: selectedService._id,
      barberName: selectedBarber,
      appointmentDate: selectedDate,
      preferredTime,
      notes,
      step,
    });
  }, [bookingSuccess, draftReady, notes, preferredTime, selectedBarber, selectedDate, selectedService, step]);

  const categorizedServices = services.map((service) => ({
    service,
    category: getServiceCategory(service),
  }));
  const categories = ['All Services', ...Array.from(new Set(categorizedServices.map(({ category }) => category)))];
  const filteredServices = selectedCategory === 'All Services'
    ? categorizedServices
    : categorizedServices.filter(({ category }) => category === selectedCategory);

  const saveDraftAndRedirect = (nextStep: BookingStep) => {
    if (!selectedService) return;
    saveBookingDraft({
      serviceId: selectedService._id,
      barberName: selectedBarber,
      appointmentDate: selectedDate || getTomorrowDate(),
      preferredTime,
      notes,
      step: nextStep,
    });
    showBookingLoginToast();
    router.push(getBookingLoginUrl(`/book?service=${encodeURIComponent(selectedService._id)}`));
  };

  const handleContinue = (nextStep: BookingStep) => {
    if (!selectedService) return;
    setError(null);
    if (!isAuthenticated) {
      saveDraftAndRedirect(nextStep);
      return;
    }
    setStep(nextStep);
  };

  const handleBookingSubmit = async () => {
    if (!isAuthenticated) {
      saveDraftAndRedirect(3);
      return;
    }

    if (!selectedService || !selectedDate || !preferredTime || selectedBarber !== 'Lycan') {
      setError('Please select a service, date, preferred time, and available barber.');
      return;
    }

    if (!bookingPhoneValidation.valid) {
      setBookingPhoneTouched(true);
      setBookingPhoneError(bookingPhoneValidation.error);
      setError('Enter a valid Nepal mobile number before booking.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (!user) {
        setError('Please sign in again before submitting your booking.');
        return;
      }
      if (user.phone !== bookingPhoneValidation.normalized) {
        const profile = await authService.updateProfile({ phone: bookingPhoneValidation.normalized });
        if (!profile.success || !profile.data) {
          setError(profile.message || 'Could not save your phone number.');
          return;
        }
        updateUser(profile.data);
      }

      const res = await appointmentService.createAppointment({
        serviceId: selectedService._id,
        appointmentDate: selectedDate,
        startTime: preferredTime,
        barberName: selectedBarber,
        customerNotes: notes,
      });

      if (res.success && res.data) {
        clearBookingDraft();
        setBookingSuccess(res.data);
      } else {
        setError(res.message || 'Failed to complete booking.');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Could not submit your booking request.'));
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
          Send your preferred date and time for confirmation by our salon team
        </p>
      </div>

      {bookingSuccess ? (
        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-champagne-300 shadow-xl text-center space-y-6 animate-in fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">Booking Request Received</span>
            <h2 className="font-serif text-3xl font-bold text-zinc-900 mt-1">
              Your Appointment Request is Submitted!
            </h2>
            <p className="text-sm text-zinc-600 mt-2 max-w-md mx-auto leading-relaxed">
              Your request is pending until our team accepts it. You can view its status in your client portal.
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
              <span className="text-zinc-500">Barber</span>
              <span className="font-semibold text-zinc-900">Lycan</span>
            </div>
            <div className="flex justify-between text-xs border-b border-champagne-200/60 pb-2">
              <span className="text-zinc-500">Date & Time</span>
              <span className="font-semibold text-zinc-900">
                {selectedDate} at {formatTime12(preferredTime)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">
                {selectedService?.priceType === 'starting' ? 'Starting Price' : selectedService?.priceType === 'range' ? 'Price Range' : 'Price Snapshot'}
              </span>
              <span className="font-bold text-zinc-900">{formatServicePrice(selectedService)}</span>
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
                setSelectedDate(getTomorrowDate());
                setPreferredTime('');
                setNotes('');
                clearBookingDraft();
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
              <span className="text-xs uppercase tracking-wider">3. Submit Request</span>
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
                <div className="text-center sm:text-left">
                  <h3 className="font-serif text-xl font-bold text-zinc-900">Choose a Treatment</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Choose one service from our active salon menu.
                  </p>
                </div>

                {loadingServices ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-champagne-300 border-t-zinc-900 rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-zinc-500">Loading active salon services...</p>
                  </div>
                ) : catalogError ? (
                  <div className="py-12 px-4 text-center rounded-xl border border-rose-200 bg-rose-50 text-sm text-rose-700">
                    <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                    {catalogError}
                  </div>
                ) : categorizedServices.length === 0 ? (
                  <div className="py-14 px-4 text-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50">
                    <Sparkles className="w-8 h-8 text-champagne-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-zinc-800">No active services are available.</p>
                    <p className="text-xs text-zinc-500 mt-1">Please check back soon.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:justify-center">
                      {categories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          aria-pressed={selectedCategory === category}
                          onClick={() => setSelectedCategory(category)}
                          className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                            selectedCategory === category
                              ? 'bg-zinc-900 text-white shadow-sm'
                              : 'bg-zinc-100 text-zinc-600 hover:bg-champagne-100 hover:text-zinc-900'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredServices.map(({ service, category }) => {
                        const isSelected = selectedService?._id === service._id;
                        const CategoryIcon = getCategoryIcon(category);
                        const serviceImage = getServiceImage(service, category);
                        return (
                          <button
                            key={service._id}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => {
                              setSelectedService(service);
                              setError(null);
                            }}
                            className={`group overflow-hidden rounded-xl border text-left transition-all focus:outline-none focus:ring-2 focus:ring-champagne-500 ${
                              isSelected
                                ? 'border-zinc-900 bg-champagne-50/50 ring-2 ring-zinc-900 shadow-md'
                                : 'border-zinc-200 bg-white hover:-translate-y-0.5 hover:border-champagne-400 hover:shadow-md'
                            }`}
                          >
                            <div className="relative aspect-[16/10] overflow-hidden bg-champagne-50">
                              {serviceImage ? (
                                <img
                                  src={serviceImage}
                                  alt={service.name}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-champagne-50 via-white to-zinc-100 text-champagne-800">
                                  <CategoryIcon className="h-10 w-10 text-champagne-600" />
                                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
                                    {category}
                                  </span>
                                </div>
                              )}
                              {isSelected && (
                                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow">
                                  <Check className="h-3 w-3" /> Selected
                                </span>
                              )}
                            </div>
                            <div className="space-y-3 p-4">
                              <div>
                                <span className="rounded bg-champagne-100/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-champagne-900">
                                  {category}
                                </span>
                                <h4 className="mt-2 font-serif text-base font-bold text-zinc-900">
                                  {service.name}
                                </h4>
                                <p className="mt-1 line-clamp-2 min-h-8 text-xs leading-relaxed text-zinc-500">
                                  {service.description}
                                </p>
                              </div>
                              <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-xs">
                                <span className="flex items-center gap-1.5 text-zinc-500">
                                  <Clock className="h-3.5 w-3.5" /> {service.duration} min
                                </span>
                                <span className="font-bold text-zinc-900">{formatServicePrice(service)}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedService && (
                  <div className="flex flex-col gap-4 rounded-xl border border-champagne-200 bg-champagne-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-champagne-800">
                        Selected Service
                      </p>
                      <p className="mt-1 truncate font-serif text-base font-bold text-zinc-900">
                        {selectedService.name}
                      </p>
                      {selectedService.priceType && selectedService.priceType !== 'fixed' && (
                        <p className="text-[11px] text-zinc-500 mt-0.5 italic">
                          * Note: Final rate is determined based on hair length, thickness, or consultation.
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:shrink-0 sm:gap-6">
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-zinc-500">
                          {selectedService.priceType === 'starting' ? 'Starting Rate' : selectedService.priceType === 'range' ? 'Price Range' : 'Service Price'}
                        </span>
                        <span className="font-bold text-zinc-900">{formatServicePrice(selectedService)}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-zinc-500">Estimated Time</span>
                        <span className="font-bold text-zinc-900">{selectedService.duration} min</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col items-end gap-2 border-t border-zinc-100 pt-5">
                  {!isAuthenticated && (
                    <p className="text-right text-xs text-zinc-500">
                      Sign in is required to continue. Your selection will be saved.
                    </p>
                  )}
                  <Button
                    disabled={!selectedService || loadingServices}
                    onClick={() => handleContinue(2)}
                    className="w-full justify-center gap-2 px-8 sm:w-auto"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
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
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                      Appointment Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={getTodayDate()}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-zinc-200 rounded-md text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold tracking-wider text-zinc-700" htmlFor="preferred-appointment-time">
                      Preferred Appointment Time
                    </label>
                    <input
                      id="preferred-appointment-time"
                      type="time"
                      required
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-zinc-200 rounded-md text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                    <p className="text-xs text-zinc-500">
                      Your requested appointment time is subject to availability and will be confirmed by our salon team.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">Choose a Barber</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { name: 'Yujin (Intern)', available: false },
                      { name: 'Rohit (Intern)', available: false },
                      { name: 'Lycan', available: true },
                    ].map((barber) => (
                      <button
                        key={barber.name}
                        type="button"
                        disabled={!barber.available}
                        aria-pressed={selectedBarber === barber.name}
                        onClick={() => {
                          if (barber.available) setSelectedBarber('Lycan');
                        }}
                        className={`p-4 rounded-lg border text-left text-sm transition-colors ${
                          !barber.available
                            ? 'cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-400'
                            : selectedBarber === barber.name
                              ? 'border-zinc-900 bg-champagne-50'
                              : 'border-zinc-200 hover:border-champagne-400'
                        }`}
                      >
                        <span className="font-semibold">{barber.name}</span>
                        <span className="block text-xs mt-1">
                          {barber.available ? 'Available to request' : 'Temporarily unavailable'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-zinc-100">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button disabled={!selectedDate || !preferredTime} onClick={() => handleContinue(3)} className="gap-2">
                    Review Details <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Review & Confirm */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-serif text-xl font-bold text-zinc-900">Review Request Details</h3>
                  <p className="text-xs text-zinc-500 mt-1">Your requested time will be confirmed by our salon team.</p>
                </div>

                {/* Summary Card */}
                <div className="p-6 bg-champagne-50/50 rounded-xl border border-champagne-200 space-y-4">
                  <div className="flex justify-between items-start pb-4 border-b border-champagne-200/80">
                    <div>
                      <h4 className="font-serif font-bold text-lg text-zinc-900">{selectedService?.name}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">{selectedService?.description}</p>
                      {selectedService?.priceType && selectedService.priceType !== 'fixed' && (
                        <p className="text-[11px] text-champagne-800 font-medium mt-1 italic">
                          * Variable price: Final rate confirmed at salon consultation based on length/volume.
                        </p>
                      )}
                    </div>
                    <span className="font-serif text-lg font-bold text-zinc-900">
                      {formatServicePrice(selectedService)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-zinc-500 block">Date</span>
                      <span className="font-semibold text-zinc-900">{selectedDate}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Time</span>
                      <span className="font-semibold text-zinc-900">{formatTime12(preferredTime)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Stylist</span>
                      <span className="font-semibold text-zinc-900">
                        {selectedBarber}
                      </span>
                    </div>
                  </div>
                </div>

                {isAuthenticated && (
                  <div className="space-y-1.5">
                    <label htmlFor="booking-phone" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                      Phone Number
                    </label>
                    <div className={`flex rounded-md border bg-white focus-within:ring-1 focus-within:ring-zinc-900 ${bookingPhoneError ? 'border-rose-400 focus-within:ring-rose-500' : 'border-zinc-200'}`}>
                      <span className="inline-flex items-center border-r border-zinc-200 bg-zinc-50 px-3.5 text-sm font-medium text-zinc-600">
                        +977
                      </span>
                      <input
                        id="booking-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel-national"
                        value={bookingPhone}
                        onChange={(event) => {
                          const nextPhone = getNepalPhoneInputValue(event.target.value);
                          setBookingPhone(nextPhone);
                          setError(null);
                          if (bookingPhoneTouched) {
                            setBookingPhoneError(normalizeNepalPhone(nextPhone).error);
                          }
                        }}
                        onBlur={() => {
                          setBookingPhoneTouched(true);
                          setBookingPhoneError(normalizeNepalPhone(bookingPhone).error);
                        }}
                        placeholder="98XXXXXXXX"
                        aria-invalid={Boolean(bookingPhoneError)}
                        aria-describedby="booking-phone-help"
                        required
                        className="min-w-0 flex-1 rounded-r-md px-3.5 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                      />
                    </div>
                    {bookingPhoneError ? (
                      <p id="booking-phone-help" role="alert" className="text-xs font-medium text-rose-500">
                        {bookingPhoneError}
                      </p>
                    ) : (
                      <p id="booking-phone-help" className="text-xs text-zinc-500">
                        Enter 10 digits starting with 98 or 97. This will update your profile contact number.
                      </p>
                    )}
                  </div>
                )}

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
                    <p className="font-semibold">Sign in required to request an appointment</p>
                    <p>
                      You will be prompted to quickly log in or create an account so your appointment can be linked and verified.
                    </p>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-zinc-100">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button
                    isLoading={submitting}
                    disabled={isAuthenticated && !bookingPhoneValidation.valid}
                    onClick={handleBookingSubmit}
                    className="gap-2 px-8"
                  >
                    {isAuthenticated ? 'Request Appointment' : 'Sign In & Request'}
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
