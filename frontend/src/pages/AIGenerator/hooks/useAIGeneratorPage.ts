import { useAIGeneratorStore } from '../../../store';
import { useSubscription } from '../../../hooks/useSubscription';
import type { AIGeneratorMode } from '../types';
import { useLessonsLoader } from './useLessonsLoader';
import { useAIGeneratorSessions } from './useAIGeneratorSessions';
import { useChatGenerateActions } from './useChatGenerateActions';
import { useBatchGeneration } from './useBatchGeneration';
import { useBlockEditModal } from './useBlockEditModal';

export function useAIGeneratorPage() {
  const { mode, setMode, stepType, setStepType, generatedStep, setGeneratedStep, selectedLessonId, setSelectedLessonId } =
    useAIGeneratorStore();

  const { isPro, canSelectModel, maxBatchSteps, refresh: refreshSubscription } = useSubscription();
  const lessons = useLessonsLoader();
  const sessions = useAIGeneratorSessions(mode, stepType);

  const chatGenerate = useChatGenerateActions({
    mode,
    stepType,
    canSelectModel,
    refreshSubscription,
    getOrCreateChatSession: sessions.getOrCreateChatSession,
    getOrCreateGenerateSession: sessions.getOrCreateGenerateSession,
  });

  const batch = useBatchGeneration({
    mode,
    selectedLessonId,
    isPro,
    maxBatchSteps,
    refreshSubscription,
    getOrCreateChatSession: sessions.getOrCreateChatSession,
  });

  const blockEdit = useBlockEditModal({
    generatedStep,
    setGeneratedStep,
    batchResults: batch.batchResults,
    setBatchResults: batch.setBatchResults,
  });

  const handleModeChange = (newMode: AIGeneratorMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    if (newMode !== 'batch') {
      batch.resetBatchPreview();
    }
  };

  const handleClear = async () => {
    if (mode === 'batch') {
      await batch.handleClearBatch();
      return;
    }
    await sessions.handleClearSession();
  };

  return {
    mode,
    stepType,
    selectedLessonId,
    setSelectedLessonId,
    canSelectModel,
    ...lessons,
    ...sessions,
    ...chatGenerate,
    ...batch,
    ...blockEdit,
    handleModeChange,
    handleStepTypeChange: setStepType,
    handleClear,
    handleRefreshLessons: lessons.refreshLessons,
  };
}
