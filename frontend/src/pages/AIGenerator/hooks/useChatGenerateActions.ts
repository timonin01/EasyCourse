import { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { agentApi, stepsApi } from '../../../api';
import { useCourseStore, useAIGeneratorStore } from '../../../store';
import type { GeneratedStepHistory, StepikBlockRequest } from '../../../types';
import { stepikBlockToPreviewStep } from '../../../utils/stepPreview';
import { AI_PROMPT_LIMITS, getPromptLimitMessage } from '../../../constants/aiPromptLimits';
import { extractApiErrorMessage } from '../../../utils/apiError';
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
    addMessage,
  } = useAIGeneratorStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLlmModelState, setSelectedLlmModel] = useState('');
  const [lastGeneratePrompt, setLastGeneratePrompt] = useState('');
  const [generatedStepHistoryRefreshKey, setGeneratedStepHistoryRefreshKey] = useState(0);

  useEffect(() => {
    if (!canSelectModel && selectedLlmModelState) {
      setSelectedLlmModel('');
    }
  }, [canSelectModel, selectedLlmModelState]);

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
    if (options?.addUserMessage !== false) {
      addMessage(sessionId, { role: 'user', content: prompt });
    }
    setLastGeneratePrompt(prompt);
    setIsLoading(true);

    try {
      const response = await agentApi.generateStep(
        sessionId,
        prompt,
        stepType,
        selectedLlmModelState || undefined
      );
      setGeneratedStep(response);

      addMessage(sessionId, {
        role: 'assistant',
        content: `Готово! Сгенерирован шаг типа "${stepType}".\n\nПредпросмотр контента:\n${response.text?.substring(0, 200) || 'Контент сгенерирован'}...`,
        stepType,
        generatedStep: response,
      });
      setGeneratedStepHistoryRefreshKey((key) => key + 1);
      void refreshSubscription();
    } catch (error) {
      addMessage(sessionId, {
        role: 'assistant',
        content: extractApiErrorMessage(error, 'Произошла ошибка при генерации. Попробуйте ещё раз.'),
      });
      toast.error(extractApiErrorMessage(error, 'Ошибка генерации'));
      void refreshSubscription();
      console.error('AI generation error:', error);
    } finally {
      setIsLoading(false);
    }
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
    addMessage(sessionId, { role: 'user', content: input });
    setInput('');
    setIsLoading(true);

    try {
      const response = await agentApi.chat(sessionId, input, selectedLlmModelState || undefined);
      addMessage(sessionId, { role: 'assistant', content: response });
    } catch (error) {
      const message = extractApiErrorMessage(error, 'Произошла ошибка. Попробуйте ещё раз.');
      addMessage(sessionId, { role: 'assistant', content: message });
      toast.error(message);
      void refreshSubscription();
    } finally {
      setIsLoading(false);
    }
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
