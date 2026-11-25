import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  profileImage?: string;
  role: 'super_admin' | 'sub_admin' | 'customer';
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;
  emailVerificationOTP?: string;
  emailVerificationOTPExpiry?: Date;
  verificationEmailSentAt?: Date;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  passwordResetOTP?: string;
  passwordResetOTPExpiry?: Date;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  fullName: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  profileImage: { type: String },
  role: { type: String, enum: ['super_admin', 'sub_admin', 'customer'], default: 'customer' },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpiry: { type: Date },
  emailVerificationOTP: { type: String },
  emailVerificationOTPExpiry: { type: Date },
  verificationEmailSentAt: { type: Date },
  passwordResetToken: { type: String },
  passwordResetExpiry: { type: Date },
  passwordResetOTP: { type: String },
  passwordResetOTPExpiry: { type: Date },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
}, { timestamps: true });

userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'));
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.emailVerificationToken;
    delete ret.emailVerificationExpiry;
    delete ret.verificationEmailSentAt;
    delete ret.emailVerificationOTP;
    delete ret.emailVerificationOTPExpiry;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpiry;
    delete ret.passwordResetOTP;
    delete ret.passwordResetOTPExpiry;
    return ret;
  },
});

export default mongoose.model<IUser>('User', userSchema);
