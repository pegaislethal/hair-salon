export type NepalPhoneValidation =
  | { valid: true; normalized: string; localNumber: string; error: null }
  | { valid: false; normalized: null; localNumber: string; error: string };

export function getNepalPhoneInputValue(value: string): string;
export function normalizeNepalPhone(value: unknown): NepalPhoneValidation;
