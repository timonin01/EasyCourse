import type { CountStepDTO, CoursePlanDTO, PlanActionDTO } from '../../../types';

/** Estimated seconds per single step generation (LLM wait), keyed by type. */
const SEC_PER_STEP: Record<string, number> = {
  text: 18,
  code: 35,
  choice: 12,
  matching: 14,
  sorting: 12,
  table: 16,
  'fill-blanks': 28,
  string: 12,
  number: 12,
  'free-answer': 14,
  math: 16,
  'random-tasks': 20,
};

const DEFAULT_SEC = 15;
const THEORY_SUMMARY_SEC = 4;

export interface PlannedStepItem {
  lessonTitle: string;
  type: string;
  /** Estimated duration for this one atomic generation */
  estimatedSec: number;
}

export interface PlanExecutionEstimate {
  items: PlannedStepItem[];
  totalSteps: number;
  codeCount: number;
  heavyCount: number;
  estimatedSecTotal: number;
}

function expandSteps(steps: CountStepDTO[] | undefined, lessonTitle: string): PlannedStepItem[] {
  if (!steps?.length) return [];
  const out: PlannedStepItem[] = [];
  for (const step of steps) {
    const type = (step.type ?? 'text').toLowerCase();
    const count = Math.max(1, step.count ?? 1);
    const sec = SEC_PER_STEP[type] ?? DEFAULT_SEC;
    for (let i = 0; i < count; i++) {
      out.push({ lessonTitle, type, estimatedSec: sec });
      // Practice after text usually has a short theory summary call
      if (type === 'text' && i === count - 1) {
        // summary is shared for following practice; count once after text block in list order —
        // we add it only when next item in same lesson is non-text? Simpler: add summary sec into next non-text.
      }
    }
  }
  return out;
}

function expandAction(action: PlanActionDTO): PlannedStepItem[] {
  if (!action?.type) return [];

  if (action.type === 'CREATE_SECTION' && action.section?.lessons) {
    return action.section.lessons.flatMap((lesson) =>
      expandSteps(lesson.steps, lesson.title || 'Новый урок'),
    );
  }

  if (action.type === 'CREATE_LESSONS' && action.lessons) {
    return action.lessons.flatMap((lesson) =>
      expandSteps(lesson.steps, lesson.title || action.targetSectionTitle || 'Урок'),
    );
  }

  if (action.type === 'CREATE_STEPS' && action.steps) {
    return expandSteps(action.steps, action.targetLessonTitle || 'Урок');
  }

  if (action.type === 'COPY_STEP') {
    return [{
      lessonTitle: action.targetLessonTitle || 'Урок',
      type: 'copy',
      estimatedSec: 2,
    }];
  }

  return [];
}

/** Add theory-summary cost once before each practice step that follows text in the same lesson. */
function withTheorySummaries(items: PlannedStepItem[]): PlannedStepItem[] {
  const result: PlannedStepItem[] = [];
  let lastLessonHadText = false;
  let lastLesson = '';

  for (const item of items) {
    if (item.lessonTitle !== lastLesson) {
      lastLesson = item.lessonTitle;
      lastLessonHadText = false;
    }
    if (item.type === 'text') {
      lastLessonHadText = true;
      result.push(item);
      continue;
    }
    if (lastLessonHadText) {
      result.push({
        lessonTitle: item.lessonTitle,
        type: '_theory_summary',
        estimatedSec: THEORY_SUMMARY_SEC,
      });
      // one summary shared for the lesson's practice; don't repeat for every practice
      lastLessonHadText = false;
    }
    result.push(item);
  }
  return result;
}

export function estimatePlanExecution(plan: CoursePlanDTO | null | undefined): PlanExecutionEstimate {
  const raw = (plan?.actions ?? []).flatMap(expandAction);
  const items = withTheorySummaries(raw);
  const contentSteps = items.filter((i) => i.type !== '_theory_summary');
  const codeCount = contentSteps.filter((i) => i.type === 'code').length;
  const heavyCount = contentSteps.filter((i) =>
    i.type === 'code' || i.type === 'fill-blanks',
  ).length;
  const estimatedSecTotal = items.reduce((sum, i) => sum + i.estimatedSec, 0);

  return {
    items,
    totalSteps: contentSteps.length,
    codeCount,
    heavyCount,
    estimatedSecTotal,
  };
}

/**
 * Simulated completed content-steps from elapsed time (capped at total-1 while still running).
 */
export function simulateCompletedSteps(
  estimate: PlanExecutionEstimate,
  elapsedMs: number,
  stillRunning: boolean,
): number {
  if (estimate.totalSteps <= 0) return 0;
  const elapsedSec = elapsedMs / 1000;
  let spent = 0;
  let completed = 0;

  for (const item of estimate.items) {
    spent += item.estimatedSec;
    if (item.type === '_theory_summary') continue;
    if (elapsedSec >= spent) {
      completed += 1;
    } else {
      break;
    }
  }

  if (stillRunning && completed >= estimate.totalSteps) {
    return Math.max(0, estimate.totalSteps - 1);
  }
  return Math.min(completed, estimate.totalSteps);
}

export function formatDurationHint(estimate: PlanExecutionEstimate): string {
  const minLow = Math.max(1, Math.round(estimate.estimatedSecTotal / 60 * 0.7));
  const minHigh = Math.max(minLow + 1, Math.round(estimate.estimatedSecTotal / 60 * 1.3));
  if (estimate.codeCount > 0 || estimate.heavyCount > 0) {
    return `Обычно ${minLow}–${minHigh} мин при нескольких code / сложных заданиях`;
  }
  return `Обычно около ${minLow}–${minHigh} мин`;
}

export function waitingHonestyHint(estimate: PlanExecutionEstimate): string | null {
  if (estimate.codeCount > 0) {
    return 'Code-задания занимают больше времени (часто 20–50 с на шаг).';
  }
  if (estimate.heavyCount > 0) {
    return 'Задания с пропусками и кодом могут занимать десятки секунд.';
  }
  return null;
}
