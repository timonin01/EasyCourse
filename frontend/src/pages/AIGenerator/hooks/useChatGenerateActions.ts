import { useState, useMemo, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { agentApi, stepsApi } from '../../../api';
import { useCourseStore, useAIGeneratorStore, useAIGeneratorExecutionStore } from '../../../store';
import type { GeneratedStepHistory, StepikBlockRequest } from '../../../types';
import { stepikBlockToPreviewStep } from '../../../utils/stepPreview';
import { AI_PROMPT_LIMITS, getPromptLimitMessage } from '../../../constants/aiPromptLimits';
import { readStoredLlmModel, writeStoredLlmModel } from '../../../utils/llmModelStorage';
import { STEP_TYPE_MAP } from '../constants';
import type { AIGeneratorMode } from '../types';

interface UseChatGenerateActionsParams {
  mode: AIGeneratorMode;
  stepType: string;
  canSelectModel: boolean;
  refreshSubscription: () => void;
  getOrCreateChatSession: () => string;
  getOrCreateGenerateSession: (stepType: string) => string;
}

export function useChatGenerateActions({
  mode,
  stepType,
  canSelectModel,
  refreshSubscription,
  getOrCreateChatSession,
  getOrCreateGenerateSession,
}: UseChatGenerateActionsParams) {
  const { addStep } = useCourseStore();
  const {
    generatedStep,
    setGeneratedStep,
    selectedLessonId,
    setStepType,
    setMode,
    setGenerateSession,
    setMessages,
  } = useAIGeneratorStore();

  const isLoading = useAIGeneratorExecutionStore((state) => state.isLoading);
  const lastGeneratePrompt = useAIGeneratorExecutionStore((state) => state.lastGeneratePrompt);
  const generatedStepHistoryRefreshKey = useAIGeneratorExecutionStore(
    (state) => state.generatedStepHistoryRefreshKey,
  );
  const startGenerate = useAIGeneratorExecutionStore((state) => state.startGenerate);
  const startChat = useAIGeneratorExecutionStore((state) => state.startChat);
  const setLastGeneratePrompt = useAIGeneratorExecutionStore((state) => state.setLastGeneratePrompt);

  const [input, setInput] = useState('');
  const [selectedLlmModelState, setSelectedLlmModelState] = useState(readStoredLlmModel);

  const setSelectedLlmModel = useCallback((model: string) => {
    setSelectedLlmModelState(model);
    writeStoredLlmModel(model);
  }, []);

  useEffect(() => {
    if (!canSelectModel && selectedLlmModelState) {
      setSelectedLlmModelState('');
    } else if (canSelectModel && !selectedLlmModelState) {
      const stored = readStoredLlmModel();
      if (stored) {
        setSelectedLlmModelState(stored);
      }
    }
  }, [canSelectModel, selectedLlmModelState]);

  useEffect(() => {
    if (!isLoading) {
      return;
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isLoading]);

  const previewStep = useMemo(
    () => (generatedStep ? stepikBlockToPreviewStep(generatedStep, stepType) : null),
    [generatedStep, stepType]
  );

  const runGenerateStep = async (prompt: string, options?: { addUserMessage?: boolean }) => {
    if (!prompt.trim() || isLoading) return;
    if (prompt.length > AI_PROMPT_LIMITS.generate) {
      toast.error(getPromptLimitMessage(prompt.length, AI_PROMPT_LIMITS.generate, 'генерации шага'));
      return;
    }

    const sessionId = getOrCreateGenerateSession(stepType);
    await startGenerate({
      sessionId,
      prompt,
      stepType,
      llmModel: selectedLlmModelState || undefined,
      addUserMessage: options?.addUserMessage !== false,
      refreshSubscription,
    });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const prompt = input.trim();
    setInput('');
    await runGenerateStep(prompt);
  };

  const handleRegenerate = async () => {
    if (!lastGeneratePrompt) {
      toast.error('Сначала сгенерируйте шаг');
      return;
    }
    await runGenerateStep(lastGeneratePrompt, { addUserMessage: false });
  };

  const handleRestoreGeneratedStep = (step: StepikBlockRequest) => {
    setGeneratedStep(step);
    toast.success('Шаг загружен в предпросмотр');
  };

  const handleOpenGeneratedStepFromHistory = async (entry: GeneratedStepHistory) => {
    if (mode !== 'generate') {
      setMode('generate');
    }

    setStepType(entry.stepType);
    setGenerateSession(entry.stepType, entry.sessionId);
    setGeneratedStep(entry.generatedStep);

    if (entry.userPrompt) {
      setLastGeneratePrompt(entry.userPrompt);
    }

    try {
      const history = await agentApi.getHistory(entry.sessionId);
      setMessages(entry.sessionId, history);
    } catch {
      toast.error('Не удалось загрузить чат сессии');
    }

    toast.success('Шаг открыт в предпросмотре');
  };

  const handleChat = async () => {
    if (!input.trim() || isLoading) return;
    if (input.length > AI_PROMPT_LIMITS.chat) {
      toast.error(getPromptLimitMessage(input.length, AI_PROMPT_LIMITS.chat, 'чата'));
      return;
    }

    const sessionId = getOrCreateChatSession();
    const prompt = input.trim();
    setInput('');
    await startChat({
      sessionId,
      prompt,
      llmModel: selectedLlmModelState || undefined,
      refreshSubscription,
    });
  };

  const handleSaveStep = async () => {
    if (!generatedStep || !selectedLessonId) {
      toast.error('Выберите урок для сохранения');
      return;
    }

    try {
      const newStep = await stepsApi.createStep({
        lessonId: selectedLessonId,
        type: STEP_TYPE_MAP[stepType] || 'TEXT',
        content: generatedStep.text || '',
        stepikBlock: generatedStep,
      });

      addStep(newStep);
      toast.success('Шаг сохранен!');
      setGeneratedStep(null);
    } catch (error) {
      toast.error('Не удалось сохранить шаг');
      console.error('Save step error:', error);
    }
  };

  const handleCopyContent = () => {
    if (generatedStep?.text) {
      navigator.clipboard.writeText(generatedStep.text);
      toast.success('Скопировано!');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (mode === 'generate') {
        void handleSendMessage();
      } else {
        void handleChat();
      }
    }
  };

  const handleSend = () => {
    if (mode === 'generate') {
      void handleSendMessage();
    } else {
      void handleChat();
    }
  };

  return {
    input,
    setInput,
    isLoading,
    selectedLlmModel: selectedLlmModelState,
    setSelectedLlmModel,
    lastGeneratePrompt,
    generatedStepHistoryRefreshKey,
    generatedStep,
    previewStep,
    handleRegenerate,
    handleRestoreGeneratedStep,
    handleOpenGeneratedStepFromHistory,
    handleSaveStep,
    handleCopyContent,
    handleKeyPress,
    handleSend,
  };
}
