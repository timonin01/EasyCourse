import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from './Card';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: 'default' | 'dashed';
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'default',
  compact = false,
  className,
}: EmptyStateProps) {
  const content = (
    <div
      className={clsx(
        'text-center',
        compact ? 'py-6' : 'py-12',
        className
      )}
    >
      <Icon
        className={clsx(
          'mx-auto text-dark-500',
          compact ? 'mb-3 h-8 w-8' : 'mb-4 h-12 w-12'
        )}
      />
      <h3
        className={clsx(
          'font-medium text-dark-300',
          compact ? 'mb-1 text-sm' : 'mb-2 text-lg'
        )}
      >
        {title}
      </h3>
      {description && (
        <p className={clsx('text-dark-500', compact ? 'text-xs' : 'mb-4 text-sm')}>
          {description}
        </p>
      )}
      {action && <div className={compact && description ? 'mt-3' : ''}>{action}</div>}
    </div>
  );

  if (compact) {
    return content;
  }

  return (
    <Card
      className={clsx(variant === 'dashed' && 'border-dashed border-dark-600')}
    >
      {content}
    </Card>
  );
}
