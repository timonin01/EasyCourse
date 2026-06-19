import api from './axios';
import { aiRequestConfig } from '../config/api';
import type { ChatMessage, StepikBlockRequest, BatchStepDTO, BatchGenerationHistory, GeneratedStepHistory } from '../types';

export const agentApi = {
  // Chat with AI
  chat: async (sessionId: string, userInput: string, llmModel?: string): Promise<string> => {
    const params = new URLSearchParams({ sessionId });
    if (llmModel) {
      params.append('llmModel', llmModel);
    }
    const response = await api.post<string>(`/agent/chat?${params}`, userInput, {
      headers: { 'Content-Type': 'text/plain' },
      ...aiRequestConfig,
    });
    return response.data;
  },

  // Get chat history
  getHistory: async (sessionId: string): Promise<ChatMessage[]> => {
    const response = await api.get<ChatMessage[]>('/agent/sessions/history', {
      params: { sessionId },
    });
    return response.data;
  },

  // Resolve latest backend session id for a user (cross-browser history)
  getLatestSession: async (
    chatType: 'CHAT' | 'GENERATE',
    stepType?: string
  ): Promise<string | null> => {
    const response = await api.get<{ sessionId: string | null }>('/agent/sessions/latest', {
      params: stepType ? { chatType, stepType } : { chatType },
    });
    return response.data?.sessionId ?? null;
  },

  // Generate step using AI
  generateStep: async (
    sessionId: string, 
    userInput: string, 
    stepType?: string,
    llmModel?: string
  ): Promise<StepikBlockRequest> => {
    const params = new URLSearchParams({ sessionId });
    if (stepType) {
      params.append('stepType', stepType);
    }
    if (llmModel) {
      params.append('llmModel', llmModel);
    }
    const response = await api.post<StepikBlockRequest>(
      `/agent/generate-step?${params}`, 
      userInput,
      { headers: { 'Content-Type': 'text/plain' }, ...aiRequestConfig }
    );
    return response.data;
  },

  // Modify step content using AI
  modifyStepContent: async (
    sessionId: string,
    userInput: string,
    stepType: string,
    previousStepikBlockRequest: StepikBlockRequest,
    llmModel?: string
  ): Promise<StepikBlockRequest> => {
    const params = new URLSearchParams({ sessionId, stepType, userInput });
    if (llmModel) {
      params.append('llmModel', llmModel);
    }
    // Отправляем JSON как строку, чтобы контроллер мог добавить поле "name" если его нет
    const response = await api.post<StepikBlockRequest>(
      `/agent/modify-stepContent?${params}`,
      JSON.stringify(previousStepikBlockRequest),
      { 
        headers: { 
          'Content-Type': 'application/json'
        },
        ...aiRequestConfig,
      }
    );
    return response.data;
  },

  // Clear session
  clearSession: async (sessionId: string): Promise<string> => {
    const response = await api.delete<string>(`/agent/sessions/${sessionId}`);
    return response.data;
  },

  // Analyze batch request and get plan
  analyzeBatchRequest: async (userInput: string): Promise<BatchStepDTO> => {
    const response = await api.post<BatchStepDTO>(
      `/agent/analyze-batch-request`,
      userInput,
      { headers: { 'Content-Type': 'text/plain' }, ...aiRequestConfig }
    );
    return response.data;
  },

  // Generate batch steps
  generateBatchSteps: async (
    sessionId: string,
    userInput: string,
    plan?: BatchStepDTO
  ): Promise<StepikBlockRequest[]> => {
    // Если есть план, отправляем его как JSON, иначе отправляем userInput как строку
    if (plan) {
      const response = await api.post<StepikBlockRequest[]>(
        `/agent/generate-batch-steps?sessionId=${sessionId}`,
        plan,
        { headers: { 'Content-Type': 'application/json' }, ...aiRequestConfig }
      );
      return response.data;
    } else {
      const response = await api.post<StepikBlockRequest[]>(
        `/agent/generate-batch-steps?sessionId=${sessionId}`,
        userInput,
        { headers: { 'Content-Type': 'text/plain' }, ...aiRequestConfig }
      );
      return response.data;
    }
  },

  getBatchHistory: async (): Promise<BatchGenerationHistory[]> => {
    const response = await api.get<BatchGenerationHistory[]>('/agent/batch/history');
    return response.data
      .filter((entry) => entry.plan?.steps?.length)
      .map((entry) => ({
        ...entry,
        id: Number(entry.id),
      }));
  },

  clearBatchHistory: async (): Promise<string> => {
    const response = await api.delete<string>('/agent/batch/history');
    return response.data;
  },

  getGeneratedStepsHistory: async (): Promise<GeneratedStepHistory[]> => {
    const response = await api.get<GeneratedStepHistory[]>('/agent/generated-steps/history');
    return response.data
      .filter((entry) => entry.generatedStep)
      .map((entry) => ({
        ...entry,
        id: Number(entry.id),
      }));
  },

  // Direct AI chat (without agent)
  directChat: async (message: string, aiName: 'DeepSeek' | 'YandexGPT' = 'YandexGPT'): Promise<string> => {
    const response = await api.post<string>('/v1/ai/chat', { message, aiName }, aiRequestConfig);
    return response.data;
  },
};

