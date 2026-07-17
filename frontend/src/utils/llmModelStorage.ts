import { LLM_MODEL_OPTIONS } from '../constants/llmModels';

const LLM_MODEL_STORAGE_KEY = 'easycourse-selected-llm-model';

const ALLOWED_VALUES = new Set(LLM_MODEL_OPTIONS.map((option) => option.value));

export function readStoredLlmModel(): string {
  try {
    const stored = localStorage.getItem(LLM_MODEL_STORAGE_KEY);
    if (stored == null) {
      return '';
    }
    return ALLOWED_VALUES.has(stored) ? stored : '';
  } catch {
    return '';
  }
}

export function writeStoredLlmModel(model: string): void {
  try {
    if (!ALLOWED_VALUES.has(model)) {
      localStorage.removeItem(LLM_MODEL_STORAGE_KEY);
      return;
    }
    localStorage.setItem(LLM_MODEL_STORAGE_KEY, model);
  } catch {
    // ignore quota / private mode
  }
}
