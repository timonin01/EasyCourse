import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  icon?: ReactNode;
  description?: string;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'highlight' | 'success' | 'warning';
}

export function FormSection({ 
  title, 
  icon, 
  description, 
  children, 
  className,
  variant = 'default' 
}: FormSectionProps) {
  const variantStyles = {
    default: 'border-dark-700/50 bg-dark-800/30',
    highlight: 'border-primary-500/30 bg-primary-500/5',
    success: 'border-emerald-500/30 bg-emerald-500/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
  };

  const titleColors = {
    default: 'text-dark-200',
    highlight: 'text-primary-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
  };

  return (
    <div className={clsx(
      'rounded-xl border p-4 transition-all duration-200',
      variantStyles[variant],
      className
    )}>
      <div className="flex items-center gap-2 mb-3">
        {icon && (
          <span className={clsx('p-1.5 rounded-lg', {
            'bg-dark-700/50 text-dark-400': variant === 'default',
            'bg-primary-500/20 text-primary-400': variant === 'highlight',
            'bg-emerald-500/20 text-emerald-400': variant === 'success',
            'bg-amber-500/20 text-amber-400': variant === 'warning',
          })}>
            {icon}
          </span>
        )}
        <div>
          <h4 className={clsx('font-medium', titleColors[variant])}>{title}</h4>
          {description && (
            <p className="text-xs text-dark-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}
