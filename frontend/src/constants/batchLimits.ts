import {
  FREE_MAX_BATCH_STEPS,
  PRO_MAX_BATCH_STEPS,
} from './subscription';

export function getMaxBatchSteps(isPro: boolean): number {
  return isPro ? PRO_MAX_BATCH_STEPS : FREE_MAX_BATCH_STEPS;
}

export function getBatchStepLimitMessage(isPro: boolean, totalSteps: number, maxSteps: number): string {
  if (totalSteps <= maxSteps) {
    return '';
  }
  if (isPro) {
    return `Максимум ${maxSteps} шагов за одну batch-генерацию. Уменьшите количество или разбейте запрос.`;
  }
  return `На бесплатном тарифе batch-генерация до ${FREE_MAX_BATCH_STEPS} шагов. В плане: ${totalSteps}. Оформите Pro для batch до ${PRO_MAX_BATCH_STEPS} шагов.`;
}

export function getBatchGenerationHint(isPro: boolean, maxSteps: number): string {
  if (isPro) {
    return `Сгенерируйте несколько шагов урока за один запрос. Максимум ${maxSteps} шагов за одну batch-генерацию.`;
  }
  return `Сгенерируйте несколько шагов урока за один запрос. На бесплатном тарифе — до ${FREE_MAX_BATCH_STEPS} шагов, с Pro — до ${PRO_MAX_BATCH_STEPS}.`;
}
