import api from './axios';
import type { Lesson, CreateLessonDTO, UpdateLessonDTO, CaptchaChallenge } from '../types';

export const lessonsApi = {
  // Get lesson by ID
  getLesson: async (lessonId: number): Promise<Lesson> => {
    const response = await api.get<Lesson>(`/v1/lessons/${lessonId}`);
    return response.data;
  },

  // Get all lessons for section
  getSectionLessons: async (sectionId: number): Promise<Lesson[]> => {
    const response = await api.get<Lesson[]>(`/v1/lessons/all_lessons/${sectionId}`);
    return response.data;
  },

  // Create lesson
  createLesson: async (data: CreateLessonDTO): Promise<Lesson> => {
    const response = await api.post<Lesson>('/v1/lessons', data);
    return response.data;
  },

  // Update lesson
  updateLesson: async (data: UpdateLessonDTO): Promise<Lesson> => {
    const response = await api.put<Lesson>('/v1/lessons/update', data);
    return response.data;
  },

  // Delete lesson
  deleteLesson: async (lessonId: number): Promise<void> => {
    await api.delete(`/v1/lessons/delete/${lessonId}`);
  },

  // Stepik sync
  getUnsyncedLessons: async (sectionId: number): Promise<Lesson[]> => {
    const response = await api.get<Lesson[]>(`/v1/stepik/lessons/unsynced-lessons/${sectionId}`);
    return response.data;
  },

  syncLesson: async (lessonId: number, captchaToken?: string): Promise<CaptchaChallenge> => {
    const params = new URLSearchParams({ lessonId: lessonId.toString() });
    if (captchaToken) {
      params.append('captchaToken', captchaToken);
    }
    const response = await api.post<CaptchaChallenge>(`/v1/stepik/lessons/sync-lesson?${params}`);
    return response.data;
  },

  updateLessonInStepik: async (lessonId: number): Promise<unknown> => {
    const response = await api.put(`/v1/stepik/lessons/update-lesson/${lessonId}`);
    return response.data;
  },

  deleteLessonFromStepik: async (lessonId: number): Promise<void> => {
    await api.delete(`/v1/stepik/lessons/delete-lesson/${lessonId}`);
  },

  syncAllSectionLessons: async (sectionId: number): Promise<Lesson[]> => {
    const response = await api.post<Lesson[]>(`/v1/stepik/lessons/sync-section-lessons?sectionId=${sectionId}`);
    return response.data;
  },
};

