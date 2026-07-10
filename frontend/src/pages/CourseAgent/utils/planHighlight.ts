import type { CoursePlanDTO, EntityCandidate } from '../../../types';
import type { CourseTreeHighlight } from '../types';

export function buildTreeHighlight(
  plan: CoursePlanDTO | null,
  candidates: EntityCandidate[],
  createdSectionIds?: number[],
  createdLessonIds?: number[],
  createdStepIds?: number[],
): CourseTreeHighlight {
  const sectionIds = new Set<number>(createdSectionIds ?? []);
  const lessonIds = new Set<number>(createdLessonIds ?? []);
  const stepIds = new Set<number>(createdStepIds ?? []);

  if (plan?.targetSectionId) {
    sectionIds.add(plan.targetSectionId);
  }
  if (plan?.targetLessonId) {
    lessonIds.add(plan.targetLessonId);
  }
  if (plan?.targetStepId) {
    stepIds.add(plan.targetStepId);
  }

  for (const candidate of candidates) {
    if (candidate.type === 'section') {
      sectionIds.add(candidate.id);
    } else if (candidate.type === 'lesson') {
      lessonIds.add(candidate.id);
    } else if (candidate.type === 'step') {
      stepIds.add(candidate.id);
    }
  }

  return { sectionIds, lessonIds, stepIds };
}
