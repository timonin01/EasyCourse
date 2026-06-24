import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  size?: 'page' | 'workspace';
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  action,
  size = 'page',
  className,
}: PageHeaderProps) {
  return (
    <div
      className={clsx(
        'mb-8 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon}
          <h1
            className={clsx(
              'font-bold text-dark-100 break-words',
              size === 'page' ? 'text-3xl' : 'text-2xl'
            )}
          >
            {title}
          </h1>
        </div>
        {description && (
          <p
            className={clsx(
              'text-dark-400 break-words',
              size === 'page' ? 'mt-1 text-base' : 'mt-1 text-sm'
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
