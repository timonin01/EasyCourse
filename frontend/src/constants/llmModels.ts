export enum LlmModel {
  YANDEX_GPT_LITE = 'YANDEX_GPT_LITE',
  YANDEX_GPT_PRO = 'YANDEX_GPT_PRO',
  QWEN = 'QWEN',
  GEMMA = 'GEMMA',
}

export const LLM_MODEL_OPTIONS = [
  { value: '', label: 'Auto (Yandex GPT Lite)' },
  { value: LlmModel.YANDEX_GPT_PRO, label: '🧠 Yandex GPT Pro' },
  { value: LlmModel.QWEN, label: '🤖 Qwen' },
  { value: LlmModel.GEMMA, label: '💎 Gemma' },
];
