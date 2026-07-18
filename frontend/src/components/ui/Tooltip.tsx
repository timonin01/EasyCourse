import { clsx } from 'clsx';
import type { ReactNode } from 'react';

type TooltipSide = 'right' | 'left' | 'bottom' | 'top';

interface TooltipProps {
  label: string;
  children: ReactNode;
  className?: string;
  side?: TooltipSide;
}

const sideClasses: Record<TooltipSide, string> = {
  right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
};

export function Tooltip({ label, children, className, side = 'right' }: TooltipProps) {
  return (
    <span className={clsx('relative inline-flex group/tip', className)}>
      {children}
      <span
        role="tooltip"
        className={clsx(
          'absolute z-[100] px-2 py-1 text-xs text-dark-100 bg-dark-800 border border-dark-600 rounded-lg shadow-lg whitespace-nowrap opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-opacity duration-150 pointer-events-none',
          sideClasses[side]
        )}
      >
        {label}
      </span>
    </span>
  );
}
