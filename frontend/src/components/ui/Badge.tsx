import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  const variants = {
    default: 'bg-dark-700 text-dark-300',
    success: 'bg-primary-900/50 text-primary-400',
    warning: 'bg-amber-900/50 text-amber-400 border border-amber-700/50',
    danger: 'bg-red-900/50 text-red-400 border border-red-700/50',
    info: 'bg-blue-900/50 text-blue-400 border border-blue-700/50',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

