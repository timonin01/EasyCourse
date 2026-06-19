import api from './axios';
import { aiRequestConfig } from '../config/api';
import type {
  Step,
  CreateStepDTO,
  UpdateStepDTO,
  StepType,
  StepikStepSourceResponseData,
} from '../types';

export const stepsApi = {
  // Get step by ID
  getStep: async (stepId: number): Promise<Step> => {
    const response = await api.get<Step>(`/v1/steps/${stepId}`);
    return response.data;
  },

  // Get all steps for lesson
  getLessonSteps: async (lessonId: number): Promise<Step[]> => {
    const response = await api.get<Step[]>(`/v1/steps/all_steps/${lessonId}`);
    return response.data;
  },

  // Create step
  createStep: async (data: CreateStepDTO): Promise<Step> => {
    const response = await api.post<Step>('/v1/steps', data);
    return response.data;
  },

  updateStep: async (data: UpdateStepDTO): Promise<Step> => {
    const response = await api.put<Step>('/v1/steps/update', data);
    return response.data;
  },

  changeStepType: async (stepId: number, newStepType: StepType, sessionId: string): Promise<Step> => {
    const response = await api.put<Step>(
      `/v1/steps/change-stepType?stepId=${stepId}&newStepType=${newStepType}&sessionId=${sessionId}`,
      undefined,
      aiRequestConfig
    );
    return response.data;
  },

  deleteStep: async (stepId: number): Promise<void> => {
    await api.delete(`/v1/steps/delete/${stepId}`);
  },

  // Stepik sync
  syncStep: async (stepId: number): Promise<unknown> => {
    const response = await api.post(`/v1/stepik/steps/sync-step?stepId=${stepId}`);
    return response.data;
  },

  updateStepInStepik: async (stepId: number): Promise<unknown> => {
    const response = await api.put(`/v1/stepik/steps/update-step/${stepId}`);
    return response.data;
  },

  deleteStepFromStepik: async (stepId: number): Promise<void> => {
    await api.delete(`/v1/stepik/steps/delete-step/${stepId}`);
  },

  syncAllLessonSteps: async (lessonId: number): Promise<Step[]> => {
    const response = await api.post<Step[]>(`/v1/stepik/steps/sync-lesson-steps?lessonId=${lessonId}`);
    return response.data;
  },

  getStepFromStepik: async (stepId: number): Promise<StepikStepSourceResponseData> => {
    const response = await api.get<StepikStepSourceResponseData>(
      `/v1/stepik/steps/get-sync-step?stepId=${stepId}`
    );
    return response.data;
  },
};

