import type { Step, StepikBlockRequest } from '../../../types';
import { getStepBlockName } from '../../../types';

export function parseStepikBlockFromStep(step: Step): StepikBlockRequest {
  if (step.stepikBlockData) {
    try {
      const parsed = typeof step.stepikBlockData === 'string'
        ? JSON.parse(step.stepikBlockData)
        : step.stepikBlockData;
      if (parsed && typeof parsed === 'object') {
        return parsed as StepikBlockRequest;
      }
    } catch {
      // fall through to default block
    }
  }

  const blockName = getStepBlockName(step);
  return {
    name: blockName,
    text: step.content || '',
    video: null,
    options: null,
    source: blockName === 'code'
      ? {
          code: '',
          templates_data: '::java21',
          test_cases: [['', '']],
          execution_time_limit: 5,
          execution_memory_limit: 256,
          samples_count: 1,
          are_all_tests_run: true,
          is_run_user_code_allowed: true,
          is_time_limit_scaled: true,
          is_memory_limit_scaled: true,
          manual_time_limits: [],
          manual_memory_limits: [],
          test_archive: [],
        }
      : {},
  };
}
