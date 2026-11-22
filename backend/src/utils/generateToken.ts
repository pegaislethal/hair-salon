import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const generateAccessToken = (userId: string, role: string): string => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET as string, { expiresIn: (process.env.JWT_EXPIRE || '7d') as jwt.SignOptions['expiresIn'] });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: (process.env.JWT_REFRESH_EXPIRE || '30d') as jwt.SignOptions['expiresIn'] });
};

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateBookingReference = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'IRIS-';
  for (let i = 0; i < 8; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
};

export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};
