import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';
import User from '../models/User';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }
    if (!token) {
      res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
      return;
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; role: string };
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Invalid token or account deactivated.' });
      return;
    }
    req.user = { id: user._id.toString(), role: user.role, email: user.email };
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
      return;
    }
    next();
  };
};

export const isSuperAdmin = authorize('super_admin');
export const isAdminOrSubAdmin = authorize('super_admin', 'sub_admin');
export const isAuthenticated = authenticate;
