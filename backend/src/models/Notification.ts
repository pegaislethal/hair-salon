import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  appointment?: mongoose.Types.ObjectId;
  isRead: boolean;
  emailSent: boolean;
  smsSent: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  appointment: { type: Schema.Types.ObjectId, ref: 'Appointment' },
  isRead: { type: Boolean, default: false },
  emailSent: { type: Boolean, default: false },
  smsSent: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

export default mongoose.model<INotification>('Notification', notificationSchema);
