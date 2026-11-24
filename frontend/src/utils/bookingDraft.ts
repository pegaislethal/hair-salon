export type BookingStep = 1 | 2 | 3;

export interface BookingDraft {
  serviceId: string;
  barberName: 'Lycan';
  appointmentDate: string;
  preferredTime: string;
  notes: string;
  step: BookingStep;
  savedAt: number;
}

type BookingDraftInput = Omit<BookingDraft, 'savedAt'>;

const STORAGE_KEY = 'iris_booking_draft';
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

const isBookingStep = (value: unknown): value is BookingStep =>
  value === 1 || value === 2 || value === 3;

export function saveBookingDraft(draft: BookingDraftInput): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
}

export function readBookingDraft(): BookingDraft | null {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  let value: unknown;
  try {
    value = JSON.parse(stored);
  } catch {
    clearBookingDraft();
    return null;
  }

  if (typeof value !== 'object' || value === null) {
    clearBookingDraft();
    return null;
  }

  const draft = value as Record<string, unknown>;
  const now = Date.now();
  const { serviceId, barberName, appointmentDate, preferredTime, notes, step, savedAt } = draft;
  const valid =
    typeof serviceId === 'string' &&
    serviceId.length > 0 &&
    barberName === 'Lycan' &&
    typeof appointmentDate === 'string' &&
    typeof preferredTime === 'string' &&
    typeof notes === 'string' &&
    isBookingStep(step) &&
    typeof savedAt === 'number' &&
    savedAt <= now &&
    now - savedAt <= MAX_AGE_MS;

  if (!valid) {
    clearBookingDraft();
    return null;
  }

  return { serviceId, barberName, appointmentDate, preferredTime, notes, step, savedAt };
}

export function clearBookingDraft(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
