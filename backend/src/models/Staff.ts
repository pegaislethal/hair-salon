import mongoose, { Document, Schema } from 'mongoose';

interface WorkingHours {
  start: string;
  end: string;
  isWorking: boolean;
}

export interface IStaff extends Document {
  user: mongoose.Types.ObjectId;
  bio: string;
  specializations: string[];
  profileImage?: string;
  services: mongoose.Types.ObjectId[];
  workingHours: {
    monday: WorkingHours;
    tuesday: WorkingHours;
    wednesday: WorkingHours;
    thursday: WorkingHours;
    friday: WorkingHours;
    saturday: WorkingHours;
    sunday: WorkingHours;
  };
  breaks: Array<{ start: string; end: string; label: string }>;
  daysOff: Date[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const workingHoursSchema = new Schema({
  start: { type: String, default: '09:00' },
  end: { type: String, default: '18:00' },
  isWorking: { type: Boolean, default: true },
}, { _id: false });

const staffSchema = new Schema<IStaff>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bio: { type: String, maxlength: 500 },
  specializations: { type: [{ type: String, trim: true }], default: [] },
  profileImage: { type: String },
  services: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
  workingHours: {
    monday: workingHoursSchema,
    tuesday: workingHoursSchema,
    wednesday: workingHoursSchema,
    thursday: workingHoursSchema,
    friday: workingHoursSchema,
    saturday: workingHoursSchema,
    sunday: workingHoursSchema,
  },
  breaks: [{ start: String, end: String, label: String }],
  daysOff: [{ type: Date }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

staffSchema.index({ services: 1 });

export default mongoose.model<IStaff>('Staff', staffSchema);
