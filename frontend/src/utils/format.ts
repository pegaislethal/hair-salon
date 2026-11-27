export function formatPrice(amount?: number): string {
  if (amount === undefined || amount === null) return 'Rs. 0';
  return `Rs. ${amount.toLocaleString()}`;
}

export interface ServicePriceFormatOptions {
  price: number;
  priceType?: 'fixed' | 'range' | 'starting';
  maxPrice?: number;
  priceUnit?: string;
}

export function formatServicePrice(service?: ServicePriceFormatOptions | null): string {
  if (!service) return 'Rs. 0';
  const { price, priceType = 'fixed', maxPrice, priceUnit } = service;

  if (priceType === 'range' && maxPrice && maxPrice > price) {
    return `Rs. ${price.toLocaleString()} - ${maxPrice.toLocaleString()}`;
  }
  if (priceType === 'starting') {
    return `Starting from Rs. ${price.toLocaleString()}`;
  }
  if (priceUnit) {
    return `Rs. ${price.toLocaleString()} ${priceUnit}`;
  }
  return `Rs. ${price.toLocaleString()}`;
}

export function formatDate(dateStr?: string | Date): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr?: string | Date): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime12(time24: string): string {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hours12 = h % 12 || 12;
  return `${hours12}:${String(m).padStart(2, '0')} ${period}`;
}
