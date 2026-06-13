export enum LlmModel {
  YANDEX_GPT_LITE = 'YANDEX_GPT_LITE',
  YANDEX_GPT_PRO = 'YANDEX_GPT_PRO',
  QWEN = 'QWEN',
  GPT_OSS_20B = 'GPT_OSS_20B',
  DEEPSEEK_V4_FLASH = 'DEEPSEEK_V4_FLASH',
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
  { value: LlmModel.GPT_OSS_20B, label: 'GPT', icon: '/logos/openai.svg' },
  { value: LlmModel.DEEPSEEK_V4_FLASH, label: 'DeepSeek', icon: '/logos/deepseek.svg' },
];

/** Модели, доступные в подписке Pro (без Auto). */
export const PRO_LLM_MODEL_LABELS = LLM_MODEL_OPTIONS.filter((o) => o.value !== '').map(
  (o) => o.label
);
