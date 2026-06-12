import { clsx } from 'clsx';
import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';

interface AddButtonProps {
  onClick: () => void;
  children: ReactNode;
  icon?: ReactNode;
  variant?: 'default' | 'dashed' | 'ghost';
  fullWidth?: boolean;
  className?: string;
}

export function AddButton({ 
  onClick, 
  children, 
  icon,
  variant = 'default',
  fullWidth = false,
  className 
}: AddButtonProps) {
  const variants = {
    default: clsx(
      'bg-dark-800 border-dark-600 hover:border-dark-500 hover:bg-dark-700',
      'text-dark-300 hover:text-dark-100'
    ),
    dashed: clsx(
      'border-dashed border-dark-600 hover:border-primary-500/50',
      'text-dark-400 hover:text-primary-400 hover:bg-primary-500/5'
    ),
    ghost: clsx(
      'border-transparent hover:bg-dark-800',
      'text-dark-400 hover:text-dark-200'
    ),
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border',
        'text-sm font-medium transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        variants[variant],
        fullWidth && 'w-full',
        className
      )}
    >
      {icon || <Plus className="w-4 h-4" />}
      {children}
    </button>
  );
}
