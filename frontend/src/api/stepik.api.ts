import api from './axios';
import type { 
  Course, 
  Model, 
  Lesson, 
  Step, 
  CaptchaChallenge 
} from '../types';

export interface StepikSyncResult {
  id?: number;
  stepikId?: number;
  success: boolean;
  message?: string;
}

export interface SyncProgress {
  total: number;
  current: number;
  stage: 'course' | 'sections' | 'lessons' | 'steps';
  currentItem?: string;
}

export interface FullCourseResponse {
  id: number;
  userId: number;
  title: string;
  description: string;
  stepikCourseId: number;
  sections: Model[];
  lessons: Lesson[];
  steps: Step[];
}

export const stepikApi = {
  // ============ COURSES ============
  
  // Get unsynced courses
  getUnsyncedCourses: async (userId: number): Promise<Course[]> => {
    const response = await api.get<Course[]>(`/v1/stepik/unsynced-courses/${userId}`);
    return response.data;
  },

  // Sync course to Stepik (upload)
  syncCourse: async (courseId: number, captchaToken?: string): Promise<CaptchaChallenge> => {
    const params = new URLSearchParams({ courseId: courseId.toString() });
    if (captchaToken) {
      params.append('captchaToken', captchaToken);
    }
    const response = await api.post<CaptchaChallenge>(`/v1/stepik/sync-course?${params}`);
    return response.data;
  },

  // Update course in Stepik
  updateCourseInStepik: async (courseId: number): Promise<unknown> => {
    const response = await api.put(`/v1/stepik/update-course/${courseId}`);
    return response.data;
  },

  // Delete course from Stepik
  deleteCourseFromStepik: async (courseId: number): Promise<string> => {
    const response = await api.delete<string>(`/v1/stepik/delete-course/${courseId}`);
    return response.data;
  },

  // ============ SECTIONS (MODELS) ============
  
  // Get unsynced sections for course
  getUnsyncedSections: async (courseId: number): Promise<Model[]> => {
    const response = await api.get<Model[]>(`/v1/stepik/sections/unsynced-sections/${courseId}`);
    return response.data;
  },

  // Sync section to Stepik
  syncSection: async (sectionId: number): Promise<StepikSyncResult> => {
    const response = await api.post(`/v1/stepik/sections/sync-section?sectionId=${sectionId}`);
    return response.data;
  },

  // Update section in Stepik
  updateSectionInStepik: async (sectionId: number): Promise<unknown> => {
    const response = await api.put(`/v1/stepik/sections/update-section/${sectionId}`);
    return response.data;
  },

  // Delete section from Stepik (cascade)
  deleteSectionFromStepik: async (sectionId: number): Promise<string> => {
    const response = await api.delete<string>(`/v1/stepik/sections/delete-section/${sectionId}`);
    return response.data;
  },

  // Sync all sections from Stepik to local (download)
  syncAllCourseSectionsFromStepik: async (courseId: number): Promise<Model[]> => {
    const response = await api.post<Model[]>(`/v1/stepik/sections/sync-course-sections?courseId=${courseId}`);
    return response.data;
  },

  // ============ LESSONS ============
  
  // Get unsynced lessons for section
  getUnsyncedLessons: async (sectionId: number): Promise<Lesson[]> => {
    const response = await api.get<Lesson[]>(`/v1/stepik/lessons/unsynced-lessons/${sectionId}`);
    return response.data;
  },

  // Sync lesson to Stepik
  syncLesson: async (lessonId: number, captchaToken?: string): Promise<CaptchaChallenge> => {
    const params = new URLSearchParams({ lessonId: lessonId.toString() });
    if (captchaToken) {
      params.append('captchaToken', captchaToken);
    }
    const response = await api.post<CaptchaChallenge>(`/v1/stepik/lessons/sync-lesson?${params}`);
    return response.data;
  },

  // Update lesson in Stepik
  updateLessonInStepik: async (lessonId: number): Promise<unknown> => {
    const response = await api.put(`/v1/stepik/lessons/update-lesson/${lessonId}`);
    return response.data;
  },

  // Delete lesson from Stepik (cascade)
  deleteLessonFromStepik: async (lessonId: number): Promise<void> => {
    await api.delete(`/v1/stepik/lessons/delete-lesson/${lessonId}`);
  },

  // Sync all lessons from Stepik to local (download)
  syncAllSectionLessonsFromStepik: async (sectionId: number): Promise<Lesson[]> => {
    const response = await api.post<Lesson[]>(`/v1/stepik/lessons/sync-section-lessons?sectionId=${sectionId}`);
    return response.data;
  },

  // ============ STEPS ============
  
  // Sync step to Stepik
  syncStep: async (stepId: number): Promise<StepikSyncResult> => {
    const response = await api.post(`/v1/stepik/steps/sync-step?stepId=${stepId}`);
    return response.data;
  },

  // Update step in Stepik
  updateStepInStepik: async (stepId: number): Promise<unknown> => {
    const response = await api.put(`/v1/stepik/steps/update-step/${stepId}`);
    return response.data;
  },

  // Delete step from Stepik
  deleteStepFromStepik: async (stepId: number): Promise<void> => {
    await api.delete(`/v1/stepik/steps/delete-step/${stepId}`);
  },

  // Sync all steps from Stepik to local (download)
  syncAllLessonStepsFromStepik: async (lessonId: number): Promise<Step[]> => {
    const response = await api.post<Step[]>(`/v1/stepik/steps/sync-lesson-steps?lessonId=${lessonId}`);
    return response.data;
  },

  // ============ FULL SYNC ============
  
  // Upload full course to Stepik (course + all sections + all lessons + all steps)
  // NOTE: Course should already be synced before calling this method
  uploadFullCourse: async (
    _courseId: number, // Course ID (not used, course is already synced)
    sections: Model[],
    lessons: Lesson[], 
    steps: Step[],
    onProgress?: (progress: SyncProgress) => void
  ): Promise<{ success: boolean; errors: string[] }> => {
    const errors: string[] = [];
    // Course is already synced, so we don't count it in totalItems
    const totalItems = sections.length + lessons.length + steps.length;
    let currentItem = 0;

    try {
      // Course is already synced in handleUploadCourse, skip it here

      // 2. Sync all sections (sections)
      for (const section of sections) {
        onProgress?.({ total: totalItems, current: ++currentItem, stage: 'sections', currentItem: section.title });
        try {
          if (!section.stepikSectionId) {
            await stepikApi.syncSection(section.id);
          } else {
            await stepikApi.updateSectionInStepik(section.id);
          }
        } catch (err) {
          errors.push(`Модуль "${section.title}": ${err instanceof Error ? err.message : 'Ошибка'}`);
        }
      }

      // 3. Sync all lessons
      for (const lesson of lessons) {
        onProgress?.({ total: totalItems, current: ++currentItem, stage: 'lessons', currentItem: lesson.title });
        try {
          if (!lesson.stepikLessonId) {
            await stepikApi.syncLesson(lesson.id);
          } else {
            await stepikApi.updateLessonInStepik(lesson.id);
          }
        } catch (err) {
          errors.push(`Урок "${lesson.title}": ${err instanceof Error ? err.message : 'Ошибка'}`);
        }
      }

      // 4. Sync all steps
      for (const step of steps) {
        onProgress?.({ total: totalItems, current: ++currentItem, stage: 'steps', currentItem: `Шаг ${step.position}` });
        try {
          if (!step.stepikStepId) {
            await stepikApi.syncStep(step.id);
          } else {
            await stepikApi.updateStepInStepik(step.id);
          }
        } catch (err) {
          errors.push(`Шаг ${step.position}: ${err instanceof Error ? err.message : 'Ошибка'}`);
        }
      }

      return { success: errors.length === 0, errors };
    } catch (err) {
      errors.push(`Курс: ${err instanceof Error ? err.message : 'Ошибка'}`);
      return { success: false, errors };
    }
  },

  // Download full course from Stepik (course + sections + lessons + steps)
  downloadFullCourse: async (
    stepikCourseId: number
  ): Promise<{ success: boolean; course?: Course }> => {
    try {
      const response = await api.get<Course>(`/v1/stepik/full-course-from-stepik/${stepikCourseId}`);
      return { success: true, course: response.data };
    } catch (err) {
      console.error('Failed to download full course:', err);
      return { success: false };
    }
  },
};