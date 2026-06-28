import { clsx } from 'clsx';
import type { ReactNode } from 'react';

const iconAccentStyles = {
  primary: 'bg-primary-500/15 text-primary-400',
  blue: 'bg-blue-500/15 text-blue-400',
  amber: 'bg-amber-500/15 text-amber-400',
  purple: 'bg-purple-500/15 text-purple-400',
} as const;

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  icon?: ReactNode;
  iconAccent?: keyof typeof iconAccentStyles;
  action?: ReactNode;
  meta?: ReactNode;
  size?: 'page' | 'workspace' | 'hero';
  className?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  icon,
  iconAccent = 'primary',
  action,
  meta,
  size = 'page',
  className,
}: PageHeaderProps) {
  const isHero = size === 'hero';

  return (
    <div
      className={clsx(
        'mb-8 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="mb-1.5 text-label uppercase tracking-[0.14em] text-dark-500">
            {eyebrow}
          </p>
        )}

        <div className={clsx('flex gap-3', isHero ? 'items-start' : 'items-center')}>
          {icon && (
            <div
              className={clsx(
                'flex shrink-0 items-center justify-center rounded-brand-lg',
                isHero ? 'h-11 w-11' : 'h-10 w-10',
                iconAccentStyles[iconAccent]
              )}
            >
              {icon}
            </div>
          )}

          <div className="min-w-0">
            <h1
              className={clsx(
                'text-dark-100 break-words',
                size === 'hero' && 'text-display',
                size === 'page' && 'text-title',
                size === 'workspace' && 'text-workspace-title'
              )}
            >
              {title}
            </h1>

            {description && (
              <p
                className={clsx(
                  'text-dark-400 break-words',
                  size === 'workspace' ? 'mt-1 text-caption' : 'mt-1.5 text-body max-w-2xl'
                )}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {meta && (
          <div className={clsx('mt-3 flex flex-wrap items-center gap-2', icon && !isHero && 'pl-[52px]', icon && isHero && 'pl-14')}>
            {meta}
          </div>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
