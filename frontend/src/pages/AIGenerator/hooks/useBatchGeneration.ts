import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { agentApi, stepsApi } from '../../../api';
import { useCourseStore, useAIGeneratorStore } from '../../../store';
import type { BatchStepDTO, CountStepDTO, StepikBlockRequest, BatchGenerationHistory } from '../../../types';
import { countTotalBatchSteps, expandBatchPlanToItems, type BatchPlanItem } from '../../../utils/batchSteps';
import { getBatchStepLimitMessage } from '../../../constants/batchLimits';
import { AI_PROMPT_LIMITS, getPromptLimitMessage, clampPromptLength } from '../../../constants/aiPromptLimits';
import type { BatchStepStatus } from '../components/BatchProgressStepper';
import { STEP_TYPE_MAP } from '../constants';
import type { AIGeneratorMode, BatchResultItem } from '../types';
import { buildBatchUserInput } from '../utils/buildBatchUserInput';
import { parseBatchGenerationError } from '../utils/parseBatchError';

interface UseBatchGenerationParams {
  mode: AIGeneratorMode;
  selectedLessonId: number | null;
  isPro: boolean;
  maxBatchSteps: number;
  refreshSubscription: () => void;
  getOrCreateChatSession: () => string;
}

export function useBatchGeneration({
  mode,
  selectedLessonId,
  isPro,
  maxBatchSteps,
  refreshSubscription,
  getOrCreateChatSession,
}: UseBatchGenerationParams) {
  const { addStep } = useCourseStore();
  const { setMode, consumePendingBatchUserInput } = useAIGeneratorStore();

  const [batchUserInput, setBatchUserInput] = useState('');
  const [batchExplicitSteps, setBatchExplicitSteps] = useState<CountStepDTO[]>([]);
  const [batchPlan, setBatchPlan] = useState<BatchStepDTO | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchResultItem[]>([]);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [batchPlanItems, setBatchPlanItems] = useState<BatchPlanItem[]>([]);
  const [batchActiveIndex, setBatchActiveIndex] = useState(0);
  const [batchHistoryRefreshKey, setBatchHistoryRefreshKey] = useState(0);

  useEffect(() => {
    if (!isGeneratingBatch || batchPlanItems.length === 0) return;
    const interval = setInterval(() => {
      setBatchActiveIndex((prev) => (prev >= batchPlanItems.length - 1 ? prev : prev + 1));
    }, 3500);
    return () => clearInterval(interval);
  }, [isGeneratingBatch, batchPlanItems.length]);

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
    setBatchResults([]);
    setBatchPlanItems([]);
    setBatchActiveIndex(0);
  }, [consumePendingBatchUserInput, setMode]);

  useEffect(() => {
    if (mode !== 'batch') return;
    if (batchResults.length > 0 || isGeneratingBatch) return;
    let cancelled = false;

    const hydrateBatchResults = async () => {
      try {
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
  }, [mode, batchResults.length, isGeneratingBatch]);

  const resetBatchPreview = () => {
    setBatchResults([]);
    setBatchPlan(null);
  };

  const handleClearBatch = async () => {
    try {
      await agentApi.clearBatchHistory();
      setBatchUserInput('');
      setBatchExplicitSteps([]);
      setBatchPlan(null);
      setBatchResults([]);
      setBatchPlanItems([]);
      setBatchActiveIndex(0);
      setIsPlanModalOpen(false);
      setBatchHistoryRefreshKey((key) => key + 1);
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
      setBatchResults([]);
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

    const planItems = expandBatchPlanToItems(plan);
    setBatchPlanItems(planItems);
    setBatchActiveIndex(0);

    const userInputString = buildBatchUserInput(batchUserInput, batchExplicitSteps);
    setIsGeneratingBatch(true);
    setBatchResults([]);

    try {
      const sessionId = getOrCreateChatSession();
      const results = await agentApi.generateBatchSteps(sessionId, userInputString, plan);

      setBatchResults(results.map((step, index) => ({ step, index })));
      setBatchActiveIndex(planItems.length - 1);
      toast.success(`Сгенерировано ${results.length} шагов`);
      void refreshSubscription();
    } catch (error) {
      console.error('Batch generation error:', error);
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

      setBatchResults([{
        step: {} as StepikBlockRequest,
        index: 0,
        error: fullErrorMessage,
      }]);
    } finally {
      setIsGeneratingBatch(false);
      setBatchHistoryRefreshKey((key) => key + 1);
    }
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

    try {
      setIsGeneratingBatch(true);
      const plan = await agentApi.analyzeBatchRequest(userInputString);
      const totalSteps = countTotalBatchSteps(plan.steps);
      const limitMessage = getBatchStepLimitMessage(isPro, totalSteps, maxBatchSteps);
      if (totalSteps > maxBatchSteps) {
        toast.error(limitMessage);
      }
      setBatchPlan(plan);
      setIsPlanModalOpen(true);
    } catch (error) {
      console.error('Error analyzing batch request:', error);
      toast.error('Ошибка при анализе запроса');
    } finally {
      setIsGeneratingBatch(false);
    }
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
