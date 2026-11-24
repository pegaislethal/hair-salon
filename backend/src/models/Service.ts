import mongoose, { Document, Schema } from 'mongoose';

export interface IService extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  image?: string;
  price: number;
  duration: number;
  bufferDuration: number;
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 1000 },
  image: { type: String },
  price: { type: Number, required: true, min: 0 },
  duration: { type: Number, required: true, min: 5, comment: 'Duration in minutes' },
  bufferDuration: { type: Number, default: 15, min: 0, comment: 'Buffer time in minutes between appointments' },
  category: { type: String, default: 'General' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

serviceSchema.index({ name: 1 });
serviceSchema.index({ isActive: 1 });

export default mongoose.model<IService>('Service', serviceSchema);
