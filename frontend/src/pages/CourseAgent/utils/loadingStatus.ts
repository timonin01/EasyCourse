const CHAT_LOADING_PHASES = [
  'Анализирую запрос…',
  'Изучаю структуру курса…',
  'Планирую уроки и шаги…',
  'Формирую план…',
  'Ещё немного, это может занять до минуты…',
];

const REVISE_LOADING_PHASES = [
  'Корректирую план…',
  'Обновляю структуру…',
  'Почти готово…',
];

const EXECUTE_LOADING_PHASES = [
  'Создаю черновик в базе…',
  'Генерирую шаги уроков…',
  'Code-задания могут занимать 20–50 с каждое…',
  'Ещё генерирую — обычно несколько минут…',
];

export function pickLoadingPhase(
  phases: string[],
  elapsedMs: number,
  stepMs = 8000,
): string {
  if (phases.length === 0) {
    return 'Думаю…';
  }
  const index = Math.min(Math.floor(elapsedMs / stepMs), phases.length - 1);
  return phases[index];
}

export function getChatLoadingPhases(isRevisingPlan: boolean): string[] {
  return isRevisingPlan ? REVISE_LOADING_PHASES : CHAT_LOADING_PHASES;
}

export function getExecuteLoadingPhases(): string[] {
  return EXECUTE_LOADING_PHASES;
}
