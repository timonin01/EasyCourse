import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  ClipboardCopy,
  Crown,
  Layers,
  Lock,
  Sparkles,
  FileText,
  RotateCcw,
  PenLine,
  PlusCircle,
  FileDown,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { MainLayout } from '../components/Layout';
import { Button, Card, Spinner, PageHeader, EmptyState, CourseAuditSkeleton, ContentReveal, Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui';
import { CoursePickerList } from '../components/courses/CoursePickerList';
import { LessonPickerSelect } from '../components/courses/LessonPickerSelect';
import { ChatMarkdown } from '../components/ui/ChatMarkdown';
import { ProUpgradeModal } from '../components/subscription/ProUpgradeModal';
import {
  CourseAuditPdfExportModal,
  type CourseAuditPdfExportOptions,
} from '../components/courseAudit/CourseAuditPdfExportModal';
import { agentApi, coursesApi, lessonsApi, sectionsApi } from '../api';
import { useAuthStore, useAIGeneratorStore, useCourseStore } from '../store';
import { fadeInUp } from '../components/ui/motion';
import { useSubscription } from '../hooks/useSubscription';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { COURSE_AUDIT_PRO_MESSAGE } from '../constants/subscription';
import { extractApiErrorMessage } from '../utils/apiError';
import type { Course } from '../types';
import {
  parseCourseAuditHints,
  formatHintLocation,
  groupAuditHints,
  getHintLessonKey,
  type CourseLessonContext,
} from '../utils/parseCourseAuditHints';
import {
  splitAuditReport,
  buildReportTabContent,
  normalizeAuditMarkdown,
  stripSectionHeading,
} from '../utils/parseCourseAuditSections';

type AuditTab = 'report' | 'existing' | 'newContent';

function HintCard({
  groupKey,
  location,
  prompts,
  isNewContent,
  courseLessons,
  selectedLessonId,
  onLessonChange,
  onOpenBatch,
  onCopyPrompt,
}: {
  groupKey: string;
  location: string | null;
  prompts: string[];
  isNewContent: boolean;
  courseLessons: CourseLessonContext[];
  selectedLessonId: string;
  onLessonChange: (groupKey: string, lessonId: string) => void;
  onOpenBatch: (groupKey: string, combinedPrompt: string) => void;
  onCopyPrompt: (prompt: string) => void;
}) {
  const combinedPrompt = prompts.join('\n');

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

      {prompts.length === 1 ? (
        <p className="mb-3 text-sm leading-relaxed text-dark-200">{prompts[0]}</p>
      ) : (
        <ul className="mb-3 list-disc space-y-1.5 pl-4">
          {prompts.map((prompt, i) => (
            <li key={i} className="text-sm leading-relaxed text-dark-200">
              {prompt}
            </li>
          ))}
        </ul>
      )}

      {isNewContent ? (
        <>
          <p className="mb-3 text-xs text-amber-200/80">
            Сначала создайте модуль/урок в редакторе курса, затем выберите его ниже или скопируйте
            промпт.
          </p>
          <LessonPickerSelect
            label="Урок (после создания)"
            value={selectedLessonId}
            onChange={(lessonId) => onLessonChange(groupKey, lessonId)}
            lessons={courseLessons}
          />
          <div className="mt-3 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              icon={<ClipboardCopy className="h-3.5 w-3.5" />}
              onClick={() => onCopyPrompt(combinedPrompt)}
            >
              Копировать
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              disabled={!selectedLessonId}
              onClick={() => onOpenBatch(groupKey, combinedPrompt)}
            >
              Открыть batch
            </Button>
          </div>
        </>
      ) : (
        <>
          <LessonPickerSelect
            label="Урок для генерации"
            value={selectedLessonId}
            onChange={(lessonId) => onLessonChange(groupKey, lessonId)}
            lessons={courseLessons}
          />
          <Button
            variant="secondary"
            size="sm"
            className="mt-3 w-full"
            disabled={!selectedLessonId}
            onClick={() => onOpenBatch(groupKey, combinedPrompt)}
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
  const { isPro, refresh: refreshSubscription } = useSubscription();
  const subscriptionStatus = useSubscriptionStore((state) => state.status);
  const isSubscriptionLoading = useSubscriptionStore((state) => state.isLoading);
  const cachedCourses = useCourseStore((state) => state.courses);
  const setCachedCourses = useCourseStore((state) => state.setCourses);
  const { setMode, setSelectedLessonId, setPendingBatchUserInput } = useAIGeneratorStore();

  const [courses, setCourses] = useState<Course[]>(cachedCourses);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [courseLessons, setCourseLessons] = useState<CourseLessonContext[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(cachedCourses.length === 0);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<string | null>(null);
  const [auditedCourseId, setAuditedCourseId] = useState<string | null>(null);
  const [hintLessonIds, setHintLessonIds] = useState<Record<string, string>>({});
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState<AuditTab>('report');

  useEffect(() => {
    const loadCourses = async () => {
      if (!user?.id) return;
      setIsLoadingCourses(true);
      try {
        const data = await coursesApi.getUserCourses(user.id);
        setCourses(data);
        setCachedCourses(data);
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
  }, [user?.id, setCachedCourses]);

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

  const existingTabContent = useMemo(() => {
    if (!auditSections?.improvements) return '';
    return normalizeAuditMarkdown(stripSectionHeading(auditSections.improvements, 'improvements'));
  }, [auditSections]);

  const newContentTabContent = useMemo(() => {
    if (!auditSections?.newContent) return '';
    return normalizeAuditMarkdown(stripSectionHeading(auditSections.newContent, 'newContent'));
  }, [auditSections]);

  const showHintsSidebar = activeTab !== 'report';
  const activeHintGroups =
    activeTab === 'existing'
      ? groupedHints.existing
      : activeTab === 'newContent'
        ? groupedHints.newContent
        : [];

  useEffect(() => {
    const defaults: Record<string, string> = {};
    for (const group of [...groupedHints.existing, ...groupedHints.newContent]) {
      const key = getHintLessonKey(group.hint);
      if (group.hint.suggestedLessonId != null) {
        defaults[key] = String(group.hint.suggestedLessonId);
      }
    }
    setHintLessonIds(defaults);
  }, [groupedHints]);

  const handleAnalyze = async () => {
    if (!selectedCourseId) {
      toast.error('Выберите курс');
      return;
    }

    setIsAnalyzing(true);
    setAnalyzeResult(null);
    setAuditedCourseId(null);
    setActiveTab('report');
    try {
      const response = await agentApi.analyzeCourse(Number(selectedCourseId));
      setAnalyzeResult(response.analyzeResult);
      setAuditedCourseId(selectedCourseId);
      await refreshSubscription();
      toast.success('Аудит курса завершён');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Не удалось выполнить аудит курса'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClearAudit = () => {
    setAnalyzeResult(null);
    setAuditedCourseId(null);
    setHintLessonIds({});
    setActiveTab('report');
  };

  const auditedCourse = courses.find((c) => String(c.id) === auditedCourseId);
  const showCoursePicker = !isAnalyzing && !analyzeResult;

  const handleOpenBatch = (groupKey: string, prompt: string) => {
    const lessonId = hintLessonIds[groupKey];
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

  const handleExportPdf = async (options: CourseAuditPdfExportOptions) => {
    if (!auditSections || !auditedCourseId) {
      toast.error('Нет данных для экспорта');
      return;
    }

    setIsExportingPdf(true);
    try {
      const { blob, filename } = await agentApi.exportCourseAuditPdf({
        courseId: Number(auditedCourseId),
        courseTitle: auditedCourse?.title ?? '',
        summary: normalizeAuditMarkdown(auditSections.summary),
        plan: normalizeAuditMarkdown(auditSections.plan),
        improvements: existingTabContent,
        newContent: newContentTabContent,
        includeReport: options.includeReport,
        includeImprovements: options.includeImprovements,
        includeNewContent: options.includeNewContent,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('PDF скачан');
      setIsPdfModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : extractApiErrorMessage(error, 'Не удалось сформировать PDF');
      toast.error(message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const renderHintGroup = (
    title: string,
    items: typeof groupedHints.existing,
    emptyText: string
  ) => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-dark-300">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-dark-500">{emptyText}</p>
      ) : (
        items.map((group) => {
          const groupKey = getHintLessonKey(group.hint);
          return (
            <HintCard
              key={groupKey}
              groupKey={groupKey}
              location={formatHintLocation(group.hint)}
              prompts={group.prompts}
              isNewContent={group.hint.target !== 'existing'}
              courseLessons={courseLessons}
              selectedLessonId={hintLessonIds[groupKey] ?? ''}
              onLessonChange={(key, lessonId) =>
                setHintLessonIds((prev) => ({ ...prev, [key]: lessonId }))
              }
              onOpenBatch={handleOpenBatch}
              onCopyPrompt={handleCopyPrompt}
            />
          );
        })
      )}
    </div>
  );

  const showInitialLoader =
    (isSubscriptionLoading && subscriptionStatus === null) ||
    (isLoadingCourses && courses.length === 0);

  if (!isPro) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-2xl py-12">
          <Card className="border-primary-500/20 bg-gradient-to-br from-dark-900 to-dark-800 p-8">
            <EmptyState
              compact
              icon={Lock}
              title="AI-аудит курса"
              description={COURSE_AUDIT_PRO_MESSAGE}
              action={
                <Button icon={<Crown className="h-4 w-4" />} onClick={() => setIsUpgradeModalOpen(true)}>
                  Перейти на Pro
                </Button>
              }
            />
          </Card>
        </div>
        <ProUpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ContentReveal
        isLoading={showInitialLoader}
        skeleton={<CourseAuditSkeleton />}
      >
      <PageHeader
        title="Аудит курса"
        description="AI проанализирует курс, предложит доработку существующих уроков и план нового контента."
        icon={<ClipboardCheck className="h-8 w-8 text-primary-400" />}
        action={
          <div className="rounded-xl border border-primary-500/25 bg-primary-900/20 px-4 py-2 text-sm text-primary-200">
            Yandex GPT Pro
          </div>
        }
      />

      {showCoursePicker && (
        <Card className="mb-6 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="mb-2 text-sm font-medium text-dark-300">Курс</h3>
              <CoursePickerList
                courses={courses}
                selectedCourseId={selectedCourseId}
                onSelect={setSelectedCourseId}
                disabled={courses.length === 0}
              />
            </div>
            <Button
              onClick={() => void handleAnalyze()}
              disabled={!selectedCourseId || isLoadingLessons}
              icon={<Sparkles className="h-4 w-4" />}
              className="w-full shrink-0 md:w-auto md:min-w-[180px]"
            >
              Запустить аудит
            </Button>
          </div>
        </Card>
      )}

      {isAnalyzing && (
        <Card className="mb-6 p-6">
          <div className="flex items-center gap-3 text-dark-200">
            <Spinner size="sm" />
            <span>
              Анализируем курс «{courses.find((c) => String(c.id) === selectedCourseId)?.title ?? '…'}»…
            </span>
          </div>
        </Card>
      )}

      {analyzeResult && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-dark-300">
            Аудит курса{' '}
            <span className="font-medium text-dark-100">{auditedCourse?.title ?? '—'}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<FileDown className="h-4 w-4" />}
              onClick={() => setIsPdfModalOpen(true)}
            >
              PDF
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCcw className="h-4 w-4" />}
              onClick={handleClearAudit}
            >
              Очистить
            </Button>
          </div>
        </Card>
      )}

      <CourseAuditPdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onExport={handleExportPdf}
        isExporting={isExportingPdf}
      />

      {analyzeResult && (
        <div className={`grid gap-6 ${showHintsSidebar ? 'xl:grid-cols-[2fr_1fr]' : ''}`}>
          <Card className="p-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AuditTab)}>
              <TabsList className="mb-5 w-full pb-4">
                <TabsTrigger value="report">
                  <FileText className="h-4 w-4" />
                  Отчёт
                </TabsTrigger>
                <TabsTrigger value="existing">
                  <PenLine className="h-4 w-4" />
                  Доработка курса
                </TabsTrigger>
                <TabsTrigger value="newContent" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                  <PlusCircle className="h-4 w-4" />
                  Новый контент
                </TabsTrigger>
              </TabsList>

              <TabsContent value="report">
                <AnimatePresence mode="wait">
                  <motion.div key="report" {...fadeInUp} transition={{ duration: 0.22 }}>
                    <ChatMarkdown content={reportTabContent || normalizeAuditMarkdown(analyzeResult)} />
                  </motion.div>
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="existing">
                <AnimatePresence mode="wait">
                  <motion.div key="existing" {...fadeInUp} transition={{ duration: 0.22 }}>
                    {existingTabContent ? (
                      <ChatMarkdown content={existingTabContent} />
                    ) : (
                      <p className="text-sm text-dark-500">
                        Нет рекомендаций по существующим урокам.
                      </p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="newContent">
                <AnimatePresence mode="wait">
                  <motion.div key="newContent" {...fadeInUp} transition={{ duration: 0.22 }}>
                    {newContentTabContent ? (
                      <ChatMarkdown content={newContentTabContent} />
                    ) : (
                      <p className="text-sm text-dark-500">
                        Нет предложений по новым модулям и урокам.
                      </p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </TabsContent>
            </Tabs>
          </Card>

          {showHintsSidebar && (
            <div className="space-y-4">
              <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary-400" />
                  <h2 className="text-lg font-semibold text-dark-100">Batch-подсказки</h2>
                </div>

                {activeHintGroups.length === 0 ? (
                  <p className="text-sm text-dark-500">
                    {activeTab === 'existing'
                      ? 'Подсказки для существующих уроков не найдены.'
                      : 'Подсказки для нового контента не найдены. Создайте урок в редакторе, затем выберите его здесь.'}
                  </p>
                ) : (
                  renderHintGroup(
                    activeTab === 'existing' ? 'Для существующих уроков' : 'Для нового контента',
                    activeHintGroups,
                    activeTab === 'existing'
                      ? 'Нет подсказок для текущих уроков'
                      : 'Нет подсказок для новых модулей/уроков'
                  )
                )}
              </Card>
            </div>
          )}
        </div>
      )}
      </ContentReveal>
    </MainLayout>
  );
}
