import { toast } from 'sonner';

const bookingAuthToastId = 'booking-auth-required';

export const showBookingLoginToast = () => {
  toast.info('Please log in or sign up first to book an appointment.', { id: bookingAuthToastId });
};

export const getBookingLoginUrl = (returnPath: string) =>
  `/login?reason=auth_required&redirect=${encodeURIComponent(returnPath)}`;
