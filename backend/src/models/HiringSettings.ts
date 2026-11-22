import mongoose, { Document, Schema } from 'mongoose';

export interface IHiringSettings extends Document {
  isHiring: boolean;
}

const hiringSettingsSchema = new Schema<IHiringSettings>({
  isHiring: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<IHiringSettings>('HiringSettings', hiringSettingsSchema);
