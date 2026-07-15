import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { agentApi, stepsApi } from '../../api';
import { useSubscription } from '../../hooks/useSubscription';
import { useAIGeneratorStore } from '../../store';
import type { Step, StepikBlockRequest, UpdateStepDTO } from '../../types';
import { getStepBlockName } from '../../types';
import { extractApiErrorMessage } from '../../utils/apiError';
import { AI_PROMPT_LIMITS, getPromptLimitMessage } from '../../constants/aiPromptLimits';
import { useStepBlockEdit } from '../CourseEditor/hooks/useStepBlockEdit';
import { EDIT_TASK_BLOCK_NAMES, stepTypeToAIString } from '../CourseEditor/types';

interface UseAgentStepEditParams {
  onStepUpdated: (step: Step) => void;
  onStepCreated?: (step: Step) => void;
}

export function useAgentStepEdit({ onStepUpdated, onStepCreated }: UseAgentStepEditParams) {
  const { canSelectModel, refresh: refreshSubscription } = useSubscription();
  const { getOrCreateGenerateSession } = useAIGeneratorStore();

  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isAiEditOpen, setIsAiEditOpen] = useState(false);
  const [contentEditData, setContentEditData] = useState<{
    userInput: string;
    generatedContent: StepikBlockRequest | null;
  }>({ userInput: '', generatedContent: null });
  const [selectedLlmModel, setSelectedLlmModel] = useState('');
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);

  const applyStepUpdate = useCallback((step: Step) => {
    setEditingStep(step);
    onStepUpdated(step);
  }, [onStepUpdated]);

  const blockEdit = useStepBlockEdit({
    applyStepUpdate,
    applyStepCreate: (step) => {
      setEditingStep(step);
      onStepCreated?.(step);
    },
    onSaved: (_step, mode) => {
      if (mode === 'update') setIsViewOpen(false);
    },
  });

  const openEdit = useCallback((step: Step) => {
    setEditingStep(step);
    setIsViewOpen(true);
  }, []);

  const closeView = useCallback(() => {
    setIsViewOpen(false);
  }, []);

  const openAiEdit = useCallback(() => {
    if (!editingStep) return;
    setContentEditData({ userInput: '', generatedContent: null });
    setSelectedLlmModel('');
    setIsAiEditOpen(true);
    setIsViewOpen(false);
  }, [editingStep]);

  const openBlockEdit = useCallback(() => {
    if (!editingStep) return;
    blockEdit.openStepBlockEdit(editingStep);
    setIsViewOpen(false);
  }, [blockEdit, editingStep]);

  const canEditTask = editingStep
    ? (EDIT_TASK_BLOCK_NAMES as readonly string[]).includes(getStepBlockName(editingStep))
    : false;

  const isCodeBlock = editingStep ? getStepBlockName(editingStep) === 'code' : false;

  const handleGenerateNewContent = useCallback(async () => {
    if (!editingStep || !contentEditData.userInput.trim()) {
      toast.error('Введите запрос для изменения контента');
      return;
    }
    if (contentEditData.userInput.length > AI_PROMPT_LIMITS.generate) {
      toast.error(getPromptLimitMessage(
        contentEditData.userInput.length,
        AI_PROMPT_LIMITS.generate,
        'генерации шага',
      ));
      return;
    }

    setIsGeneratingContent(true);
    try {
      const aiStepType = stepTypeToAIString(editingStep.type);
      const sessionId = getOrCreateGenerateSession(aiStepType);

      let previousStepikBlock: StepikBlockRequest | null = null;
      if (editingStep.stepikBlockData) {
        try {
          const parsed = typeof editingStep.stepikBlockData === 'string'
            ? JSON.parse(editingStep.stepikBlockData)
            : editingStep.stepikBlockData;
          previousStepikBlock = parsed as StepikBlockRequest;
        } catch (error) {
          console.error('Failed to parse stepikBlockData:', error);
        }
      }

      if (!previousStepikBlock) {
        toast.error('Не удалось получить текущий контент шага');
        return;
      }

      toast.loading('Генерация нового контента...', { id: 'agent-generate-content' });
      const generatedContent = await agentApi.modifyStepContent(
        sessionId,
        contentEditData.userInput,
        aiStepType,
        previousStepikBlock,
        selectedLlmModel || undefined,
      );

      setContentEditData((prev) => ({ ...prev, generatedContent }));
      toast.success('Контент сгенерирован!', { id: 'agent-generate-content' });
      void refreshSubscription();
    } catch (error) {
      toast.error(
        extractApiErrorMessage(error, 'Не удалось сгенерировать контент'),
        { id: 'agent-generate-content' },
      );
      void refreshSubscription();
    } finally {
      setIsGeneratingContent(false);
    }
  }, [
    contentEditData.userInput,
    editingStep,
    getOrCreateGenerateSession,
    refreshSubscription,
    selectedLlmModel,
  ]);

  const handleSaveContentChanges = useCallback(async () => {
    if (!editingStep || !contentEditData.generatedContent) {
      toast.error('Сначала сгенерируйте новый контент');
      return;
    }

    setIsSavingContent(true);
    try {
      const updateData: UpdateStepDTO = {
        stepId: editingStep.id,
        stepikBlock: contentEditData.generatedContent,
      };
      const updatedStep = await stepsApi.updateStep(updateData);
      applyStepUpdate(updatedStep);
      toast.success('Контент шага обновлен!');
      setIsAiEditOpen(false);
      setContentEditData({ userInput: '', generatedContent: null });
      setSelectedLlmModel('');
    } catch (error) {
      toast.error('Не удалось обновить контент');
      console.error('Failed to update step content:', error);
    } finally {
      setIsSavingContent(false);
    }
  }, [applyStepUpdate, contentEditData.generatedContent, editingStep]);

  return {
    editingStep,
    isViewOpen,
    openEdit,
    closeView,
    canEditTask,
    isCodeBlock,
    openBlockEdit,
    openAiEdit,
    canSelectModel,
    isAiEditOpen,
    setIsAiEditOpen,
    contentEditData,
    setContentEditData,
    selectedLlmModel,
    setSelectedLlmModel,
    isGeneratingContent,
    isSavingContent,
    handleGenerateNewContent,
    handleSaveContentChanges,
    blockEdit,
  };
}
