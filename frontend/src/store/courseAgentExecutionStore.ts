import { create } from 'zustand';
import type {
  CoursePlanDTO,
  CourseAgentResponse,
  PlanExecutionEvent,
  PlanExecutionLiveProgress,
  PlanExecutionEventType,
  Lesson,
  Model,
  Step,
  StepType,
} from '../types';

export type CourseStructureHandlers = {
  refresh: () => void;
  addSection: (section: Model) => void;
  addLesson: (lesson: Lesson) => void;
  addStep: (step: Step) => void;
  expandToNode: (type: 'section' | 'lesson' | 'step', id: number) => void;
};

export type CreatedDuringExecute = {
  sectionIds: number[];
  lessonIds: number[];
  stepIds: number[];
};

export type ExecutionFinishPayload =
  | { kind: 'success'; response: CourseAgentResponse }
  | { kind: 'partial'; created: CreatedDuringExecute }
  | { kind: 'failed' };

type CourseAgentExecutionState = {
  courseId: number | null;
  sessionId: string | null;
  plan: CoursePlanDTO | null;
  isExecuting: boolean;
  live: PlanExecutionLiveProgress | null;
  createdIds: CreatedDuringExecute;
  finishPayload: ExecutionFinishPayload | null;
  structureHandlers: CourseStructureHandlers | null;
};

type CourseAgentExecutionActions = {
  registerStructureHandlers: (handlers: CourseStructureHandlers | null) => void;
  beginExecution: (params: {
    courseId: number;
    sessionId: string;
    plan: CoursePlanDTO;
  }) => boolean;
  applyProgressEvent: (event: PlanExecutionEvent) => void;
  completeExecution: (payload: ExecutionFinishPayload) => void;
  consumeFinishPayload: () => ExecutionFinishPayload | null;
  clearExecution: () => void;
  isExecutingFor: (courseId: number) => boolean;
};

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const emptyCreated = (): CreatedDuringExecute => ({
  sectionIds: [],
  lessonIds: [],
  stepIds: [],
});

const LOGGABLE_TYPES = new Set<PlanExecutionEventType>([
  'SECTION_CREATED',
  'LESSON_CREATED',
  'STEP_CREATED',
  'STEP_FAILED',
  'DONE',
  'ERROR',
]);

export const useCourseAgentExecutionStore = create<
  CourseAgentExecutionState & CourseAgentExecutionActions
>((set, get) => ({
  courseId: null,
  sessionId: null,
  plan: null,
  isExecuting: false,
  live: null,
  createdIds: emptyCreated(),
  finishPayload: null,
  structureHandlers: null,

  registerStructureHandlers: (handlers) => set({ structureHandlers: handlers }),

  beginExecution: ({ courseId, sessionId, plan }) => {
    const state = get();
    if (state.isExecuting) {
      return false;
    }
    set({
      courseId,
      sessionId,
      plan,
      isExecuting: true,
      live: null,
      createdIds: emptyCreated(),
      finishPayload: null,
    });
    return true;
  },

  applyProgressEvent: (event) => {
    const type = event.planExecutionEventType;
    const handlers = get().structureHandlers;
    const now = new Date().toISOString();

    set((prev) => {
      const loggable = LOGGABLE_TYPES.has(type);
      const logEntry = loggable && event.message
        ? { id: newId(), text: event.message, kind: type }
        : null;
      const prevLog = prev.live?.log ?? [];
      const nextLog = logEntry ? [...prevLog, logEntry].slice(-12) : prevLog;
      return {
        live: {
          current: event.currentCreatedSteps ?? prev.live?.current ?? 0,
          total: event.totalSteps ?? prev.live?.total ?? 0,
          phase: type,
          lessonTitle: event.lessonTitle ?? prev.live?.lessonTitle,
          stepType: event.stepType ?? prev.live?.stepType,
          message: event.message ?? prev.live?.message,
          log: nextLog,
        },
      };
    });

    if (type === 'SECTION_CREATED' && event.createdSectionId != null) {
      const section: Model = {
        id: event.createdSectionId,
        courseId: event.courseId ?? get().courseId ?? 0,
        title: event.sectionTitle || 'Без названия',
        description: '',
        position: event.sectionPosition ?? 1,
        createdAt: now,
        updatedAt: now,
        needsStepikSync: true,
      };
      handlers?.addSection(section);
      handlers?.expandToNode('section', section.id);
      set((prev) => ({
        createdIds: {
          ...prev.createdIds,
          sectionIds: [...prev.createdIds.sectionIds, section.id],
        },
      }));
    }

    if (type === 'LESSON_CREATED' && event.createdLessonId != null && event.createdSectionId != null) {
      const lesson: Lesson = {
        id: event.createdLessonId,
        sectionId: event.createdSectionId,
        title: event.lessonTitle || 'Без названия',
        description: '',
        position: event.lessonPosition ?? 1,
        createdAt: now,
        updatedAt: now,
        needsStepikSync: true,
      };
      handlers?.addLesson(lesson);
      handlers?.expandToNode('lesson', lesson.id);
      set((prev) => ({
        createdIds: {
          ...prev.createdIds,
          lessonIds: [...prev.createdIds.lessonIds, lesson.id],
        },
      }));
    }

    if (type === 'STEP_CREATED' && event.createdStepId != null && event.createdLessonId != null) {
      const stepType = (event.stepType ?? 'TEXT') as StepType;
      const step: Step = {
        id: event.createdStepId,
        lessonId: event.createdLessonId,
        type: stepType,
        content: '',
        position: event.stepPosition ?? 1,
        createdAt: now,
        updatedAt: now,
        needsStepikSync: true,
      };
      handlers?.addStep(step);
      set((prev) => ({
        createdIds: {
          ...prev.createdIds,
          stepIds: [...prev.createdIds.stepIds, step.id],
        },
      }));
    }
  },

  completeExecution: (payload) => {
    set({
      isExecuting: false,
      live: null,
      finishPayload: payload,
    });
  },

  consumeFinishPayload: () => {
    const payload = get().finishPayload;
    if (payload) {
      set({ finishPayload: null, plan: null, courseId: null, sessionId: null });
    }
    return payload;
  },

  clearExecution: () => set({
    courseId: null,
    sessionId: null,
    plan: null,
    isExecuting: false,
    live: null,
    createdIds: emptyCreated(),
    finishPayload: null,
  }),

  isExecutingFor: (courseId) => {
    const state = get();
    return state.isExecuting && state.courseId === courseId;
  },
}));
