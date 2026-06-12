import api from './axios';
import type { Model, CreateModelDTO, UpdateModelDTO } from '../types';

export const sectionsApi = {
  // Get section by ID
  getSection: async (sectionId: number): Promise<Model> => {
    const response = await api.get<Model>(`/v1/sections/${sectionId}`);
    return response.data;
  },

  // Get all sections for course
  getCourseSections: async (courseId: number): Promise<Model[]> => {
    const response = await api.get<Model[]>(`/v1/sections/all_sections/${courseId}`);
    return response.data;
  },

  // Create section
  createSection: async (data: CreateModelDTO): Promise<Model> => {
    const response = await api.post<Model>('/v1/sections', data);
    return response.data;
  },

  // Update section
  updateSection: async (data: UpdateModelDTO): Promise<Model> => {
    const response = await api.put<Model>('/v1/sections/update', data);
    return response.data;
  },

  // Delete section
  deleteSection: async (sectionId: number): Promise<void> => {
    await api.delete(`/v1/sections/delete/${sectionId}`);
  },

  // Stepik sync
  getUnsyncedSections: async (courseId: number): Promise<Model[]> => {
    const response = await api.get<Model[]>(`/v1/stepik/sections/unsynced-sections/${courseId}`);
    return response.data;
  },

  syncSection: async (sectionId: number): Promise<unknown> => {
    const response = await api.post(`/v1/stepik/sections/sync-section?sectionId=${sectionId}`);
    return response.data;
  },

  updateSectionInStepik: async (sectionId: number): Promise<unknown> => {
    const response = await api.put(`/v1/stepik/sections/update-section/${sectionId}`);
    return response.data;
  },

  deleteSectionFromStepik: async (sectionId: number): Promise<string> => {
    const response = await api.delete<string>(`/v1/stepik/sections/delete-section/${sectionId}`);
    return response.data;
  },

  syncAllCourseSections: async (courseId: number): Promise<Model[]> => {
    const response = await api.post<Model[]>(`/v1/stepik/sections/sync-course-sections?courseId=${courseId}`);
    return response.data;
  },
};
