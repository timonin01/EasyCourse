import api from './axios';
import type { Course, CreateCourseDTO, UpdateCourseDTO, CaptchaChallenge } from '../types';

export const coursesApi = {
  // Get course by ID
  getCourse: async (courseId: number): Promise<Course> => {
    const response = await api.get<Course>(`/v1/courses/${courseId}`);
    return response.data;
  },

  // Get all courses for user
  getUserCourses: async (userId: number): Promise<Course[]> => {
    const response = await api.get<Course[]>(`/v1/courses/all_courses/${userId}`);
    return response.data;
  },

  // Create course
  createCourse: async (data: CreateCourseDTO): Promise<Course> => {
    const response = await api.post<Course>('/v1/courses', data);
    return response.data;
  },

  // Update course
  updateCourse: async (data: UpdateCourseDTO): Promise<Course> => {
    const response = await api.put<Course>('/v1/courses/update', data);
    return response.data;
  },

  // Delete course
  deleteCourse: async (courseId: number): Promise<void> => {
    await api.delete(`/v1/courses/delete/${courseId}`);
  },

  // Stepik sync
  getUnsyncedCourses: async (userId: number): Promise<Course[]> => {
    const response = await api.get<Course[]>(`/v1/stepik/unsynced-courses/${userId}`);
    return response.data;
  },

  syncCourse: async (courseId: number, captchaToken?: string): Promise<CaptchaChallenge> => {
    const params = new URLSearchParams({ courseId: courseId.toString() });
    if (captchaToken) {
      params.append('captchaToken', captchaToken);
    }
    const response = await api.post<CaptchaChallenge>(`/v1/stepik/sync-course?${params}`);
    return response.data;
  },

  updateCourseInStepik: async (courseId: number): Promise<unknown> => {
    const response = await api.put(`/v1/stepik/update-course/${courseId}`);
    return response.data;
  },

  deleteCourseFromStepik: async (courseId: number): Promise<string> => {
    const response = await api.delete<string>(`/v1/stepik/delete-course/${courseId}`);
    return response.data;
  },
};

