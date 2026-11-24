import mongoose, { Document, Schema } from 'mongoose';

export interface IBookingLock extends Document {
  staff?: mongoose.Types.ObjectId;
  barberName?: string;
  appointmentDate: Date;
  minute: number;
  reservationId: string;
}

const bookingLockSchema = new Schema<IBookingLock>({
  staff: { type: Schema.Types.ObjectId, ref: 'User' },
  barberName: { type: String },
  appointmentDate: { type: Date, required: true },
  minute: { type: Number, required: true },
  reservationId: { type: String, required: true },
});

bookingLockSchema.index({ staff: 1, appointmentDate: 1, minute: 1 }, { unique: true });
bookingLockSchema.index(
  { barberName: 1, appointmentDate: 1, minute: 1 },
  { unique: true, partialFilterExpression: { barberName: { $type: 'string' } } }
);

export default mongoose.model<IBookingLock>('BookingLock', bookingLockSchema);
