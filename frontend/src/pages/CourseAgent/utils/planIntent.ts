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

export function planSummaryLabel(plan: CoursePlanDTO): string {
  const actions = plan.actions ?? [];
  const hasDelete = actions.some(isDeleteAction);
  const hasCreate = actions.some(isCreateAction);
  if (hasDelete && hasCreate) {
    return 'Изменение курса';
  }
  if (hasDelete) {
    const deleteCount = actions.filter(isDeleteAction).length;
    return deleteCount > 1 ? 'Удаление элементов' : 'Удаление';
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
