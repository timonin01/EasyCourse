import { Check, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import type { CoursePlanDTO, PlanExecutionLiveProgress } from '../../../types';
import {
  estimatePlanExecution,
  formatDurationHint,
  waitingHonestyHint,
} from '../utils/planExecutionProgress';

interface ExecuteProgressProps {
  plan: CoursePlanDTO;
  isDelete: boolean;
  live?: PlanExecutionLiveProgress | null;
}

export function ExecuteProgress({ plan, isDelete, live }: ExecuteProgressProps) {
  const estimate = useMemo(() => estimatePlanExecution(plan), [plan]);

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

  const total = live?.total || estimate.totalSteps;
  const completed = live?.current ?? 0;
  const percent = live
    ? (total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 8)
    : 8;
  const title = live?.message
    || (live?.stepType
      ? `Генерирую ${live.stepType.toLowerCase()}${live.lessonTitle ? ` · «${live.lessonTitle}»` : ''}`
      : 'Генерирую шаги…');
  const honesty = !live ? waitingHonestyHint(estimate) : null;
  const durationHint = !live ? formatDurationHint(estimate) : null;
  const log = live?.log ?? [];

  return (
    <div className="mt-3 space-y-2.5 rounded-lg border border-dark-700 bg-dark-900 px-3 py-3">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary-400" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm text-dark-200">{title}</span>
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

      {log.length > 0 ? (
        <ul className="max-h-28 space-y-1 overflow-y-auto text-xs text-dark-400">
          {log.slice(-6).map((entry) => {
            const isDone = entry.kind === 'STEP_CREATED'
              || entry.kind === 'LESSON_CREATED'
              || entry.kind === 'SECTION_CREATED'
              || entry.kind === 'DONE';
            const isFailed = entry.kind === 'STEP_FAILED' || entry.kind === 'ERROR';
            return (
              <li key={entry.id} className="flex items-start gap-1.5">
                {isDone
                  ? <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                  : isFailed
                    ? <span className="mt-0.5 h-3 w-3 shrink-0 rounded-full bg-red-500/80" />
                    : <span className="mt-0.5 h-3 w-3 shrink-0 rounded-full border border-dark-600" />}
                <span className="min-w-0 break-words">{entry.text}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="space-y-1 text-xs text-dark-500">
          {durationHint && <p>{durationHint}</p>}
          {honesty && <p className="text-dark-400">{honesty}</p>}
          <p className="text-dark-500">Не закрывайте вкладку — шаги появятся в структуре курса по мере создания.</p>
        </div>
      )}

      <p className="text-xs text-amber-200/80">
        Не меняйте структуру курса вручную, пока генерация не завершится.
      </p>
    </div>
  );
}
