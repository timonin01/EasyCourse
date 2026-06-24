import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  BookOpen,
  Loader2,
  ExternalLink,
  Settings,
  ChevronRight
} from 'lucide-react';
import { StepikIcon } from '../components/StepikIcon';
import toast from 'react-hot-toast';
import { MainLayout } from '../components/Layout';
import { Card, Button, Input, Modal, Badge, PageHeader, EmptyState, StepikSyncSkeleton } from '../components/ui';
import { coursesApi, sectionsApi, lessonsApi, stepsApi, authApi } from '../api';
import { stepikApi, SyncProgress } from '../api/stepik.api';
import { useAuthStore, useCourseStore } from '../store';
import type { Course, Model, Lesson, Step, CaptchaChallenge } from '../types';
import { getStepDisplayType } from '../types';
import {
  countPendingStepikUploads,
  hasPendingStepikUploads,
} from '../utils/stepikSyncStatus';

type TabType = 'upload' | 'download';

interface CourseWithDetails extends Course {
  sections?: Model[];
  lessons?: Lesson[];
  steps?: Step[];
}

export function StepikSync() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { courses, setCourses, updateCourse } = useCourseStore();
  
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [isLoading, setIsLoading] = useState(courses.length === 0);
  const [hasStepikConfig, setHasStepikConfig] = useState(false);
  
  const [selectedCourse, setSelectedCourse] = useState<CourseWithDetails | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  
  const [syncingItems, setSyncingItems] = useState<Set<number>>(new Set());
  const [deletingItems, setDeletingItems] = useState<Set<number>>(new Set());
  
  const [stepikCourseId, setStepikCourseId] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStage, setDownloadStage] = useState<string>('');
  
  const [captchaModal, setCaptchaModal] = useState<{
    isOpen: boolean;
    challenge?: CaptchaChallenge;
    onSubmit?: (token: string) => void;
  }>({ isOpen: false });

  useEffect(() => {
    const checkConfig = async () => {
      if (!user?.id) return;
      try {
        const hasConfig = await authApi.hasStepikOAuthConfig(user.id);
        setHasStepikConfig(hasConfig);
      } catch {
        setHasStepikConfig(false);
      }
    };
    checkConfig();
  }, [user?.id]);

  useEffect(() => {
    const loadCourses = async () => {
      if (!user?.id) return;
      try {
        const data = await coursesApi.getUserCourses(user.id);
        setCourses(data);
      } catch (error) {
        toast.error('Не удалось загрузить курсы');
        console.error('Failed to load courses:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCourses();
  }, [user?.id, setCourses]);

  const loadCourseDetails = async (course: Course): Promise<CourseWithDetails | null> => {
    try {
      setSyncProgress(null);

      const freshCourse = await coursesApi.getCourse(course.id);
      updateCourse(freshCourse);

      const sections = await sectionsApi.getCourseSections(freshCourse.id);
      const allLessons: Lesson[] = [];
      const allSteps: Step[] = [];

      for (const section of sections) {
        const lessons = await lessonsApi.getSectionLessons(section.id);
        allLessons.push(...lessons);

        for (const lesson of lessons) {
          const steps = await stepsApi.getLessonSteps(lesson.id);
          allSteps.push(...steps);
        }
      }

      const details: CourseWithDetails = {
        ...freshCourse,
        sections,
        lessons: allLessons,
        steps: allSteps,
      };
      setSelectedCourse(details);
      return details;
    } catch (error) {
      toast.error('Не удалось загрузить детали курса');
      console.error('Failed to load course details:', error);
      return null;
    }
  };

  const handleUploadCourse = async () => {
    if (!selectedCourse || !selectedCourse.sections) return;

    setIsSyncing(true);
    setSyncProgress(null);

    const finishSync = async () => {
      const updatedCourse = await coursesApi.getCourse(selectedCourse.id);
      updateCourse(updatedCourse);
      await loadCourseDetails(updatedCourse);
      toast.success('Синхронизация с Stepik завершена');
      setIsSyncing(false);
    };

    try {
      const result = await stepikApi.syncCourse(selectedCourse.id);
      
      if (result.requiresCaptcha) {
        setCaptchaModal({
          isOpen: true,
          challenge: result,
          onSubmit: async (token) => {
            setCaptchaModal({ isOpen: false });
            try {
              await stepikApi.syncCourse(selectedCourse.id, token);
              await finishSync();
            } catch {
              toast.error('Ошибка при синхронизации с captcha');
              setIsSyncing(false);
            }
          }
        });
        return;
      }

      await finishSync();
    } catch (error) {
      toast.error('Ошибка при синхронизации курса');
      console.error('Failed to sync course:', error);
      setIsSyncing(false);
    }
  };

  const handleSyncModel = async (modelId: number) => {
    if (!selectedCourse) return;
    
    const section = selectedCourse.sections?.find(m => m.id === modelId);
    if (!section) return;

    setSyncingItems(prev => new Set(prev).add(modelId));
    try {
      if (!section.stepikSectionId) {
        await stepikApi.syncSection(section.id);
        toast.success('Модуль синхронизирован!');
      } else {
        await stepikApi.updateSectionInStepik(section.id);
        toast.success('Модуль обновлён в Stepik!');
      }
      
      const updatedCourse = await coursesApi.getCourse(selectedCourse.id);
      updateCourse(updatedCourse);
      await loadCourseDetails(updatedCourse);
    } catch (error) {
      toast.error('Ошибка при синхронизации модуля');
      console.error('Failed to sync section:', error);
    } finally {
      setSyncingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(modelId);
        return newSet;
      });
    }
  };

  const handleSyncLesson = async (lessonId: number) => {
    if (!selectedCourse) return;
    
    const lesson = selectedCourse.lessons?.find(l => l.id === lessonId);
    if (!lesson) return;

    setSyncingItems(prev => new Set(prev).add(lessonId));
    try {
      if (!lesson.stepikLessonId) {
        await stepikApi.syncLesson(lesson.id);
        toast.success('Урок синхронизирован!');
      } else {
        await stepikApi.updateLessonInStepik(lesson.id);
        toast.success('Урок обновлён в Stepik!');
      }
      
      const updatedCourse = await coursesApi.getCourse(selectedCourse.id);
      updateCourse(updatedCourse);
      await loadCourseDetails(updatedCourse);
    } catch (error) {
      toast.error('Ошибка при синхронизации урока');
      console.error('Failed to sync lesson:', error);
    } finally {
      setSyncingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(lessonId);
        return newSet;
      });
    }
  };

  const handleSyncStep = async (stepId: number) => {
    if (!selectedCourse) return;
    
    const step = selectedCourse.steps?.find(s => s.id === stepId);
    if (!step) return;

    setSyncingItems(prev => new Set(prev).add(stepId));
    try {
      if (!step.stepikStepId) {
        await stepikApi.syncStep(step.id);
        toast.success('Шаг синхронизирован!');
      } else {
        await stepikApi.updateStepInStepik(step.id);
        toast.success('Шаг обновлён в Stepik!');
      }
      
      const updatedCourse = await coursesApi.getCourse(selectedCourse.id);
      updateCourse(updatedCourse);
      await loadCourseDetails(updatedCourse);
    } catch (error) {
      toast.error('Ошибка при синхронизации шага');
      console.error('Failed to sync step:', error);
    } finally {
      setSyncingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(stepId);
        return newSet;
      });
    }
  };

  const handleDeleteModelFromStepik = async (modelId: number) => {
    if (!selectedCourse) return;
    
    const section = selectedCourse.sections?.find(m => m.id === modelId);
    if (!section || !section.stepikSectionId) return;
    
    if (!confirm('Удалить модуль из Stepik? Это действие нельзя отменить.')) return;

    setDeletingItems(prev => new Set(prev).add(modelId));
    try {
      await stepikApi.deleteSectionFromStepik(section.id);
      toast.success('Модуль удален из Stepik!');
      
      const updatedCourse = await coursesApi.getCourse(selectedCourse.id);
      updateCourse(updatedCourse);
      await loadCourseDetails(updatedCourse);
    } catch (error) {
      toast.error('Ошибка при удалении модуля из Stepik');
      console.error('Failed to delete section from Stepik:', error);
    } finally {
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(modelId);
        return newSet;
      });
    }
  };

  const handleDeleteLessonFromStepik = async (lessonId: number) => {
    if (!selectedCourse) return;
    
    const lesson = selectedCourse.lessons?.find(l => l.id === lessonId);
    if (!lesson || !lesson.stepikLessonId) return;
    
    if (!confirm('Удалить урок из Stepik? Это действие нельзя отменить.')) return;

    setDeletingItems(prev => new Set(prev).add(lessonId));
    try {
      await stepikApi.deleteLessonFromStepik(lesson.id);
      toast.success('Урок удален из Stepik!');
      
      const updatedCourse = await coursesApi.getCourse(selectedCourse.id);
      updateCourse(updatedCourse);
      await loadCourseDetails(updatedCourse);
    } catch (error) {
      toast.error('Ошибка при удалении урока из Stepik');
      console.error('Failed to delete lesson from Stepik:', error);
    } finally {
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(lessonId);
        return newSet;
      });
    }
  };

  const handleDeleteStepFromStepik = async (stepId: number) => {
    if (!selectedCourse) return;
    
    const step = selectedCourse.steps?.find(s => s.id === stepId);
    if (!step || !step.stepikStepId) return;
    
    if (!confirm('Удалить шаг из Stepik? Это действие нельзя отменить.')) return;

    setDeletingItems(prev => new Set(prev).add(stepId));
    try {
      await stepikApi.deleteStepFromStepik(step.id);
      toast.success('Шаг удален из Stepik!');
      
      const updatedCourse = await coursesApi.getCourse(selectedCourse.id);
      updateCourse(updatedCourse);
      await loadCourseDetails(updatedCourse);
    } catch (error) {
      toast.error('Ошибка при удалении шага из Stepik');
      console.error('Failed to delete step from Stepik:', error);
    } finally {
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(stepId);
        return newSet;
      });
    }
  };

  const handleDownloadCourse = async () => {
    if (!stepikCourseId.trim()) {
      toast.error('Введите Stepik Course ID');
      return;
    }

    const stepikId = parseInt(stepikCourseId);
    if (isNaN(stepikId)) {
      toast.error('Введите корректный Stepik Course ID');
      return;
    }

    setIsDownloading(true);
    setDownloadStage('Получение данных курса...');

    try {
      setTimeout(() => setDownloadStage('Загрузка модулей...'), 500);
      setTimeout(() => setDownloadStage('Загрузка уроков...'), 1500);
      setTimeout(() => setDownloadStage('Загрузка шагов...'), 2500);

      const { success, course } = await stepikApi.downloadFullCourse(stepikId);

      if (success && course) {
        setDownloadStage('Сохранение в базу данных...');
        toast.success('Курс успешно загружен из Stepik!');
        const data = await coursesApi.getUserCourses(user!.id);
        setCourses(data);
      } else {
        toast.error('Не удалось загрузить курс из Stepik');
      }

      setStepikCourseId('');
    } catch (error) {
      toast.error('Ошибка при загрузке курса');
      console.error('Failed to download course:', error);
    } finally {
      setIsDownloading(false);
      setDownloadStage('');
    }
  };

  const getSyncStatus = (course: Course) => {
    if (course.stepikCourseId && course.fullySynced) {
      return { status: 'synced', label: 'Синхронизирован', icon: CheckCircle, color: 'text-green-400' };
    }
    if (course.stepikCourseId) {
      return { status: 'partial', label: 'Не полностью', icon: AlertTriangle, color: 'text-amber-400' };
    }
    return { status: 'unsynced', label: 'Не синхронизирован', icon: AlertTriangle, color: 'text-amber-400' };
  };

  // Курс выгружен, но часть модулей/уроков/шагов ещё не на Stepik
  const selectedUnsyncedCount = selectedCourse
    ? countPendingStepikUploads({
        course: selectedCourse,
        sections: selectedCourse.sections,
        lessons: selectedCourse.lessons,
        steps: selectedCourse.steps,
      })
    : 0;
  const selectedHasUnsyncedChildren = selectedCourse
    ? hasPendingStepikUploads({
        course: selectedCourse,
        sections: selectedCourse.sections,
        lessons: selectedCourse.lessons,
        steps: selectedCourse.steps,
      })
    : false;
  const showCourseUploadButton =
    selectedCourse != null &&
    (!selectedCourse.stepikCourseId ||
      selectedHasUnsyncedChildren ||
      selectedCourse.fullySynced === false);
  const courseUploadButtonLabel = selectedUnsyncedCount > 0
    ? `Выгрузить на Stepik (${selectedUnsyncedCount})`
    : 'Выгрузить на Stepik';

  const renderItemSyncIcon = (hasStepikId: boolean, needsStepikSync?: boolean) => {
    if (!hasStepikId) {
      return <XCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />;
    }
    if (needsStepikSync) {
      return <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />;
  };

  const handleUploadClick = async () => {
    if (activeTab !== 'upload') {
      setActiveTab('upload');
      return;
    }
    if (!selectedCourse) {
      toast.error('Выберите курс из списка');
      return;
    }

    const details = await loadCourseDetails(selectedCourse);
    if (!details) return;

    const pending = hasPendingStepikUploads({
      course: details,
      sections: details.sections,
      lessons: details.lessons,
      steps: details.steps,
    });

    if (details.stepikCourseId && !pending && details.fullySynced !== false) {
      toast('Курс уже полностью выгружен на Stepik');
      return;
    }

    handleUploadCourse();
  };

  if (isLoading && courses.length === 0) {
    return (
      <MainLayout>
        <StepikSyncSkeleton />
      </MainLayout>
    );
  }

  if (!hasStepikConfig) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto animate-fade-in">
          <EmptyState
            icon={AlertTriangle}
            title="Настройте Stepik OAuth"
            description="Для синхронизации курсов со Stepik необходимо настроить OAuth параметры. Получите Client ID и Client Secret в настройках вашего приложения на Stepik."
            action={
              <Button
                icon={<Settings className="w-4 h-4" />}
                onClick={() => navigate('/settings')}
              >
                Перейти в настройки
              </Button>
            }
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-fade-in">
      <PageHeader
        title="Синхронизация со Stepik"
        description="Выгружайте и загружайте курсы с платформы Stepik"
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'upload' ? 'primary' : 'secondary'}
          icon={isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          onClick={handleUploadClick}
          disabled={isSyncing}
        >
          {isSyncing ? 'Синхронизация...' : courseUploadButtonLabel}
        </Button>
        <Button
          variant={activeTab === 'download' ? 'primary' : 'secondary'}
          icon={<Download className="w-4 h-4" />}
          onClick={() => setActiveTab('download')}
        >
          Загрузить из Stepik
        </Button>
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* Course list */}
          <Card>
            <h3 className="text-lg font-semibold text-dark-100 mb-4">Ваши курсы</h3>
            
            {courses.length === 0 ? (
              <EmptyState
                compact
                icon={BookOpen}
                title="У вас пока нет курсов"
                description="Создайте курс, чтобы синхронизировать его со Stepik"
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/courses')}
                  >
                    Создать курс
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {courses.map((course) => {
                  const syncStatus = getSyncStatus(course);
                  const SyncIcon = syncStatus.icon;
                  
                  return (
                    <div
                      key={course.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer
                        ${selectedCourse?.id === course.id 
                          ? 'border-primary-500 bg-primary-600/10' 
                          : !course.fullySynced
                            ? 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60'
                            : 'border-dark-700 hover:border-dark-600 hover:bg-dark-800/50'
                        }`}
                      onClick={() => loadCourseDetails(course)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-dark-700 rounded-lg">
                          <BookOpen className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-dark-100">{course.title}</h4>
                          <p className="text-sm text-dark-400 line-clamp-1">{course.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 ${syncStatus.color}`}>
                          <SyncIcon className="w-4 h-4" />
                          <span className="text-sm">{syncStatus.label}</span>
                        </div>
                        {course.stepikCourseId && (
                          <Badge variant="default">
                            <a 
                              href={`https://stepik.org/course/${course.stepikCourseId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              #{course.stepikCourseId}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Badge>
                        )}
                        <ChevronRight className="w-4 h-4 text-dark-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Selected course details */}
          {selectedCourse && (
            <Card>
              <h3 className="text-lg font-semibold text-dark-100 mb-4">
                Детали курса: {selectedCourse.title}
              </h3>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-dark-800 rounded-xl text-center">
                  <p className="text-2xl font-bold text-primary-400">
                    {selectedCourse.sections?.length || 0}
                  </p>
                  <p className="text-sm text-dark-400">Модулей</p>
                </div>
                <div className="p-4 bg-dark-800 rounded-xl text-center">
                  <p className="text-2xl font-bold text-primary-400">
                    {selectedCourse.lessons?.length || 0}
                  </p>
                  <p className="text-sm text-dark-400">Уроков</p>
                </div>
                <div className="p-4 bg-dark-800 rounded-xl text-center">
                  <p className="text-2xl font-bold text-primary-400">
                    {selectedCourse.steps?.length || 0}
                  </p>
                  <p className="text-sm text-dark-400">Шагов</p>
                </div>
              </div>

              {/* Sync progress */}
              {syncProgress && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-dark-300">
                      {syncProgress.stage === 'course' && 'Синхронизация курса...'}
                      {syncProgress.stage === 'sections' && `Модули: ${syncProgress.currentItem}`}
                      {syncProgress.stage === 'lessons' && `Уроки: ${syncProgress.currentItem}`}
                      {syncProgress.stage === 'steps' && `Шаги: ${syncProgress.currentItem}`}
                    </span>
                    <span className="text-sm text-dark-400">
                      {syncProgress.current} / {syncProgress.total}
                    </span>
                  </div>
                  <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-500 transition-all duration-300"
                      style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Individual items sync - only if course is synced */}
              {selectedCourse.stepikCourseId && (
                <div className="space-y-6">
                  {selectedHasUnsyncedChildren ? (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-amber-400 mb-1">
                            Курс синхронизирован не полностью
                          </p>
                          <p className="text-sm text-dark-400">
                            {selectedUnsyncedCount} элемент(ов) нужно выгрузить или обновить на Stepik. Нажмите
                            «Выгрузить на Stepik» вверху или используйте кнопку рядом с каждым элементом.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-green-400 mb-1">
                            Курс полностью синхронизирован с Stepik
                          </p>
                          <p className="text-sm text-dark-400">
                            Все модули, уроки и шаги актуальны на Stepik.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-400 mb-1">
                          Выгрузка и обновление
                        </p>
                        <p className="text-sm text-dark-400">
                          Кнопка «Выгрузить на Stepik» вверху создаёт новые элементы и обновляет изменённые.
                          При необходимости можно выгрузить отдельный модуль, урок или шаг ниже.
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedCourse.sections && selectedCourse.sections.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-dark-100 mb-3">Модули</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {selectedCourse.sections.map((section) => (
                          <div
                            key={section.id}
                            className="flex items-center gap-3 p-3 rounded-lg border border-dark-700 hover:border-dark-600 transition-colors"
                          >
                            {renderItemSyncIcon(Boolean(section.stepikSectionId), section.needsStepikSync)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-dark-100 truncate">{section.title}</p>
                              {section.stepikSectionId && (
                                <p className="text-xs text-dark-400">Stepik ID: {section.stepikSectionId}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`p-1 ${section.stepikSectionId && !section.needsStepikSync ? 'text-green-400 hover:text-green-300' : section.needsStepikSync ? 'text-amber-400 hover:text-amber-300' : ''}`}
                              onClick={() => handleSyncModel(section.id)}
                              disabled={syncingItems.has(section.id) || deletingItems.has(section.id)}
                              title={
                                !section.stepikSectionId
                                  ? 'Выгрузить на Stepik'
                                  : section.needsStepikSync
                                    ? 'Обновить на Stepik'
                                    : 'Выгрузить на Stepik'
                              }
                            >
                              {syncingItems.has(section.id) ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Upload className="w-3 h-3" />
                              )}
                            </Button>
                            {section.stepikSectionId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 hover:bg-red-500/10"
                                onClick={() => handleDeleteModelFromStepik(section.id)}
                                disabled={syncingItems.has(section.id) || deletingItems.has(section.id)}
                                title="Удалить из Stepik"
                              >
                                {deletingItems.has(section.id) ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-red-400" />
                                ) : (
                                  <StepikIcon size={12} />
                                )}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCourse.lessons && selectedCourse.lessons.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-dark-100 mb-3">Уроки</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {selectedCourse.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-3 p-3 rounded-lg border border-dark-700 hover:border-dark-600 transition-colors"
                          >
                            {renderItemSyncIcon(Boolean(lesson.stepikLessonId), lesson.needsStepikSync)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-dark-100 truncate">{lesson.title}</p>
                              {lesson.stepikLessonId && (
                                <p className="text-xs text-dark-400">Stepik ID: {lesson.stepikLessonId}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`p-1 ${lesson.stepikLessonId && !lesson.needsStepikSync ? 'text-green-400 hover:text-green-300' : lesson.needsStepikSync ? 'text-amber-400 hover:text-amber-300' : ''}`}
                              onClick={() => handleSyncLesson(lesson.id)}
                              disabled={syncingItems.has(lesson.id) || deletingItems.has(lesson.id)}
                              title={
                                !lesson.stepikLessonId
                                  ? 'Выгрузить на Stepik'
                                  : lesson.needsStepikSync
                                    ? 'Обновить на Stepik'
                                    : 'Выгрузить на Stepik'
                              }
                            >
                              {syncingItems.has(lesson.id) ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Upload className="w-3 h-3" />
                              )}
                            </Button>
                            {lesson.stepikLessonId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 hover:bg-red-500/10"
                                onClick={() => handleDeleteLessonFromStepik(lesson.id)}
                                disabled={syncingItems.has(lesson.id) || deletingItems.has(lesson.id)}
                                title="Удалить из Stepik"
                              >
                                {deletingItems.has(lesson.id) ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-red-400" />
                                ) : (
                                  <StepikIcon size={12} />
                                )}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCourse.steps && selectedCourse.steps.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-dark-100 mb-3">Шаги</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {selectedCourse.steps.map((step) => (
                          <div
                            key={step.id}
                            className="flex items-center gap-3 p-3 rounded-lg border border-dark-700 hover:border-dark-600 transition-colors"
                          >
                            {renderItemSyncIcon(Boolean(step.stepikStepId), step.needsStepikSync)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-dark-100">
                                Шаг {step.position} {getStepDisplayType(step) && `(${getStepDisplayType(step)})`}
                              </p>
                              {step.stepikStepId && (
                                <p className="text-xs text-dark-400">Stepik ID: {step.stepikStepId}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`p-1 ${step.stepikStepId && !step.needsStepikSync ? 'text-green-400 hover:text-green-300' : step.needsStepikSync ? 'text-amber-400 hover:text-amber-300' : ''}`}
                              onClick={() => handleSyncStep(step.id)}
                              disabled={syncingItems.has(step.id) || deletingItems.has(step.id)}
                              title={
                                !step.stepikStepId
                                  ? 'Выгрузить на Stepik'
                                  : step.needsStepikSync
                                    ? 'Обновить на Stepik'
                                    : 'Выгрузить на Stepik'
                              }
                            >
                              {syncingItems.has(step.id) ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Upload className="w-3 h-3" />
                              )}
                            </Button>
                            {step.stepikStepId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 hover:bg-red-500/10"
                                onClick={() => handleDeleteStepFromStepik(step.id)}
                                disabled={syncingItems.has(step.id) || deletingItems.has(step.id)}
                                title="Удалить из Stepik"
                              >
                                {deletingItems.has(step.id) ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-red-400" />
                                ) : (
                                  <StepikIcon size={12} />
                                )}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-dark-700">
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedCourse(null)}
                    >
                      Закрыть
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Download Tab */}
      {activeTab === 'download' && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-dark-100 mb-4">Загрузить курс из Stepik</h3>
            <p className="text-dark-400 mb-6">
              Введите Stepik Course ID для загрузки курса со всеми модулями, уроками и шагами.
              Если курс уже существует локально, он будет обновлён.
            </p>

            <div className="flex gap-4 max-w-md">
              <Input
                placeholder="Stepik Course ID (например: 12345)"
                value={stepikCourseId}
                onChange={(e) => setStepikCourseId(e.target.value)}
                disabled={isDownloading}
              />
              <Button
                icon={isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                onClick={handleDownloadCourse}
                disabled={isDownloading || !stepikCourseId.trim()}
              >
                {isDownloading ? 'Загрузка...' : 'Загрузить'}
              </Button>
            </div>

            {/* Download progress */}
            {isDownloading && (
              <div className="mt-6 max-w-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-dark-300">
                    {downloadStage || 'Загрузка...'}
                  </span>
                  <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
                </div>
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-500 transition-all duration-300 animate-pulse"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            )}

          </Card>

          {/* Synced courses list */}
          <Card>
            <h3 className="text-lg font-semibold text-dark-100 mb-4">Синхронизированные курсы</h3>
            
            {courses.filter(c => c.stepikCourseId).length === 0 ? (
              <EmptyState
                compact
                icon={RefreshCw}
                title="Нет синхронизированных курсов"
                description="Выгрузите курс на Stepik во вкладке «Выгрузить на Stepik»"
              />
            ) : (
              <div className="space-y-3">
                {courses.filter(c => c.stepikCourseId).map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-dark-700 hover:border-dark-600 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-dark-100">{course.title}</h4>
                        <p className="text-sm text-dark-400">
                          Stepik ID: {course.stepikCourseId}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStepikCourseId(course.stepikCourseId?.toString() || '')}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <a 
                        href={`https://stepik.org/course/${course.stepikCourseId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Captcha Modal */}
      <Modal
        isOpen={captchaModal.isOpen}
        onClose={() => setCaptchaModal({ isOpen: false })}
        title="Подтверждение reCAPTCHA"
      >
        <div className="space-y-4">
          <p className="text-dark-400">
            Stepik требует подтверждение reCAPTCHA для создания курса.
            Пожалуйста, перейдите по ссылке и введите полученный токен.
          </p>
          
          {captchaModal.challenge?.captchaImageUrl && (
            <a 
              href={captchaModal.challenge.captchaImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary-400 hover:text-primary-300"
            >
              Открыть reCAPTCHA
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          
          <Input
            label="Токен reCAPTCHA"
            placeholder="Введите токен"
            id="captcha-token"
          />
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setCaptchaModal({ isOpen: false })}>
              Отмена
            </Button>
            <Button
              onClick={() => {
                const token = (document.getElementById('captcha-token') as HTMLInputElement)?.value;
                if (token && captchaModal.onSubmit) {
                  captchaModal.onSubmit(token);
                }
              }}
            >
              Подтвердить
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    </MainLayout>
  );
}

