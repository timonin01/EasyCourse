import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from 'react';
import toast from 'react-hot-toast';
import { agentApi, stepsApi } from '../../../api';
import { useCourseStore, useAIGeneratorStore, useAIGeneratorExecutionStore } from '../../../store';
import type { BatchStepDTO, CountStepDTO, BatchGenerationHistory } from '../../../types';
import { countTotalBatchSteps } from '../../../utils/batchSteps';
import { getBatchStepLimitMessage } from '../../../constants/batchLimits';
import { AI_PROMPT_LIMITS, getPromptLimitMessage, clampPromptLength } from '../../../constants/aiPromptLimits';
import type { BatchStepStatus } from '../components/BatchProgressStepper';
import { STEP_TYPE_MAP } from '../constants';
import type { AIGeneratorMode, BatchResultItem } from '../types';
import { buildBatchUserInput } from '../utils/buildBatchUserInput';

interface UseBatchGenerationParams {
  mode: AIGeneratorMode;
  selectedLessonId: number | null;
  isPro: boolean;
  maxBatchSteps: number;
  selectedLlmModel: string;
  refreshSubscription: () => void;
  getOrCreateChatSession: () => string;
}

export function useBatchGeneration({
  mode,
  selectedLessonId,
  isPro,
  maxBatchSteps,
  selectedLlmModel,
  refreshSubscription,
  getOrCreateChatSession,
}: UseBatchGenerationParams) {
  const { addStep } = useCourseStore();
  const { setMode, consumePendingBatchUserInput } = useAIGeneratorStore();

  const isGeneratingBatch = useAIGeneratorExecutionStore((state) => state.isGeneratingBatch);
  const batchResults = useAIGeneratorExecutionStore((state) => state.batchResults);
  const batchPlanItems = useAIGeneratorExecutionStore((state) => state.batchPlanItems);
  const batchActiveIndex = useAIGeneratorExecutionStore((state) => state.batchActiveIndex);
  const batchHistoryRefreshKey = useAIGeneratorExecutionStore((state) => state.batchHistoryRefreshKey);
  const storeBatchPlan = useAIGeneratorExecutionStore((state) => state.batchPlan);
  const startBatchAnalyze = useAIGeneratorExecutionStore((state) => state.startBatchAnalyze);
  const startBatchGenerate = useAIGeneratorExecutionStore((state) => state.startBatchGenerate);
  const clearBatchResults = useAIGeneratorExecutionStore((state) => state.clearBatchResults);
  const storeSetBatchResults = useAIGeneratorExecutionStore((state) => state.setBatchResults);

  const setBatchResults: Dispatch<SetStateAction<BatchResultItem[]>> = useCallback((value) => {
    const current = useAIGeneratorExecutionStore.getState().batchResults;
    const next = typeof value === 'function' ? value(current) : value;
    storeSetBatchResults(next);
  }, [storeSetBatchResults]);

  const [batchUserInput, setBatchUserInput] = useState('');
  const [batchExplicitSteps, setBatchExplicitSteps] = useState<CountStepDTO[]>([]);
  const [batchPlan, setBatchPlan] = useState<BatchStepDTO | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  useEffect(() => {
    if (storeBatchPlan && !batchPlan) {
      setBatchPlan(storeBatchPlan);
    }
  }, [storeBatchPlan, batchPlan]);

  useEffect(() => {
    if (!isGeneratingBatch) {
      return;
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isGeneratingBatch]);

  const batchStepStatuses: BatchStepStatus[] = batchPlanItems.map((item, i) => {
    const result = batchResults.find((r) => r.index === item.index);
    if (result?.error) return 'error';
    if (result && !result.error) return 'done';
    if (isGeneratingBatch) {
      if (i < batchActiveIndex) return 'done';
      if (i === batchActiveIndex) return 'active';
      return 'pending';
    }
    return 'pending';
  });

  const batchProgressPercent =
    batchPlanItems.length > 0
      ? batchResults.some((r) => !r.error)
        ? 100
        : Math.min(100, Math.round(((batchActiveIndex + 1) / batchPlanItems.length) * 100))
      : 0;

  useEffect(() => {
    const pendingBatchPrompt = consumePendingBatchUserInput();
    if (!pendingBatchPrompt) return;

    setMode('batch');
    setBatchUserInput(pendingBatchPrompt);
    setBatchExplicitSteps([]);
    setBatchPlan(null);
    clearBatchResults();
  }, [consumePendingBatchUserInput, setMode, clearBatchResults]);

  useEffect(() => {
    if (mode !== 'batch') return;
    if (batchResults.length > 0 || isGeneratingBatch) return;
    let cancelled = false;

    const hydrateBatchResults = async () => {
      try {
        // If generation finished while away, store already has results
        if (useAIGeneratorExecutionStore.getState().batchResults.length > 0) {
          return;
        }
        const history = await agentApi.getBatchHistory();
        if (cancelled) return;

        const lastWithSteps = history.find((entry) => (entry.generatedSteps?.length ?? 0) > 0);
        if (!lastWithSteps?.generatedSteps?.length) return;

        setBatchUserInput(clampPromptLength(lastWithSteps.userInput, AI_PROMPT_LIMITS.batch));
        setBatchExplicitSteps(lastWithSteps.plan.steps.map((step) => ({ ...step })));
        setBatchResults(lastWithSteps.generatedSteps.map((step, index) => ({ step, index })));
      } catch {
        // empty preview is fine
      }
    };

    void hydrateBatchResults();
    return () => {
      cancelled = true;
    };
  }, [mode, batchResults.length, isGeneratingBatch, setBatchResults]);

  const resetBatchPreview = () => {
    clearBatchResults();
    setBatchPlan(null);
  };

  const handleClearBatch = async () => {
    try {
      await agentApi.clearBatchHistory();
      setBatchUserInput('');
      setBatchExplicitSteps([]);
      setBatchPlan(null);
      clearBatchResults();
      setIsPlanModalOpen(false);
      toast.success('История batch-генераций очищена');
    } catch {
      toast.error('Не удалось очистить batch-историю');
    }
  };

  const handleViewBatchSteps = (entry: BatchGenerationHistory) => {
    const steps = entry.generatedSteps ?? [];
    if (steps.length === 0) {
      toast.error('Для этой генерации нет сохранённых шагов');
      return;
    }
    setBatchExplicitSteps(entry.plan.steps.map((step) => ({ ...step })));
    setBatchUserInput(clampPromptLength(entry.userInput, AI_PROMPT_LIMITS.batch));
    setBatchResults(steps.map((step, index) => ({ step, index })));
    toast.success(`Загружено ${steps.length} шагов из истории`);
  };

  const handleRerunBatchHistory = (entry: BatchGenerationHistory) => {
    if (!selectedLessonId) {
      toast.error('Выберите урок для сохранения шагов');
      return;
    }
    setBatchPlan(entry.plan);
    setIsPlanModalOpen(true);
  };

  const handleSaveBatchSteps = async (indices: number[]) => {
    if (!selectedLessonId || indices.length === 0) {
      return;
    }

    setIsSavingBatch(true);
    let savedCount = 0;

    for (const index of indices) {
      const result = batchResults[index];
      if (!result || result.error) {
        continue;
      }

      try {
        const type = STEP_TYPE_MAP[result.step.name || 'text'] || 'TEXT';
        const newStep = await stepsApi.createStep({
          lessonId: selectedLessonId,
          type,
          content: result.step.text || '',
          stepikBlock: result.step,
        });

        addStep(newStep);
        savedCount++;
      } catch (error) {
        console.error(`Failed to save step ${index}:`, error);
        toast.error(`Ошибка при сохранении шага ${index + 1}. Сохранение остановлено.`);
        break;
      }
    }

    if (savedCount > 0) {
      toast.success(`Сохранено ${savedCount} шагов`);
      clearBatchResults();
    }

    setIsSavingBatch(false);
  };

  const handleSaveAllBatchSteps = async () => {
    const successfulIndices = batchResults
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => !r.error)
      .map(({ i }) => i);

    await handleSaveBatchSteps(successfulIndices);
  };

  const handlePlanConfirm = async (plan: BatchStepDTO) => {
    const totalSteps = countTotalBatchSteps(plan.steps);
    const limitMessage = getBatchStepLimitMessage(isPro, totalSteps, maxBatchSteps);
    if (totalSteps > maxBatchSteps) {
      toast.error(limitMessage);
      return;
    }

    setIsPlanModalOpen(false);
    setBatchPlan(plan);

    const userInputString = buildBatchUserInput(batchUserInput, batchExplicitSteps);
    await startBatchGenerate({
      sessionId: getOrCreateChatSession(),
      userInput: userInputString,
      plan,
      llmModel: selectedLlmModel || undefined,
      refreshSubscription,
    });
  };

  const handleBatchAnalyze = async () => {
    const userInputString = buildBatchUserInput(batchUserInput, batchExplicitSteps);
    if (!userInputString.trim()) {
      toast.error('Введите запрос или выберите типы шагов');
      return;
    }
    if (userInputString.length > AI_PROMPT_LIMITS.batch) {
      toast.error(getPromptLimitMessage(userInputString.length, AI_PROMPT_LIMITS.batch, 'batch-генерации'));
      return;
    }
    if (!selectedLessonId) {
      toast.error('Выберите урок для сохранения шагов');
      return;
    }

    const plan = await startBatchAnalyze({
      userInput: userInputString,
      llmModel: selectedLlmModel || undefined,
    });
    if (!plan) {
      return;
    }

    const totalSteps = countTotalBatchSteps(plan.steps);
    const limitMessage = getBatchStepLimitMessage(isPro, totalSteps, maxBatchSteps);
    if (totalSteps > maxBatchSteps) {
      toast.error(limitMessage);
    }
    setBatchPlan(plan);
    setIsPlanModalOpen(true);
  };

  return {
    batchUserInput,
    setBatchUserInput,
    batchExplicitSteps,
    setBatchExplicitSteps,
    batchPlan,
    setBatchPlan,
    isPlanModalOpen,
    setIsPlanModalOpen,
    isGeneratingBatch,
    batchResults,
    setBatchResults,
    isSavingBatch,
    batchPlanItems,
    batchStepStatuses,
    batchProgressPercent,
    batchHistoryRefreshKey,
    resetBatchPreview,
    handleClearBatch,
    handleViewBatchSteps,
    handleRerunBatchHistory,
    handleSaveBatchSteps,
    handleSaveAllBatchSteps,
    handlePlanConfirm,
    handleBatchAnalyze,
  };
}
