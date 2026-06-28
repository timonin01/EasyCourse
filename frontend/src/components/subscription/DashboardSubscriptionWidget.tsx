import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Crown, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';
import { Card, Badge, Button } from '../ui';
import { useSubscription } from '../../hooks/useSubscription';
import { ProUpgradeModal } from './ProUpgradeModal';

export function DashboardSubscriptionWidget() {
  const { isPro, aiUsed, aiLimit, maxBatchSteps } = useSubscription();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const usagePercent =
    aiLimit !== null && aiLimit > 0 ? Math.min(100, Math.round((aiUsed / aiLimit) * 100)) : 0;
  const usageNearLimit = !isPro && aiLimit !== null && usagePercent >= 80;
  const usageAtLimit = !isPro && aiLimit !== null && aiUsed >= aiLimit;

  if (isPro) {
    return (
      <Card className="mb-8 border-primary-500/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-dark-100">Подписка Pro</h2>
                <Badge variant="success">Активна</Badge>
              </div>
              <p className="text-sm text-dark-400">
                Безлимитные AI-генерации, аудит курса и расширенная batch-генерация
              </p>
            </div>
          </div>
          <Link to="/settings" className="shrink-0">
            <Button variant="secondary" size="sm">
              Управление подпиской
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card
        className={clsx(
          'mb-8',
          usageAtLimit
            ? 'border-red-500/30'
            : usageNearLimit
              ? 'border-amber-500/30'
              : undefined
        )}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600/20">
                <Sparkles className="h-5 w-5 text-primary-400" />
              </div>
              <h2 className="text-lg font-semibold text-dark-100">AI-лимит</h2>
              <Badge variant="info">Free</Badge>
              <span className="text-caption text-dark-500">
                · batch до {maxBatchSteps} шагов
              </span>
            </div>

            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-caption text-dark-400">Использовано в этом месяце</span>
              <span
                className={clsx(
                  'text-caption font-semibold tabular-nums',
                  usageAtLimit ? 'text-red-400' : usageNearLimit ? 'text-amber-400' : 'text-dark-100'
                )}
              >
                {aiUsed} / {aiLimit} генераций
              </span>
            </div>

            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-dark-700">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-300',
                  usageAtLimit ? 'bg-red-500' : usageNearLimit ? 'bg-amber-500' : 'bg-primary-500'
                )}
                style={{ width: `${usagePercent}%` }}
              />
            </div>

            {usageAtLimit && (
              <p className="flex items-center gap-1.5 text-caption text-red-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Лимит исчерпан. Перейдите на Pro для безлимитных генераций.
              </p>
            )}
            {!usageAtLimit && usageNearLimit && (
              <p className="flex items-center gap-1.5 text-caption text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Осталось мало генераций — скоро лимит будет исчерпан.
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
            <Button onClick={() => setIsUpgradeModalOpen(true)}>
              <Crown className="mr-1.5 h-4 w-4" />
              Перейти на Pro
            </Button>
            <Link to="/settings">
              <Button variant="ghost" size="sm" className="w-full">
                Подробнее о подписке
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <ProUpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
    </>
  );
}
