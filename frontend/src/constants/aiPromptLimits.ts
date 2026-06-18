export const AI_PROMPT_LIMITS = {
  chat: 10_000,
  generate: 4_000,
  batch: 6_000,
} as const;

export function clampPromptLength(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return value.slice(0, maxLength);
}

export function getPromptLimitMessage(length: number, max: number, context: string): string {
  return `Промпт для ${context} слишком длинный: ${length} символов (максимум ${max})`;
}
