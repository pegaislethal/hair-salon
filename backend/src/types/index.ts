import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'super_admin' | 'sub_admin' | 'customer';
    email: string;
  };
}

export type UserRole = 'super_admin' | 'sub_admin' | 'customer';
export type AppointmentStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed' | 'no_show';
