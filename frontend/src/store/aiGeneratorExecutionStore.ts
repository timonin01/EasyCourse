import { create } from 'zustand';
import toast from 'react-hot-toast';
import { agentApi } from '../api';
import type { BatchStepDTO, StepikBlockRequest } from '../types';
import { extractApiErrorMessage } from '../utils/apiError';
import { expandBatchPlanToItems, type BatchPlanItem } from '../utils/batchSteps';
import { useAIGeneratorStore } from './aiGeneratorStore';
import type { BatchResultItem } from '../pages/AIGenerator/types';
import { parseBatchGenerationError } from '../pages/AIGenerator/utils/parseBatchError';

type ExecutionKind = 'idle' | 'generate' | 'chat' | 'batch' | 'batch-analyze';

type AIGeneratorExecutionState = {
  kind: ExecutionKind;
  isLoading: boolean;
  isGeneratingBatch: boolean;
  lastGeneratePrompt: string;
  generatedStepHistoryRefreshKey: number;
  batchResults: BatchResultItem[];
  batchPlan: BatchStepDTO | null;
  batchPlanItems: BatchPlanItem[];
  batchActiveIndex: number;
  batchHistoryRefreshKey: number;

  isBusy: () => boolean;
  setLastGeneratePrompt: (prompt: string) => void;
  clearBatchResults: () => void;
  setBatchResults: (results: BatchResultItem[]) => void;

  startGenerate: (params: {
    sessionId: string;
    prompt: string;
    stepType: string;
    llmModel?: string;
    addUserMessage?: boolean;
    refreshSubscription: () => void;
  }) => Promise<void>;

  startChat: (params: {
    sessionId: string;
    prompt: string;
    llmModel?: string;
    refreshSubscription: () => void;
  }) => Promise<void>;

  startBatchAnalyze: (params: {
    userInput: string;
  }) => Promise<BatchStepDTO | null>;

  startBatchGenerate: (params: {
    sessionId: string;
    userInput: string;
    plan: BatchStepDTO;
    refreshSubscription: () => void;
  }) => Promise<void>;
};

let batchProgressTimer: ReturnType<typeof setInterval> | null = null;

function stopBatchProgressTimer() {
  if (batchProgressTimer != null) {
    clearInterval(batchProgressTimer);
    batchProgressTimer = null;
  }
}

function startBatchProgressTimer(itemCount: number) {
  stopBatchProgressTimer();
  if (itemCount <= 1) {
    return;
  }
  batchProgressTimer = setInterval(() => {
    useAIGeneratorExecutionStore.setState((state) => ({
      batchActiveIndex: state.batchActiveIndex >= itemCount - 1
        ? state.batchActiveIndex
        : state.batchActiveIndex + 1,
    }));
  }, 3500);
}

export const useAIGeneratorExecutionStore = create<AIGeneratorExecutionState>((set, get) => ({
  kind: 'idle',
  isLoading: false,
  isGeneratingBatch: false,
  lastGeneratePrompt: '',
  generatedStepHistoryRefreshKey: 0,
  batchResults: [],
  batchPlan: null,
  batchPlanItems: [],
  batchActiveIndex: 0,
  batchHistoryRefreshKey: 0,

  isBusy: () => {
    const state = get();
    return state.isLoading || state.isGeneratingBatch;
  },

  setLastGeneratePrompt: (prompt) => set({ lastGeneratePrompt: prompt }),

  clearBatchResults: () => set({
    batchResults: [],
    batchPlan: null,
    batchPlanItems: [],
    batchActiveIndex: 0,
  }),

  setBatchResults: (results) => set({ batchResults: results }),

  startGenerate: async ({
    sessionId,
    prompt,
    stepType,
    llmModel,
    addUserMessage = true,
    refreshSubscription,
  }) => {
    if (get().isBusy()) {
      toast.error('Генерация уже выполняется. Дождитесь завершения.');
      return;
    }

    const aiStore = useAIGeneratorStore.getState();
    if (addUserMessage) {
      aiStore.addMessage(sessionId, { role: 'user', content: prompt });
    }

    set({
      kind: 'generate',
      isLoading: true,
      lastGeneratePrompt: prompt,
    });

    try {
      const response = await agentApi.generateStep(sessionId, prompt, stepType, llmModel);
      aiStore.setGeneratedStep(response);
      aiStore.addMessage(sessionId, {
        role: 'assistant',
        content: `Готово! Сгенерирован шаг типа "${stepType}".\n\nПредпросмотр контента:\n${response.text?.substring(0, 200) || 'Контент сгенерирован'}...`,
        stepType,
        generatedStep: response,
      });
      set((state) => ({
        kind: 'idle',
        isLoading: false,
        generatedStepHistoryRefreshKey: state.generatedStepHistoryRefreshKey + 1,
      }));
      refreshSubscription();
    } catch (error) {
      aiStore.addMessage(sessionId, {
        role: 'assistant',
        content: extractApiErrorMessage(error, 'Произошла ошибка при генерации. Попробуйте ещё раз.'),
      });
      toast.error(extractApiErrorMessage(error, 'Ошибка генерации'));
      refreshSubscription();
      console.error('AI generation error:', error);
      set({ kind: 'idle', isLoading: false });
    }
  },

  startChat: async ({ sessionId, prompt, llmModel, refreshSubscription }) => {
    if (get().isBusy()) {
      toast.error('Генерация уже выполняется. Дождитесь завершения.');
      return;
    }

    const aiStore = useAIGeneratorStore.getState();
    aiStore.addMessage(sessionId, { role: 'user', content: prompt });
    set({ kind: 'chat', isLoading: true });

    try {
      const response = await agentApi.chat(sessionId, prompt, llmModel);
      aiStore.addMessage(sessionId, { role: 'assistant', content: response });
      set({ kind: 'idle', isLoading: false });
    } catch (error) {
      const message = extractApiErrorMessage(error, 'Произошла ошибка. Попробуйте ещё раз.');
      aiStore.addMessage(sessionId, { role: 'assistant', content: message });
      toast.error(message);
      refreshSubscription();
      set({ kind: 'idle', isLoading: false });
    }
  },

  startBatchAnalyze: async ({ userInput }) => {
    if (get().isBusy()) {
      toast.error('Генерация уже выполняется. Дождитесь завершения.');
      return null;
    }

    set({ kind: 'batch-analyze', isGeneratingBatch: true });
    try {
      const plan = await agentApi.analyzeBatchRequest(userInput);
      set({ kind: 'idle', isGeneratingBatch: false });
      return plan;
    } catch (error) {
      console.error('Error analyzing batch request:', error);
      toast.error('Ошибка при анализе запроса');
      set({ kind: 'idle', isGeneratingBatch: false });
      return null;
    }
  },

  startBatchGenerate: async ({ sessionId, userInput, plan, refreshSubscription }) => {
    if (get().isBusy()) {
      toast.error('Генерация уже выполняется. Дождитесь завершения.');
      return;
    }

    const planItems = expandBatchPlanToItems(plan);
    set({
      kind: 'batch',
      isGeneratingBatch: true,
      batchPlan: plan,
      batchPlanItems: planItems,
      batchActiveIndex: 0,
      batchResults: [],
    });
    startBatchProgressTimer(planItems.length);

    try {
      const results = await agentApi.generateBatchSteps(sessionId, userInput, plan);
      stopBatchProgressTimer();
      set((state) => ({
        kind: 'idle',
        isGeneratingBatch: false,
        batchResults: results.map((step, index) => ({ step, index })),
        batchActiveIndex: planItems.length - 1,
        batchHistoryRefreshKey: state.batchHistoryRefreshKey + 1,
      }));
      toast.success(`Сгенерировано ${results.length} шагов`);
      refreshSubscription();
    } catch (error) {
      console.error('Batch generation error:', error);
      stopBatchProgressTimer();
      const fullErrorMessage = parseBatchGenerationError(error);
      toast.error(fullErrorMessage, {
        duration: 10000,
        style: {
          maxWidth: '600px',
          whiteSpace: 'pre-wrap',
          fontSize: '13px',
          maxHeight: '400px',
          overflowY: 'auto',
        },
      });
      set((state) => ({
        kind: 'idle',
        isGeneratingBatch: false,
        batchResults: [{
          step: {} as StepikBlockRequest,
          index: 0,
          error: fullErrorMessage,
        }],
        batchHistoryRefreshKey: state.batchHistoryRefreshKey + 1,
      }));
    }
  },
}));
