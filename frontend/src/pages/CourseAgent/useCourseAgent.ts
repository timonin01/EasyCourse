import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { agentApi, coursesApi } from '../../api';
import { useAuthStore } from '../../store';
import type {
  Course,
  CoursePlanDTO,
  CourseAgentResponse,
  AgentResumeContext,
  EntityCandidate,
  ChatMessage,
} from '../../types';
import type { CourseTreeHighlight } from './types';
import { buildTreeHighlight } from './utils/planHighlight';
import { isDeletePlan } from './utils/planIntent';
import { useCourseAgentStore } from '../../store';
import type { CourseAgentPendingRequest } from '../../utils/buildAuditAgentHandoff';
import {
  getChatLoadingPhases,
  getExecuteLoadingPhases,
  pickLoadingPhase,
} from './utils/loadingStatus';

export type CourseAgentChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

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
      content: message.content ?? '',
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
    pendingPlan: lastResponse?.action === 'SHOW_PLAN' ? (lastResponse.plan ?? null) : null,
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
  const [isExecuting, setIsExecuting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [createdHighlight, setCreatedHighlight] = useState<CourseTreeHighlight | null>(null);
  const [pendingHandoff, setPendingHandoff] = useState<CourseAgentPendingRequest | null>(null);

  const sessionIdRef = useRef<string>(newSessionId());
  const lastUserInputRef = useRef<string>('');
  const structureRefreshRef = useRef<(() => void) | undefined>(undefined);
  const pendingHandoffRef = useRef<CourseAgentPendingRequest | null>(null);
  const loadingStartedAtRef = useRef<number | null>(null);
  const wasBusyRef = useRef(false);

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

    const phases = isExecuting
      ? getExecuteLoadingPhases()
      : getChatLoadingPhases(Boolean(pendingPlan));

    const tick = () => {
      const startedAt = loadingStartedAtRef.current ?? Date.now();
      setLoadingStatus(pickLoadingPhase(phases, Date.now() - startedAt));
    };

    tick();
    const interval = window.setInterval(tick, 2000);
    return () => window.clearInterval(interval);
  }, [isLoading, isExecuting, pendingPlan]);

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

  const registerStructureRefresh = useCallback((refresh: () => void) => {
    structureRefreshRef.current = refresh;
  }, []);

  const appendInputContext = useCallback((text: string) => {
    if (!text) return;
    setInput((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}\n${text}` : text;
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
          return prev ?? (list[0]?.id ?? null);
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
    if (!selectedCourseId || !user?.id) {
      return;
    }
    let cancelled = false;
    setMessages([]);
    setPendingPlan(null);
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
        setPendingPlan(restored.pendingPlan);
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
      pushMessage('assistant', res.message);
    }
    if (res.action === 'SHOW_PLAN') {
      setPendingPlan(res.plan ?? null);
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
      structureRefreshRef.current?.();
      window.setTimeout(() => setCreatedHighlight(null), 8000);
    }
    if (res.action === 'STEP_MODIFIED') {
      toast.success('Шаг обновлён');
      if (res.step?.id) {
        setCreatedHighlight(buildTreeHighlight(null, [], [], [], [res.step.id]));
        structureRefreshRef.current?.();
        window.setTimeout(() => setCreatedHighlight(null), 5000);
      }
    }
    if (res.action === 'ENTITY_DELETED') {
      toast.success(res.message || 'Удалено');
      structureRefreshRef.current?.();
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

    const planToRevise = pendingPlan && !isDeletePlan(pendingPlan) ? pendingPlan : null;
    if (pendingPlan && isDeletePlan(pendingPlan)) {
      toast.error('План удаления нельзя изменить через чат. Подтвердите удаление или отмените план.');
      return;
    }
    lastUserInputRef.current = planToRevise ? lastUserInputRef.current : trimmed;
    pushMessage('user', trimmed);
    setInput('');
    setCandidates([]);
    setIsLoading(true);
    try {
      const res = planToRevise
        ? await agentApi.courseAgentEditPlan(
            selectedCourseId,
            sessionIdRef.current,
            planToRevise,
            trimmed
          )
        : await agentApi.courseAgentChat(selectedCourseId, sessionIdRef.current, trimmed);
      applyResponse(res);
    } catch (error) {
      console.error('Course agent chat error:', error);
      pushMessage('assistant', 'Произошла ошибка при обработке запроса.');
      toast.error('Ошибка запроса к агенту');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourseId, pendingPlan, pushMessage, applyResponse, adoptSessionId]);

  const handleSend = useCallback(() => {
    void sendChat(input);
  }, [input, sendChat]);

  const confirmPlan = useCallback(async () => {
    if (!selectedCourseId || !pendingPlan) return;
    setIsExecuting(true);
    try {
      const res = await agentApi.courseAgentExecutePlan(selectedCourseId, sessionIdRef.current, pendingPlan);
      applyResponse(res);
    } catch (error) {
      console.error('Course agent execute error:', error);
      pushMessage('assistant', 'Не удалось выполнить план.');
      toast.error('Ошибка выполнения плана');
    } finally {
      setIsExecuting(false);
    }
  }, [selectedCourseId, pendingPlan, applyResponse, pushMessage]);

  const cancelPlan = useCallback(async () => {
    if (!selectedCourseId) return;
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
        lastUserInputRef.current
      );
      applyResponse(res);
    } catch (error) {
      console.error('Course agent candidate error:', error);
      toast.error('Не удалось применить выбранный вариант');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourseId, resumeContext, pushMessage, applyResponse]);

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

  return {
    courses,
    courseOptions,
    selectedCourseId,
    setSelectedCourseId,
    messages,
    input,
    setInput,
    pendingPlan,
    candidates,
    isLoading,
    isExecuting,
    loadingStatus,
    handleSend,
    confirmPlan,
    cancelPlan,
    chooseCandidate,
    updatePlan,
    resetSession,
    appendInputContext,
    registerStructureRefresh,
    treeHighlight,
    pendingHandoff,
    clearPendingHandoff,
  };
}
