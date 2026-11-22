import mongoose, { Document, Schema } from 'mongoose';

export interface IJobApplication extends Document {
  vacancy: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  experience: string;
  skills: string[];
  cvUrl: string;
  status: 'pending' | 'accepted' | 'rejected';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
}

const jobApplicationSchema = new Schema<IJobApplication>({
  vacancy: { type: Schema.Types.ObjectId, ref: 'JobVacancy', required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  experience: { type: String, required: true, maxlength: 2000 },
  skills: [{ type: String, trim: true }],
  cvUrl: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
}, { timestamps: true });

jobApplicationSchema.index({ vacancy: 1, status: 1 });

export default mongoose.model<IJobApplication>('JobApplication', jobApplicationSchema);
