import type { Step, StepType, StepikBlockRequest } from '../types';

const STEP_TYPE_MAP: Record<string, StepType> = {
  text: 'TEXT',
  choice: 'CHOICE',
  matching: 'MATCHING',
  sorting: 'SORTING',
  'fill-blanks': 'FILL_BLANK',
  string: 'STRING',
  number: 'NUMBER',
  'free-answer': 'FREE_ANSWER',
  math: 'MATH',
  'random-tasks': 'RANDOM_TASKS',
  table: 'TABLE',
  code: 'CODE',
};

/** Преобразует сгенерированный StepikBlockRequest в Step для StepView preview. */
export function stepikBlockToPreviewStep(
  block: StepikBlockRequest,
  stepTypeKey: string
): Step {
  const now = new Date().toISOString();
  return {
    id: 0,
    lessonId: 0,
    type: STEP_TYPE_MAP[stepTypeKey] || 'TEXT',
    content: block.text || '',
    position: 1,
    stepikBlockData: JSON.stringify(block),
    createdAt: now,
    updatedAt: now,
  };
}
