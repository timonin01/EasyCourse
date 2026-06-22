import type { StepikBlockRequest } from '../../types';

export type AIGeneratorMode = 'chat' | 'generate' | 'batch';

export type BatchResultItem = {
  step: StepikBlockRequest;
  index: number;
  error?: string;
};
