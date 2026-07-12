import type { CoursePlanDTO, EntityCandidate, PlanActionDTO } from '../../../types';

export interface CourseTreeHighlight {
  sectionIds: Set<number>;
  lessonIds: Set<number>;
  stepIds: Set<number>;
}

export function buildTreeHighlight(
  plan: CoursePlanDTO | null,
  candidates: EntityCandidate[],
  createdSectionIds?: number[],
  createdLessonIds?: number[],
  createdStepIds?: number[],
): CourseTreeHighlight {
  const sectionIds = new Set<number>();
  const lessonIds = new Set<number>();
  const stepIds = new Set<number>();

  if (plan?.actions) {
    for (const action of plan.actions) {
      collectFromAction(action, sectionIds, lessonIds, stepIds);
    }
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

  createdSectionIds?.forEach((id) => sectionIds.add(id));
  createdLessonIds?.forEach((id) => lessonIds.add(id));
  createdStepIds?.forEach((id) => stepIds.add(id));

  return { sectionIds, lessonIds, stepIds };
}

function collectFromAction(
  action: PlanActionDTO,
  sectionIds: Set<number>,
  lessonIds: Set<number>,
  stepIds: Set<number>,
) {
  if (action.targetSectionId) {
    sectionIds.add(action.targetSectionId);
  }
  if (action.targetLessonId) {
    lessonIds.add(action.targetLessonId);
  }
  if (action.targetStepId) {
    stepIds.add(action.targetStepId);
  }
}
