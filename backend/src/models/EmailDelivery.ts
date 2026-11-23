import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailDelivery extends Document {
  deduplicationKey?: string;
  recipient: string;
  subject: string;
  type: string;
  status: 'pending' | 'sent' | 'failed';
  providerMessageId?: string;
  error?: string;
  attempts: number;
  lastAttemptAt?: Date;
  html?: string;
  text?: string;
  createdAt: Date;
  updatedAt: Date;
}

const emailDeliverySchema = new Schema<IEmailDelivery>({
  deduplicationKey: { type: String },
  recipient: { type: String, required: true },
  subject: { type: String, required: true },
  type: { type: String, default: 'general' },
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  providerMessageId: String,
  error: String,
  attempts: { type: Number, default: 0 },
  lastAttemptAt: Date,
  html: String,
  text: String,
}, { timestamps: true });

emailDeliverySchema.index({ deduplicationKey: 1 }, { unique: true, sparse: true });
emailDeliverySchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IEmailDelivery>('EmailDelivery', emailDeliverySchema);
