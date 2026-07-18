import type { CoursePlanDTO, PlanActionDTO } from '../../../types';

export function isDeletePlan(plan?: CoursePlanDTO | null): boolean {
  return plan?.actions?.some((action) => isDeleteAction(action)) ?? false;
}

export function isDeleteAction(action?: PlanActionDTO | null): boolean {
  return action?.type === 'DELETE_SECTION'
    || action?.type === 'DELETE_LESSON'
    || action?.type === 'DELETE_STEP';
}

export function isCreateAction(action?: PlanActionDTO | null): boolean {
  return action?.type === 'CREATE_SECTION'
    || action?.type === 'CREATE_LESSONS'
    || action?.type === 'CREATE_STEPS';
}

export function isCopyAction(action?: PlanActionDTO | null): boolean {
  return action?.type === 'COPY_STEP';
}

export function isMoveAction(action?: PlanActionDTO | null): boolean {
  return action?.type === 'MOVE_STEP' || action?.type === 'MOVE_LESSON';
}

export function planSummaryLabel(plan: CoursePlanDTO): string {
  const actions = plan.actions ?? [];
  const hasDelete = actions.some(isDeleteAction);
  const hasCreate = actions.some(isCreateAction);
  const hasCopy = actions.some(isCopyAction);
  const hasMove = actions.some(isMoveAction);
  if ([hasDelete, hasCreate, hasCopy, hasMove].filter(Boolean).length > 1) {
    return 'Изменение курса';
  }
  if (hasDelete) {
    const deleteCount = actions.filter(isDeleteAction).length;
    return deleteCount > 1 ? 'Удаление элементов' : 'Удаление';
  }
  if (hasMove) {
    const moveSteps = actions.filter((action) => action.type === 'MOVE_STEP').length;
    const moveLessons = actions.filter((action) => action.type === 'MOVE_LESSON').length;
    if (moveSteps > 0 && moveLessons > 0) {
      return 'Перемещение';
    }
    if (moveLessons > 0) {
      return moveLessons > 1 ? 'Перемещение уроков' : 'Перемещение урока';
    }
    return moveSteps > 1 ? 'Перемещение шагов' : 'Перемещение шага';
  }
  if (hasCopy && !hasCreate) {
    return actions.filter(isCopyAction).length > 1 ? 'Копирование шагов' : 'Копирование шага';
  }
  if (actions.some((action) => action.type === 'CREATE_SECTION')) {
    return 'Новый модуль';
  }
  if (actions.some((action) => action.type === 'CREATE_LESSONS')) {
    return actions.filter((action) => action.type === 'CREATE_LESSONS').length > 1
      ? 'Уроки в нескольких модулях'
      : 'Новые уроки';
  }
  return actions.length > 1 ? 'Новые шаги в нескольких уроках' : 'Новые шаги';
}
