import mongoose, { Document, Schema } from 'mongoose';

export interface ISalonSettings extends Document {
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
  holidays: Array<{ date: Date; reason: string }>;
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
  createdAt: Date;
  updatedAt: Date;
}

const daySchema = new Schema({ open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' }, isClosed: { type: Boolean, default: false } }, { _id: false });

const salonSettingsSchema = new Schema<ISalonSettings>({
  businessName: { type: String, default: 'Iris Hair Cut and Salon' },
  logo: String,
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  country: { type: String, default: 'Nepal' },
  contactPhone: { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  notificationEmail: { type: String, default: '' },
  website: String,
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
  },
  businessHours: {
    monday: { type: daySchema, default: {} },
    tuesday: { type: daySchema, default: {} },
    wednesday: { type: daySchema, default: {} },
    thursday: { type: daySchema, default: {} },
    friday: { type: daySchema, default: {} },
    saturday: { type: daySchema, default: {} },
    sunday: { type: daySchema, default: { isClosed: true } },
  },
  holidays: [{ date: Date, reason: String }],
  bookingSettings: {
    advanceBookingDays: { type: Number, default: 30 },
    minAdvanceHours: { type: Number, default: 2 },
    maxConcurrentAppointments: { type: Number, default: 3 },
    appointmentSlotInterval: { type: Number, default: 30 },
    allowStylistSelection: { type: Boolean, default: true },
    cancellationPolicy: { type: String, default: 'Cancellations must be made at least 2 hours in advance.' },
    requireConfirmation: { type: Boolean, default: true },
  },
  reminderSettings: {
    reminder24hEnabled: { type: Boolean, default: true },
    reminder2hEnabled: { type: Boolean, default: true },
    reminderEmail: { type: Boolean, default: true },
    reminderSMS: { type: Boolean, default: true },
  },
  smsSettings: {
    provider: { type: String, default: 'sparrowsms' },
    senderId: { type: String, default: 'IRIS' },
  },
}, { timestamps: true });

export default mongoose.model<ISalonSettings>('SalonSettings', salonSettingsSchema);
