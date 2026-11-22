import mongoose, { Document, Schema } from 'mongoose';

export interface IBookingLock extends Document {
  staff: mongoose.Types.ObjectId;
  appointmentDate: Date;
  minute: number;
  reservationId: string;
}

const bookingLockSchema = new Schema<IBookingLock>({
  staff: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentDate: { type: Date, required: true },
  minute: { type: Number, required: true },
  reservationId: { type: String, required: true },
});

bookingLockSchema.index({ staff: 1, appointmentDate: 1, minute: 1 }, { unique: true });

export default mongoose.model<IBookingLock>('BookingLock', bookingLockSchema);
