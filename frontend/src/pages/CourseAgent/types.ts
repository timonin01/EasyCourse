import type { Lesson, Model, Step } from '../../types';

export type CourseTreeLessonNode = {
  lesson: Lesson;
  steps: Step[] | null;
  stepsLoading: boolean;
};

export type CourseTreeSectionNode = {
  section: Model;
  lessons: CourseTreeLessonNode[];
  lessonsLoading: boolean;
};

export type CourseTreeSelection = {
  type: 'section' | 'lesson' | 'step';
  id: number;
};

export type CourseTreeHighlight = {
  sectionIds: Set<number>;
  lessonIds: Set<number>;
  stepIds: Set<number>;
};
