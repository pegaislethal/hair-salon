import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  variant?: 'pending' | 'accepted' | 'confirmed' | 'reschedule_requested' | 'completed' | 'cancelled' | 'rejected' | 'default' | 'gold' | 'no_show' | string;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className }) => {
  const variants: Record<string, string> = {
    default: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    accepted: 'bg-blue-50 text-blue-700 border-blue-200',
    confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
    reschedule_requested: 'bg-violet-50 text-violet-700 border-violet-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-zinc-100 text-zinc-500 border-zinc-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    no_show: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    gold: 'bg-champagne-100 text-champagne-900 border-champagne-300',
  };

  const styleClass = variants[variant] || variants.default;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider',
        styleClass,
        className
      )}
    >
      {children}
    </span>
  );
};
