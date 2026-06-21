export type UserRole = 'DEFAULT' | 'PRO';

export interface SubscriptionStatus {
  role: UserRole;
  pro: boolean;
  aiUsed: number;
  aiLimit: number | null;
  maxBatchSteps: number;
  canChangeStepType: boolean;
  canSelectModel: boolean;
}

export const FREE_AI_LIMIT = 40;
export const FREE_MAX_BATCH_STEPS = 3;
export const PRO_MAX_BATCH_STEPS = 8;

export const PRO_UPGRADE_MESSAGE = 'Доступно в подписке Pro';
export const STEP_TYPE_CHANGE_PRO_MESSAGE = 'Смена типа шага доступна в подписке Pro';
export const MODEL_PRO_MESSAGE = 'Выбор модели доступен в подписке Pro';
export const COURSE_AUDIT_PRO_MESSAGE = 'AI-аудит курса доступен в подписке Pro';
