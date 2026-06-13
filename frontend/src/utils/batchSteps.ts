import type { CountStepDTO } from '../types';

function getExplicitStepKey(step: CountStepDTO): string {
  return `${step.type}|${(step.specificInput || '').trim()}|${step.useSummarizedEnabled ?? false}`;
}

export function mergeExplicitSteps(steps: CountStepDTO[]): CountStepDTO[] {
  const result: CountStepDTO[] = [];
  const indexByKey = new Map<string, number>();

  for (const step of steps) {
    const key = getExplicitStepKey(step);
    const existingIndex = indexByKey.get(key);

    if (existingIndex !== undefined) {
      result[existingIndex] = {
        ...result[existingIndex],
        count: (result[existingIndex].count || 1) + (step.count || 1),
      };
    } else {
      indexByKey.set(key, result.length);
      result.push({ ...step, count: step.count || 1 });
    }
  }

  return result;
}

export function buildExplicitStepsQuery(
  steps: CountStepDTO[],
  getTypeLabel: (type: string) => string,
  description?: string
): string {
  const merged = mergeExplicitSteps(steps);
  const explicitParts = merged.map((step) => {
    const count = step.count || 1;
    const specific = step.specificInput ? ` ${step.specificInput}` : '';
    return `${count} ${getTypeLabel(step.type)}${specific}`;
  });

  const explicitText = explicitParts.join(', ');
  const desc = description?.trim();
  return desc ? `${desc}. Создай: ${explicitText}` : `Создай: ${explicitText}`;
}
