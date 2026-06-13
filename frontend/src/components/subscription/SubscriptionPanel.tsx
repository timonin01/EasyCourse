import { Badge, Card } from '../../components/ui';
import { useSubscription } from '../../hooks/useSubscription';

export function SubscriptionPanel() {
  const { isPro, aiUsed, aiLimit, maxBatchSteps, proMaxBatchSteps } = useSubscription();

  return (
    <Card className="mb-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-dark-300">Подписка</span>
          <Badge variant={isPro ? 'success' : 'info'}>{isPro ? 'Pro' : 'Free'}</Badge>
        </div>

        {!isPro && aiLimit !== null && (
          <div>
            <p className="text-xs text-dark-500 mb-1">AI-генерации в этом месяце</p>
            <p className="text-sm text-dark-200">
              {aiUsed} / {aiLimit}
            </p>
          </div>
        )}

        <div className="text-xs text-dark-500 space-y-1">
          <p>Batch: до {maxBatchSteps} шагов{!isPro && ` (Pro: до ${proMaxBatchSteps})`}</p>
          <p>Модели: {isPro ? 'все' : 'только Auto'}</p>
          <p>Смена типа шага: {isPro ? 'доступна' : 'только Pro'}</p>
        </div>

        {!isPro && (
          <p className="text-xs text-primary-400/90 pt-1 border-t border-dark-700">
            Pro — безлимитные AI-генерации, все модели, batch до {proMaxBatchSteps} шагов
          </p>
        )}
      </div>
    </Card>
  );
}
