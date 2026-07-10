import type { CourseAgentIntent } from '../../../types';

export function isDeleteIntent(intent?: CourseAgentIntent | null): boolean {
  return intent === 'DELETE_SECTION'
    || intent === 'DELETE_LESSON'
    || intent === 'DELETE_STEP';
}
