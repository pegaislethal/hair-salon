import { Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { AuthRequest } from '../types';
import { createError } from './errorHandler';

export const validate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }
  next();
};

export const validateObjectId = [
  param('id').isMongoId().withMessage('Invalid ID format'),
];
