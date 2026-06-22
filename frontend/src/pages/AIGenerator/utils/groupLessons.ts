import type { Lesson } from '../../../types';

export type LessonWithContext = Lesson & { modelTitle?: string; courseTitle?: string };

export function groupLessonsByCourse(lessons: LessonWithContext[]): Record<string, LessonWithContext[]> {
  return lessons.reduce((acc, lesson) => {
    const courseTitle = lesson.courseTitle || 'Без курса';
    if (!acc[courseTitle]) {
      acc[courseTitle] = [];
    }
    acc[courseTitle].push(lesson);
    return acc;
  }, {} as Record<string, LessonWithContext[]>);
}
