import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { Card } from './Card';

type StatAccent = 'primary' | 'blue' | 'amber';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  accent?: StatAccent;
}

const accentStyles: Record<
  StatAccent,
  { bar: string; iconBg: string; iconColor: string; glow: string }
> = {
  primary: {
    bar: 'from-primary-500 to-primary-400',
    iconBg: 'bg-primary-500/15',
    iconColor: 'text-primary-400',
    glow: 'shadow-primary-500/10',
  },
  blue: {
    bar: 'from-blue-500 to-blue-400',
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
    glow: 'shadow-blue-500/10',
  },
  amber: {
    bar: 'from-amber-500 to-amber-400',
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    glow: 'shadow-amber-500/10',
  },
};

export function StatCard({ label, value, icon: Icon, accent = 'primary' }: StatCardProps) {
  const styles = accentStyles[accent];

  return (
    <Card padding="none" className={clsx('overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200', styles.glow)}>
      <div className={clsx('h-1 bg-gradient-to-r', styles.bar)} />
      <div className="flex items-center gap-4 p-4">
        <div
          className={clsx(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
            styles.iconBg,
            styles.iconColor
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-3xl font-bold tabular-nums text-dark-100">{value}</p>
          <p className="text-sm text-dark-400">{label}</p>
        </div>
      </div>
    </Card>
  );
}
