import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

// Simple async wrapper to catch unhandled async errors
export const asyncHandler = (fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
