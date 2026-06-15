import { create } from 'zustand';
import type { Course, Model, Lesson, Step } from '../types';

/**
 * Пересчитывает множества уроков/секций, в которых есть невыгруженные шаги
 * (шаги без stepikStepId). Секция считается по урокам, которые сейчас загружены.
 */
function computeNewSteps(
  lessons: Lesson[],
  prevLessonsWithNewSteps: Set<number>,
  prevSectionsWithNewSteps: Set<number>,
  lessonId: number | undefined,
  stepsForLesson: Step[]
): { lessonsWithNewSteps: Set<number>; sectionsWithNewSteps: Set<number> } {
  const lessonsWithNewSteps = new Set(prevLessonsWithNewSteps);
  const sectionsWithNewSteps = new Set(prevSectionsWithNewSteps);

  if (lessonId === undefined) {
    return { lessonsWithNewSteps, sectionsWithNewSteps };
  }

  const hasNew = stepsForLesson.some((s) => s.lessonId === lessonId && !s.stepikStepId);
  if (hasNew) {
    lessonsWithNewSteps.add(lessonId);
  } else {
    lessonsWithNewSteps.delete(lessonId);
  }

  const lesson = lessons.find((l) => l.id === lessonId);
  if (lesson) {
    const sectionHasNew = lessons.some(
      (l) => l.sectionId === lesson.sectionId && lessonsWithNewSteps.has(l.id)
    );
    if (sectionHasNew) {
      sectionsWithNewSteps.add(lesson.sectionId);
    } else {
      sectionsWithNewSteps.delete(lesson.sectionId);
    }
  }

  return { lessonsWithNewSteps, sectionsWithNewSteps };
}

interface CourseState {
  selectedCourse: Course | null;
  selectedModel: Model | null;
  selectedLesson: Lesson | null;
  selectedStep: Step | null;
  
  courses: Course[];
  sections: Model[];
  lessons: Lesson[];
  steps: Step[];
  
  unsyncedSteps: Set<number>;
  unsyncedLessons: Set<number>;
  unsyncedSections: Set<number>;

  // Уроки/секции, содержащие хотя бы один ещё не выгруженный на Stepik шаг
  lessonsWithNewSteps: Set<number>;
  sectionsWithNewSteps: Set<number>;
  
  // Последние синхронизированные позиции (entityId -> position)
  syncedModelPositions: Map<number, number>;
  syncedLessonPositions: Map<number, number>;
  syncedStepPositions: Map<number, number>;
  
  setSelectedCourse: (course: Course | null) => void;
  setSelectedModel: (section: Model | null) => void;
  setSelectedLesson: (lesson: Lesson | null) => void;
  setSelectedStep: (step: Step | null) => void;
  
  setCourses: (courses: Course[]) => void;
  setModels: (sections: Model[]) => void;
  setLessons: (lessons: Lesson[]) => void;
  setSteps: (steps: Step[]) => void;
  
  addCourse: (course: Course) => void;
  updateCourse: (course: Course) => void;
  removeCourse: (courseId: number) => void;
  
  addModel: (section: Model) => void;
  updateModel: (section: Model) => void;
  removeModel: (modelId: number) => void;
  reorderModels: (sections: Model[]) => void;
  
  addLesson: (lesson: Lesson) => void;
  updateLesson: (lesson: Lesson) => void;
  removeLesson: (lessonId: number) => void;
  reorderLessons: (lessons: Lesson[]) => void;
  
  addStep: (step: Step) => void;
  updateStep: (step: Step) => void;
  removeStep: (stepId: number) => void;
  reorderSteps: (steps: Step[]) => void;
  
  markStepAsUnsynced: (stepId: number, lessonId: number, modelId: number) => void;
  markStepAsSynced: (stepId: number) => void;
  markLessonAsUnsynced: (lessonId: number, modelId: number) => void;
  markLessonAsSynced: (lessonId: number) => void;
  markModelAsUnsynced: (modelId: number) => void;
  markModelAsSynced: (modelId: number) => void;
  
  // Сохранение синхронизированных позиций
  saveSyncedModelPositions: (sections: Model[]) => void;
  saveSyncedLessonPositions: (lessons: Lesson[]) => void;
  saveSyncedStepPositions: (steps: Step[]) => void;
  
  // Проверка и пометка изменений позиций
  checkAndMarkPositionChanges: () => void;
  
  clearSelection: () => void;
}

export const useCourseStore = create<CourseState>((set) => ({
  selectedCourse: null,
  selectedModel: null,
  selectedLesson: null,
  selectedStep: null,
  
  courses: [],
  sections: [],
  lessons: [],
  steps: [],
  
  unsyncedSteps: new Set<number>(),
  unsyncedLessons: new Set<number>(),
  unsyncedSections: new Set<number>(),

  lessonsWithNewSteps: new Set<number>(),
  sectionsWithNewSteps: new Set<number>(),
  
  syncedModelPositions: new Map<number, number>(),
  syncedLessonPositions: new Map<number, number>(),
  syncedStepPositions: new Map<number, number>(),
  
  setSelectedCourse: (course) => set({ 
    selectedCourse: course,
    selectedModel: null,
    selectedLesson: null,
    selectedStep: null,
    sections: [],
    lessons: [],
    steps: [],
  }),
  
  setSelectedModel: (section) => set({
    selectedModel: section,
    selectedLesson: null,
    selectedStep: null,
    lessons: [],
    steps: [],
  }),
  
  setSelectedLesson: (lesson) => set({ 
    selectedLesson: lesson,
    selectedStep: null,
    steps: [],
  }),
  
  setSelectedStep: (step) => set({ selectedStep: step }),
  
  setCourses: (courses) => set({ courses }),
  setModels: (sections) => set({ sections }),
  setLessons: (lessons) => set({ lessons }),
  setSteps: (steps) => set((state) => ({
    steps,
    ...computeNewSteps(
      state.lessons,
      state.lessonsWithNewSteps,
      state.sectionsWithNewSteps,
      steps[0]?.lessonId ?? state.selectedLesson?.id,
      steps
    ),
  })),
  
  addCourse: (course) => set((state) => ({ 
    courses: [course, ...state.courses] 
  })),
  
  updateCourse: (course) => set((state) => ({
    courses: state.courses.map((c) => c.id === course.id ? course : c),
    selectedCourse: state.selectedCourse?.id === course.id ? course : state.selectedCourse,
  })),
  
  removeCourse: (courseId) => set((state) => ({
    courses: state.courses.filter((c) => c.id !== courseId),
    selectedCourse: state.selectedCourse?.id === courseId ? null : state.selectedCourse,
  })),
  
  addModel: (section) => set((state) => ({
    sections: [...state.sections, section].sort((a, b) => a.position - b.position),
  })),
  
  updateModel: (section) => set((state) => ({
    sections: state.sections.map((m) => m.id === section.id ? section : m),
    selectedModel: state.selectedModel?.id === section.id ? section : state.selectedModel,
  })),
  
  removeModel: (modelId) => set((state) => {
    const newPositions = new Map(state.syncedModelPositions);
    newPositions.delete(modelId);
    return {
      sections: state.sections.filter((m) => m.id !== modelId),
      selectedModel: state.selectedModel?.id === modelId ? null : state.selectedModel,
      syncedModelPositions: newPositions,
    };
  }),
  
  reorderModels: (sections) => set({
    sections: sections.map((m, index) => ({ ...m, position: index + 1 })),
  }),
  
  addLesson: (lesson) => set((state) => ({
    lessons: [...state.lessons, lesson].sort((a, b) => a.position - b.position),
  })),
  
  updateLesson: (lesson) => set((state) => ({
    lessons: state.lessons.map((l) => l.id === lesson.id ? lesson : l),
    selectedLesson: state.selectedLesson?.id === lesson.id ? lesson : state.selectedLesson,
  })),
  
  removeLesson: (lessonId) => set((state) => {
    const newPositions = new Map(state.syncedLessonPositions);
    newPositions.delete(lessonId);
    return {
      lessons: state.lessons.filter((l) => l.id !== lessonId),
      selectedLesson: state.selectedLesson?.id === lessonId ? null : state.selectedLesson,
      syncedLessonPositions: newPositions,
    };
  }),
  
  reorderLessons: (lessons) => set({
    lessons: lessons.map((l, index) => ({ ...l, position: index + 1 })),
  }),
  
  addStep: (step) => set((state) => {
    const steps = [...state.steps, step].sort((a, b) => a.position - b.position);
    return {
      steps,
      ...computeNewSteps(
        state.lessons,
        state.lessonsWithNewSteps,
        state.sectionsWithNewSteps,
        step.lessonId,
        steps
      ),
    };
  }),
  
  updateStep: (step) => set((state) => {
    const steps = state.steps.map((s) => s.id === step.id ? step : s);
    return {
      steps,
      selectedStep: state.selectedStep?.id === step.id ? step : state.selectedStep,
      ...computeNewSteps(
        state.lessons,
        state.lessonsWithNewSteps,
        state.sectionsWithNewSteps,
        step.lessonId,
        steps
      ),
    };
  }),
  
  removeStep: (stepId) => set((state) => {
    const removed = state.steps.find((s) => s.id === stepId);
    const steps = state.steps.filter((s) => s.id !== stepId);
    const newPositions = new Map(state.syncedStepPositions);
    newPositions.delete(stepId);
    return {
      steps,
      selectedStep: state.selectedStep?.id === stepId ? null : state.selectedStep,
      syncedStepPositions: newPositions,
      ...computeNewSteps(
        state.lessons,
        state.lessonsWithNewSteps,
        state.sectionsWithNewSteps,
        removed?.lessonId,
        steps
      ),
    };
  }),
  
  reorderSteps: (steps) => set((state) => {
    const renumbered = steps.map((s, index) => ({ ...s, position: index + 1 }));
    return {
      steps: renumbered,
      ...computeNewSteps(
        state.lessons,
        state.lessonsWithNewSteps,
        state.sectionsWithNewSteps,
        renumbered[0]?.lessonId,
        renumbered
      ),
    };
  }),
  
  markStepAsUnsynced: (stepId, lessonId, modelId) => set((state) => {
    const newUnsyncedSteps = new Set(state.unsyncedSteps);
    newUnsyncedSteps.add(stepId);
    const newUnsyncedLessons = new Set(state.unsyncedLessons);
    newUnsyncedLessons.add(lessonId);
    const newUnsyncedModels = new Set(state.unsyncedSections);
    newUnsyncedModels.add(modelId);
    return {
      unsyncedSteps: newUnsyncedSteps,
      unsyncedLessons: newUnsyncedLessons,
      unsyncedSections: newUnsyncedModels,
    };
  }),
  
  markStepAsSynced: (stepId) => set((state) => {
    const newUnsyncedSteps = new Set(state.unsyncedSteps);
    newUnsyncedSteps.delete(stepId);
    return { unsyncedSteps: newUnsyncedSteps };
  }),
  
  markLessonAsUnsynced: (lessonId, modelId) => set((state) => {
    const newUnsyncedLessons = new Set(state.unsyncedLessons);
    newUnsyncedLessons.add(lessonId);
    const newUnsyncedModels = new Set(state.unsyncedSections);
    if (modelId) {
      newUnsyncedModels.add(modelId);
    }
    return {
      unsyncedLessons: newUnsyncedLessons,
      unsyncedSections: newUnsyncedModels,
    };
  }),
  
  markLessonAsSynced: (lessonId) => set((state) => {
    const newUnsyncedLessons = new Set(state.unsyncedLessons);
    newUnsyncedLessons.delete(lessonId);
    return { unsyncedLessons: newUnsyncedLessons };
  }),
  
  markModelAsUnsynced: (modelId) => set((state) => {
    const newUnsyncedModels = new Set(state.unsyncedSections);
    newUnsyncedModels.add(modelId);
    return { unsyncedSections: newUnsyncedModels };
  }),
  
  markModelAsSynced: (modelId) => set((state) => {
    const newUnsyncedModels = new Set(state.unsyncedSections);
    newUnsyncedModels.delete(modelId);
    return { unsyncedSections: newUnsyncedModels };
  }),
  
  saveSyncedModelPositions: (sections) => set((state) => {
    const newPositions = new Map(state.syncedModelPositions);
    sections.forEach(section => {
      // Сохраняем позицию только для синхронизированных моделей
      if (section.stepikSectionId) {
        newPositions.set(section.id, section.position);
      }
    });
    return { syncedModelPositions: newPositions };
  }),
  
  saveSyncedLessonPositions: (lessons) => set((state) => {
    const newPositions = new Map(state.syncedLessonPositions);
    lessons.forEach(lesson => {
      // Сохраняем позицию только для синхронизированных уроков
      if (lesson.stepikLessonId) {
        newPositions.set(lesson.id, lesson.position);
      }
    });
    return { syncedLessonPositions: newPositions };
  }),
  
  saveSyncedStepPositions: (steps) => set((state) => {
    const newPositions = new Map(state.syncedStepPositions);
    steps.forEach(step => {
      // Сохраняем позицию только для синхронизированных шагов
      if (step.stepikStepId) {
        newPositions.set(step.id, step.position);
      }
    });
    return { syncedStepPositions: newPositions };
  }),
  
  checkAndMarkPositionChanges: () => set((state) => {
    const newUnsyncedSteps = new Set(state.unsyncedSteps);
    const newUnsyncedLessons = new Set(state.unsyncedLessons);
    const newUnsyncedModels = new Set(state.unsyncedSections);
    
    // Проверяем модели
    state.sections.forEach(section => {
      if (section.stepikSectionId) {
        const syncedPosition = state.syncedModelPositions.get(section.id);
        if (syncedPosition !== undefined && syncedPosition !== section.position) {
          // Позиция изменилась - помечаем как несинхронизированную
          newUnsyncedModels.add(section.id);
        } else if (syncedPosition !== undefined && syncedPosition === section.position) {
          // Позиция вернулась к исходной - убираем пометку
          newUnsyncedModels.delete(section.id);
        }
      }
    });
    
    // Проверяем уроки
    state.lessons.forEach(lesson => {
      if (lesson.stepikLessonId) {
        const syncedPosition = state.syncedLessonPositions.get(lesson.id);
        if (syncedPosition !== undefined && syncedPosition !== lesson.position) {
          // Позиция изменилась - помечаем урок и его модуль
          newUnsyncedLessons.add(lesson.id);
          // Находим модуль для этого урока по modelId
          const lessonModel = state.sections.find(m => m.id === lesson.sectionId);
          if (lessonModel && lessonModel.stepikSectionId) {
            newUnsyncedModels.add(lessonModel.id);
          }
        } else if (syncedPosition !== undefined && syncedPosition === lesson.position) {
          // Позиция вернулась к исходной - проверяем, нет ли других причин для пометки
          // Убираем пометку только если нет других изменений
          const hasOtherChanges = state.steps.some(s => 
            s.lessonId === lesson.id && 
            s.stepikStepId && 
            state.syncedStepPositions.get(s.id) !== undefined &&
            state.syncedStepPositions.get(s.id) !== s.position
          );
          if (!hasOtherChanges) {
            newUnsyncedLessons.delete(lesson.id);
          }
        }
      }
    });
    
    // Проверяем шаги
    state.steps.forEach(step => {
      if (step.stepikStepId) {
        const syncedPosition = state.syncedStepPositions.get(step.id);
        if (syncedPosition !== undefined && syncedPosition !== step.position) {
          // Позиция изменилась - помечаем шаг, урок и модуль
          newUnsyncedSteps.add(step.id);
          // Находим урок для этого шага
          const stepLesson = state.lessons.find(l => l.id === step.lessonId);
          if (stepLesson && stepLesson.stepikLessonId) {
            newUnsyncedLessons.add(stepLesson.id);
            // Находим модуль для этого урока
            const lessonModel = state.sections.find(m => m.id === stepLesson.sectionId);
            if (lessonModel && lessonModel.stepikSectionId) {
              newUnsyncedModels.add(lessonModel.id);
            }
          }
        } else if (syncedPosition !== undefined && syncedPosition === step.position) {
          // Позиция вернулась к исходной - убираем пометку
          newUnsyncedSteps.delete(step.id);
          // Проверяем, можно ли убрать пометку с урока
          const stepLesson = state.lessons.find(l => l.id === step.lessonId);
          if (stepLesson) {
            const allStepsSynced = state.steps
              .filter(s => s.lessonId === stepLesson.id && s.stepikStepId)
              .every(s => {
                const pos = state.syncedStepPositions.get(s.id);
                return pos === undefined || pos === s.position;
              });
            if (allStepsSynced) {
              const lessonPos = state.syncedLessonPositions.get(stepLesson.id);
              if (lessonPos !== undefined && lessonPos === stepLesson.position) {
                newUnsyncedLessons.delete(stepLesson.id);
                // Проверяем, можно ли убрать пометку с модуля
                const lessonModel = state.sections.find(m => m.id === stepLesson.sectionId);
                if (lessonModel) {
                  const allLessonsSynced = state.lessons
                    .filter(l => l.sectionId === lessonModel.id && l.stepikLessonId)
                    .every(l => {
                      const pos = state.syncedLessonPositions.get(l.id);
                      return pos === undefined || pos === l.position;
                    });
                  if (allLessonsSynced) {
                    const modelPos = state.syncedModelPositions.get(lessonModel.id);
                    if (modelPos !== undefined && modelPos === lessonModel.position) {
                      newUnsyncedModels.delete(lessonModel.id);
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    
    return {
      unsyncedSteps: newUnsyncedSteps,
      unsyncedLessons: newUnsyncedLessons,
      unsyncedSections: newUnsyncedModels,
    };
  }),
  
  clearSelection: () => set({
    selectedCourse: null,
    selectedModel: null,
    selectedLesson: null,
    selectedStep: null,
    sections: [],
    lessons: [],
    steps: [],
    syncedModelPositions: new Map(),
    syncedLessonPositions: new Map(),
    syncedStepPositions: new Map(),
    lessonsWithNewSteps: new Set(),
    sectionsWithNewSteps: new Set(),
  }),
}));

