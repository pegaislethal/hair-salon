import mongoose, { Document, Schema } from 'mongoose';

export interface IJobVacancy extends Document {
  title: string;
  description: string;
  requirements: string[];
  experience: string;
  applicationDeadline?: Date;
  isActive: boolean;
}

const jobVacancySchema = new Schema<IJobVacancy>({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, maxlength: 5000 },
  requirements: [{ type: String, trim: true }],
  experience: { type: String, required: true, maxlength: 300 },
  applicationDeadline: Date,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

jobVacancySchema.index({ isActive: 1, applicationDeadline: 1 });

export default mongoose.model<IJobVacancy>('JobVacancy', jobVacancySchema);
