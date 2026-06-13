import type { CountStepDTO } from '../types';

export function countTotalBatchSteps(steps: CountStepDTO[]): number {
  return steps.reduce((sum, step) => sum + (step.count || 1), 0);
}

function getExplicitStepKey(step: CountStepDTO): string {
  return `${step.type}|${(step.specificInput || '').trim()}|${step.useSummarizedEnabled ?? false}`;
}

/** Склеивает только подряд идущие одинаковые шаги (для предпросмотра и запроса). */
export function mergeConsecutiveExplicitSteps(steps: CountStepDTO[]): CountStepDTO[] {
  const result: CountStepDTO[] = [];

  for (const step of steps) {
    const normalized: CountStepDTO = { ...step, count: step.count || 1 };
    const last = result[result.length - 1];

    if (last && getExplicitStepKey(last) === getExplicitStepKey(normalized)) {
      result[result.length - 1] = {
        ...last,
        count: (last.count || 1) + normalized.count,
      };
    } else {
      result.push(normalized);
    }
  }

  return result;
}

export function buildExplicitStepsQuery(
  steps: CountStepDTO[],
  getTypeLabel: (type: string) => string,
  description?: string
): string {
  const merged = mergeConsecutiveExplicitSteps(steps);
  const explicitParts = merged.map((step) => {
    const count = step.count || 1;
    const specific = step.specificInput ? ` ${step.specificInput}` : '';
    return `${count} ${getTypeLabel(step.type)}${specific}`;
  });

  const explicitText = explicitParts.join(', ');
  const desc = description?.trim();
  return desc ? `${desc}. Создай: ${explicitText}` : `Создай: ${explicitText}`;
}
