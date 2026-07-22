import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { agentApi, coursesApi } from '../../api';
import { useAuthStore } from '../../store';
import { useSubscription } from '../../hooks/useSubscription';
import type {
  Course,
  CoursePlanDTO,
  CourseAgentResponse,
  AgentResumeContext,
  EntityCandidate,
  ChatMessage,
} from '../../types';
import type { CourseTreeHighlight, CourseAgentMode } from './types';
import { buildTreeHighlight } from './utils/planHighlight';
import { isDeleteOnlyPlan } from './utils/planIntent';
import { extractApiErrorMessage } from '../../utils/apiError';
import { useCourseAgentStore } from '../../store';
import type { CourseAgentPendingRequest } from '../../utils/buildAuditAgentHandoff';
import {
  getChatLoadingPhases,
  getExecuteLoadingPhases,
  pickLoadingPhase,
} from './utils/loadingStatus';
import {
  estimatePlanExecution,
  simulateCompletedSteps,
  waitingHonestyHint,
} from './utils/planExecutionProgress';
import { sanitizePlanMessage } from './utils/sanitizePlanMessage';
import { readStoredLlmModel, writeStoredLlmModel } from '../../utils/llmModelStorage';
import {
  useCourseAgentExecutionStore,
  type CourseStructureHandlers,
} from '../../store/courseAgentExecutionStore';

export type CourseAgentChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export type { CourseStructureHandlers };

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function newSessionId(): string {
  const uuid = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : newId();
  return `course-agent-${uuid}`;
}

function courseSessionStorageKey(courseId: number): string {
  return `course-agent-session-${courseId}`;
}

const AGENT_MODE_STORAGE_KEY = 'course-agent-mode';
const LAST_COURSE_STORAGE_KEY = 'course-agent-last-course';

function readStoredAgentMode(): CourseAgentMode {
  try {
    const stored = localStorage.getItem(AGENT_MODE_STORAGE_KEY);
    if (stored === 'ASK') {
      return 'ASK';
    }
    return 'AGENT';
  } catch {
    return 'AGENT';
  }
}

function writeStoredAgentMode(mode: CourseAgentMode): void {
  try {
    localStorage.setItem(AGENT_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore quota / private mode
  }
}

function lastCourseStorageKey(userId: number): string {
  return `${LAST_COURSE_STORAGE_KEY}-${userId}`;
}

function readStoredLastCourseId(userId: number): number | null {
  try {
    const raw = localStorage.getItem(lastCourseStorageKey(userId));
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function writeStoredLastCourseId(userId: number, courseId: number): void {
  try {
    localStorage.setItem(lastCourseStorageKey(userId), String(courseId));
  } catch {
    // ignore quota / private mode
  }
}

function readStoredSessionId(courseId: number): string | null {
  try {
    return localStorage.getItem(courseSessionStorageKey(courseId));
  } catch {
    return null;
  }
}

function writeStoredSessionId(courseId: number, sessionId: string): void {
  try {
    localStorage.setItem(courseSessionStorageKey(courseId), sessionId);
  } catch {
    // ignore quota / private mode
  }
}

function mapHistoryToMessages(history: ChatMessage[]): CourseAgentChatMessage[] {
  if (!Array.isArray(history)) {
    return [];
  }
  return history
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      id: newId(),
      role: message.role as 'user' | 'assistant',
      content: message.role === 'assistant'
        ? (sanitizePlanMessage(message.content) || message.content || '')
        : (message.content ?? ''),
    }));
}

function restoreStateFromHistory(history: ChatMessage[]) {
  if (!Array.isArray(history) || history.length === 0) {
    return {
      lastUserInput: '',
      pendingPlan: null,
      candidates: [] as EntityCandidate[],
      resumeContext: null as AgentResumeContext | null,
    };
  }

  const originalUserMessage = [...history]
    .reverse()
    .find((message) => message.role === 'user'
      && !(message.content ?? '').startsWith('Выбран вариант:'));
  const lastUserInput = originalUserMessage?.content ?? '';

  const lastResponse = [...history]
    .reverse()
    .filter((message) => message.role === 'assistant')
    .map(parseResponsePayload)
    .find((response): response is CourseAgentResponse => response !== null);

  return {
    lastUserInput,
    pendingPlan: lastResponse?.action === 'SHOW_PLAN'
      ? {
          ...(lastResponse.plan ?? { actions: [] }),
          message: sanitizePlanMessage(lastResponse.plan?.message) || lastResponse.plan?.message,
        }
      : null,
    candidates: lastResponse?.action === 'NEED_CLARIFICATION'
      ? (lastResponse.candidates ?? [])
      : [],
    resumeContext: lastResponse?.action === 'NEED_CLARIFICATION'
      ? (lastResponse.resumeContext ?? null)
      : null,
  };
}

function parseResponsePayload(message: ChatMessage): CourseAgentResponse | null {
  if (!message.payloadJson) {
    return null;
  }
  try {
    return JSON.parse(message.payloadJson) as CourseAgentResponse;
  } catch {
    return null;
  }
}

/**
 * Логика страницы агента курса: выбор курса, чат, показ плана на подтверждение,
 * выполнение плана и обработка уточнений (кандидатов).
 */
export function useCourseAgent() {
  const { user } = useAuthStore();
  const location = useLocation();
  const consumePendingRequest = useCourseAgentStore((state) => state.consumePendingRequest);

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [messages, setMessages] = useState<CourseAgentChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [pendingPlan, setPendingPlan] = useState<CoursePlanDTO | null>(null);
  const [candidates, setCandidates] = useState<EntityCandidate[]>([]);
  const [resumeContext, setResumeContext] = useState<AgentResumeContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [createdHighlight, setCreatedHighlight] = useState<CourseTreeHighlight | null>(null);
  const [pendingHandoff, setPendingHandoff] = useState<CourseAgentPendingRequest | null>(null);
  const [agentMode, setAgentModeState] = useState<CourseAgentMode>(readStoredAgentMode);
  const [selectedLlmModel, setSelectedLlmModelState] = useState(readStoredLlmModel);
  const { canSelectModel, refresh: refreshSubscription, isPro, aiUsed, aiLimit } = useSubscription();

  const isExecuting = useCourseAgentExecutionStore((state) => (
    state.isExecuting && state.courseId === selectedCourseId
  ));
  const executionLive = useCourseAgentExecutionStore((state) => (
    state.courseId === selectedCourseId ? state.live : null
  ));
  const executionPlan = useCourseAgentExecutionStore((state) => (
    state.isExecuting && state.courseId === selectedCourseId ? state.plan : null
  ));
  const finishPayload = useCourseAgentExecutionStore((state) => state.finishPayload);

  const setAgentMode = useCallback((mode: CourseAgentMode) => {
    setAgentModeState(mode);
    writeStoredAgentMode(mode);
  }, []);

  const setSelectedLlmModel = useCallback((model: string) => {
    setSelectedLlmModelState(model);
    writeStoredLlmModel(model);
  }, []);

  useEffect(() => {
    if (!canSelectModel && selectedLlmModel) {
      setSelectedLlmModelState('');
    } else if (canSelectModel && !selectedLlmModel) {
      const stored = readStoredLlmModel();
      if (stored) {
        setSelectedLlmModelState(stored);
      }
    }
  }, [canSelectModel, selectedLlmModel]);

  const sessionIdRef = useRef<string>(newSessionId());
  const lastUserInputRef = useRef<string>('');
  const structureHandlersRef = useRef<CourseStructureHandlers | undefined>(undefined);
  const pendingHandoffRef = useRef<CourseAgentPendingRequest | null>(null);
  const loadingStartedAtRef = useRef<number | null>(null);
  const wasBusyRef = useRef(false);

  useEffect(() => {
    if (!isExecuting) {
      return;
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isExecuting]);

  useEffect(() => {
    const busy = isLoading || isExecuting;
    if (busy && !wasBusyRef.current) {
      loadingStartedAtRef.current = Date.now();
    }
    if (!busy) {
      loadingStartedAtRef.current = null;
      setLoadingStatus(null);
      wasBusyRef.current = false;
      return;
    }
    wasBusyRef.current = busy;

    if (isExecuting && executionLive) {
      const { current, total, message, lessonTitle, stepType } = executionLive;
      if (message) {
        setLoadingStatus(message);
        return;
      }
      const label = stepType
        ? `Генерирую ${stepType.toLowerCase()}${lessonTitle ? ` · «${lessonTitle}»` : ''}`
        : 'Генерирую шаги…';
      setLoadingStatus(total > 0 ? `${label} ${current} / ${total}` : label);
      return;
    }

    const phases = isExecuting
      ? getExecuteLoadingPhases()
      : getChatLoadingPhases(Boolean(pendingPlan));

    const tick = () => {
      const startedAt = loadingStartedAtRef.current ?? Date.now();
      const elapsed = Date.now() - startedAt;
      if (isExecuting && pendingPlan && !isDeleteOnlyPlan(pendingPlan)) {
        const estimate = estimatePlanExecution(pendingPlan);
        if (estimate.totalSteps > 0) {
          const done = simulateCompletedSteps(estimate, elapsed, true);
          const honesty = waitingHonestyHint(estimate);
          setLoadingStatus(
            honesty
              ? `Генерирую шаги… ${done} / ${estimate.totalSteps}. ${honesty}`
              : `Генерирую шаги… ${done} / ${estimate.totalSteps}`,
          );
          return;
        }
      }
      setLoadingStatus(pickLoadingPhase(phases, elapsed));
    };

    tick();
    const interval = window.setInterval(tick, 2000);
    return () => window.clearInterval(interval);
  }, [isLoading, isExecuting, pendingPlan, executionLive]);

  const applyPendingHandoff = useCallback((handoff: CourseAgentPendingRequest) => {
    pendingHandoffRef.current = handoff;
    if (handoff.courseId === selectedCourseId) {
      setInput(handoff.prompt);
      setPendingHandoff(handoff);
      pendingHandoffRef.current = null;
      return;
    }
    setSelectedCourseId(handoff.courseId);
  }, [selectedCourseId]);

  useEffect(() => {
    if (location.pathname !== '/course-agent') {
      return;
    }
    const pending = consumePendingRequest();
    if (pending) {
      applyPendingHandoff(pending);
    }
  }, [location.pathname, location.key, consumePendingRequest, applyPendingHandoff]);

  const adoptSessionId = useCallback((courseId: number, sessionId: string) => {
    sessionIdRef.current = sessionId;
    writeStoredSessionId(courseId, sessionId);
  }, []);

  const registerStructureHandlers = useCallback((handlers: CourseStructureHandlers) => {
    structureHandlersRef.current = handlers;
    useCourseAgentExecutionStore.getState().registerStructureHandlers(handlers);
  }, []);

  useEffect(() => {
    return () => {
      useCourseAgentExecutionStore.getState().registerStructureHandlers(null);
    };
  }, []);

  // Restore plan panel + highlight + refresh tree if generation survived navigation
  useEffect(() => {
    if (!selectedCourseId || !isExecuting) {
      return;
    }
    if (executionPlan) {
      setPendingPlan(executionPlan);
    }
    const { createdIds } = useCourseAgentExecutionStore.getState();
    if (
      createdIds.sectionIds.length
      || createdIds.lessonIds.length
      || createdIds.stepIds.length
    ) {
      setCreatedHighlight({
        sectionIds: new Set(createdIds.sectionIds),
        lessonIds: new Set(createdIds.lessonIds),
        stepIds: new Set(createdIds.stepIds),
      });
    }
    structureHandlersRef.current?.refresh();
  }, [selectedCourseId, isExecuting, executionPlan]);

  const appendInputContext = useCallback((text: string) => {
    if (!text) return;
    setInput((prev) => {
      const lines = prev
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      if (lines.includes(text)) {
        return prev;
      }
      return lines.length ? `${lines.join('\n')}\n${text}` : text;
    });
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const list = await coursesApi.getUserCourses(user.id);
        if (cancelled) return;
        setCourses(list);
        setSelectedCourseId((prev) => {
          const handoffCourseId = pendingHandoffRef.current?.courseId;
          if (handoffCourseId && list.some((course) => course.id === handoffCourseId)) {
            return handoffCourseId;
          }
          if (prev != null && list.some((course) => course.id === prev)) {
            return prev;
          }
          const storedCourseId = readStoredLastCourseId(user.id);
          if (storedCourseId != null && list.some((course) => course.id === storedCourseId)) {
            return storedCourseId;
          }
          return list[0]?.id ?? null;
        });
      } catch {
        toast.error('Не удалось загрузить список курсов');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || selectedCourseId == null) {
      return;
    }
    writeStoredLastCourseId(user.id, selectedCourseId);
  }, [selectedCourseId, user?.id]);

  useEffect(() => {
    if (!selectedCourseId || !user?.id) {
      return;
    }
    let cancelled = false;
    const executionActive = useCourseAgentExecutionStore.getState().isExecutingFor(selectedCourseId);
    setMessages([]);
    if (!executionActive) {
      setPendingPlan(null);
    }
    setCandidates([]);
    setResumeContext(null);
    setInput('');
    setIsLoading(true);

    void (async () => {
      try {
        const storedSessionId = readStoredSessionId(selectedCourseId);
        const latestSessionId =
          await agentApi.getLatestCourseAgentSession(selectedCourseId);
        if (cancelled) return;

        const sessionId = latestSessionId ?? storedSessionId ?? newSessionId();
        adoptSessionId(selectedCourseId, sessionId);

        if (!latestSessionId && !storedSessionId) {
          lastUserInputRef.current = '';
          return;
        }

        const history = await agentApi.getCourseAgentHistory(
          selectedCourseId,
          sessionId
        );
        if (cancelled) return;

        const restored = restoreStateFromHistory(history);
        setMessages(mapHistoryToMessages(history));
        lastUserInputRef.current = restored.lastUserInput;
        const stillExecuting = useCourseAgentExecutionStore.getState().isExecutingFor(selectedCourseId);
        const livePlan = useCourseAgentExecutionStore.getState().plan;
        setPendingPlan(stillExecuting ? (livePlan ?? restored.pendingPlan) : restored.pendingPlan);
        setCandidates(restored.candidates);
        setResumeContext(restored.resumeContext);
      } catch (error) {
        if (!cancelled) {
          console.error('Course agent history error:', error);
          const fallbackSessionId = newSessionId();
          adoptSessionId(selectedCourseId, fallbackSessionId);
          lastUserInputRef.current = '';
          toast.error('Не удалось загрузить историю агента');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          const handoff = pendingHandoffRef.current;
          if (handoff && handoff.courseId === selectedCourseId) {
            setInput(handoff.prompt);
            setPendingHandoff(handoff);
            pendingHandoffRef.current = null;
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCourseId, user?.id, adoptSessionId]);

  const pushMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    setMessages((prev) => [...prev, { id: newId(), role, content }]);
  }, []);

  const applyResponse = useCallback((res: CourseAgentResponse) => {
    if (res.message) {
      const message = res.action === 'SHOW_PLAN'
        ? sanitizePlanMessage(res.message)
        : res.message;
      pushMessage('assistant', message || res.message);
    }
    if (res.action === 'SHOW_PLAN') {
      const plan = res.plan
        ? { ...res.plan, message: sanitizePlanMessage(res.plan.message) || res.plan.message }
        : null;
      setPendingPlan(plan);
    } else if (
      res.action === 'PLAN_CANCELLED'
      || res.action === 'DRAFT_READY'
      || res.action === 'STEP_MODIFIED'
      || res.action === 'ENTITY_DELETED'
    ) {
      setPendingPlan(null);
    }
    if (res.action === 'NEED_CLARIFICATION') {
      setCandidates(res.candidates ?? []);
      setResumeContext(res.resumeContext ?? null);
    } else {
      setCandidates([]);
      setResumeContext(null);
    }
    if (res.action === 'DRAFT_READY') {
      toast.success('Черновик создан');
      setCreatedHighlight(buildTreeHighlight(
        null,
        [],
        res.createdSectionIds,
        res.createdLessonIds,
        res.createdStepIds,
      ));
      // Structure already updated live via SSE; only refresh if nothing was added
      if (!(res.createdStepIds?.length || res.createdLessonIds?.length || res.createdSectionIds?.length)) {
        structureHandlersRef.current?.refresh();
      }
      window.setTimeout(() => setCreatedHighlight(null), 8000);
    }
    if (res.action === 'STEP_MODIFIED') {
      toast.success('Шаг обновлён');
      if (res.step?.id) {
        setCreatedHighlight(buildTreeHighlight(null, [], [], [], [res.step.id]));
        structureHandlersRef.current?.refresh();
        window.setTimeout(() => setCreatedHighlight(null), 5000);
      }
    }
    if (res.action === 'ENTITY_DELETED') {
      toast.success(res.message || 'Удалено');
      structureHandlersRef.current?.refresh();
    }
    if (res.action === 'ERROR') {
      toast.error(res.message || 'Ошибка агента');
    }
  }, [pushMessage]);

  const sendChat = useCallback(async (text: string) => {
    if (!selectedCourseId) {
      toast.error('Выберите курс');
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) return;

    adoptSessionId(selectedCourseId, sessionIdRef.current);

    const planToRevise = agentMode === 'AGENT' && pendingPlan && !isDeleteOnlyPlan(pendingPlan) ? pendingPlan : null;
    if (agentMode === 'AGENT' && pendingPlan && isDeleteOnlyPlan(pendingPlan)) {
      toast.error('План удаления нельзя изменить через чат. Подтвердите удаление или отмените план.');
      return;
    }
    lastUserInputRef.current = planToRevise ? lastUserInputRef.current : trimmed;
    pushMessage('user', trimmed);
    setInput('');
    setCandidates([]);
    setIsLoading(true);
    try {
      const llmModel = selectedLlmModel || undefined;
      const res = planToRevise
        ? await agentApi.courseAgentEditPlan(
            selectedCourseId,
            sessionIdRef.current,
            planToRevise,
            trimmed,
            llmModel,
          )
        : await agentApi.courseAgentChat(
            selectedCourseId,
            sessionIdRef.current,
            trimmed,
            llmModel,
            agentMode,
          );
      applyResponse(res);
      void refreshSubscription();
    } catch (error) {
      console.error('Course agent chat error:', error);
      pushMessage('assistant', 'Произошла ошибка при обработке запроса.');
      toast.error('Ошибка запроса к агенту');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourseId, pendingPlan, pushMessage, applyResponse, adoptSessionId, agentMode, selectedLlmModel, refreshSubscription]);

  const handleSend = useCallback(() => {
    void sendChat(input);
  }, [input, sendChat]);

  useEffect(() => {
    if (!finishPayload) {
      return;
    }
    const executionCourseId = useCourseAgentExecutionStore.getState().courseId;
    if (executionCourseId != null && selectedCourseId != null && executionCourseId !== selectedCourseId) {
      return;
    }
    const payload = useCourseAgentExecutionStore.getState().consumeFinishPayload();
    if (!payload) {
      return;
    }
    if (payload.kind === 'success') {
      applyResponse(payload.response);
      void refreshSubscription();
      return;
    }
    if (payload.kind === 'partial') {
      pushMessage(
        'assistant',
        'Ответ не дождались, но часть черновика уже создана. Обновите структуру курса при необходимости.',
      );
      setPendingPlan(null);
      setCreatedHighlight(buildTreeHighlight(
        null,
        [],
        payload.created.sectionIds,
        payload.created.lessonIds,
        payload.created.stepIds,
      ));
      toast.success('Черновик частично создан');
      structureHandlersRef.current?.refresh();
      void refreshSubscription();
      return;
    }
    pushMessage('assistant', payload.message || 'Не удалось выполнить план.');
    toast.error(payload.message || 'Ошибка выполнения плана');
  }, [finishPayload, selectedCourseId, applyResponse, pushMessage, refreshSubscription]);

  const confirmPlan = useCallback(async () => {
    if (!selectedCourseId || !pendingPlan) return;

    if (!isPro && !isDeleteOnlyPlan(pendingPlan) && aiLimit != null) {
      const plannedSteps = estimatePlanExecution(pendingPlan).totalSteps;
      const remaining = Math.max(0, aiLimit - aiUsed);
      if (plannedSteps > remaining) {
        toast.error(
          `В плане ${plannedSteps} шаг., осталось ${remaining} из ${aiLimit}. Уменьшите план или оформите Pro.`,
        );
        return;
      }
    }

    const executionStore = useCourseAgentExecutionStore.getState();
    if (executionStore.isExecuting) {
      toast.error('Генерация уже выполняется. Дождитесь завершения.');
      return;
    }

    const started = executionStore.beginExecution({
      courseId: selectedCourseId,
      sessionId: sessionIdRef.current,
      plan: pendingPlan,
    });
    if (!started) {
      toast.error('Генерация уже выполняется. Дождитесь завершения.');
      return;
    }

    if (!isDeleteOnlyPlan(pendingPlan)) {
      toast('Не меняйте структуру курса, пока идёт генерация', {
        duration: 6000,
      });
    }

    const abortController = new AbortController();
    const planSnapshot = pendingPlan;
    const courseIdSnapshot = selectedCourseId;
    const sessionIdSnapshot = sessionIdRef.current;
    const llmModel = selectedLlmModel || undefined;

    try {
      if (isDeleteOnlyPlan(planSnapshot)) {
        const res = await agentApi.courseAgentExecutePlan(
          courseIdSnapshot,
          sessionIdSnapshot,
          planSnapshot,
          llmModel,
        );
        useCourseAgentExecutionStore.getState().completeExecution({ kind: 'success', response: res });
        return;
      }

      // SSE is best-effort progress only — never block or fail execute on stream errors.
      // Waiting for INIT caused false failures when async SSE hit Access Denied / buffering.
      const streamPromise = agentApi.courseAgentExecutePlanStream(
        courseIdSnapshot,
        sessionIdSnapshot,
        {
          onReady: () => undefined,
          onProgress: (event) => {
            useCourseAgentExecutionStore.getState().applyProgressEvent(event);
            const type = event.planExecutionEventType;
            if (type === 'SECTION_CREATED' && event.createdSectionId != null) {
              setCreatedHighlight((prev) => ({
                sectionIds: new Set([...(prev?.sectionIds ?? []), event.createdSectionId!]),
                lessonIds: new Set(prev?.lessonIds ?? []),
                stepIds: new Set(prev?.stepIds ?? []),
              }));
            }
            if (type === 'LESSON_CREATED' && event.createdLessonId != null) {
              setCreatedHighlight((prev) => ({
                sectionIds: new Set(prev?.sectionIds ?? []),
                lessonIds: new Set([...(prev?.lessonIds ?? []), event.createdLessonId!]),
                stepIds: new Set(prev?.stepIds ?? []),
              }));
            }
            if (type === 'STEP_CREATED' && event.createdStepId != null) {
              setCreatedHighlight((prev) => ({
                sectionIds: new Set(prev?.sectionIds ?? []),
                lessonIds: new Set(prev?.lessonIds ?? []),
                stepIds: new Set([...(prev?.stepIds ?? []), event.createdStepId!]),
              }));
            }
          },
        },
        abortController.signal,
      ).catch((error) => {
        console.warn('Course agent SSE stream unavailable, continuing execute', error);
      });

      // Give the stream a brief head start so early progress events are not missed.
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 150);
      });

      try {
        const res = await agentApi.courseAgentExecutePlan(
          courseIdSnapshot,
          sessionIdSnapshot,
          planSnapshot,
          llmModel,
        );
        useCourseAgentExecutionStore.getState().completeExecution({ kind: 'success', response: res });
      } finally {
        abortController.abort();
        await streamPromise;
      }
    } catch (error) {
      console.error('Course agent execute error:', error);
      const message = extractApiErrorMessage(error, 'Не удалось выполнить план.');
      const created = useCourseAgentExecutionStore.getState().createdIds;
      if (created.stepIds.length > 0 || created.lessonIds.length > 0 || created.sectionIds.length > 0) {
        useCourseAgentExecutionStore.getState().completeExecution({ kind: 'partial', created });
      } else {
        useCourseAgentExecutionStore.getState().completeExecution({ kind: 'failed', message });
      }
    } finally {
      if (!abortController.signal.aborted) {
        abortController.abort();
      }
    }
  }, [selectedCourseId, pendingPlan, selectedLlmModel, isPro, aiUsed, aiLimit]);

  const cancelPlan = useCallback(async () => {
    if (!selectedCourseId) return;
    if (useCourseAgentExecutionStore.getState().isExecutingFor(selectedCourseId)) {
      toast.error('Дождитесь окончания генерации');
      return;
    }
    setIsLoading(true);
    try {
      const response = await agentApi.courseAgentCancelPlan(
        selectedCourseId,
        sessionIdRef.current
      );
      applyResponse(response);
    } catch (error) {
      console.error('Course agent cancel plan error:', error);
      toast.error('Не удалось отменить план');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourseId, applyResponse]);

  const chooseCandidate = useCallback(async (candidate: EntityCandidate) => {
    if (!selectedCourseId || !resumeContext) return;
    setCandidates([]);
    setIsLoading(true);
    pushMessage('user', `Выбран вариант: ${candidate.label}`);
    try {
      const res = await agentApi.courseAgentSelectCandidate(
        selectedCourseId,
        sessionIdRef.current,
        resumeContext,
        candidate,
        lastUserInputRef.current,
        selectedLlmModel || undefined,
        agentMode,
      );
      applyResponse(res);
      void refreshSubscription();
    } catch (error) {
      console.error('Course agent candidate error:', error);
      toast.error('Не удалось применить выбранный вариант');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourseId, resumeContext, pushMessage, applyResponse, agentMode, selectedLlmModel, refreshSubscription]);

  const updatePlan = useCallback((plan: CoursePlanDTO) => {
    setPendingPlan(plan);
  }, []);

  const courseOptions = useMemo(
    () => courses.map((c) => ({ value: String(c.id), label: c.title })),
    [courses]
  );

  const planHighlight = useMemo(
    () => buildTreeHighlight(pendingPlan, candidates),
    [pendingPlan, candidates],
  );

  const treeHighlight = useMemo(() => {
    if (!createdHighlight) {
      return planHighlight;
    }
    return {
      sectionIds: new Set([...planHighlight.sectionIds, ...createdHighlight.sectionIds]),
      lessonIds: new Set([...planHighlight.lessonIds, ...createdHighlight.lessonIds]),
      stepIds: new Set([...planHighlight.stepIds, ...createdHighlight.stepIds]),
    };
  }, [createdHighlight, planHighlight]);

  const clearPendingHandoff = useCallback(() => {
    setPendingHandoff(null);
  }, []);

  const resetSession = useCallback(async () => {
    if (!selectedCourseId) {
      return;
    }
    if (useCourseAgentExecutionStore.getState().isExecutingFor(selectedCourseId)) {
      toast.error('Дождитесь окончания генерации');
      return;
    }
    const previousSessionId = sessionIdRef.current;
    setIsLoading(true);
    try {
      await agentApi.clearCourseAgentSession(selectedCourseId, previousSessionId);
    } catch (error) {
      console.error('Course agent clear session error:', error);
      toast.error('Не удалось сбросить историю на сервере');
    } finally {
      const nextSessionId = newSessionId();
      adoptSessionId(selectedCourseId, nextSessionId);
      sessionIdRef.current = nextSessionId;
      lastUserInputRef.current = '';
      setMessages([]);
      setPendingPlan(null);
      setCandidates([]);
      setResumeContext(null);
      setInput('');
      setCreatedHighlight(null);
      setIsLoading(false);
      toast.success('История сессии сброшена');
    }
  }, [selectedCourseId, adoptSessionId]);

  const displayedPendingPlan = executionPlan ?? pendingPlan;

  return {
    courses,
    courseOptions,
    selectedCourseId,
    setSelectedCourseId,
    messages,
    input,
    setInput,
    pendingPlan: displayedPendingPlan,
    candidates,
    isLoading,
    isExecuting,
    executionLive,
    loadingStatus,
    handleSend,
    confirmPlan,
    cancelPlan,
    chooseCandidate,
    updatePlan,
    resetSession,
    agentMode,
    setAgentMode,
    selectedLlmModel,
    setSelectedLlmModel,
    canSelectModel,
    appendInputContext,
    registerStructureHandlers,
    treeHighlight,
    pendingHandoff,
    clearPendingHandoff,
  };
}
