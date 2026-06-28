import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = clsx(
    'inline-flex items-center justify-center font-medium rounded-lg',
    'transition-colors duration-150',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'
  );
  
  const variants = {
    primary: clsx(
      'bg-primary-600 hover:bg-primary-500',
      'text-white',
      'focus-visible:ring-primary-500'
    ),
    secondary: clsx(
      'bg-dark-800 hover:bg-dark-700 border border-dark-600 hover:border-dark-500',
      'text-dark-100',
      'focus-visible:ring-dark-500'
    ),
    danger: clsx(
      'bg-red-600 hover:bg-red-500',
      'text-white',
      'focus-visible:ring-red-500'
    ),
    success: clsx(
      'bg-emerald-600 hover:bg-emerald-500',
      'text-white',
      'focus-visible:ring-emerald-500'
    ),
    ghost: clsx(
      'bg-transparent hover:bg-dark-800',
      'text-dark-400 hover:text-dark-100',
      'focus-visible:ring-dark-500'
    ),
    outline: clsx(
      'bg-transparent border border-dark-600 hover:border-primary-500',
      'text-dark-300 hover:text-primary-400 hover:bg-primary-500/5',
      'focus-visible:ring-primary-500'
    ),
  };
  
  const sizes = {
    xs: 'px-2 py-1 text-xs gap-1',
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
    icon: 'p-1 text-xs gap-1 w-7 h-7', // квадратная кнопка под иконку
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    icon: 'w-3.5 h-3.5',
  };

  const renderIcon = () => {
    if (isLoading) {
      return <Loader2 className={clsx(iconSizes[size], 'animate-spin')} />;
    }
    if (icon) {
      return <span className={iconSizes[size]}>{icon}</span>;
    }
    return null;
  };

  return (
    <button
      className={clsx(
        baseStyles, 
        variants[variant], 
        sizes[size], 
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {iconPosition === 'left' && renderIcon()}
      {children}
      {iconPosition === 'right' && renderIcon()}
    </button>
  );
}

