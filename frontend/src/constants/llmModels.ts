export enum LlmModel {
  DEEPSEEK_V4_FLASH = 'DEEPSEEK_V4_FLASH',
  DEEPSEEK_V4_PRO = 'DEEPSEEK_V4_PRO',
  SONNET_4_6 = 'SONNET_4_6',
  Z_AI_GLM_5_2 = 'Z_AI_GLM_5_2',
  QWEN_3_7_MAX = 'QWEN_3_7_MAX',
  GEMINI_3_1_FLASH = 'GEMINI_3_1_FLASH',
  GEMINI_3_5_FLASH = 'GEMINI_3_5_FLASH',
  GROK_4_1_FAST = 'GROK_4_1_FAST',
  GROK_4_5 = 'GROK_4_5',
  MIMO_2_5_PRO = 'MIMO_2_5_PRO',
}

export interface LlmModelOption {
  value: string;
  label: string;
  icon?: string;
}

export const LLM_MODEL_OPTIONS: LlmModelOption[] = [
  { value: '', label: 'Auto' },
  { value: LlmModel.DEEPSEEK_V4_PRO, label: 'DeepSeek Pro', icon: '/logos/deepseek.svg' },
  { value: LlmModel.SONNET_4_6, label: 'Claude Sonnet 4.6', icon: '/logos/claude.png' },
  { value: LlmModel.Z_AI_GLM_5_2, label: 'Z.ai GLM 5.2', icon: '/logos/z-ai.svg' },
  { value: LlmModel.QWEN_3_7_MAX, label: 'Qwen 3.7 Max', icon: '/logos/qwen.svg' },
  { value: LlmModel.GEMINI_3_1_FLASH, label: 'Gemini 3 Flash', icon: '/logos/gemini.svg' },
  { value: LlmModel.GEMINI_3_5_FLASH, label: 'Gemini 3.5 Flash', icon: '/logos/gemini.svg' },
  { value: LlmModel.GROK_4_1_FAST, label: 'Grok 4.1 Fast', icon: '/logos/grok.svg' },
  { value: LlmModel.GROK_4_5, label: 'Grok 4.5', icon: '/logos/grok.svg' },
  { value: LlmModel.MIMO_2_5_PRO, label: 'MiMo 2.5 Pro', icon: '/logos/mimo.png' },
];

/** Модели, доступные в подписке Pro (без Auto). */
export const PRO_LLM_MODEL_LABELS = LLM_MODEL_OPTIONS.filter((o) => o.value !== '').map(
  (o) => o.label
);
