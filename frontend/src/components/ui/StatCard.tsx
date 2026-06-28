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
  { iconBg: string; iconColor: string }
> = {
  primary: {
    iconBg: 'bg-primary-500/15',
    iconColor: 'text-primary-400',
  },
  blue: {
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
  },
  amber: {
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
  },
};

export function StatCard({ label, value, icon: Icon, accent = 'primary' }: StatCardProps) {
  const styles = accentStyles[accent];

  return (
    <Card padding="none">
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
        <div className="min-w-0">
          <p className="text-3xl font-semibold tabular-nums text-dark-100">{value}</p>
          <p className="text-sm text-dark-400">{label}</p>
        </div>
      </div>
    </Card>
  );
}
