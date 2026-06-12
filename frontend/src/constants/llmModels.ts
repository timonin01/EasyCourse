export enum LlmModel {
  YANDEX_GPT_LITE = 'YANDEX_GPT_LITE',
  YANDEX_GPT_PRO = 'YANDEX_GPT_PRO',
  QWEN = 'QWEN',
  GEMMA = 'GEMMA',
}

export interface LlmModelOption {
  value: string;
  label: string;
  icon?: string;
}

export const LLM_MODEL_OPTIONS: LlmModelOption[] = [
  { value: '', label: 'Auto' },
  { value: LlmModel.YANDEX_GPT_PRO, label: 'Yandex GPT Pro', icon: '/logos/yandex.svg' },
  { value: LlmModel.QWEN, label: 'Qwen', icon: '/logos/qwen.svg' },
  { value: LlmModel.GEMMA, label: 'Gemma', icon: '/logos/gemma.svg' },
];
