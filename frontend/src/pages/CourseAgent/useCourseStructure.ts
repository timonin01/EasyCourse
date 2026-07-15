import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { lessonsApi, sectionsApi, stepsApi } from '../../api';
import type { Lesson, Model, Step } from '../../types';
import type { CourseTreeSectionNode } from './types';

export function useCourseStructure(courseId: number | null) {
  const [sections, setSections] = useState<CourseTreeSectionNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<number>>(new Set());

  const loadStructure = useCallback(async () => {
    if (!courseId) {
      setSections([]);
      return;
    }

    setIsLoading(true);
    try {
      const courseSections = await sectionsApi.getCourseSections(courseId);
      const sortedSections = [...courseSections].sort((a, b) => a.position - b.position);

      const nodes: CourseTreeSectionNode[] = await Promise.all(
        sortedSections.map(async (section) => {
          const lessons = await lessonsApi.getSectionLessons(section.id);
          return {
            section,
            lessonsLoading: false,
            lessons: [...lessons]
              .sort((a, b) => a.position - b.position)
              .map((lesson) => ({
                lesson,
                steps: null,
                stepsLoading: false,
              })),
          };
        }),
      );

      setSections(nodes);
    } catch (error) {
      console.error('Failed to load course structure:', error);
      toast.error('Не удалось загрузить структуру курса');
      setSections([]);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void loadStructure();
  }, [loadStructure]);

  const loadLessonSteps = useCallback(async (lessonId: number) => {
    setSections((prev) => prev.map((sectionNode) => ({
      ...sectionNode,
      lessons: sectionNode.lessons.map((lessonNode) => (
        lessonNode.lesson.id === lessonId
          ? { ...lessonNode, stepsLoading: true }
          : lessonNode
      )),
    })));

    try {
      const steps = await stepsApi.getLessonSteps(lessonId);
      const sortedSteps = [...steps].sort((a, b) => a.position - b.position);
      setSections((prev) => prev.map((sectionNode) => ({
        ...sectionNode,
        lessons: sectionNode.lessons.map((lessonNode) => (
          lessonNode.lesson.id === lessonId
            ? { ...lessonNode, steps: sortedSteps, stepsLoading: false }
            : lessonNode
        )),
      })));
    } catch (error) {
      console.error('Failed to load lesson steps:', error);
      toast.error('Не удалось загрузить шаги урока');
      setSections((prev) => prev.map((sectionNode) => ({
        ...sectionNode,
        lessons: sectionNode.lessons.map((lessonNode) => (
          lessonNode.lesson.id === lessonId
            ? { ...lessonNode, stepsLoading: false }
            : lessonNode
        )),
      })));
    }
  }, []);

  const toggleSection = useCallback((sectionId: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const toggleLesson = useCallback((lessonId: number, isExpanded: boolean) => {
    setExpandedLessons((prev) => {
      const next = new Set(prev);
      if (isExpanded) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }
      return next;
    });

    if (!isExpanded) {
      const lessonNode = sections
        .flatMap((sectionNode) => sectionNode.lessons)
        .find((item) => item.lesson.id === lessonId);
      if (lessonNode && lessonNode.steps === null && !lessonNode.stepsLoading) {
        void loadLessonSteps(lessonId);
      }
    }
  }, [loadLessonSteps, sections]);

  const patchSection = useCallback((sectionId: number, updater: (section: Model) => Model) => {
    setSections((prev) => prev.map((sectionNode) => (
      sectionNode.section.id === sectionId
        ? { ...sectionNode, section: updater(sectionNode.section) }
        : sectionNode
    )));
  }, []);

  const patchLesson = useCallback((lessonId: number, updater: (lesson: Lesson) => Lesson) => {
    setSections((prev) => prev.map((sectionNode) => ({
      ...sectionNode,
      lessons: sectionNode.lessons.map((lessonNode) => (
        lessonNode.lesson.id === lessonId
          ? { ...lessonNode, lesson: updater(lessonNode.lesson) }
          : lessonNode
      )),
    })));
  }, []);

  const patchStep = useCallback((stepId: number, updated: Step) => {
    setSections((prev) => prev.map((sectionNode) => ({
      ...sectionNode,
      lessons: sectionNode.lessons.map((lessonNode) => (
        lessonNode.steps?.some((step) => step.id === stepId)
          ? {
              ...lessonNode,
              steps: lessonNode.steps.map((step) => (step.id === stepId ? updated : step)),
            }
          : lessonNode
      )),
    })));
  }, []);

  const removeSection = useCallback((sectionId: number) => {
    setSections((prev) => prev.filter((sectionNode) => sectionNode.section.id !== sectionId));
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.delete(sectionId);
      return next;
    });
  }, []);

  const removeLesson = useCallback((lessonId: number) => {
    setSections((prev) => prev.map((sectionNode) => ({
      ...sectionNode,
      lessons: sectionNode.lessons.filter((lessonNode) => lessonNode.lesson.id !== lessonId),
    })));
    setExpandedLessons((prev) => {
      const next = new Set(prev);
      next.delete(lessonId);
      return next;
    });
  }, []);

  const removeStep = useCallback((stepId: number) => {
    setSections((prev) => prev.map((sectionNode) => ({
      ...sectionNode,
      lessons: sectionNode.lessons.map((lessonNode) => (
        lessonNode.steps?.some((step) => step.id === stepId)
          ? {
              ...lessonNode,
              steps: lessonNode.steps
                .filter((step) => step.id !== stepId)
                .map((step, index) => ({ ...step, position: index + 1 })),
            }
          : lessonNode
      )),
    })));
  }, []);

  const addSection = useCallback((section: Model) => {
    setSections((prev) => {
      const next = [...prev, {
        section,
        lessonsLoading: false,
        lessons: [] as CourseTreeSectionNode['lessons'],
      }];
      return next.sort((a, b) => a.section.position - b.section.position);
    });
    setExpandedSections((prev) => new Set(prev).add(section.id));
  }, []);

  const addLesson = useCallback((lesson: Lesson) => {
    setSections((prev) => prev.map((sectionNode) => {
      if (sectionNode.section.id !== lesson.sectionId) {
        return sectionNode;
      }
      const lessons = [
        ...sectionNode.lessons,
        { lesson, steps: [] as Step[], stepsLoading: false },
      ].sort((a, b) => a.lesson.position - b.lesson.position);
      return { ...sectionNode, lessons };
    }));
    setExpandedSections((prev) => new Set(prev).add(lesson.sectionId));
  }, []);

  const addStep = useCallback((step: Step) => {
    setSections((prev) => prev.map((sectionNode) => ({
      ...sectionNode,
      lessons: sectionNode.lessons.map((lessonNode) => {
        if (lessonNode.lesson.id !== step.lessonId) {
          return lessonNode;
        }
        const current = lessonNode.steps ?? [];
        const steps = [...current.filter((item) => item.id !== step.id), step]
          .sort((a, b) => a.position - b.position);
        return { ...lessonNode, steps, stepsLoading: false };
      }),
    })));
    setExpandedLessons((prev) => new Set(prev).add(step.lessonId));
  }, []);

  const expandToNode = useCallback((
    type: 'section' | 'lesson' | 'step',
    id: number,
  ) => {
    for (const sectionNode of sections) {
      if (type === 'section' && sectionNode.section.id === id) {
        setExpandedSections((prev) => new Set(prev).add(id));
        return;
      }

      for (const lessonNode of sectionNode.lessons) {
        if (type === 'lesson' && lessonNode.lesson.id === id) {
          setExpandedSections((prev) => new Set(prev).add(sectionNode.section.id));
          setExpandedLessons((prev) => new Set(prev).add(id));
          if (lessonNode.steps === null && !lessonNode.stepsLoading) {
            void loadLessonSteps(id);
          }
          return;
        }

        if (type === 'step' && lessonNode.steps?.some((step) => step.id === id)) {
          setExpandedSections((prev) => new Set(prev).add(sectionNode.section.id));
          setExpandedLessons((prev) => new Set(prev).add(lessonNode.lesson.id));
          if (lessonNode.steps === null && !lessonNode.stepsLoading) {
            void loadLessonSteps(lessonNode.lesson.id);
          }
          return;
        }
      }
    }
  }, [loadLessonSteps, sections]);

  return {
    sections,
    isLoading,
    expandedSections,
    expandedLessons,
    loadStructure,
    toggleSection,
    toggleLesson,
    expandToNode,
    patchSection,
    patchLesson,
    patchStep,
    addSection,
    addLesson,
    addStep,
    removeSection,
    removeLesson,
    removeStep,
  };
}
