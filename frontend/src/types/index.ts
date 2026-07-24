// User types
export type UserRole = 'DEFAULT' | 'PRO';

export interface User {
  id: number;
  name: string;
  email: string;
  role?: UserRole;
  createdAt: string;
}

export interface RegistrationMessage {
  message: string;
}

export interface RegistrationConfig {
  enabled: boolean;
  inviteRequired: boolean;
  privacyConsentVersion: string;
}

export interface VerifyEmailDTO {
  email: string;
  code: string;
}

export interface ResendVerificationDTO {
  email: string;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  inviteCode?: string;
  privacyAccepted: boolean;
  privacyConsentVersion: string;
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
  /** true, если курс и всё его содержимое выгружены на Stepik */
  fullySynced?: boolean;
  /** локальные изменения, требующие update в Stepik */
  needsStepikSync?: boolean;
}

export interface CreateCourseDTO {
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
  needsStepikSync?: boolean;
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
  needsStepikSync?: boolean;
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
  needsStepikSync?: boolean;
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

export interface StepikSyncFailure {
  entityType: 'step' | 'lesson' | 'section' | string;
  entityId: number;
  title?: string;
  error: string;
}

export interface CaptchaChallenge {
  requiresCaptcha: boolean;
  captchaKey?: string;
  captchaImageUrl?: string;
  message?: string;
  courseId?: number;
  lessonId?: number;
  failures?: StepikSyncFailure[];
}

// AI Agent types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  stepType?: string;
  generatedStep?: StepikBlockRequest;
  payloadJson?: string;
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

export interface CourseAnalyzerResponse {
  analyzeResult: string;
}

export interface CourseAuditPdfExportRequest {
  courseId: number;
  courseTitle: string;
  summary: string;
  plan: string;
  improvements: string;
  newContent: string;
  includeReport: boolean;
  includeImprovements: boolean;
  includeNewContent: boolean;
}

export interface BatchGenerationHistory {
  id: number;
  userInput: string;
  plan: BatchStepDTO;
  generatedSteps?: StepikBlockRequest[];
  status?: string;
  totalSteps?: number;
  lessonId?: number | null;
  errorMessage?: string | null;
  createdAt?: string;
  completedAt?: string | null;
}

export interface GeneratedStepHistory {
  id: number;
  sessionId: string;
  stepType: string;
  userPrompt?: string | null;
  content?: string;
  generatedStep: StepikBlockRequest;
  createdAt?: string;
}

export interface StepikVideoUrl {
  quality?: string | number;
  url?: string;
}

export interface StepikVideoSource {
  id?: number;
  thumbnail?: string;
  urls?: StepikVideoUrl[];
  duration?: number;
  status?: string;
  upload_date?: string;
  filename?: string;
}

export interface StepikBlockRequest {
  name: string;
  text?: string;
  video?: StepikVideoSource | null;
  options?: unknown;
  source?: unknown;
  feedback_correct?: string;
  feedback_wrong?: string;
}

export interface GeneratedStep {
  text: string;
  video?: StepikVideoSource | null;
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

// ---------------------------------------------------------------------------
// Course Agent (агентский режим уровня курса)
// ---------------------------------------------------------------------------

export type PlanActionType =
  | 'CREATE_SECTION'
  | 'CREATE_LESSONS'
  | 'CREATE_STEPS'
  | 'DELETE_SECTION'
  | 'DELETE_LESSON'
  | 'DELETE_STEP'
  | 'COPY_STEP'
  | 'MOVE_STEP'
  | 'MOVE_LESSON';

export type CourseAgentAction =
  | 'NEED_CLARIFICATION'
  | 'SHOW_PLAN'
  | 'PLAN_CANCELLED'
  | 'DRAFT_READY'
  | 'INFO_ANSWER'
  | 'STEP_MODIFIED'
  | 'ENTITY_DELETED'
  | 'ERROR';

export type PlanExecutionEventType =
  | 'STARTED'
  | 'SECTION_CREATED'
  | 'LESSON_CREATED'
  | 'STEP_STARTED'
  | 'STEP_CREATED'
  | 'STEP_FAILED'
  | 'DONE'
  | 'ERROR';

export interface PlanExecutionEvent {
  planExecutionEventType: PlanExecutionEventType;
  currentCreatedSteps?: number;
  totalSteps?: number;
  courseId?: number;
  userId?: number;
  sessionId?: string;
  sectionTitle?: string;
  lessonTitle?: string;
  stepType?: StepType;
  sectionPosition?: number;
  lessonPosition?: number;
  stepPosition?: number;
  message?: string;
  createdSectionId?: number;
  createdLessonId?: number;
  createdStepId?: number;
  createdSectionIds?: number[];
  createdLessonIds?: number[];
  createdStepIds?: number[];
  planActionType?: PlanActionType;
}

export interface PlanExecutionLiveProgress {
  current: number;
  total: number;
  phase: PlanExecutionEventType | 'idle';
  lessonTitle?: string;
  stepType?: StepType;
  message?: string;
  log: Array<{ id: string; text: string; kind: PlanExecutionEventType }>;
}

export interface CourseAgentLessonPlan {
  title: string;
  steps: CountStepDTO[];
}

export interface CourseAgentSectionPlan {
  title: string;
  description?: string;
  lessons: CourseAgentLessonPlan[];
}

export interface PlanActionDTO {
  type: PlanActionType;
  targetSectionId?: number;
  targetSectionTitle?: string;
  targetLessonId?: number;
  targetLessonTitle?: string;
  targetStepId?: number;
  targetStepTitle?: string;
  sourceSectionId?: number;
  sourceSectionTitle?: string;
  sourceLessonId?: number;
  sourceLessonTitle?: string;
  /** Synced entities will also be removed on Stepik when the plan is confirmed. */
  deleteFromStepik?: boolean;
  cascadeLessonCount?: number;
  cascadeStepCount?: number;
  section?: CourseAgentSectionPlan;
  lessons?: CourseAgentLessonPlan[];
  steps?: CountStepDTO[];
}

export interface AgentResumeContext {
  pendingTool?: string;
  pendingArgs?: Record<string, unknown>;
  collectedActions?: PlanActionDTO[];
  loopMessages?: ChatMessage[];
  userInput?: string;
  clarificationMessage?: string;
  agentMode?: 'ASK' | 'AGENT';
}

export interface CoursePlanDTO {
  message?: string;
  actions?: PlanActionDTO[];
}

export interface EntityCandidate {
  type: 'section' | 'lesson' | 'step';
  id: number;
  label: string;
}

export interface CourseAgentResponse {
  action: CourseAgentAction;
  message?: string;
  plan?: CoursePlanDTO;
  candidates?: EntityCandidate[];
  resumeContext?: AgentResumeContext;
  createdSectionIds?: number[];
  createdLessonIds?: number[];
  createdStepIds?: number[];
  step?: Step;
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
      if (parsed && typeof parsed === 'object' && parsed.name === 'video') {
        return 'VIDEO';
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
  VIDEO: 'video',
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

