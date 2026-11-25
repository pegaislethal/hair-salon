import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { createHmac, timingSafeEqual } from 'crypto';
import User, { type IUser } from '../models/User';
import { generateAccessToken, generateRefreshToken, generateSecureToken, generateOTP } from '../utils/generateToken';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';
import { sendEmail, type SendEmailResult } from '../config/email';
import { sendSMS } from '../config/sms';
import { normalizeNepalPhone } from '../utils/nepalPhone';
import jwt from 'jsonwebtoken';
import { verificationTemplate, verificationTextTemplate, passwordResetTemplate } from '../utils/emailTemplates';

const router = Router();
const verificationResendCooldownMs = 60 * 1000;
const phoneVerificationCooldownMs = 60 * 1000;
const phoneVerificationExpiryMs = 10 * 60 * 1000;
const resendVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many verification requests. Please try again later.' },
});
const phoneVerificationRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many phone verification requests. Please try again later.' },
});
const phoneVerificationAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many verification attempts. Please try again later.' },
});
const resendVerificationMessage = 'If an active account with that email needs verification, it can receive a new email if the resend cooldown has passed. Check your inbox and spam folder.';

const hashPhoneVerificationOTP = (otp: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET must be configured for phone verification.');
  return createHmac('sha256', secret).update(otp).digest('hex');
};

const getFrontendBaseUrl = (): string | null => {
  const configuredUrl = process.env.FRONTEND_URL?.trim();
  if (!configuredUrl) return null;
  try {
    const parsedUrl = new URL(configuredUrl);
    const isLocalhost = ['localhost', '127.0.0.1'].includes(parsedUrl.hostname);
    if (parsedUrl.protocol !== 'https:' && !isLocalhost) return null;
    return parsedUrl.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
};

const sendVerificationEmail = async (user: IUser): Promise<SendEmailResult> => {
  const frontendBaseUrl = getFrontendBaseUrl();
  if (!frontendBaseUrl) {
    const error = 'FRONTEND_URL must be configured with the frontend origin and use HTTPS outside localhost.';
    console.error('[AUTH] Verification email not attempted', { error });
    return { success: false, error };
  }

  const token = generateSecureToken();
  const otp = generateOTP();
  user.emailVerificationToken = token;
  user.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  user.emailVerificationOTP = otp;
  user.emailVerificationOTPExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  user.verificationEmailSentAt = new Date();
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${frontendBaseUrl}/verify-email?token=${token}`;
  return sendEmail({
    to: user.email,
    subject: 'Verify Your Email — Iris Salon',
    html: verificationTemplate(user.fullName, verifyUrl, otp),
    text: verificationTextTemplate(user.fullName, verifyUrl, otp),
    deduplicationKey: `auth:${user._id.toString()}:email_verification:${token}`,
    type: 'email_verification',
  });
};

const createSession = (userId: string, role: string, res: Response) => {
  const accessToken = generateAccessToken(userId, role);
  const refreshToken = generateRefreshToken(userId);
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return { accessToken, refreshToken };
};

// @route   POST /api/auth/register
router.post('/register', [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').isString().withMessage('Phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }
  const phoneValidation = normalizeNepalPhone(req.body.phone);
  if (!phoneValidation.valid) {
    res.status(400).json({ success: false, message: phoneValidation.error });
    return;
  }
  try {
    const { fullName, email, password } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ success: false, message: 'Email already registered.' });
      return;
    }
    const user = await User.create({
      fullName,
      email,
      phone: phoneValidation.normalized,
      password,
    });
    const emailResult = await sendVerificationEmail(user);
    res.status(201).json({
      success: true,
      emailSent: emailResult.success,
      message: emailResult.success
        ? 'Registration successful. Please check your email to verify your account.'
        : 'Your account was created, but we could not send the verification email. Use the resend option to try again.',
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ success: false, message: 'Email already registered.' });
      return;
    }
    console.error('[AUTH] Registration failed', { code: (error as { code?: number }).code });
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

router.post('/resend-verification', resendVerificationLimiter, [
  body('email').trim().isEmail().withMessage('Valid email is required'),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }

  try {
    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email, role: 'customer', isActive: true, isEmailVerified: false });
    if (user) {
      const now = new Date();
      const eligibleUser = await User.findOneAndUpdate(
        {
          _id: user._id,
          role: 'customer',
          isActive: true,
          isEmailVerified: false,
          $or: [
            { verificationEmailSentAt: { $exists: false } },
            { verificationEmailSentAt: { $lte: new Date(now.getTime() - verificationResendCooldownMs) } },
          ],
        },
        { $set: { verificationEmailSentAt: now } },
        { new: true }
      );
      if (eligibleUser) await sendVerificationEmail(eligibleUser);
    }

    res.json({ success: true, message: resendVerificationMessage });
  } catch (error) {
    console.error('[AUTH] Verification email resend failed', { code: (error as { code?: number }).code });
    res.status(500).json({ success: false, message: 'We could not process your request. Please try again later.' });
  }
});

// @route   POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }
    if (user.role === 'customer' && !user.isEmailVerified) {
      res.status(403).json({ success: false, message: 'Please verify your email before logging in.' });
      return;
    }
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    const tokens = createSession(user._id.toString(), user.role, res);
    res.json({ success: true, data: { user, ...tokens } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// @route   POST /api/auth/logout
router.post('/logout', authenticate, (req: AuthRequest, res: Response): void => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// @route   GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PUT /api/auth/profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const phoneProvided = req.body && Object.prototype.hasOwnProperty.call(req.body, 'phone');
  const phoneValidation =
    phoneProvided && req.user!.role === 'customer' ? normalizeNepalPhone(req.body.phone) : null;
  if (phoneValidation && !phoneValidation.valid) {
    res.status(400).json({ success: false, message: phoneValidation.error });
    return;
  }

  try {
    const { fullName, phone, profileImage } = req.body;
    const user = await User.findById(req.user!.id).select(
      '+phoneVerificationOTPHash +phoneVerificationOTPExpiry +phoneVerificationOTPAttempts +phoneVerificationSentAt'
    );
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }
    if (fullName) user.fullName = fullName.trim();
    if (phoneValidation?.valid) {
      const currentPhone = normalizeNepalPhone(user.phone);
      const phoneChanged = !currentPhone.valid || currentPhone.normalized !== phoneValidation.normalized;
      user.phone = phoneValidation.normalized;
      if (phoneChanged) {
        user.isPhoneVerified = false;
        user.phoneVerifiedAt = undefined;
        user.phoneVerificationOTPHash = undefined;
        user.phoneVerificationOTPExpiry = undefined;
        user.phoneVerificationOTPAttempts = 0;
      }
    } else if (phoneProvided && typeof phone === 'string') {
      user.phone = phone.trim();
    }
    if (profileImage !== undefined) user.profileImage = profileImage;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Profile updated successfully.', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
});

router.post(
  '/phone/request-verification',
  authenticate,
  phoneVerificationRequestLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user!.role !== 'customer') {
      res.status(403).json({ success: false, message: 'Only customers can verify a phone number.' });
      return;
    }

    try {
      const user = await User.findById(req.user!.id);
      if (!user || !user.isActive) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }
      if (user.isPhoneVerified) {
        res.json({ success: true, message: 'This phone number is already verified.' });
        return;
      }

      const phoneValidation = normalizeNepalPhone(user.phone);
      if (!phoneValidation.valid) {
        res.status(400).json({ success: false, message: 'Update your profile with a valid Nepal mobile number first.' });
        return;
      }

      const now = new Date();
      const otp = generateOTP();
      const otpHash = hashPhoneVerificationOTP(otp);
      const eligibleUser = await User.findOneAndUpdate(
        {
          _id: user._id,
          phone: user.phone,
          role: 'customer',
          isActive: true,
          isPhoneVerified: { $ne: true },
          $or: [
            { phoneVerificationSentAt: { $exists: false } },
            { phoneVerificationSentAt: { $lte: new Date(now.getTime() - phoneVerificationCooldownMs) } },
          ],
        },
        {
          $set: {
            phone: phoneValidation.normalized,
            phoneVerificationOTPHash: otpHash,
            phoneVerificationOTPExpiry: new Date(now.getTime() + phoneVerificationExpiryMs),
            phoneVerificationOTPAttempts: 0,
            phoneVerificationSentAt: now,
          },
        },
        { new: true }
      );
      if (!eligibleUser) {
        const latestUser = await User.findById(user._id).select('isPhoneVerified phone');
        if (latestUser?.isPhoneVerified) {
          res.json({ success: true, message: 'This phone number is already verified.' });
          return;
        }
        if (latestUser && latestUser.phone !== user.phone) {
          res.status(409).json({ success: false, message: 'Your phone number changed. Refresh your profile and try again.' });
          return;
        }
        res.status(429).json({ success: false, message: 'Please wait before requesting another verification code.' });
        return;
      }

      const smsSent = await sendSMS(
        phoneValidation.normalized,
        `Your Iris Salon phone verification code is ${otp}. It expires in 10 minutes.`
      );
      if (!smsSent) {
        await User.updateOne(
          { _id: user._id, phoneVerificationOTPHash: otpHash },
          {
            $unset: { phoneVerificationOTPHash: 1, phoneVerificationOTPExpiry: 1 },
            $set: { phoneVerificationOTPAttempts: 0 },
          }
        );
        res.status(503).json({
          success: false,
          message: 'We could not send the verification SMS. Please try again later.',
        });
        return;
      }

      res.json({ success: true, message: 'A verification code was sent to your phone.' });
    } catch (error) {
      console.error('[AUTH] Phone verification SMS request failed', {
        code: (error as { code?: string }).code,
      });
      res.status(500).json({ success: false, message: 'Could not process phone verification. Please try again later.' });
    }
  }
);

router.post(
  '/phone/verify',
  authenticate,
  phoneVerificationAttemptLimiter,
  [body('otp').isString().matches(/^\d{6}$/).withMessage('Enter the six-digit verification code.')],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: 'Enter the six-digit verification code.' });
      return;
    }
    if (req.user!.role !== 'customer') {
      res.status(403).json({ success: false, message: 'Only customers can verify a phone number.' });
      return;
    }

    try {
      const user = await User.findById(req.user!.id).select(
        '+phoneVerificationOTPHash +phoneVerificationOTPExpiry +phoneVerificationOTPAttempts'
      );
      if (!user || !user.isActive) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }
      if (user.isPhoneVerified) {
        res.json({ success: true, message: 'This phone number is already verified.', data: user });
        return;
      }
      if (user.phoneVerificationOTPAttempts >= 5) {
        res.status(429).json({ success: false, message: 'Too many incorrect codes. Request a new code later.' });
        return;
      }

      const storedHash = user.phoneVerificationOTPHash;
      const expiry = user.phoneVerificationOTPExpiry;
      if (!storedHash || !expiry || expiry <= new Date()) {
        res.status(400).json({ success: false, message: 'The verification code is invalid or expired.' });
        return;
      }

      const expectedHash = Buffer.from(hashPhoneVerificationOTP(req.body.otp), 'hex');
      const actualHash = Buffer.from(storedHash, 'hex');
      if (expectedHash.length !== actualHash.length || !timingSafeEqual(expectedHash, actualHash)) {
        await User.updateOne(
          {
            _id: user._id,
            phoneVerificationOTPHash: storedHash,
            phoneVerificationOTPExpiry: { $gt: new Date() },
            phoneVerificationOTPAttempts: { $lt: 5 },
          },
          { $inc: { phoneVerificationOTPAttempts: 1 } }
        );
        res.status(400).json({ success: false, message: 'The verification code is invalid or expired.' });
        return;
      }

      const now = new Date();
      const verifiedUser = await User.findOneAndUpdate(
        {
          _id: user._id,
          isActive: true,
          isPhoneVerified: { $ne: true },
          phoneVerificationOTPAttempts: { $lt: 5 },
          phoneVerificationOTPHash: storedHash,
          phoneVerificationOTPExpiry: { $gt: now },
        },
        {
          $set: { isPhoneVerified: true, phoneVerifiedAt: now },
          $unset: {
            phoneVerificationOTPHash: 1,
            phoneVerificationOTPExpiry: 1,
            phoneVerificationOTPAttempts: 1,
            phoneVerificationSentAt: 1,
          },
        },
        { new: true }
      );
      if (!verifiedUser) {
        res.status(400).json({ success: false, message: 'The verification code is invalid or expired.' });
        return;
      }
      res.json({ success: true, message: 'Phone number verified successfully.', data: verifiedUser });
    } catch (error) {
      console.error('[AUTH] Phone verification failed', {
        code: (error as { code?: string }).code,
      });
      res.status(500).json({ success: false, message: 'Could not verify this phone number. Please try again later.' });
    }
  }
);

// @route   PUT /api/auth/change-password
router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user!.id).select('+password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      return;
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error changing password.' });
  }
});

// @route   POST /api/auth/verify-email
router.post('/verify-email', [
  body('token').optional().isString().isLength({ min: 64, max: 64 }).isHexadecimal(),
  body('email').optional().isString().trim().isEmail(),
  body('otp').optional().isString().matches(/^\d{6}$/),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: 'Enter a valid verification link or email and six-digit code.' });
    return;
  }

  try {
    const { token, otp, email } = req.body ?? {};
    if (!token && !(email && otp)) {
      res.status(400).json({ success: false, message: 'A verification token or email and code are required.' });
      return;
    }

    let user;
    if (token) {
      user = await User.findOne({ emailVerificationToken: token, emailVerificationExpiry: { $gt: new Date() } });
    } else if (email && otp) {
      user = await User.findOne({
        email: email.trim().toLowerCase(),
        emailVerificationOTP: otp,
        emailVerificationOTPExpiry: { $gt: new Date() },
      });
    }
    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid or expired verification token.' });
      return;
    }
    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'This account is inactive.' });
      return;
    }
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpiry = undefined;
    user.verificationEmailSentAt = undefined;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    const tokens = createSession(user._id.toString(), user.role, res);
    res.json({ success: true, message: 'Email verified successfully.', data: { user, ...tokens } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', [body('email').isEmail()], async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user) {
      res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
      return;
    }
    const resetToken = generateSecureToken();
    const resetOTP = generateOTP();
    user.passwordResetToken = resetToken;
    user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000);
    user.passwordResetOTP = resetOTP;
    user.passwordResetOTPExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });
    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const resetUrl = `${frontendBase}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Password Reset — Iris Salon',
      html: passwordResetTemplate(resetUrl, user.fullName, resetOTP),
      deduplicationKey: `auth:${user._id.toString()}:password_reset:${resetToken}`,
      type: 'password_reset',
    });
    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   POST /api/auth/reset-password
router.post('/reset-password', [
  body('token').optional(),
  body('otp').optional(),
  body('email').optional().isEmail(),
  body('password').isLength({ min: 6 }),
], async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, otp, email, password } = req.body;
    let user;
    if (token) {
      user = await User.findOne({ passwordResetToken: token, passwordResetExpiry: { $gt: new Date() } });
    } else if (email && otp) {
      user = await User.findOne({
        email: email.toLowerCase(),
        passwordResetOTP: otp,
        passwordResetOTPExpiry: { $gt: new Date() },
      });
    }
    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
      return;
    }
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpiry = undefined;
    await user.save();
    res.json({ success: true, message: 'Password reset successful.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (!token) { res.status(401).json({ success: false, message: 'No refresh token.' }); return; }
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as { id: string };
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive || (user.role === 'customer' && !user.isEmailVerified)) {
      res.status(401).json({ success: false, message: 'Invalid token.' });
      return;
    }
    const newAccessToken = generateAccessToken(user._id.toString(), user.role);
    res.cookie('accessToken', newAccessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true, data: { accessToken: newAccessToken } });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
});

export default router;
