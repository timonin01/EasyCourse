import { Bot, Check, Crown, Layers, Lock, RefreshCw, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { useState, type ReactNode } from 'react';
import { Button, Badge, Card } from '../../components/ui';
import { PRO_LLM_MODEL_LABELS } from '../../constants/llmModels';
import { useSubscription } from '../../hooks/useSubscription';
import { ProUpgradeModal } from './ProUpgradeModal';

interface FeatureRowProps {
  icon: ReactNode;
  label: string;
  value: string;
  active?: boolean;
}

interface SubscriptionPanelProps {
  variant?: 'full' | 'compact';
}

function FeatureRow({ icon, label, value, active = true }: FeatureRowProps) {
  return (
    <div
      className={clsx(
        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors',
        active ? 'bg-dark-800/60' : 'bg-dark-800/30 opacity-70'
      )}
    >
      <span
        className={clsx(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
          active ? 'bg-primary-500/15 text-primary-400' : 'bg-dark-700 text-dark-500'
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-dark-500">{label}</p>
        <p className={clsx('text-sm font-medium', active ? 'text-dark-100' : 'text-dark-400')}>
          {value}
        </p>
      </div>
      {active ? (
        <Check className="h-4 w-4 shrink-0 text-primary-400" />
      ) : (
        <Lock className="h-3.5 w-3.5 shrink-0 text-dark-600" />
      )}
    </div>
  );
}

export function SubscriptionPanel({ variant = 'full' }: SubscriptionPanelProps) {
  const { isPro, aiUsed, aiLimit, maxBatchSteps } = useSubscription();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const usagePercent =
    aiLimit !== null && aiLimit > 0 ? Math.min(100, Math.round((aiUsed / aiLimit) * 100)) : 0;
  const usageNearLimit = !isPro && aiLimit !== null && usagePercent >= 80;

  if (variant === 'compact') {
    return (
      <>
        <div
          className={clsx(
            'mb-3 rounded-xl border px-3 py-2.5',
            isPro
              ? 'border-primary-500/25 bg-primary-900/20'
              : 'border-dark-700 bg-dark-800/50'
          )}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {isPro ? (
                <Crown className="h-3.5 w-3.5 text-primary-400" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-dark-500" />
              )}
              <span className={clsx('text-sm font-semibold', isPro ? 'gradient-text' : 'text-dark-200')}>
                {isPro ? 'Pro' : 'Free'}
              </span>
            </div>
            {!isPro && aiLimit !== null && (
              <span
                className={clsx(
                  'text-xs font-semibold tabular-nums',
                  usageNearLimit ? 'text-amber-400' : 'text-dark-300'
                )}
              >
                {aiUsed}/{aiLimit} AI
              </span>
            )}
            {isPro && (
              <Badge variant="success" className="text-[10px] px-2 py-0">
                Активна
              </Badge>
            )}
          </div>
          {!isPro && aiLimit !== null && (
            <div className="mb-2 h-1 overflow-hidden rounded-full bg-dark-700">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-500',
                  usageNearLimit
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                    : 'bg-gradient-to-r from-primary-600 to-primary-400'
                )}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          )}
          {!isPro && (
            <button
              type="button"
              onClick={() => setIsUpgradeModalOpen(true)}
              className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              Batch до {maxBatchSteps} шагов · Перейти на Pro →
            </button>
          )}
        </div>
        <ProUpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
      </>
    );
  }

  return (
    <Card
      padding="none"
      className={clsx(
        'mb-4 overflow-hidden',
        isPro
          ? 'border-primary-500/25 shadow-lg shadow-primary-500/10'
          : 'border-dark-600/40'
      )}
    >
      {/* Header */}
      <div
        className={clsx(
          'relative px-4 pt-4 pb-3',
          isPro
            ? 'bg-gradient-to-br from-primary-900/40 via-dark-850 to-dark-900/80'
            : 'bg-gradient-to-br from-dark-800/80 to-dark-900/40'
        )}
      >
        {isPro && (
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary-500/10 blur-2xl" />
        )}

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={clsx(
                'flex h-9 w-9 items-center justify-center rounded-xl',
                isPro
                  ? 'bg-gradient-to-br from-primary-500 to-primary-700 shadow-md shadow-primary-500/30'
                  : 'bg-dark-700 border border-dark-600'
              )}
            >
              {isPro ? (
                <Crown className="h-4 w-4 text-white" />
              ) : (
                <Sparkles className="h-4 w-4 text-dark-400" />
              )}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-dark-500">
                Подписка
              </p>
              <p className={clsx('text-base font-semibold', isPro ? 'gradient-text' : 'text-dark-200')}>
                {isPro ? 'Pro' : 'Free'}
              </p>
            </div>
          </div>

          <Badge
            variant={isPro ? 'success' : 'info'}
            className={clsx(isPro && 'border border-primary-500/30 shadow-sm shadow-primary-500/20')}
          >
            {isPro ? 'Активна' : 'Базовый'}
          </Badge>
        </div>
      </div>

      <div className="space-y-3 px-4 pb-4 pt-3">
        {/* AI usage — Free only */}
        {!isPro && aiLimit !== null && (
          <div className="rounded-xl border border-dark-700/80 bg-dark-800/50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-dark-400">AI-генерации в месяце</span>
              <span
                className={clsx(
                  'text-sm font-semibold tabular-nums',
                  usageNearLimit ? 'text-amber-400' : 'text-dark-100'
                )}
              >
                {aiUsed}
                <span className="font-normal text-dark-500"> / {aiLimit}</span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-dark-700">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-500',
                  usageNearLimit
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                    : 'bg-gradient-to-r from-primary-600 to-primary-400'
                )}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Features */}
        <div className="space-y-1.5">
          <FeatureRow
            icon={<Layers className="h-3.5 w-3.5" />}
            label="Batch-генерация"
            value={`до ${maxBatchSteps} шагов`}
            active
          />
          <FeatureRow
            icon={<Bot className="h-3.5 w-3.5" />}
            label="Модели AI"
            value={isPro ? PRO_LLM_MODEL_LABELS.join(', ') : 'Только Auto'}
            active={isPro}
          />
          <FeatureRow
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            label="Смена типа шага"
            value={isPro ? 'Доступна' : 'Только в Pro'}
            active={isPro}
          />
        </div>

        {/* Upgrade hint — Free only */}
        {!isPro && (
          <div className="rounded-xl border border-primary-500/20 bg-gradient-to-r from-primary-900/30 to-dark-800/50 px-3 py-2.5 space-y-2.5">
            <p className="text-xs leading-relaxed text-dark-300">
              <span className="font-semibold text-primary-400">Pro</span>
              {' — '}
              безлимитные генерации, все модели и расширенная batch генерация
            </p>
            <Button
              size="sm"
              className="w-full btn-hover"
              icon={<Sparkles className="h-4 w-4" />}
              onClick={() => setIsUpgradeModalOpen(true)}
            >
              Перейти на Pro
            </Button>
          </div>
        )}

        {isPro && (
          <p className="text-center text-[11px] text-primary-400/70">
            Спасибо, что поддерживаете проект
          </p>
        )}
      </div>

      <ProUpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
    </Card>
  );
}
