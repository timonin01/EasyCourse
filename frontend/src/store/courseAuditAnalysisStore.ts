import { create } from 'zustand';
import toast from 'react-hot-toast';
import { agentApi } from '../api';
import { extractApiErrorMessage } from '../utils/apiError';
import {
  readStoredCourseAudit,
  writeStoredCourseAudit,
} from '../utils/courseAuditStorage';

type CourseAuditAnalysisState = {
  isAnalyzing: boolean;
  analyzingCourseId: string | null;
  startAnalysis: (params: {
    userId: number;
    courseId: string;
    refreshSubscription: () => Promise<unknown>;
  }) => Promise<boolean>;
};

export const useCourseAuditAnalysisStore = create<CourseAuditAnalysisState>((set, get) => ({
  isAnalyzing: false,
  analyzingCourseId: null,

  startAnalysis: async ({ userId, courseId, refreshSubscription }) => {
    if (get().isAnalyzing) {
      toast.error('Аудит уже выполняется. Дождитесь завершения.');
      return false;
    }

    const previous = readStoredCourseAudit(userId);
    set({ isAnalyzing: true, analyzingCourseId: courseId });
    writeStoredCourseAudit(userId, {
      selectedCourseId: courseId,
      auditedCourseId: null,
      analyzeResult: null,
      hintLessonIds: {},
      activeTab: 'report',
    });

    try {
      const response = await agentApi.analyzeCourse(Number(courseId));
      writeStoredCourseAudit(userId, {
        selectedCourseId: courseId,
        auditedCourseId: courseId,
        analyzeResult: response.analyzeResult,
        hintLessonIds: {},
        activeTab: 'report',
      });
      set({ isAnalyzing: false, analyzingCourseId: null });
      try {
        await refreshSubscription();
      } catch {
        // subscription refresh is best-effort
      }
      toast.success('Аудит курса завершён');
      return true;
    } catch (error) {
      writeStoredCourseAudit(userId, {
        selectedCourseId: courseId,
        auditedCourseId: previous?.analyzeResult ? previous.auditedCourseId : null,
        analyzeResult: previous?.analyzeResult ?? null,
        hintLessonIds: previous?.hintLessonIds ?? {},
        activeTab: previous?.activeTab ?? 'report',
      });
      set({ isAnalyzing: false, analyzingCourseId: null });
      toast.error(extractApiErrorMessage(error, 'Не удалось выполнить аудит курса'));
      return false;
    }
  },
}));
