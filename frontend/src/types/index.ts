export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'super_admin' | 'sub_admin' | 'customer';
  profileImage?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  phoneVerifiedAt?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  _id: string;
  name: string;
  description: string;
  image?: string;
  price: number;
  priceType?: 'fixed' | 'range' | 'starting';
  maxPrice?: number;
  priceUnit?: string;
  categoryDescription?: string;
  includedItems?: string[];
  duration: number; // in minutes
  bufferDuration: number;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffWorkingHours {
  start: string;
  end: string;
  isWorking: boolean;
}

export interface Staff {
  _id: string;
  user: User | string;
  bio?: string;
  specializations?: string[];
  profileImage?: string;
  services: (Service | string)[];
  workingHours: {
    monday: StaffWorkingHours;
    tuesday: StaffWorkingHours;
    wednesday: StaffWorkingHours;
    thursday: StaffWorkingHours;
    friday: StaffWorkingHours;
    saturday: StaffWorkingHours;
    sunday: StaffWorkingHours;
  };
  breaks?: Array<{ start: string; end: string; label: string }>;
  daysOff?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  _id: string;
  bookingReference: string;
  customer: User;
  service: Service;
  staff?: User;
  requestedBarberName?: 'Yujin (Intern)' | 'Rohit (Intern)' | 'Lycan';
  requestedAppointmentDate?: string;
  requestedStartTime?: string;
  suggestedAppointmentDate?: string;
  suggestedStartTime?: string;
  suggestedEndTime?: string;
  suggestionResponse?: 'accepted' | 'rejected';
  appointmentDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  priceSnapshot: number;
  customerNotes?: string;
  status: 'pending' | 'accepted' | 'confirmed' | 'reschedule_requested' | 'rejected' | 'cancelled' | 'completed' | 'no_show';
  rejectionReason?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  acceptedBy?: string;
  acceptedAt?: string;
  completedBy?: string;
  completedAt?: string;
  rescheduledFrom?: {
    date: string;
    startTime: string;
    endTime: string;
  };
  notifications?: {
    bookingRequestSent: boolean;
    confirmationSent: boolean;
    rejectionSent: boolean;
    cancellationSent: boolean;
    rescheduledSent: boolean;
    reminder24hSent: boolean;
    reminder2hSent: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GalleryItem {
  _id: string;
  title: string;
  image: string;
  category: string;
  description?: string;
  tags?: string[];
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SalonSettings {
  _id?: string;
  businessName: string;
  logo?: string;
  address: string;
  city: string;
  country: string;
  contactPhone: string;
  contactEmail: string;
  notificationEmail: string;
  website?: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  businessHours: {
    monday: { open: string; close: string; isClosed: boolean };
    tuesday: { open: string; close: string; isClosed: boolean };
    wednesday: { open: string; close: string; isClosed: boolean };
    thursday: { open: string; close: string; isClosed: boolean };
    friday: { open: string; close: string; isClosed: boolean };
    saturday: { open: string; close: string; isClosed: boolean };
    sunday: { open: string; close: string; isClosed: boolean };
  };
  holidays: Array<{ date: string; reason: string }>;
  bookingSettings: {
    advanceBookingDays: number;
    minAdvanceHours: number;
    maxConcurrentAppointments: number;
    appointmentSlotInterval: number;
    allowStylistSelection: boolean;
    cancellationPolicy: string;
    requireConfirmation: boolean;
  };
  reminderSettings: {
    reminder24hEnabled: boolean;
    reminder2hEnabled: boolean;
    reminderEmail: boolean;
    reminderSMS: boolean;
  };
  smsSettings: {
    provider: string;
    senderId: string;
  };
}

export interface PublicSalonInfo {
  businessName: string;
  address: string;
  city: string;
  country: string;
  contactPhone: string;
  contactEmail: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  businessHours: Partial<SalonSettings['businessHours']>;
}

export interface NotificationItem {
  _id: string;
  recipient: string;
  type: string;
  title: string;
  message: string;
  appointment?: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardReport {
  totalCustomers: number;
  totalAppointments: number;
  pendingAppointments: number;
  todayAppointments: number;
  monthlyRevenue: number;
  recentAppointments: Appointment[];
  statusBreakdown: Record<string, number>;
}
