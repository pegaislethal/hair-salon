import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
  bookingReference: string;
  customer: mongoose.Types.ObjectId;
  service: mongoose.Types.ObjectId;
  staff?: mongoose.Types.ObjectId;
  requestedBarberName?: string;
  requestedAppointmentDate?: Date;
  requestedStartTime?: string;
  suggestedAppointmentDate?: Date;
  suggestedStartTime?: string;
  suggestedEndTime?: string;
  suggestionResponse?: 'accepted' | 'rejected';
  suggestedBy?: mongoose.Types.ObjectId;
  suggestedAt?: Date;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  duration: number;
  priceSnapshot: number;
  reservationId?: string;
  customerNotes?: string;
  status: 'pending' | 'accepted' | 'confirmed' | 'reschedule_requested' | 'rejected' | 'cancelled' | 'completed' | 'no_show';
  rejectionReason?: string;
  cancellationReason?: string;
  cancelledBy?: mongoose.Types.ObjectId;
  acceptedBy?: mongoose.Types.ObjectId;
  acceptedAt?: Date;
  completedBy?: mongoose.Types.ObjectId;
  completedAt?: Date;
  rescheduledFrom?: {
    date: Date;
    startTime: string;
    endTime: string;
  };
  notifications: {
    bookingRequestSent: boolean;
    confirmationSent: boolean;
    rejectionSent: boolean;
    cancellationSent: boolean;
    rescheduledSent: boolean;
    reminder24hSent: boolean;
    reminder2hSent: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>({
  bookingReference: { type: String, unique: true, required: true },
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
  staff: { type: Schema.Types.ObjectId, ref: 'User' },
  requestedBarberName: { type: String, enum: ['Yujin (Intern)', 'Rohit (Intern)', 'Lycan'] },
  requestedAppointmentDate: { type: Date },
  requestedStartTime: { type: String },
  suggestedAppointmentDate: { type: Date },
  suggestedStartTime: { type: String },
  suggestedEndTime: { type: String },
  suggestionResponse: { type: String, enum: ['accepted', 'rejected'] },
  suggestedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  suggestedAt: { type: Date },
  appointmentDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  duration: { type: Number, required: true },
  priceSnapshot: { type: Number, required: true },
  reservationId: { type: String },
  customerNotes: { type: String, maxlength: 500 },
  status: { type: String, enum: ['pending', 'accepted', 'confirmed', 'reschedule_requested', 'rejected', 'cancelled', 'completed', 'no_show'], default: 'pending' },
  rejectionReason: { type: String },
  cancellationReason: { type: String },
  cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
  acceptedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  acceptedAt: { type: Date },
  completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  completedAt: { type: Date },
  rescheduledFrom: {
    date: Date,
    startTime: String,
    endTime: String,
  },
  notifications: {
    bookingRequestSent: { type: Boolean, default: false },
    confirmationSent: { type: Boolean, default: false },
    rejectionSent: { type: Boolean, default: false },
    cancellationSent: { type: Boolean, default: false },
    rescheduledSent: { type: Boolean, default: false },
    reminder24hSent: { type: Boolean, default: false },
    reminder2hSent: { type: Boolean, default: false },
  },
}, { timestamps: true });

appointmentSchema.index({ customer: 1, appointmentDate: -1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ appointmentDate: 1, startTime: 1 });
appointmentSchema.index({ staff: 1, appointmentDate: 1 });

export default mongoose.model<IAppointment>('Appointment', appointmentSchema);
