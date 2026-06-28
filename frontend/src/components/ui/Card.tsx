import { clsx } from 'clsx';
import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ 
  children, 
  hover = false, 
  padding = 'md',
  className, 
  ...props 
}: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={clsx(
        'surface rounded-brand-lg',
        paddings[padding],
        hover && 'hover:border-dark-500 transition-colors duration-150 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

