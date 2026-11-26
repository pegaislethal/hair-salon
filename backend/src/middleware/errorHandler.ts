import { Request, Response, NextFunction } from 'express';
import { logSafeError } from '../utils/logSafeError';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction): void => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production'
    || process.env.VERCEL === '1'
    || process.env.VERCEL_ENV === 'production';
  const message = isProduction && statusCode >= 500
    ? 'Internal server error.'
    : err.message || 'Internal Server Error';
  if (statusCode >= 500) {
    logSafeError(`ERROR Request failed with status ${statusCode}`, err);
  } else if (!isProduction) {
    console.error('[ERROR]', err);
  }
  res.status(statusCode).json({
    success: false,
    message,
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error: AppError = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const createError = (message: string, statusCode: number): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
