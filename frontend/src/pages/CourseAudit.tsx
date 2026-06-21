import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  ClipboardCopy,
  Crown,
  Layers,
  Lock,
  Sparkles,
  Lightbulb,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { MainLayout } from '../components/Layout';
import { Button, Card, PageLoader, Select, Spinner } from '../components/ui';
import { ChatMarkdown } from '../components/ui/ChatMarkdown';
import { ProUpgradeModal } from '../components/subscription/ProUpgradeModal';
import { agentApi, coursesApi, lessonsApi, sectionsApi } from '../api';
import { useAuthStore, useAIGeneratorStore } from '../store';
import { useSubscription } from '../hooks/useSubscription';
import { COURSE_AUDIT_PRO_MESSAGE } from '../constants/subscription';
import { extractApiErrorMessage } from '../utils/apiError';
import type { Course } from '../types';
import {
  parseCourseAuditHints,
  formatHintLocation,
  groupAuditHints,
  type CourseLessonContext,
} from '../utils/parseCourseAuditHints';
import {
  splitAuditReport,
  buildReportTabContent,
  buildImprovementsTabContent,
  normalizeAuditMarkdown,
} from '../utils/parseCourseAuditSections';

type AuditTab = 'report' | 'ideas';

function HintCard({
  hintIndex,
  location,
  prompt,
  isNewContent,
  lessonSelectOptions,
  selectedLessonId,
  onLessonChange,
  onOpenBatch,
  onCopyPrompt,
}: {
  hintIndex: number;
  location: string | null;
  prompt: string;
  isNewContent: boolean;
  lessonSelectOptions: { value: string; label: string }[];
  selectedLessonId: string;
  onLessonChange: (index: number, lessonId: string) => void;
  onOpenBatch: (index: number, prompt: string) => void;
  onCopyPrompt: (prompt: string) => void;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        isNewContent
          ? 'border-amber-500/30 bg-amber-950/20'
          : 'border-dark-700 bg-dark-900/50'
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {isNewContent && (
          <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
            Новый контент
          </span>
        )}
        {location && (
          <p className="text-xs font-medium leading-relaxed text-primary-300">{location}</p>
        )}
      </div>

      <p className="mb-3 text-sm leading-relaxed text-dark-200">{prompt}</p>

      {isNewContent ? (
        <>
          <p className="mb-3 text-xs text-amber-200/80">
            Сначала создайте модуль/урок в редакторе курса, затем выберите его ниже или скопируйте
            промпт.
          </p>
          <Select
            label="Урок (после создания)"
            value={selectedLessonId}
            onChange={(e) => onLessonChange(hintIndex, e.target.value)}
            options={lessonSelectOptions}
          />
          <div className="mt-3 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              icon={<ClipboardCopy className="h-3.5 w-3.5" />}
              onClick={() => onCopyPrompt(prompt)}
            >
              Копировать
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              disabled={!selectedLessonId}
              onClick={() => onOpenBatch(hintIndex, prompt)}
            >
              Открыть batch
            </Button>
          </div>
        </>
      ) : (
        <>
          <Select
            label="Урок для генерации"
            value={selectedLessonId}
            onChange={(e) => onLessonChange(hintIndex, e.target.value)}
            options={lessonSelectOptions}
          />
          <Button
            variant="secondary"
            size="sm"
            className="mt-3 w-full"
            disabled={!selectedLessonId}
            onClick={() => onOpenBatch(hintIndex, prompt)}
          >
            Открыть batch
          </Button>
        </>
      )}
    </div>
  );
}

export function CourseAudit() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isPro, isLoading: isSubscriptionLoading, refresh: refreshSubscription } = useSubscription();
  const { setMode, setSelectedLessonId, setPendingBatchUserInput } = useAIGeneratorStore();

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [courseLessons, setCourseLessons] = useState<CourseLessonContext[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<string | null>(null);
  const [hintLessonIds, setHintLessonIds] = useState<Record<number, string>>({});
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AuditTab>('report');

  useEffect(() => {
    const loadCourses = async () => {
      if (!user?.id) return;
      setIsLoadingCourses(true);
      try {
        const data = await coursesApi.getUserCourses(user.id);
        setCourses(data);
        if (data.length > 0) {
          setSelectedCourseId((prev) => prev || String(data[0].id));
        }
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Не удалось загрузить курсы'));
      } finally {
        setIsLoadingCourses(false);
      }
    };

    void loadCourses();
  }, [user?.id]);

  const loadCourseLessons = useCallback(async (courseId: number) => {
    setIsLoadingLessons(true);
    try {
      const course = courses.find((item) => item.id === courseId);
      const sections = await sectionsApi.getCourseSections(courseId);
      const lessons: CourseLessonContext[] = [];

      for (const section of sections) {
        const sectionLessons = await lessonsApi.getSectionLessons(section.id);
        for (const lesson of sectionLessons) {
          lessons.push({
            id: lesson.id,
            title: lesson.title,
            position: lesson.position,
            sectionTitle: section.title,
            sectionPosition: section.position,
            courseTitle: course?.title ?? '',
          });
        }
      }

      setCourseLessons(lessons);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Не удалось загрузить уроки курса'));
      setCourseLessons([]);
    } finally {
      setIsLoadingLessons(false);
    }
  }, [courses]);

  useEffect(() => {
    if (!selectedCourseId) {
      setCourseLessons([]);
      return;
    }
    void loadCourseLessons(Number(selectedCourseId));
  }, [selectedCourseId, loadCourseLessons]);

  const batchHints = useMemo(() => {
    if (!analyzeResult) return [];
    return parseCourseAuditHints(analyzeResult, courseLessons);
  }, [analyzeResult, courseLessons]);

  const groupedHints = useMemo(() => groupAuditHints(batchHints), [batchHints]);

  const auditSections = useMemo(() => {
    if (!analyzeResult) return null;
    return splitAuditReport(analyzeResult);
  }, [analyzeResult]);

  const reportTabContent = useMemo(() => {
    if (!auditSections) return '';
    return normalizeAuditMarkdown(buildReportTabContent(auditSections));
  }, [auditSections]);

  const improvementsTabContent = useMemo(() => {
    if (!auditSections) return '';
    return normalizeAuditMarkdown(buildImprovementsTabContent(auditSections));
  }, [auditSections]);

  useEffect(() => {
    const defaults: Record<number, string> = {};
    batchHints.forEach((hint, index) => {
      if (hint.suggestedLessonId != null) {
        defaults[index] = String(hint.suggestedLessonId);
      }
    });
    setHintLessonIds(defaults);
  }, [batchHints]);

  const handleAnalyze = async () => {
    if (!selectedCourseId) {
      toast.error('Выберите курс');
      return;
    }

    setIsAnalyzing(true);
    setAnalyzeResult(null);
    setActiveTab('report');
    try {
      const response = await agentApi.analyzeCourse(Number(selectedCourseId));
      setAnalyzeResult(response.analyzeResult);
      await refreshSubscription();
      toast.success('Аудит курса завершён');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Не удалось выполнить аудит курса'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOpenBatch = (hintIndex: number, prompt: string) => {
    const lessonId = hintLessonIds[hintIndex];
    if (!lessonId) {
      toast.error('Выберите урок для batch-генерации');
      return;
    }

    setSelectedLessonId(Number(lessonId));
    setPendingBatchUserInput(prompt);
    setMode('batch');
    navigate('/ai-generator');
    toast.success('Промпт перенесён в batch-генератор');
  };

  const handleCopyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success('Промпт скопирован');
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  const courseOptions = courses.length > 0
    ? courses.map((course) => ({
        value: String(course.id),
        label: course.title,
      }))
    : [{ value: '', label: 'Нет курсов' }];

  const lessonSelectOptions = [
    { value: '', label: 'Выберите урок' },
    ...courseLessons.map((lesson) => ({
      value: String(lesson.id),
      label: `${lesson.sectionTitle} · Урок ${lesson.position}: ${lesson.title}`,
    })),
  ];

  const renderHintGroup = (
    title: string,
    items: Array<{ hint: (typeof batchHints)[0]; index: number }>,
    emptyText: string
  ) => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-dark-300">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-dark-500">{emptyText}</p>
      ) : (
        items.map(({ hint, index }) => (
          <HintCard
            key={`${hint.prompt}-${index}`}
            hintIndex={index}
            location={formatHintLocation(hint)}
            prompt={hint.prompt}
            isNewContent={hint.target !== 'existing'}
            lessonSelectOptions={lessonSelectOptions}
            selectedLessonId={hintLessonIds[index] ?? ''}
            onLessonChange={(idx, lessonId) =>
              setHintLessonIds((prev) => ({ ...prev, [idx]: lessonId }))
            }
            onOpenBatch={handleOpenBatch}
            onCopyPrompt={handleCopyPrompt}
          />
        ))
      )}
    </div>
  );

  if (isSubscriptionLoading || isLoadingCourses) {
    return (
      <MainLayout>
        <PageLoader />
      </MainLayout>
    );
  }

  if (!isPro) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-2xl py-12">
          <Card className="border-primary-500/20 bg-gradient-to-br from-dark-900 to-dark-800 p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/15">
              <Lock className="h-7 w-7 text-primary-400" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-dark-100">AI-аудит курса</h1>
            <p className="mb-6 text-dark-400">{COURSE_AUDIT_PRO_MESSAGE}</p>
            <Button icon={<Crown className="h-4 w-4" />} onClick={() => setIsUpgradeModalOpen(true)}>
              Перейти на Pro
            </Button>
          </Card>
        </div>
        <ProUpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-8 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-dark-100">
              <ClipboardCheck className="h-8 w-8 text-primary-400" />
              Аудит курса
            </h1>
            <p className="mt-2 max-w-2xl text-dark-400">
              AI проанализирует курс, предложит улучшения и batch-подсказки. Yandex GPT Pro.
            </p>
          </div>
          <div className="rounded-xl border border-primary-500/25 bg-primary-900/20 px-4 py-2 text-sm text-primary-200">
            Yandex GPT Pro
          </div>
        </div>
      </div>

      <Card className="mb-6 p-6">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <Select
            label="Курс"
            value={selectedCourseId}
            onChange={(e) => {
              setSelectedCourseId(e.target.value);
              setAnalyzeResult(null);
            }}
            options={courseOptions}
            disabled={courses.length === 0 || isAnalyzing}
          />
          <Button
            onClick={() => void handleAnalyze()}
            disabled={!selectedCourseId || isAnalyzing || isLoadingLessons}
            icon={isAnalyzing ? undefined : <Sparkles className="h-4 w-4" />}
            className="md:min-w-[180px]"
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                Анализ...
              </span>
            ) : (
              'Запустить аудит'
            )}
          </Button>
        </div>
      </Card>

      {analyzeResult && (
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <Card className="p-6">
            <div className="mb-5 flex flex-wrap gap-2 border-b border-dark-700 pb-4">
              <button
                type="button"
                onClick={() => setActiveTab('report')}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'report'
                    ? 'bg-primary-500/20 text-primary-200'
                    : 'text-dark-400 hover:bg-dark-800 hover:text-dark-200'
                }`}
              >
                <FileText className="h-4 w-4" />
                Отчёт
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ideas')}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'ideas'
                    ? 'bg-amber-500/15 text-amber-200'
                    : 'text-dark-400 hover:bg-dark-800 hover:text-dark-200'
                }`}
              >
                <Lightbulb className="h-4 w-4" />
                Идеи для улучшения
              </button>
            </div>

            {activeTab === 'report' ? (
              <ChatMarkdown content={reportTabContent || normalizeAuditMarkdown(analyzeResult)} />
            ) : improvementsTabContent ? (
              <div className="space-y-8">
                {auditSections?.improvements && (
                  <section>
                    <h2 className="mb-3 text-base font-semibold text-dark-100">
                      Улучшения существующих уроков
                    </h2>
                    <ChatMarkdown content={normalizeAuditMarkdown(auditSections.improvements)} />
                  </section>
                )}
                {auditSections?.newContent && (
                  <section className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4">
                    <h2 className="mb-3 text-base font-semibold text-amber-200">
                      Новые модули и уроки
                    </h2>
                    <ChatMarkdown content={normalizeAuditMarkdown(auditSections.newContent)} />
                  </section>
                )}
              </div>
            ) : (
              <p className="text-sm text-dark-500">Нет раздела с идеями. Запустите аудит повторно.</p>
            )}
          </Card>

          <div className="space-y-4">
            <Card className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary-400" />
                <h2 className="text-lg font-semibold text-dark-100">Batch-подсказки</h2>
              </div>

              {batchHints.length === 0 ? (
                <p className="text-sm text-dark-500">
                  Подсказки не найдены. Скопируйте текст из отчёта вручную.
                </p>
              ) : (
                <div className="space-y-6">
                  {renderHintGroup(
                    'Для существующих уроков',
                    groupedHints.existing,
                    'Нет подсказок для текущих уроков'
                  )}
                  {renderHintGroup(
                    'Для нового контента',
                    groupedHints.newContent,
                    'Нет подсказок для новых модулей/уроков'
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
