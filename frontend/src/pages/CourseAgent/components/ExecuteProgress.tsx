import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { CoursePlanDTO } from '../../../types';
import {
  estimatePlanExecution,
  formatDurationHint,
  simulateCompletedSteps,
  waitingHonestyHint,
} from '../utils/planExecutionProgress';

interface ExecuteProgressProps {
  plan: CoursePlanDTO;
  isDelete: boolean;
}

export function ExecuteProgress({ plan, isDelete }: ExecuteProgressProps) {
  const estimate = useMemo(() => estimatePlanExecution(plan), [plan]);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    setElapsedMs(0);
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  if (isDelete) {
    return (
      <div className="mt-3 flex items-start gap-2 rounded-lg border border-dark-700 bg-dark-900 px-3 py-2.5">
        <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-red-400" />
        <div>
          <div className="text-sm text-dark-200">Удаляю…</div>
          <div className="text-xs text-dark-500">Это займёт несколько секунд</div>
        </div>
      </div>
    );
  }

  const total = estimate.totalSteps;
  const completed = total > 0
    ? simulateCompletedSteps(estimate, elapsedMs, true)
    : 0;
  const percent = total > 0 ? Math.min(95, Math.round((completed / total) * 100)) : 8;
  const honesty = waitingHonestyHint(estimate);
  const durationHint = formatDurationHint(estimate);

  return (
    <div className="mt-3 space-y-2.5 rounded-lg border border-dark-700 bg-dark-900 px-3 py-3">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary-400" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-dark-200">Генерирую шаги…</span>
            <span className="shrink-0 text-sm tabular-nums text-dark-400">
              {total > 0 ? `${completed} / ${total}` : '…'}
            </span>
          </div>
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-dark-700">
        <div
          className="h-full rounded-full bg-primary-600 transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="space-y-1 text-xs text-dark-500">
        <p>{durationHint}</p>
        {honesty && <p className="text-dark-400">{honesty}</p>}
      </div>
    </div>
  );
}
