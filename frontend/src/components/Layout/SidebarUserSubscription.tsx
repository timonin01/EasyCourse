import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { clsx } from 'clsx';
import { Badge } from '../ui';
import { useSubscription } from '../../hooks/useSubscription';

export function SidebarUserSubscription() {
  const { isPro, aiUsed, aiLimit } = useSubscription();

  const usagePercent =
    aiLimit !== null && aiLimit > 0 ? Math.min(100, Math.round((aiUsed / aiLimit) * 100)) : 0;
  const usageNearLimit = !isPro && aiLimit !== null && usagePercent >= 80;

  return (
    <Link
      to="/settings"
      className={clsx(
        'mx-2 mb-2 block rounded-xl border px-3 py-2.5 transition-colors',
        isPro
          ? 'border-primary-500/25 bg-primary-900/20 hover:bg-primary-900/30'
          : 'border-dark-700 bg-dark-800/50 hover:bg-dark-800'
      )}
    >
      {isPro ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-600">
              <Crown className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-primary-400 truncate">Pro</span>
          </div>
          <Badge variant="success" className="text-[10px] px-2 py-0">
            Активна
          </Badge>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="info" className="text-[10px] px-2 py-0">
              Free
            </Badge>
            <span
              className={clsx(
                'text-xs font-semibold tabular-nums',
                usageNearLimit ? 'text-amber-400' : 'text-dark-200'
              )}
            >
              {aiUsed}/{aiLimit} AI
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-dark-700">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-500',
                usageNearLimit ? 'bg-amber-500' : 'bg-primary-500'
              )}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}
