import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction): void => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction && statusCode >= 500
    ? 'Internal server error.'
    : err.message || 'Internal Server Error';
  if (isProduction && statusCode >= 500) {
    const internalMessage = (err.message || 'Unknown error.')
      .replace(/mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi, '[redacted MongoDB URI]')
      .replace(/\b(password|secret|token)(\s*[:=]\s*)[^\s,;]+/gi, '$1$2[redacted]');
    console.error('[ERROR] Request failed.', {
      statusCode,
      name: err.name,
      message: internalMessage,
    });
  } else if (!isProduction) {
    console.error('[ERROR]', err);
  }
  res.status(statusCode).json({
    success: false,
    message,
    ...(!isProduction && { stack: err.stack }),
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
