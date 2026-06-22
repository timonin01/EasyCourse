import { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { coursesApi, sectionsApi, lessonsApi } from '../../../api';
import { useAuthStore, useAIGeneratorStore } from '../../../store';
import { groupLessonsByCourse } from '../utils/groupLessons';

export function useLessonsLoader() {
  const { user } = useAuthStore();
  const { allLessons, setAllLessons } = useAIGeneratorStore();
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);

  const groupedLessons = useMemo(() => groupLessonsByCourse(allLessons), [allLessons]);

  const loadAllLessons = useCallback(async (showSuccessToast = false) => {
    if (!user?.id) return;

    setIsLoadingLessons(true);
    try {
      const courses = await coursesApi.getUserCourses(user.id);
      const allLessonsWithContext = [];

      for (const course of courses) {
        const sections = await sectionsApi.getCourseSections(course.id);
        for (const section of sections) {
          const lessons = await lessonsApi.getSectionLessons(section.id);
          for (const lesson of lessons) {
            allLessonsWithContext.push({
              ...lesson,
              modelTitle: section.title,
              courseTitle: course.title,
            });
          }
        }
      }

      setAllLessons(allLessonsWithContext);
      if (showSuccessToast) {
        toast.success('Список уроков обновлен');
      }
    } catch (error) {
      console.error('Failed to load lessons:', error);
      if (showSuccessToast) {
        toast.error('Не удалось загрузить уроки');
      }
    } finally {
      setIsLoadingLessons(false);
    }
  }, [user?.id, setAllLessons]);

  useEffect(() => {
    void loadAllLessons();
  }, [loadAllLessons]);

  useEffect(() => {
    const handleFocus = () => {
      void loadAllLessons();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadAllLessons]);

  return {
    allLessons,
    groupedLessons,
    isLoadingLessons,
    refreshLessons: () => void loadAllLessons(true),
  };
}
