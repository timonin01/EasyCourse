import type { CountStepDTO } from '../../../types';
import { buildExplicitStepsQuery } from '../../../utils/batchSteps';
import { STEP_TYPE_OPTIONS } from '../constants';

export function buildBatchUserInput(batchUserInput: string, batchExplicitSteps: CountStepDTO[]): string {
  if (batchExplicitSteps.length === 0) {
    return batchUserInput;
  }

  return buildExplicitStepsQuery(
    batchExplicitSteps,
    (type) => STEP_TYPE_OPTIONS.find((opt) => opt.value === type)?.label || type,
    batchUserInput
  );
}
