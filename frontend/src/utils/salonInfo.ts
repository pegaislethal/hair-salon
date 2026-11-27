import type { PublicSalonInfo } from '../types';

export const salonBusinessDays: Array<keyof PublicSalonInfo['businessHours']> = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

export const formatSalonTime = (value: string): string => {
  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return value;
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' })
    .format(new Date(2000, 0, 1, hours, minutes));
};

export const getSalonAddress = (salonInfo: PublicSalonInfo | null): string =>
  Array.from(new Map(
    [salonInfo?.address, salonInfo?.city, salonInfo?.country]
      .filter((part): part is string => Boolean(part?.trim()))
      .map((part) => [part.trim().toLowerCase(), part.trim()])
  ).values())
    .join(', ');
