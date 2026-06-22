import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { agentApi } from '../../../api';
import { useAIGeneratorStore } from '../../../store';
import { AI_PROMPT_LIMITS } from '../../../constants/aiPromptLimits';
import type { AIGeneratorMode } from '../types';

export function useAIGeneratorSessions(mode: AIGeneratorMode, stepType: string) {
  const {
    getOrCreateChatSession,
    setChatSession,
    getOrCreateGenerateSession,
    setGenerateSession,
    getMessages,
    setMessages,
    clearSession,
    setGeneratedStep,
  } = useAIGeneratorStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSessionId =
    mode === 'chat'
      ? getOrCreateChatSession()
      : mode === 'generate'
        ? getOrCreateGenerateSession(stepType)
        : getOrCreateChatSession();

  const messages = mode === 'batch' ? [] : getMessages(currentSessionId);
  const promptMaxLength = mode === 'chat' ? AI_PROMPT_LIMITS.chat : AI_PROMPT_LIMITS.generate;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (mode === 'batch') return;
    let cancelled = false;

    const adoptLatestSession = async () => {
      try {
        const chatType = mode === 'chat' ? 'CHAT' : 'GENERATE';
        const latest = await agentApi.getLatestSession(chatType, mode === 'generate' ? stepType : undefined);
        if (cancelled || !latest) return;

        if (mode === 'chat') {
          if (latest !== getOrCreateChatSession()) {
            setChatSession(latest);
          }
        } else if (latest !== getOrCreateGenerateSession(stepType)) {
          setGenerateSession(stepType, latest);
        }
      } catch {
        // keep local session if backend has none
      }
    };

    void adoptLatestSession();
    return () => {
      cancelled = true;
    };
  }, [mode, stepType, getOrCreateChatSession, getOrCreateGenerateSession, setChatSession, setGenerateSession]);

  useEffect(() => {
    if (mode === 'batch') return;
    let cancelled = false;

    const loadHistory = async () => {
      try {
        const history = await agentApi.getHistory(currentSessionId);
        if (cancelled) return;

        setMessages(currentSessionId, history);

        if (mode === 'generate') {
          const lastWithStep = [...history]
            .reverse()
            .find((message) => message.role === 'assistant' && message.generatedStep);
          setGeneratedStep(lastWithStep?.generatedStep ?? null);
        }
      } catch {
        if (!cancelled) {
          setMessages(currentSessionId, []);
        }
      }
    };

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [currentSessionId, mode, setMessages, setGeneratedStep]);

  const handleClearSession = async () => {
    try {
      await agentApi.clearSession(currentSessionId);
      clearSession(currentSessionId);
      if (mode === 'generate') {
        setGeneratedStep(null);
      }
      toast.success('Сессия очищена');
    } catch {
      toast.error('Не удалось очистить сессию');
    }
  };

  return {
    messagesEndRef,
    currentSessionId,
    messages,
    promptMaxLength,
    handleClearSession,
    getOrCreateChatSession,
    getOrCreateGenerateSession,
  };
}
