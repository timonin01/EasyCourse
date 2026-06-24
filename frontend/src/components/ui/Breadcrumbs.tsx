import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Навигация"
      className={clsx('mb-4 flex flex-wrap items-center gap-1.5 text-sm text-dark-400', className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-dark-600" />}
            {item.to && !isLast ? (
              <Link to={item.to} className="transition-colors hover:text-dark-200">
                {item.label}
              </Link>
            ) : (
              <span className={clsx(isLast && 'text-dark-200')}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
