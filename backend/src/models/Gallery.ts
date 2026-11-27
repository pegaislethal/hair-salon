import mongoose, { Document, Schema } from 'mongoose';

export interface IGallery extends Document {
  title: string;
  description?: string;
  image: string;
  category: string;
  tags: string[];
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const gallerySchema = new Schema<IGallery>({
  title: { type: String, required: true },
  description: String,
  image: { type: String, required: true },
  category: { type: String, default: 'General' },
  tags: { type: [String], default: [] },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

gallerySchema.index({ isActive: 1, order: 1, createdAt: -1 });

export default mongoose.model<IGallery>('Gallery', gallerySchema);
