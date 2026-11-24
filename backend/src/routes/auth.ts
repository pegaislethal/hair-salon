import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import { generateAccessToken, generateRefreshToken, generateSecureToken, generateOTP } from '../utils/generateToken';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';
import { sendEmail } from '../config/email';
import jwt from 'jsonwebtoken';
import { verificationTemplate, passwordResetTemplate } from '../utils/emailTemplates';

const router = Router();

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
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }
  try {
    const { fullName, email, phone, password } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400).json({ success: false, message: 'Email already registered.' });
      return;
    }
    const verificationToken = generateSecureToken();
    const verificationOTP = generateOTP();
    const user = await User.create({
      fullName, email, phone, password,
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      emailVerificationOTP: verificationOTP,
      emailVerificationOTPExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const verifyUrl = `${frontendBase}/verify-email?token=${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email — Iris Salon',
      html: verificationTemplate(user.fullName, verifyUrl, verificationOTP),
      deduplicationKey: `auth:${user._id.toString()}:email_verification`,
      type: 'email_verification',
    });
    res.status(201).json({ success: true, message: 'Registration successful. Please verify your email.' });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      res.status(400).json({ success: false, message: 'Email already registered.' });
      return;
    }
    res.status(500).json({ success: false, message: 'Server error during registration.' });
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
  try {
    const { fullName, phone, profileImage } = req.body;
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }
    if (fullName) user.fullName = fullName.trim();
    if (phone) user.phone = phone.trim();
    if (profileImage !== undefined) user.profileImage = profileImage;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Profile updated successfully.', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
});

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
router.post('/verify-email', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, otp, email } = req.body;
    let user;
    if (token) {
      user = await User.findOne({ emailVerificationToken: token, emailVerificationExpiry: { $gt: new Date() } });
    } else if (email && otp) {
      user = await User.findOne({
        email: email.toLowerCase(),
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
