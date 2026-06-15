import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, suffix, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
    
    return (
      <div className="space-y-1.5">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-dark-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'w-full py-2.5 bg-dark-800/80 border border-dark-600 rounded-xl text-dark-100 placeholder-dark-500',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 focus:bg-dark-800',
              'hover:border-dark-500 hover:bg-dark-800',
              'transition-all duration-200',
              icon ? 'pl-10' : 'pl-4',
              suffix ? 'pr-12' : 'pr-4',
              error && 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50',
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute inset-y-0 right-3 flex items-center text-dark-400">
              {suffix}
            </div>
          )}
        </div>
        {hint && !error && (
          <p className="text-xs text-dark-500">{hint}</p>
        )}
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

