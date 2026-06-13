// User types
export type UserRole = 'DEFAULT' | 'PRO';

export interface User {
  id: number;
  name: string;
  email: string;
  role?: UserRole;
  createdAt: string;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
}

export interface UserLoginDTO {
  email: string;
  password: string;
}

export interface UserLoginResponse {
  user: User;
  token: string;
}

export interface UpdateUserDTO {
  userId: number;
  name?: string;
  email?: string;
  password?: string;
}

// Course types
export interface Course {
  id: number;
  userId: number;
  title: string;
  description: string;
  stepikCourseId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseDTO {
  userId: number;
  title: string;
  description: string;
}

export interface UpdateCourseDTO {
  id: number;
  title?: string;
  description?: string;
}

// Model (Section) types
export interface Model {
  id: number;
  courseId: number;
  title: string;
  description: string;
  position: number;
  stepikSectionId?: number;
  createdAt: string;
  updatedAt: string;
  needsSync?: boolean;
}

export interface CreateModelDTO {
  courseId: number;
  title: string;
  description: string;
}

export interface UpdateModelDTO {
  sectionId: number;
  title?: string;
  description?: string;
  position?: number;
}

// Lesson types
export interface Lesson {
  id: number;
  sectionId: number;
  title: string;
  description: string;
  position: number;
  stepikLessonId?: number;
  createdAt: string;
  updatedAt: string;
  needsSync?: boolean;
}

export interface CreateLessonDTO {
  sectionId: number;
  title: string;
  description?: string;
}

export interface UpdateLessonDTO {
  lessonId: number;
  title?: string;
  description?: string;
  position?: number;
}

// Step types
export type StepType = 
  | 'TEXT'
  | 'CHOICE'
  | 'SORTING'
  | 'MATCHING'
  | 'TABLE'
  | 'CODE'
  | 'VIDEO'
  | 'FILL_BLANK'
  | 'STRING'
  | 'NUMBER'
  | 'RANDOM_TASKS'
  | 'MATH'
  | 'FREE_ANSWER';

export interface Step {
  id: number;
  lessonId: number;
  type: StepType;
  content: string;
  position: number;
  cost?: number;
  stepikBlockData?: string;
  stepikStepId?: number;
  createdAt: string;
  updatedAt: string;
  needsSync?: boolean;
}

export interface ChangeStepTypeDTO {
  stepId: number;
  newStepType: StepType;
  stepikBlock: StepikBlockRequest;
}

export interface CreateStepDTO {
  lessonId: number;
  type: StepType;
  content?: string;
  position?: number;
  cost?: number;
  stepikBlock?: StepikBlockRequest;
}

export interface UpdateStepDTO {
  stepId: number;
  type?: StepType;
  content?: string;
  title?: string;
  position?: number;
  cost?: number;
  stepikBlock?: StepikBlockRequest;
  stepikStepId?: number;
}

// Stepik types
export interface StepikOAuthConfig {
  clientId: string;
  clientSecret: string;
}

/** Ответ get-sync-step: шаг с Stepik (block, position, cost и др.). */
export interface StepikStepSourceResponseData {
  id?: number;
  lesson?: number;
  position?: number;
  block?: unknown;
  cost?: number;
  [key: string]: unknown;
}

export interface CaptchaChallenge {
  requiresCaptcha: boolean;
  captchaKey?: string;
  captchaImageUrl?: string;
  message?: string;
  courseId?: number;
  lessonId?: number;
}

// AI Agent types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  stepType?: string;
}

// Batch generation types
export interface CountStepDTO {
  type: string;
  count: number;
  specificInput: string;
  useSummarizedEnabled?: boolean;
}

export interface BatchStepDTO {
  steps: CountStepDTO[];
}

export interface BatchGenerationHistory {
  id: string;
  userInput: string;
  plan: BatchStepDTO;
  timestamp: number;
}

export interface StepikBlockRequest {
  name: string;
  text?: string;
  video?: string | null;
  options?: unknown;
  source?: unknown;
  feedback_correct?: string;
  feedback_wrong?: string;
}

export interface GeneratedStep {
  text: string;
  video?: string | null;
  options?: unknown;
  source?: ChoiceSource | MatchingSource | unknown;
}

export interface ChoiceOption {
  text: string;
  is_correct: boolean;
  feedback?: string;
}

export interface ChoiceSource {
  is_html_enabled: boolean;
  is_multiple_choice: boolean;
  is_always_correct: boolean;
  sample_size: number;
  preserve_order: boolean;
  is_options_feedback: boolean;
  options: ChoiceOption[];
}

export interface MatchingPair {
  first: string;
  second: string;
}

export interface MatchingSource {
  pairs: MatchingPair[];
}

// API Error
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
}

/** Возвращает тип шага для отображения. Если backend вернул TEXT, но в stepikBlockData блок с name "code" — показываем CODE. */
export function getStepDisplayType(step: Step): StepType {
  if (step.stepikBlockData) {
    try {
      const parsed = typeof step.stepikBlockData === 'string'
        ? JSON.parse(step.stepikBlockData)
        : step.stepikBlockData;
      if (parsed && typeof parsed === 'object' && parsed.name === 'code') {
        return 'CODE';
      }
    } catch {
      // ignore
    }
  }
  return step.type;
}

const STEP_TYPE_TO_BLOCK: Record<StepType, string> = {
  TEXT: 'text',
  CHOICE: 'choice',
  SORTING: 'sorting',
  MATCHING: 'matching',
  TABLE: 'table',
  FILL_BLANK: 'fill-blanks',
  STRING: 'string',
  NUMBER: 'number',
  MATH: 'math',
  FREE_ANSWER: 'free-answer',
  CODE: 'code',
  VIDEO: 'text',
  RANDOM_TASKS: 'random-tasks',
};

/** Имя блока из stepikBlockData (name) или из step.type. Нужно для выбора формы редактирования. */
export function getStepBlockName(step: Step): string {
  if (step.stepikBlockData) {
    try {
      const parsed = typeof step.stepikBlockData === 'string'
        ? JSON.parse(step.stepikBlockData)
        : step.stepikBlockData;
      if (parsed && typeof parsed === 'object' && typeof parsed.name === 'string') {
        return parsed.name;
      }
    } catch {
      // ignore
    }
  }
  return STEP_TYPE_TO_BLOCK[step.type] ?? 'text';
}

