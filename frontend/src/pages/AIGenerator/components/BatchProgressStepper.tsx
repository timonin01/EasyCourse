import { Check, Circle, Loader2, X } from 'lucide-react';
import { clsx } from 'clsx';
import type { BatchPlanItem } from '../../../utils/batchSteps';

export type BatchStepStatus = 'pending' | 'active' | 'done' | 'error';

interface BatchProgressStepperProps {
  items: BatchPlanItem[];
  stepStatuses: BatchStepStatus[];
  progressPercent: number;
  title?: string;
}

export function BatchProgressStepper({
  items,
  stepStatuses,
  progressPercent,
  title = 'Batch-генерация',
}: BatchProgressStepperProps) {
  const completedCount = stepStatuses.filter((s) => s === 'done').length;
  const total = items.length;

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-dark-200">{title}</span>
          <span className="text-sm tabular-nums text-dark-400">
            {completedCount} / {total}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-dark-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        {items.map((item, i) => {
          const status = stepStatuses[i] ?? 'pending';
          return (
            <li
              key={item.index}
              className={clsx(
                'flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors',
                status === 'active' && 'bg-primary-500/10 border border-primary-500/20',
                status === 'done' && 'bg-dark-800/60',
                status === 'error' && 'bg-red-900/20 border border-red-700/30',
                status === 'pending' && 'bg-dark-800/30 opacity-70'
              )}
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                {status === 'done' && <Check className="h-4 w-4 text-primary-400" />}
                {status === 'active' && <Loader2 className="h-4 w-4 animate-spin text-primary-400" />}
                {status === 'error' && <X className="h-4 w-4 text-red-400" />}
                {status === 'pending' && <Circle className="h-3.5 w-3.5 text-dark-600" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-dark-500">Шаг {item.index + 1}</p>
                <p
                  className={clsx(
                    'text-sm font-medium',
                    status === 'active' && 'text-primary-300',
                    status === 'done' && 'text-dark-100',
                    status === 'error' && 'text-red-300',
                    status === 'pending' && 'text-dark-400'
                  )}
                >
                  {item.label}
                  {status === 'active' && (
                    <span className="ml-1 font-normal text-dark-500">— генерируется...</span>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
