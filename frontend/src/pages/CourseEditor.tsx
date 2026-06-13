import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Loader2,
  ListChecks,
  FileText,
  TextCursorInput,
  Settings2,
  MessageCircle,
  MessageSquareText,
  Paperclip,
  Code,
  UserCheck,
  Table2,
  Columns,
  Rows,
  Link2,
  ArrowLeftRight,
  AlignLeft,
  ArrowUpDown,
  Type,
  Hash,
  Calculator,
  Shuffle,
  GripVertical,
  Regex,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { MainLayout } from '../components/Layout';
import { Button, Input, Textarea, Modal, Badge, PageLoader, Toggle, FormSection, OptionCard, AddButton, Checkbox, LlmModelSelect } from '../components/ui';
import { StepikIcon } from '../components/StepikIcon';
import { coursesApi, sectionsApi, lessonsApi, stepsApi, agentApi, stepikApi } from '../api';
import { useCourseStore, useAuthStore, useAIGeneratorStore } from '../store';
import type { Model, Lesson, Step, StepType, UpdateStepDTO, StepikBlockRequest } from '../types';
import { getStepDisplayType, getStepBlockName } from '../types';
import { stepMatchesStepik, getStepDiff, type StepDiffInfo } from '../utils/stepikCompare';
import { stepTypeToAIString, EDIT_TASK_BLOCK_NAMES } from './CourseEditor/types';
import { CreateModelModal, CreateLessonModal, CreateStepModal, StepViewModal, StepTypeChangeModal, StepDiffModal } from './CourseEditor/modals';
import { ModelsColumn, LessonsColumn, StepsColumn } from './CourseEditor/columns';
import { SortableList } from '../components/ui';
export function CourseEditor() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  useAuthStore();
  const {
    selectedCourse,
    setSelectedCourse,
    sections,
    setModels,
    selectedModel,
    setSelectedModel,
    lessons,
    setLessons,
    selectedLesson,
    setSelectedLesson,
    steps,
    setSteps,
    addModel,
    removeModel,
    reorderModels,
    updateModel,
    addLesson,
    removeLesson,
    reorderLessons,
    updateLesson,
    addStep,
    removeStep,
    reorderSteps,
    updateStep,
    unsyncedSteps,
    unsyncedLessons,
    unsyncedSections,
    markStepAsUnsynced,
    markModelAsUnsynced,
    markModelAsSynced,
    markLessonAsUnsynced,
    markLessonAsSynced,
    markStepAsSynced,
    saveSyncedModelPositions,
    saveSyncedLessonPositions,
    saveSyncedStepPositions,
    checkAndMarkPositionChanges,
  } = useCourseStore();
  const { setSelectedLessonId, setMode, getOrCreateGenerateSession } = useAIGeneratorStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [isStepViewModalOpen, setIsStepViewModalOpen] = useState(false);
  const [isStepContentEditModalOpen, setIsStepContentEditModalOpen] = useState(false);
  const [isStepTypeChangeModalOpen, setIsStepTypeChangeModalOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', type: 'TEXT' as StepType });
  const [editStepData, setEditStepData] = useState({ title: '', cost: '' });
  const [contentEditData, setContentEditData] = useState({ userInput: '', generatedContent: null as StepikBlockRequest | null });
  const [stepTypeChangeData, setStepTypeChangeData] = useState({ newType: 'TEXT' as StepType });
  const [selectedLlmModel, setSelectedLlmModel] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isDeleteCourseModalOpen, setIsDeleteCourseModalOpen] = useState(false);
  const [isDeleteResultModalOpen, setIsDeleteResultModalOpen] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{ success: string[]; errors: string[] } | null>(null);
  const [deletingItems, setDeletingItems] = useState<Set<number>>(new Set());
  const [syncingItems, setSyncingItems] = useState<Set<number>>(new Set());
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [isCodeStepEditModalOpen, setIsCodeStepEditModalOpen] = useState(false);
  const [codeStepEditData, setCodeStepEditData] = useState<{
    text: string;
    templates_data: string;
    code: string;
    test_cases: [string, string][];
    execution_time_limit: number;
    execution_memory_limit: number;
    feedback_correct?: string;
    feedback_wrong?: string;
  }>({
    text: '',
    templates_data: '::java21',
    code: '',
    test_cases: [['', '']],
    execution_time_limit: 5,
    execution_memory_limit: 256,
    feedback_correct: '',
    feedback_wrong: '',
  });

  type ChoiceOptionEdit = { text: string; is_correct: boolean; feedback: string };
  type MatchingPairEdit = { first: string; second: string };
  const [isChoiceEditModalOpen, setIsChoiceEditModalOpen] = useState(false);
  const [choiceEditData, setChoiceEditData] = useState<{ text: string; options: ChoiceOptionEdit[]; feedback_correct?: string; feedback_wrong?: string }>({ text: '', options: [], feedback_correct: '', feedback_wrong: '' });
  const [choiceEditSourceRest, setChoiceEditSourceRest] = useState<Record<string, unknown>>({});
  const [isMatchingEditModalOpen, setIsMatchingEditModalOpen] = useState(false);
  const [matchingEditData, setMatchingEditData] = useState<{ text: string; pairs: MatchingPairEdit[]; feedback_correct?: string; feedback_wrong?: string }>({ text: '', pairs: [], feedback_correct: '', feedback_wrong: '' });
  const [matchingEditSourceRest, setMatchingEditSourceRest] = useState<Record<string, unknown>>({});
  const [isTextEditModalOpen, setIsTextEditModalOpen] = useState(false);
  const [textEditData, setTextEditData] = useState<{ text: string; feedback_correct?: string; feedback_wrong?: string }>({ text: '', feedback_correct: '', feedback_wrong: '' });

  const [isFreeAnswerEditModalOpen, setIsFreeAnswerEditModalOpen] = useState(false);
  const [freeAnswerEditData, setFreeAnswerEditData] = useState<{
    text: string;
    is_attachments_enabled: boolean;
    is_html_enabled: boolean;
    manual_scoring: boolean;
    feedback_correct?: string;
    feedback_wrong?: string;
  }>({ text: '', is_attachments_enabled: false, is_html_enabled: false, manual_scoring: false, feedback_correct: '', feedback_wrong: '' });

  const [isMathEditModalOpen, setIsMathEditModalOpen] = useState(false);
  const [mathEditData, setMathEditData] = useState<{ text: string; answer: string; maxError: string; feedback_correct?: string; feedback_wrong?: string }>({
    text: '', answer: '', maxError: '1e-06', feedback_correct: '', feedback_wrong: '',
  });

  const [isNumberEditModalOpen, setIsNumberEditModalOpen] = useState(false);
  type NumberOptionEdit = { answer: string; maxError: string };
  const [numberEditData, setNumberEditData] = useState<{ text: string; options: NumberOptionEdit[]; feedback_correct?: string; feedback_wrong?: string }>({ text: '', options: [], feedback_correct: '', feedback_wrong: '' });
  const [numberEditSourceRest, setNumberEditSourceRest] = useState<Record<string, unknown>>({});

  const [isSortingEditModalOpen, setIsSortingEditModalOpen] = useState(false);
  const [sortingEditData, setSortingEditData] = useState<{ text: string; options: { id: number; text: string }[]; feedback_correct?: string; feedback_wrong?: string }>({ text: '', options: [], feedback_correct: '', feedback_wrong: '' });
  const [sortingEditSourceRest, setSortingEditSourceRest] = useState<Record<string, unknown>>({});

  const [isStringEditModalOpen, setIsStringEditModalOpen] = useState(false);
  const [stringEditData, setStringEditData] = useState<{
    text: string;
    pattern: string;
    use_re: boolean;
    match_substring: boolean;
    case_sensitive: boolean;
    code: string;
    feedback_correct?: string;
    feedback_wrong?: string;
  }>({ text: '', pattern: '', use_re: false, match_substring: false, case_sensitive: false, code: '', feedback_correct: '', feedback_wrong: '' });

  const [isFillBlanksEditModalOpen, setIsFillBlanksEditModalOpen] = useState(false);
  type FillBlanksComponentEdit = { type: 'text' | 'blank'; text: string; options: { text: string; is_correct: boolean }[]; inputType?: 'input' | 'select' };
  const [fillBlanksEditData, setFillBlanksEditData] = useState<{
    text: string;
    components: FillBlanksComponentEdit[];
    isCaseSensitive: boolean;
    isDetailedFeedback: boolean;
    isPartiallyCorrect: boolean;
    feedback_correct?: string;
    feedback_wrong?: string;
  }>({ text: '', components: [], isCaseSensitive: false, isDetailedFeedback: false, isPartiallyCorrect: false, feedback_correct: '', feedback_wrong: '' });

  const [isTableEditModalOpen, setIsTableEditModalOpen] = useState(false);
  type TableRowEdit = { name: string; columns: boolean[] };
  const [tableEditData, setTableEditData] = useState<{
    text: string;
    columnNames: string[];
    rows: TableRowEdit[];
    feedback_correct?: string;
    feedback_wrong?: string;
  }>({ text: '', columnNames: [], rows: [], feedback_correct: '', feedback_wrong: '' });
  const [tableEditOptions, setTableEditOptions] = useState<Record<string, unknown>>({});

  const [isRandomTasksEditModalOpen, setIsRandomTasksEditModalOpen] = useState(false);
  const [randomTasksEditData, setRandomTasksEditData] = useState<{
    text: string;
    task: string;
    solve: string;
    maxError: string;
    feedback_correct?: string;
    feedback_wrong?: string;
  }>({ text: '', task: '', solve: '', maxError: '', feedback_correct: '', feedback_wrong: '' });

  // Функции для работы с localStorage
  const getStorageKey = (key: string) => `step-diffs-${courseId}-${key}`;
  
  const loadStepsDiffersFromStorage = (): Set<number> => {
    if (!courseId) return new Set();
    try {
      const stored = localStorage.getItem(getStorageKey('differs'));
      if (stored) {
        const array = JSON.parse(stored) as number[];
        return new Set(array);
      }
    } catch (error) {
      console.error('Failed to load steps differs from storage:', error);
    }
    return new Set();
  };

  const loadStepsDiffDetailsFromStorage = (): Map<number, StepDiffInfo> => {
    if (!courseId) return new Map();
    try {
      const stored = localStorage.getItem(getStorageKey('details'));
      if (stored) {
        const array = JSON.parse(stored) as Array<[number, StepDiffInfo]>;
        return new Map(array);
      }
    } catch (error) {
      console.error('Failed to load steps diff details from storage:', error);
    }
    return new Map();
  };

  const saveStepsDiffersToStorage = (differs: Set<number>) => {
    if (!courseId) return;
    try {
      const array = Array.from(differs);
      localStorage.setItem(getStorageKey('differs'), JSON.stringify(array));
    } catch (error) {
      console.error('Failed to save steps differs to storage:', error);
    }
  };

  const saveStepsDiffDetailsToStorage = (details: Map<number, StepDiffInfo>) => {
    if (!courseId) return;
    try {
      const array = Array.from(details.entries());
      localStorage.setItem(getStorageKey('details'), JSON.stringify(array));
    } catch (error) {
      console.error('Failed to save steps diff details to storage:', error);
    }
  };

  const [stepsDiffersFromStepik, setStepsDiffersFromStepik] = useState<Set<number>>(() => loadStepsDiffersFromStorage());
  const [stepsDiffDetails, setStepsDiffDetails] = useState<Map<number, StepDiffInfo>>(() => loadStepsDiffDetailsFromStorage());
  const [stepsChecking, setStepsChecking] = useState<Set<number>>(new Set());
  const [diffModalStepId, setDiffModalStepId] = useState<number | null>(null);

  // Сохраняем в localStorage при изменении состояния
  useEffect(() => {
    saveStepsDiffersToStorage(stepsDiffersFromStepik);
  }, [stepsDiffersFromStepik, courseId]);

  useEffect(() => {
    saveStepsDiffDetailsToStorage(stepsDiffDetails);
  }, [stepsDiffDetails, courseId]);

  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) return;
      try {
        const course = await coursesApi.getCourse(parseInt(courseId));
        setSelectedCourse(course);
        const courseSections = await sectionsApi.getCourseSections(parseInt(courseId));
        setModels(courseSections);
        // Сохраняем синхронизированные позиции модулей
        saveSyncedModelPositions(courseSections);
        // Проверяем изменения позиций после загрузки
        setTimeout(() => checkAndMarkPositionChanges(), 0);
      } catch (error) {
        toast.error('Не удалось загрузить курс');
        console.error('Failed to load course:', error);
        navigate('/courses');
      } finally {
        setIsLoading(false);
      }
    };
    loadCourse();
  }, [courseId, setSelectedCourse, setModels, navigate, saveSyncedModelPositions]);

  useEffect(() => {
    const loadLessons = async () => {
      if (!selectedModel) return;
      try {
        const modelLessons = await lessonsApi.getSectionLessons(selectedModel.id);
        setLessons(modelLessons);
        // Сохраняем синхронизированные позиции уроков
        saveSyncedLessonPositions(modelLessons);
        // Проверяем изменения позиций после загрузки
        setTimeout(() => checkAndMarkPositionChanges(), 0);
      } catch (error) {
        console.error('Failed to load lessons:', error);
      }
    };
    loadLessons();
  }, [selectedModel, setLessons, saveSyncedLessonPositions]);

  useEffect(() => {
    const loadSteps = async () => {
      if (!selectedLesson) return;
      try {
        const lessonSteps = await stepsApi.getLessonSteps(selectedLesson.id);
        setSteps(lessonSteps);
        // Сохраняем синхронизированные позиции шагов
        saveSyncedStepPositions(lessonSteps);
        // Проверяем изменения позиций после загрузки
        setTimeout(() => checkAndMarkPositionChanges(), 0);
        
        // Автоматически проверяем шаги со Stepik для восстановления состояния различий
        const stepsWithStepik = lessonSteps.filter(step => step.stepikStepId);
        if (stepsWithStepik.length > 0) {
          // Проверяем все шаги асинхронно, но без показа toast
          const checkPromises = stepsWithStepik.map(async (step) => {
            try {
              const stepikData = await stepsApi.getStepFromStepik(step.id);
              const matches = stepMatchesStepik(step, stepikData);
              return { stepId: step.id, matches, diff: matches ? null : getStepDiff(step, stepikData) };
            } catch (error) {
              console.error(`Failed to check step ${step.id} vs Stepik:`, error);
              return null;
            }
          });
          
          const results = await Promise.all(checkPromises);
          // Объединяем с сохраненными данными из localStorage
          const storedDiffers = loadStepsDiffersFromStorage();
          const storedDetails = loadStepsDiffDetailsFromStorage();
          
          const newDiffers = new Set(storedDiffers);
          const newDetails = new Map(storedDetails);
          
          results.forEach(result => {
            if (result) {
              if (result.matches) {
                newDiffers.delete(result.stepId);
                newDetails.delete(result.stepId);
              } else {
                newDiffers.add(result.stepId);
                if (result.diff) {
                  newDetails.set(result.stepId, result.diff);
                }
              }
            }
          });
          
          setStepsDiffersFromStepik(newDiffers);
          setStepsDiffDetails(newDetails);
        }
      } catch (error) {
        console.error('Failed to load steps:', error);
      }
    };
    loadSteps();
  }, [selectedLesson, setSteps, saveSyncedStepPositions, checkAndMarkPositionChanges]);

  const handleCreateModel = async () => {
    if (!courseId || !formData.title.trim()) return;
    setIsSaving(true);
    try {
      const newModel = await sectionsApi.createSection({
        courseId: parseInt(courseId),
        title: formData.title,
        description: formData.description,
      });
      addModel(newModel);
      toast.success('Модуль создан!');
      setIsModelModalOpen(false);
      setFormData({ title: '', description: '', type: 'TEXT' });
    } catch (error) {
      toast.error('Не удалось создать модуль');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateLesson = async () => {
    if (!selectedModel || !formData.title.trim()) return;
    setIsSaving(true);
    try {
      const newLesson = await lessonsApi.createLesson({
        sectionId: selectedModel.id,
        title: formData.title,
      });
      addLesson(newLesson);
      toast.success('Урок создан!');
      setIsLessonModalOpen(false);
      setFormData({ title: '', description: '', type: 'TEXT' });
    } catch (error) {
      toast.error('Не удалось создать урок');
    } finally {
      setIsSaving(false);
    }
  };

  const createCodeStepikBlock = (text: string): StepikBlockRequest => ({
    name: 'code',
    text: text || 'Условие задачи',
    video: null,
    options: null,
    source: {
      code: '',
      templates_data: '::java21',
      test_cases: [['', '']],
      execution_time_limit: 5,
      execution_memory_limit: 256,
      samples_count: 1,
      are_all_tests_run: true,
      is_run_user_code_allowed: true,
      is_time_limit_scaled: true,
      is_memory_limit_scaled: true,
      manual_time_limits: [],
      manual_memory_limits: [],
      test_archive: [],
    },
  });

  const handleCreateStep = async () => {
    if (!selectedLesson) return;
    setIsSaving(true);
    try {
      const payload: Parameters<typeof stepsApi.createStep>[0] = {
        lessonId: selectedLesson.id,
        type: formData.type,
        content: formData.description || '',
      };
      if (formData.type === 'CODE') {
        payload.stepikBlock = createCodeStepikBlock(formData.description || '');
      }
      const newStep = await stepsApi.createStep(payload);
      addStep(newStep);
      toast.success('Шаг создан!');
      setIsStepModalOpen(false);
      setFormData({ title: '', description: '', type: 'TEXT' });
    } catch (error) {
      toast.error('Не удалось создать шаг');
    } finally {
      setIsSaving(false);
    }
  };

  // Подсчет дочерних сущностей для предупреждения
  const getModelChildrenCount = (modelId: number): { lessons: number; steps: number } => {
    const modelLessons = lessons.filter(l => l.sectionId === modelId);
    const stepsCount = modelLessons.reduce((sum, lesson) => {
      return sum + steps.filter(s => s.lessonId === lesson.id).length;
    }, 0);
    return { lessons: modelLessons.length, steps: stepsCount };
  };

  const getLessonChildrenCount = (lessonId: number): number => {
    return steps.filter(s => s.lessonId === lessonId).length;
  };

  // Удаление локально
  const handleDeleteModelLocal = async (modelId: number) => {
    const section = sections.find(m => m.id === modelId);
    if (!section) return;

    if (section.stepikSectionId) {
      toast.error('Нельзя удалить локально синхронизированный модуль. Сначала удалите его со Stepik.');
      return;
    }

    if (!confirm('Удалить этот модуль локально?')) return;

    setDeletingItems(prev => new Set(prev).add(modelId));
    try {
      await sectionsApi.deleteSection(modelId);
      removeModel(modelId);
      toast.success('Модуль удален локально');
      setNeedsRefresh(true);
    } catch (error) {
      toast.error('Ошибка удаления');
    } finally {
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(modelId);
        return newSet;
      });
    }
  };

  const handleDeleteLessonLocal = async (lessonId: number) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    if (lesson.stepikLessonId) {
      toast.error('Нельзя удалить локально синхронизированный урок. Сначала удалите его со Stepik.');
      return;
    }

    if (!confirm('Удалить этот урок локально?')) return;

    setDeletingItems(prev => new Set(prev).add(lessonId));
    try {
      await lessonsApi.deleteLesson(lessonId);
      removeLesson(lessonId);
      toast.success('Урок удален локально');
      setNeedsRefresh(true);
    } catch (error) {
      toast.error('Ошибка удаления');
    } finally {
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(lessonId);
        return newSet;
      });
    }
  };

  const handleDeleteStepLocal = async (stepId: number) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    if (step.stepikStepId) {
      toast.error('Нельзя удалить локально синхронизированный шаг. Сначала удалите его со Stepik.');
      return;
    }

    if (!confirm('Удалить этот шаг локально?')) return;

    setDeletingItems(prev => new Set(prev).add(stepId));
    try {
      await stepsApi.deleteStep(stepId);
      removeStep(stepId);
      toast.success('Шаг удален локально');
      setNeedsRefresh(true);
    } catch (error) {
      toast.error('Ошибка удаления');
    } finally {
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(stepId);
        return newSet;
      });
    }
  };

  // Удаление со Stepik (каскадное)
  const handleDeleteModelFromStepik = async (modelId: number) => {
    const section = sections.find(m => m.id === modelId);
    if (!section || !section.stepikSectionId) return;

    const children = getModelChildrenCount(modelId);
    const warningText = children.lessons > 0 || children.steps > 0
      ? `Внимание! Будет удалено каскадно: модуль "${section.title}", ${children.lessons} урок(ов), ${children.steps} шаг(ов).\n\nРекомендуется удалять сущности в порядке их позиций (1→2→3) для избежания проблем с позициями на Stepik.\n\nПродолжить?`
      : `Удалить модуль "${section.title}" со Stepik? Это действие нельзя отменить.`;

    if (!confirm(warningText)) return;

    setDeletingItems(prev => new Set(prev).add(modelId));
    const success: string[] = [];
    const errors: string[] = [];

    try {
      await stepikApi.deleteSectionFromStepik(modelId);
      success.push(`Модуль "${section.title}" успешно удален`);
      
      // Обновляем локальное состояние - убираем stepikSectionId у модуля и всех дочерних сущностей
      const updatedModel = { ...section, stepikSectionId: undefined };
      updateModel(updatedModel);
      
      // Обновляем уроки этого модуля
      const modelLessons = lessons.filter(l => l.sectionId === modelId);
      modelLessons.forEach(lesson => {
        if (lesson.stepikLessonId) {
          const updatedLesson = { ...lesson, stepikLessonId: undefined };
          updateLesson(updatedLesson);
        }
      });
      
      // Обновляем шаги этих уроков
      modelLessons.forEach(lesson => {
        const lessonSteps = steps.filter(s => s.lessonId === lesson.id);
        lessonSteps.forEach(step => {
          if (step.stepikStepId) {
            const updatedStep = { ...step, stepikStepId: undefined };
            updateStep(updatedStep);
          }
        });
      });
      
      toast.success('Модуль удален со Stepik');
      setNeedsRefresh(true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Неизвестная ошибка';
      errors.push(`Модуль "${section.title}": ${errorMsg}`);
      toast.error('Ошибка при удалении модуля со Stepik');
    } finally {
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(modelId);
        return newSet;
      });
      
      if (errors.length > 0 || success.length > 0) {
        setDeleteResult({ success, errors });
        setIsDeleteResultModalOpen(true);
      }
    }
  };

  const handleDeleteLessonFromStepik = async (lessonId: number) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson || !lesson.stepikLessonId) return;

    const childrenCount = getLessonChildrenCount(lessonId);
    const warningText = childrenCount > 0
      ? `Внимание! Будет удалено каскадно: урок "${lesson.title}", ${childrenCount} шаг(ов).\n\nРекомендуется удалять сущности в порядке их позиций (1→2→3) для избежания проблем с позициями на Stepik.\n\nПродолжить?`
      : `Удалить урок "${lesson.title}" со Stepik? Это действие нельзя отменить.`;

    if (!confirm(warningText)) return;

    setDeletingItems(prev => new Set(prev).add(lessonId));
    const success: string[] = [];
    const errors: string[] = [];

    try {
      await stepikApi.deleteLessonFromStepik(lessonId);
      success.push(`Урок "${lesson.title}" успешно удален`);
      
      // Обновляем локальное состояние - убираем stepikLessonId у урока и всех его шагов
      const updatedLesson = { ...lesson, stepikLessonId: undefined };
      updateLesson(updatedLesson);
      
      // Обновляем шаги этого урока
      const lessonSteps = steps.filter(s => s.lessonId === lessonId);
      lessonSteps.forEach(step => {
        if (step.stepikStepId) {
          const updatedStep = { ...step, stepikStepId: undefined };
          updateStep(updatedStep);
        }
      });
      
      toast.success('Урок удален со Stepik');
      setNeedsRefresh(true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Неизвестная ошибка';
      errors.push(`Урок "${lesson.title}": ${errorMsg}`);
      toast.error('Ошибка при удалении урока со Stepik');
    } finally {
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(lessonId);
        return newSet;
      });
      
      if (errors.length > 0 || success.length > 0) {
        setDeleteResult({ success, errors });
        setIsDeleteResultModalOpen(true);
      }
    }
  };

  const handleDeleteStepFromStepik = async (stepId: number) => {
    const step = steps.find(s => s.id === stepId);
    if (!step || !step.stepikStepId) return;

    if (!confirm(`Удалить шаг со Stepik? Это действие нельзя отменить.`)) return;

    setDeletingItems(prev => new Set(prev).add(stepId));
    const success: string[] = [];
    const errors: string[] = [];

    try {
      await stepikApi.deleteStepFromStepik(stepId);
      success.push(`Шаг успешно удален`);
      
      // Обновляем локальное состояние
      const updatedStep = { ...step, stepikStepId: undefined };
      updateStep(updatedStep);
      setStepsDiffersFromStepik((prev) => {
        const next = new Set(prev);
        next.delete(stepId);
        return next;
      });
      setStepsDiffDetails((prev) => {
        const next = new Map(prev);
        next.delete(stepId);
        return next;
      });
      
      toast.success('Шаг удален со Stepik');
      setNeedsRefresh(true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Неизвестная ошибка';
      errors.push(`Шаг: ${errorMsg}`);
      toast.error('Ошибка при удалении шага со Stepik');
    } finally {
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(stepId);
        return newSet;
      });
      
      if (errors.length > 0 || success.length > 0) {
        setDeleteResult({ success, errors });
        setIsDeleteResultModalOpen(true);
      }
    }
  };

  const handleOpenContentEdit = (step: Step) => {
    setSelectedStep(step);
    setContentEditData({ userInput: '', generatedContent: null });
    setSelectedLlmModel('');
    setIsStepContentEditModalOpen(true);
  };

  const handleGenerateNewContent = async () => {
    if (!selectedStep || !contentEditData.userInput.trim()) {
      toast.error('Введите запрос для изменения контента');
      return;
    }

    setIsGeneratingContent(true);
    try {
      const aiStepType = stepTypeToAIString(selectedStep.type);
      const sessionId = getOrCreateGenerateSession(aiStepType);
      
      let previousStepikBlock: StepikBlockRequest | null = null;
      if (selectedStep.stepikBlockData) {
        try {
          const parsed = typeof selectedStep.stepikBlockData === 'string' 
            ? JSON.parse(selectedStep.stepikBlockData) 
            : selectedStep.stepikBlockData;
          previousStepikBlock = parsed as StepikBlockRequest;
        } catch (error) {
          console.error('Failed to parse stepikBlockData:', error);
        }
      }

      if (!previousStepikBlock) {
        toast.error('Не удалось получить текущий контент шага');
        setIsGeneratingContent(false);
        return;
      }
      
      toast.loading('Генерация нового контента...', { id: 'generate-content' });
      const generatedContent = await agentApi.modifyStepContent(
        sessionId,
        contentEditData.userInput,
        aiStepType,
        previousStepikBlock,
        selectedLlmModel || undefined
      );
      
      setContentEditData(prev => ({ ...prev, generatedContent }));
      toast.success('Контент сгенерирован!', { id: 'generate-content' });
    } catch (error) {
      toast.error('Не удалось сгенерировать контент', { id: 'generate-content' });
      console.error('Failed to generate content:', error);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleSaveContentChanges = async () => {
    if (!selectedStep || !contentEditData.generatedContent) {
      toast.error('Сначала сгенерируйте новый контент');
      return;
    }

    setIsSaving(true);
    try {
      const updateData: UpdateStepDTO = {
        stepId: selectedStep.id,
        stepikBlock: contentEditData.generatedContent,
      };

      const updatedStep = await stepsApi.updateStep(updateData);
      updateStep(updatedStep);
      
      if (selectedStep.stepikStepId && selectedModel) {
        markStepAsUnsynced(selectedStep.id, selectedStep.lessonId, selectedModel.id);
      }
      
      toast.success('Контент шага обновлен!');
      setIsStepContentEditModalOpen(false);
      setIsStepViewModalOpen(false);
      setSelectedStep(null);
      setContentEditData({ userInput: '', generatedContent: null });
    setSelectedLlmModel('');
    } catch (error) {
      toast.error('Не удалось обновить контент');
      console.error('Failed to update step content:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenCodeStepEdit = (step: Step) => {
    setSelectedStep(step);
    setEditStepData({ title: '', cost: step.cost?.toString() ?? '' });
    const { text, feedback_correct, feedback_wrong } = parseBlock(step);
    let data = {
      text: text || step.content || '',
      templates_data: '::java21',
      code: '',
      test_cases: [['', '']] as [string, string][],
      execution_time_limit: 5,
      execution_memory_limit: 256,
      feedback_correct: feedback_correct || '',
      feedback_wrong: feedback_wrong || '',
    };
    if (step.stepikBlockData) {
      try {
        const parsed = typeof step.stepikBlockData === 'string'
          ? JSON.parse(step.stepikBlockData)
          : step.stepikBlockData;
        const src = (parsed as any)?.source;
        data = {
          text: (parsed as any)?.text ?? step.content ?? '',
          templates_data: src?.templates_data ?? '::java21',
          code: src?.code ?? '',
          test_cases: Array.isArray(src?.test_cases) && src.test_cases.length > 0
            ? src.test_cases.map((p: unknown) => Array.isArray(p) && p.length >= 2 ? [String(p[0]), String(p[1])] as [string, string] : ['', ''])
            : [['', '']],
          execution_time_limit: typeof src?.execution_time_limit === 'number' ? src.execution_time_limit : 5,
          execution_memory_limit: typeof src?.execution_memory_limit === 'number' ? src.execution_memory_limit : 256,
          feedback_correct: feedback_correct || '',
          feedback_wrong: feedback_wrong || '',
        };
      } catch {
        data.text = step.content ?? '';
      }
    } else {
      data.text = step.content ?? '';
    }
    setCodeStepEditData(data);
    setIsCodeStepEditModalOpen(true);
  };

  const handleSaveCodeStepEdit = async () => {
    if (!selectedStep) return;
    setIsSaving(true);
    try {
      const block: StepikBlockRequest = {
        name: 'code',
        text: codeStepEditData.text,
        video: null,
        options: null,
        feedback_correct: codeStepEditData.feedback_correct?.trim() || undefined,
        feedback_wrong: codeStepEditData.feedback_wrong?.trim() || undefined,
        source: {
          code: codeStepEditData.code,
          templates_data: codeStepEditData.templates_data,
          test_cases: codeStepEditData.test_cases,
          execution_time_limit: codeStepEditData.execution_time_limit,
          execution_memory_limit: codeStepEditData.execution_memory_limit,
          samples_count: 1,
          are_all_tests_run: true,
          is_run_user_code_allowed: true,
          is_time_limit_scaled: true,
          is_memory_limit_scaled: true,
          manual_time_limits: [],
          manual_memory_limits: [],
          test_archive: [],
        },
      };
      const payload: UpdateStepDTO = {
        stepId: selectedStep.id,
        content: codeStepEditData.text,
        stepikBlock: block,
      };
      if (editStepData.title.trim()) payload.title = editStepData.title.trim();
      if (editStepData.cost.trim()) {
        const n = parseInt(editStepData.cost, 10);
        if (!isNaN(n)) payload.cost = n;
      }
      const updatedStep = await stepsApi.updateStep(payload);
      updateStep(updatedStep);
      if (selectedStep.stepikStepId && selectedModel) {
        markStepAsUnsynced(selectedStep.id, selectedStep.lessonId, selectedModel.id);
      }
      toast.success('Задача по программированию обновлена');
      setIsCodeStepEditModalOpen(false);
      setIsStepViewModalOpen(false);
      setSelectedStep(null);
      setEditStepData({ title: '', cost: '' });
    } catch (error) {
      toast.error('Не удалось сохранить');
      console.error('Failed to save code step:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChoiceEdit = (step: Step) => {
    setSelectedStep(step);
    const { text, feedback_correct, feedback_wrong } = parseBlock(step);
    let options: ChoiceOptionEdit[] = [];
    let sourceRest: Record<string, unknown> = {};
    if (step.stepikBlockData) {
      try {
        const parsed = typeof step.stepikBlockData === 'string' ? JSON.parse(step.stepikBlockData) : step.stepikBlockData;
        const src = parsed?.source ?? {};
        const opts = src?.options;
        if (Array.isArray(opts) && opts.length > 0) {
          options = opts.map((o: unknown) => {
            const x = o as { text?: string; is_correct?: boolean; feedback?: string };
            return {
              text: typeof x?.text === 'string' ? x.text : '',
              is_correct: !!x?.is_correct,
              feedback: typeof x?.feedback === 'string' ? x.feedback : '',
            };
          });
        } else {
          options = [{ text: '', is_correct: false, feedback: '' }];
        }
        const { options: _o, ...rest } = src as Record<string, unknown>;
        sourceRest = rest ?? {};
      } catch {
        options = [{ text: '', is_correct: false, feedback: '' }];
      }
    } else {
      options = [{ text: '', is_correct: false, feedback: '' }];
    }
    setChoiceEditData({ text: text || step.content || '', options, feedback_correct: feedback_correct || '', feedback_wrong: feedback_wrong || '' });
    setChoiceEditSourceRest(sourceRest);
    setIsChoiceEditModalOpen(true);
  };

  const handleSaveChoiceEdit = async () => {
    if (!selectedStep) return;
    setIsSaving(true);
    try {
      const opts = choiceEditData.options;
      const sourceRest = { ...choiceEditSourceRest };
      sourceRest.sample_size = opts.length;
      const correctCount = opts.filter((o) => o.is_correct).length;
      sourceRest.is_multiple_choice = correctCount > 1;
      const block: StepikBlockRequest = {
        name: 'choice',
        text: choiceEditData.text,
        video: null,
        options: null,
        feedback_correct: choiceEditData.feedback_correct?.trim() || undefined,
        feedback_wrong: choiceEditData.feedback_wrong?.trim() || undefined,
        source: { ...sourceRest, options: opts },
      };
      const payload: UpdateStepDTO = {
        stepId: selectedStep.id,
        content: choiceEditData.text,
        stepikBlock: block,
      };
      if (editStepData.title.trim()) payload.title = editStepData.title.trim();
      if (editStepData.cost.trim()) {
        const n = parseInt(editStepData.cost, 10);
        if (!isNaN(n)) payload.cost = n;
      }
      const updatedStep = await stepsApi.updateStep(payload);
      updateStep(updatedStep);
      if (selectedStep.stepikStepId && selectedModel) {
        markStepAsUnsynced(selectedStep.id, selectedStep.lessonId, selectedModel.id);
      }
      toast.success('Задание обновлено');
      setIsChoiceEditModalOpen(false);
      setIsStepViewModalOpen(false);
      setSelectedStep(null);
      setEditStepData({ title: '', cost: '' });
    } catch (error) {
      toast.error('Не удалось сохранить');
      console.error('Failed to save choice step:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenMatchingEdit = (step: Step) => {
    setSelectedStep(step);
    setEditStepData({ title: '', cost: step.cost?.toString() ?? '' });
    const { text, feedback_correct, feedback_wrong } = parseBlock(step);
    let pairs: MatchingPairEdit[] = [];
    let sourceRest: Record<string, unknown> = {};
    if (step.stepikBlockData) {
      try {
        const parsed = typeof step.stepikBlockData === 'string' ? JSON.parse(step.stepikBlockData) : step.stepikBlockData;
        const src = parsed?.source ?? {};
        let rawPairs = src?.pairs;
        if (!rawPairs && Array.isArray(src?.options)) {
          rawPairs = (src.options as { text?: string; match?: string }[]).map((o) => ({ first: o.text ?? '', second: o.match ?? '' }));
        }
        if (Array.isArray(rawPairs) && rawPairs.length > 0) {
          pairs = rawPairs.map((p: unknown) => {
            const x = p as { first?: string; second?: string };
            return { first: typeof x?.first === 'string' ? x.first : '', second: typeof x?.second === 'string' ? x.second : '' };
          });
        } else {
          pairs = [{ first: '', second: '' }];
        }
        const { pairs: _p, options: _o, ...rest } = src as Record<string, unknown>;
        sourceRest = rest ?? {};
      } catch {
        pairs = [{ first: '', second: '' }];
      }
    } else {
      pairs = [{ first: '', second: '' }];
    }
    setMatchingEditData({ text: text || step.content || '', pairs, feedback_correct: feedback_correct || '', feedback_wrong: feedback_wrong || '' });
    setMatchingEditSourceRest(sourceRest);
    setIsMatchingEditModalOpen(true);
  };

  const makeMatchingPairsUnique = (pairs: MatchingPairEdit[]): MatchingPairEdit[] => {
    const usedFirst = new Set<string>();
    const usedSecond = new Set<string>();
    return pairs.map((p) => {
      const firstBase = (p.first ?? '').trim();
      const secondBase = (p.second ?? '').trim();
      let first = firstBase;
      let key = first.toLowerCase();
      let n = 2;
      while (usedFirst.has(key)) {
        first = firstBase + ` (${n})`;
        key = first.toLowerCase();
        n++;
      }
      usedFirst.add(key);
      let second = secondBase;
      key = second.toLowerCase();
      n = 2;
      while (usedSecond.has(key)) {
        second = secondBase + ` (${n})`;
        key = second.toLowerCase();
        n++;
      }
      usedSecond.add(key);
      return { first, second };
    });
  };

  const handleSaveMatchingEdit = async () => {
    if (!selectedStep) return;
    setIsSaving(true);
    try {
      const pairs = makeMatchingPairsUnique(matchingEditData.pairs);
      const block: StepikBlockRequest = {
        name: 'matching',
        text: matchingEditData.text,
        video: null,
        options: null,
        feedback_correct: matchingEditData.feedback_correct?.trim() || undefined,
        feedback_wrong: matchingEditData.feedback_wrong?.trim() || undefined,
        source: { ...matchingEditSourceRest, pairs },
      };
      const payload: UpdateStepDTO = {
        stepId: selectedStep.id,
        content: matchingEditData.text,
        stepikBlock: block,
      };
      if (editStepData.title.trim()) payload.title = editStepData.title.trim();
      if (editStepData.cost.trim()) {
        const n = parseInt(editStepData.cost, 10);
        if (!isNaN(n)) payload.cost = n;
      }
      const updatedStep = await stepsApi.updateStep(payload);
      updateStep(updatedStep);
      if (selectedStep.stepikStepId && selectedModel) {
        markStepAsUnsynced(selectedStep.id, selectedStep.lessonId, selectedModel.id);
      }
      toast.success('Задание обновлено');
      setIsMatchingEditModalOpen(false);
      setIsStepViewModalOpen(false);
      setSelectedStep(null);
      setEditStepData({ title: '', cost: '' });
    } catch (error) {
      toast.error('Не удалось сохранить');
      console.error('Failed to save matching step:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenTextEdit = (step: Step) => {
    setSelectedStep(step);
    setEditStepData({ title: '', cost: step.cost?.toString() ?? '' });
    let text = step.content ?? '';
    if (step.stepikBlockData) {
      try {
        const parsed = typeof step.stepikBlockData === 'string' ? JSON.parse(step.stepikBlockData) : step.stepikBlockData;
        text = parsed?.text ?? text;
      } catch { /* keep step.content */ }
    }
    setTextEditData({ text });
    setIsTextEditModalOpen(true);
  };

  const handleSaveTextEdit = async () => {
    if (!selectedStep) return;
    setIsSaving(true);
    try {
      const block: StepikBlockRequest = {
        name: 'text',
        text: textEditData.text,
        video: null,
        options: null,
        feedback_correct: textEditData.feedback_correct?.trim() || undefined,
        feedback_wrong: textEditData.feedback_wrong?.trim() || undefined,
      };
      const payload: UpdateStepDTO = {
        stepId: selectedStep.id,
        content: textEditData.text,
        stepikBlock: block,
      };
      if (editStepData.title.trim()) payload.title = editStepData.title.trim();
      if (editStepData.cost.trim()) {
        const n = parseInt(editStepData.cost, 10);
        if (!isNaN(n)) payload.cost = n;
      }
      const updatedStep = await stepsApi.updateStep(payload);
      updateStep(updatedStep);
      if (selectedStep.stepikStepId && selectedModel) {
        markStepAsUnsynced(selectedStep.id, selectedStep.lessonId, selectedModel.id);
      }
      toast.success('Задание обновлено');
      setIsTextEditModalOpen(false);
      setIsStepViewModalOpen(false);
      setSelectedStep(null);
      setEditStepData({ title: '', cost: '' });
    } catch (error) {
      toast.error('Не удалось сохранить');
      console.error('Failed to save text step:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const parseBlock = (step: Step): { text: string; source: Record<string, unknown>; rest: Record<string, unknown>; feedback_correct?: string; feedback_wrong?: string } => {
    let text = step.content ?? '';
    let source: Record<string, unknown> = {};
    let rest: Record<string, unknown> = {};
    let feedback_correct: string | undefined;
    let feedback_wrong: string | undefined;
    if (step.stepikBlockData) {
      try {
        const parsed = typeof step.stepikBlockData === 'string' ? JSON.parse(step.stepikBlockData) : step.stepikBlockData;
        text = (parsed as { text?: string })?.text ?? text;
        source = (parsed as { source?: Record<string, unknown> })?.source as Record<string, unknown> ?? {};
        feedback_correct = typeof (parsed as { feedback_correct?: string })?.feedback_correct === 'string' 
          ? (parsed as { feedback_correct?: string }).feedback_correct 
          : undefined;
        feedback_wrong = typeof (parsed as { feedback_wrong?: string })?.feedback_wrong === 'string' 
          ? (parsed as { feedback_wrong?: string }).feedback_wrong 
          : undefined;
        const { source: _s, feedback_correct: _fc, feedback_wrong: _fw, ...r } = (parsed as Record<string, unknown>) ?? {};
        rest = r ?? {};
      } catch { /* noop */ }
    }
    return { text, source, rest, feedback_correct, feedback_wrong };
  };

  const handleOpenFreeAnswerEdit = (step: Step) => {
    setSelectedStep(step);
    const { text, source, feedback_correct, feedback_wrong } = parseBlock(step);
    setFreeAnswerEditData({
      text,
      is_attachments_enabled: !!source?.is_attachments_enabled,
      is_html_enabled: !!source?.is_html_enabled,
      manual_scoring: !!source?.manual_scoring,
      feedback_correct: feedback_correct || '',
      feedback_wrong: feedback_wrong || '',
    });
    setIsFreeAnswerEditModalOpen(true);
  };

  const handleSaveFreeAnswerEdit = async () => {
    if (!selectedStep) return;
    setIsSaving(true);
    try {
      const block: StepikBlockRequest = {
        name: 'free-answer',
        text: freeAnswerEditData.text,
        video: null,
        options: null,
        feedback_correct: freeAnswerEditData.feedback_correct?.trim() || undefined,
        feedback_wrong: freeAnswerEditData.feedback_wrong?.trim() || undefined,
        source: {
          is_attachments_enabled: freeAnswerEditData.is_attachments_enabled,
          is_html_enabled: freeAnswerEditData.is_html_enabled,
          manual_scoring: freeAnswerEditData.manual_scoring,
        },
      };
      const payload: UpdateStepDTO = {
        stepId: selectedStep.id,
        content: freeAnswerEditData.text,
        stepikBlock: block,
      };
      if (editStepData.title.trim()) payload.title = editStepData.title.trim();
      if (editStepData.cost.trim()) {
        const n = parseInt(editStepData.cost, 10);
        if (!isNaN(n)) payload.cost = n;
      }
      const updatedStep = await stepsApi.updateStep(payload);
      updateStep(updatedStep);
      if (selectedStep.stepikStepId && selectedModel) markStepAsUnsynced(selectedStep.id, selectedStep.lessonId, selectedModel.id);
      toast.success('Задание обновлено');
      setIsFreeAnswerEditModalOpen(false);
      setIsStepViewModalOpen(false);
      setSelectedStep(null);
      setEditStepData({ title: '', cost: '' });
    } catch (error) {
      toast.error('Не удалось сохранить');
      console.error('Failed to save free-answer step:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenMathEdit = (step: Step) => {
    setSelectedStep(step);
    setEditStepData({ title: '', cost: step.cost?.toString() ?? '' });
    const { text, source, feedback_correct, feedback_wrong } = parseBlock(step);
    const nt = (source?.numerical_test as Record<string, unknown>) ?? {};
    setMathEditData({
      text,
      answer: typeof source?.answer === 'string' ? source.answer : '',
      maxError: typeof nt?.max_error === 'string' ? nt.max_error : '1e-06',
      feedback_correct: feedback_correct || '',
      feedback_wrong: feedback_wrong || '',
    });
    setIsMathEditModalOpen(true);
  };

  const handleSaveMathEdit = async () => {
    if (!selectedStep) return;
    setIsSaving(true);
    try {
      // Получаем существующие значения numerical_test из шага, если они есть
      const { source } = parseBlock(selectedStep);
      const existingNt = (source?.numerical_test as Record<string, unknown>) ?? {};
      
      const block: StepikBlockRequest = {
        name: 'math',
        text: mathEditData.text,
        video: null,
        options: null,
        feedback_correct: mathEditData.feedback_correct?.trim() || undefined,
        feedback_wrong: mathEditData.feedback_wrong?.trim() || undefined,
        source: {
          answer: mathEditData.answer,
          numerical_test: {
            z_re_min: typeof existingNt?.z_re_min === 'string' ? existingNt.z_re_min : '-1e308',
            z_re_max: typeof existingNt?.z_re_max === 'string' ? existingNt.z_re_max : '1e308',
            z_im_min: typeof existingNt?.z_im_min === 'string' ? existingNt.z_im_min : '-1e308',
            z_im_max: typeof existingNt?.z_im_max === 'string' ? existingNt.z_im_max : '1e308',
            max_error: mathEditData.maxError,
            integer_only: typeof existingNt?.integer_only === 'boolean' ? existingNt.integer_only : false,
          },
        },
      };
      const updatedStep = await stepsApi.updateStep({
        stepId: selectedStep.id,
        content: mathEditData.text,
        stepikBlock: block,
      });
      updateStep(updatedStep);
      if (selectedStep.stepikStepId && selectedModel) markStepAsUnsynced(selectedStep.id, selectedStep.lessonId, selectedModel.id);
      toast.success('Задание обновлено');
      setIsMathEditModalOpen(false);
      setIsStepViewModalOpen(false);
      setSelectedStep(null);
    } catch (error) {
      toast.error('Не удалось сохранить');
      console.error('Failed to save math step:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenNumberEdit = (step: Step) => {
    setSelectedStep(step);
    setEditStepData({ title: '', cost: step.cost?.toString() ?? '' });
    const { text, source, feedback_correct, feedback_wrong } = parseBlock(step);
    const opts = source?.options as { answer?: string; max_error?: string }[] | undefined;
    const options: NumberOptionEdit[] = Array.isArray(opts) && opts.length > 0
      ? opts.map((o) => ({ answer: typeof o?.answer === 'string' ? o.answer : '', maxError: typeof (o as { max_error?: string })?.max_error === 'string' ? (o as { max_error: string }).max_error : '' }))
      : [{ answer: '', maxError: '' }];
    const { options: _o, ...rest } = (source as Record<string, unknown>) ?? {};
    setNumberEditData({ text, options, feedback_correct: feedback_correct || '', feedback_wrong: feedback_wrong || '' });
    setNumberEditSourceRest(rest);
    setIsNumberEditModalOpen(true);
  };

  const handleSaveNumberEdit = async () => {
    if (!selectedStep) return;
    setIsSaving(true);
    try {
      const options = numberEditData.options.map((o) => ({ answer: o.answer, max_error: o.maxError || '' }));
      const block: StepikBlockRequest = {
        name: 'number',
        text: numberEditData.text,
        video: null,
        options: null,
        feedback_correct: numberEditData.feedback_correct?.trim() || undefined,
        feedback_wrong: numberEditData.feedback_wrong?.trim() || undefined,
        source: { ...numberEditSourceRest, options },
      };
      const updatedStep = await stepsApi.updateStep({
        stepId: selectedStep.id,
        content: numberEditData.text,
        stepikBlock: block,
      });
      updateStep(updatedStep);
      if (selectedStep.stepikStepId && selectedModel) markStepAsUnsynced(selectedStep.id, selectedStep.lessonId, selectedModel.id);
      toast.success('Задание обновлено');
      setIsNumberEditModalOpen(false);
      setIsStepViewModalOpen(false);
      setSelectedStep(null);
    } catch (error) {
      toast.error('Не удалось сохранить');
      console.error('Failed to save number step:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenSortingEdit = (step: Step) => {
    setSelectedStep(step);
    setEditStepData({ title: '', cost: step.cost?.toString() ?? '' });
    const { text, source, feedback_correct, feedback_wrong } = parseBlock(step);
    const opts = source?.options as { text?: string }[] | undefined;
    const options = Array.isArray(opts) && opts.length > 0
      ? opts.map((o, index) => ({ id: index + 1, text: typeof o?.text === 'string' ? o.text : '' }))
      : [{ id: 1, text: '' }];
    const { options: _o, ...rest } = (source as Record<string, unknown>) ?? {};
    setSortingEditData({ text, options, feedback_correct: feedback_correct || '', feedback_wrong: feedback_wrong || '' });
    setSortingEditSourceRest(rest);
    setIsSortingEditModalOpen(true);
  };

  const handleSaveSortingEdit = async () => {
    if (!selectedStep) return;
    setIsSaving(true);
    try {
      // Убираем id перед сохранением
      const optionsWithoutId = sortingEditData.options.map(({ text }) => ({ text }));
      const block: StepikBlockRequest = {
        name: 'sorting',
        text: sortingEditData.text,
        video: null,
        options: null,
        feedback_correct: sortingEditData.feedback_correct?.trim() || undefined,
        feedback_wrong: sortingEditData.feedback_wrong?.trim() || undefined,
        source: { ...sortingEditSourceRest, options: optionsWithoutId },
      };
      const updatedStep = await stepsApi.updateStep({
        stepId: selectedStep.id,
        content: sortingEditData.text,
        stepikBlock: block,
      });
      updateStep(updatedStep);
      if (selectedStep.stepikStepId && selectedModel) markStepAsUnsynced(selectedStep.id, selectedStep.lessonId, selectedModel.id);
      toast.success('Задание обновлено');
      setIsSortingEditModalOpen(false);
      setIsStepViewModalOpen(false);
      setSelectedStep(null);
    } catch (error) {
      toast.error('Не удалось сохранить');
      console.error('Failed to save sorting step:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenStringEdit = (step: Step) => {
    setSelectedStep(step);
    setEditStepData({ title: '', cost: step.cost?.toString() ?? '' });
    const { text, source, feedback_correct, feedback_wrong } = parseBlock(step);
    const s = source as Record<string, unknown>;
    setStringEditData({
      text,
      pattern: typeof s?.pattern === 'string' ? s.pattern : '',
      use_re: !!s?.use_re,
      match_substring: !!s?.match_substring,
      case_sensitive: !!s?.case_sensitive,
      code: typeof s?.code === 'string' ? s.code : '',
      feedback_correct: feedback_correct || '',
      feedback_wrong: feedback_wrong || '',
    });
    setIsStringEditModalOpen(true);
  };

  const handleSaveStringEdit = async () => {
    if (!selectedStep) return;
    setIsSaving(true);
    try {
      const block: StepikBlockRequest = {
        name: 'string',
        text: stringEditData.text,
        video: null,
        options: null,
        feedback_correct: stringEditData.feedback_correct?.trim() || undefined,
        feedback_wrong: stringEditData.feedback_wrong?.trim() || undefined,
        source: {
          pattern: stringEditData.pattern || undefined,
          use_re: stringEditData.use_re,
          match_substring: stringEditData.match_substring,
          case_sensitive: stringEditData.case_sensitive,
          code: stringEditData.code || undefined,
        },
      };
      const payload: UpdateStepDTO = {
        stepId: selectedStep.id,
        content: stringEditData.text,
        stepikBlock: block,
      };
      if (editStepData.title.trim()) payload.title = editStepData.title.trim();
      if (editStepData.cost.trim()) {
        const n = parseInt(editStepData.cost, 10);
        if (!isNaN(n)) payload.cost = n;
      }
      const updatedStep = await stepsApi.updateStep(payload);
      updateStep(updatedStep);
      if (selectedStep.stepikStepId && selectedModel) markStepAsUnsynced(selectedStep.id, selectedStep.lessonId, selectedModel.id);
      toast.success('Задание обновлено');
      setIsStringEditModalOpen(false);
      setIsStepViewModalOpen(false);
      setSelectedStep(null);
      setEditStepData({ title: '', cost: '' });
    } catch (error) {
      toast.error('Не удалось сохранить');
      console.error('Failed to save string step:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenFillBlanksEdit = (step: Step) => {
    setSelectedStep(step);
    const { text, source, feedback_correct, feedback_wrong } = parseBlock(step);
    const comps = (source?.components as { type?: string; text?: string; options?: { text?: string; is_correct?: boolean }[] }[]) ?? [];
    
    // Преобразуем формат Stepik (text + input/select) в локальный формат (blank)
    const components: FillBlanksComponentEdit[] = [];
    let i = 0;
    while (i < comps.length) {
      const c = comps[i];
      const cType = c.type;
      
      if (cType === 'text') {
        // Проверяем, не следует ли за этим text компонент input/select
        if (i + 1 < comps.length) {
          const next = comps[i + 1];
          if (next.type === 'input' || next.type === 'select') {
            // Объединяем text и input/select в один blank компонент
            const textPart = typeof c.text === 'string' ? c.text : '';
            const options = Array.isArray(next.options)
              ? next.options.map((o) => ({ text: typeof o?.text === 'string' ? o.text : '', is_correct: !!o?.is_correct }))
              : [];
            // Сохраняем тип input/select
            const inputType = next.type === 'select' ? 'select' : 'input';
            components.push({
              type: 'blank',
              text: textPart,
              options,
              inputType,
            });
            i += 2; // Пропускаем оба компонента
            continue;
          }
        }
        // Обычный text компонент без следующего input/select
        components.push({
          type: 'text',
          text: typeof c.text === 'string' ? c.text : '',
          options: [],
        });
        i++;
      } else if (cType === 'input' || cType === 'select' || cType === 'blank') {
        // Компонент input/select без предшествующего text, или старый формат blank
        const options = Array.isArray(c.options)
          ? c.options.map((o) => ({ text: typeof o?.text === 'string' ? o.text : '', is_correct: !!o?.is_correct }))
          : [];
        // Сохраняем тип input/select для компонента blank
        const inputType = (cType === 'input' || cType === 'select') ? cType as 'input' | 'select' : 'input';
        components.push({
          type: 'blank',
          text: typeof c.text === 'string' ? c.text : '',
          options,
          inputType,
        });
        i++;
      } else {
        // Неизвестный тип, пропускаем
        i++;
      }
    }
    
    if (components.length === 0) {
      components.push({ type: 'text', text: '', options: [] });
    }
    
    const s = source as Record<string, unknown>;
    setFillBlanksEditData({
      text,
      components,
      isCaseSensitive: !!s?.is_case_sensitive,
      isDetailedFeedback: !!s?.is_detailed_feedback,
      isPartiallyCorrect: !!s?.is_partially_correct,
      feedback_correct: feedback_correct || '',
      feedback_wrong: feedback_wrong || '',
    });
    setIsFillBlanksEditModalOpen(true);
  };

  const handleSaveFillBlanksEdit = async () => {
    if (!selectedStep) return;
    setIsSaving(true);
    try {
      // Преобразуем компоненты для Stepik: blank -> input/select, разделяем текст и пропуск
      const components: Array<{ type: 'text' | 'input' | 'select'; text: string; options: Array<{ text: string; is_correct: boolean }> }> = [];
      
      for (const c of fillBlanksEditData.components) {
        if (c.type === 'text') {
          // Текстовый компонент остается как есть
          components.push({ type: 'text', text: c.text, options: [] });
        } else {
          // Компонент типа blank нужно разделить на текст и пропуск
          // Если в text есть текст перед пропуском, разделяем его
          const textBeforeBlank = c.text.trim();
          
          if (textBeforeBlank) {
            // Добавляем текстовую часть
            components.push({ type: 'text', text: textBeforeBlank, options: [] });
          }
          
          // Добавляем пропуск (input или select в зависимости от выбранного типа)
          // Используем сохраненный inputType или по умолчанию 'input'
          const blankType = (c.inputType === 'select') ? 'select' : 'input';
          components.push({ 
            type: blankType, 
            text: '', 
            options: c.options 
          });
        }
      }
      
      const block: StepikBlockRequest = {
        name: 'fill-blanks',
        text: fillBlanksEditData.text,
        video: null,
        options: null,
        feedback_correct: fillBlanksEditData.feedback_correct?.trim() || undefined,
        feedback_wrong: fillBlanksEditData.feedback_wrong?.trim() || undefined,
        source: {
          components,
          is_case_sensitive: fillBlanksEditData.isCaseSensitive,
          is_detailed_feedback: fillBlanksEditData.isDetailedFeedback,
          is_partially_correct: fillBlanksEditData.isPartiallyCorrect,
        },
      };
      const updatedStep = await stepsApi.updateStep({
        stepId: selectedStep.id,
        content: fillBlanksEditData.text,
        stepikBlock: block,
      });
      updateStep(updatedStep);
      if (selectedStep.stepikStepId && selectedModel) markStepAsUnsynced(selectedStep.id, selectedStep.lessonId, selectedModel.id);
      toast.success('Задание обновлено');
      setIsFillBlanksEditModalOpen(false);
      setIsStepViewModalOpen(false);
      setSelectedStep(null);
    } catch (error) {
      toast.error('Не удалось сохранить');
      console.error('Failed to save fill-blanks step:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenTableEdit = (step: Step) => {
    setSelectedStep(step);
    setEditStepData({ title: '', cost: step.cost?.toString() ?? '' });
    const { text, source, feedback_correct, feedback_wrong } = parseBlock(step);
    const rows = (source?.rows as { name?: string; columns?: { choice?: boolean }[]; cells?: { choice?: boolean }[] }[]) ?? [];
    const columns = (source?.columns as { name?: string }[]) ?? [];
    const columnNames = columns.length > 0 ? columns.map((c) => (typeof c?.name === 'string' ? c.name : '')) : [''];

    let tableRows: TableRowEdit[];
    if (rows.length > 0) {
      tableRows = rows.map((r) => {
        const cols = r.columns ?? r.cells ?? [];
        const choiceBools = cols.map((c) => !!c?.choice);
        const padded = [...choiceBools];
        while (padded.length < columnNames.length) padded.push(false);
        return { name: typeof r.name === 'string' ? r.name : '', columns: padded.slice(0, columnNames.length) };
      });
    } else {
      tableRows = columnNames.length > 0 ? [{ name: '', columns: columnNames.map(() => false) }] : [];
    }
    if (tableRows.length === 0 && columnNames.length > 0) {
      tableRows = [{ name: '', columns: columnNames.map(() => false) }];
    }
    const opts = (source?.options as Record<string, unknown>) ?? {};
    setTableEditData({ text, columnNames, rows: tableRows, feedback_correct: feedback_correct || '', feedback_wrong: feedback_wrong || '' });
    setTableEditOptions(opts);
    setIsTableEditModalOpen(true);
  };

  const handleSaveTableEdit = async () => {
    if (!selectedStep) return;
    setIsSaving(true);
    try {
      const columns = tableEditData.columnNames.map((name) => ({ name: typeof name === 'string' ? name : '' }));
      const rows = tableEditData.rows.map((r) => ({
        name: typeof r.name === 'string' ? r.name : '',
        columns: r.columns.map((choice) => ({ choice: !!choice })),
      }));
      const hasMultipleCorrectInAnyRow = tableEditData.rows.some((r) => r.columns.filter(Boolean).length > 1);
      const options: Record<string, unknown> = { ...tableEditOptions, sample_size: tableEditData.rows.length };
      if (hasMultipleCorrectInAnyRow) options.is_checkbox = true;
      const text = typeof tableEditData.text === 'string' ? tableEditData.text : '';
      const block: StepikBlockRequest = {
        name: 'table',
        text,
        video: null,
        options: null,
        feedback_correct: tableEditData.feedback_correct?.trim() || undefined,
        feedback_wrong: tableEditData.feedback_wrong?.trim() || undefined,
        source: { rows, columns, options, description: '' },
      };
      const payload: UpdateStepDTO = {
        stepId: selectedStep.id,
        content: text,
        stepikBlock: block,
      };
      if (editStepData.title.trim()) payload.title = editStepData.title.trim();
      if (editStepData.cost.trim()) {
        const n = parseInt(editStepData.cost, 10);
        if (!isNaN(n)) payload.cost = n;
      }
      const updatedStep = await stepsApi.updateStep(payload);
      updateStep(updatedStep);
      if (selectedStep.stepikStepId && selectedModel) markStepAsUnsynced(selectedStep.id, selectedStep.lessonId, selectedModel.id);
      toast.success('Задание обновлено');
      setIsTableEditModalOpen(false);
      setIsStepViewModalOpen(false);
      setSelectedStep(null);
      setEditStepData({ title: '', cost: '' });
    } catch (error) {
      toast.error('Не удалось сохранить');
      console.error('Failed to save table step:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenRandomTasksEdit = (step: Step) => {
    setSelectedStep(step);
    setEditStepData({ title: '', cost: step.cost?.toString() ?? '' });
    const { text, source, feedback_correct, feedback_wrong } = parseBlock(step);
    const s = source as Record<string, unknown>;
    setRandomTasksEditData({
      text,
      task: typeof s?.task === 'string' ? s.task : '',
      solve: typeof s?.solve === 'string' ? s.solve : '',
      maxError: typeof s?.max_error === 'string' ? s.max_error : '',
      feedback_correct: feedback_correct || '',
      feedback_wrong: feedback_wrong || '',
    });
    setIsRandomTasksEditModalOpen(true);
  };

  const handleSaveRandomTasksEdit = async () => {
    if (!selectedStep) return;
    setIsSaving(true);
    try {
      const block: StepikBlockRequest = {
        name: 'random-tasks',
        text: randomTasksEditData.text,
        video: null,
        options: null,
        feedback_correct: randomTasksEditData.feedback_correct?.trim() || undefined,
        feedback_wrong: randomTasksEditData.feedback_wrong?.trim() || undefined,
        source: {
          task: randomTasksEditData.task,
          solve: randomTasksEditData.solve,
          max_error: randomTasksEditData.maxError || '',
        },
      };
      const updatedStep = await stepsApi.updateStep({
        stepId: selectedStep.id,
        content: randomTasksEditData.text,
        stepikBlock: block,
      });
      updateStep(updatedStep);
      if (selectedStep.stepikStepId && selectedModel) markStepAsUnsynced(selectedStep.id, selectedStep.lessonId, selectedModel.id);
      toast.success('Задание обновлено');
      setIsRandomTasksEditModalOpen(false);
      setIsStepViewModalOpen(false);
      setSelectedStep(null);
    } catch (error) {
      toast.error('Не удалось сохранить');
      console.error('Failed to save random-tasks step:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncModel = async (modelId: number) => {
    try {
      toast.loading('Синхронизация модуля...', { id: 'sync' });
      await sectionsApi.syncSection(modelId);
      
      // Перезагружаем курс и модули из БД для получения актуальных stepikId
      const course = await coursesApi.getCourse(parseInt(courseId!));
      setSelectedCourse(course);
      const courseSections = await sectionsApi.getCourseSections(parseInt(courseId!));
      setModels(courseSections);
      
      // Загружаем уроки модуля для обновления данных и очистки флагов
      const modelLessons = await lessonsApi.getSectionLessons(modelId);
      
      // Если есть выбранный модуль и это синхронизированный модуль, обновляем уроки в UI
      if (selectedModel && selectedModel.id === modelId) {
        setLessons(modelLessons);
        
        // Если есть выбранный урок, перезагружаем его шаги
        if (selectedLesson) {
          const lessonSteps = await stepsApi.getLessonSteps(selectedLesson.id);
          setSteps(lessonSteps);
        }
      }
      
      // Очищаем флаги несинхронизированности для синхронизированного модуля и его детей
      markModelAsSynced(modelId);
      
      // Очищаем флаги для всех уроков модуля
      modelLessons.forEach(lesson => {
        markLessonAsSynced(lesson.id);
      });
      
      // Загружаем и очищаем флаги для всех шагов всех уроков модуля
      const stepPromises = modelLessons.map(lesson => 
        stepsApi.getLessonSteps(lesson.id).then(lessonSteps => {
          lessonSteps.forEach(step => {
            markStepAsSynced(step.id);
          });
          return lessonSteps;
        })
      );
      const allStepsArrays = await Promise.all(stepPromises);
      const allSteps = allStepsArrays.flat();
      
      // Обновляем сохраненные позиции после синхронизации
      saveSyncedModelPositions(courseSections);
      saveSyncedLessonPositions(modelLessons);
      saveSyncedStepPositions(allSteps);
      
      // Проверяем позиции после синхронизации, чтобы убрать пометки если позиции вернулись к исходным
      setTimeout(() => checkAndMarkPositionChanges(), 0);
      
      toast.success('Модуль синхронизирован!', { id: 'sync' });
    } catch (error) {
      toast.error('Ошибка синхронизации', { id: 'sync' });
      console.error('Failed to sync section:', error);
    }
  };

  const handleSyncLesson = async (lessonId: number) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    setSyncingItems(prev => new Set(prev).add(lessonId));
    try {
      toast.loading('Синхронизация урока...', { id: 'sync-lesson' });
      
      await lessonsApi.syncLesson(lessonId);
      
      // Перезагружаем уроки для получения актуальных stepikLessonId
      if (selectedModel) {
        const modelLessons = await lessonsApi.getSectionLessons(selectedModel.id);
        setLessons(modelLessons);
        
        // Если есть выбранный урок, перезагружаем его шаги
        if (selectedLesson && selectedLesson.id === lessonId) {
          const lessonSteps = await stepsApi.getLessonSteps(lessonId);
          setSteps(lessonSteps);
        }
      }
      
      // Очищаем флаги несинхронизированности для синхронизированного урока
      markLessonAsSynced(lessonId);
      
      // Загружаем и очищаем флаги для всех шагов урока
      const lessonSteps = await stepsApi.getLessonSteps(lessonId);
      lessonSteps.forEach(step => {
        markStepAsSynced(step.id);
      });
      
      // Обновляем сохраненные позиции после синхронизации
      if (selectedModel) {
        const modelLessons = await lessonsApi.getSectionLessons(selectedModel.id);
        saveSyncedLessonPositions(modelLessons);
        saveSyncedStepPositions(lessonSteps);
      }
      
      // Проверяем позиции после синхронизации
      setTimeout(() => checkAndMarkPositionChanges(), 0);
      
      toast.success('Урок синхронизирован!', { id: 'sync-lesson' });
    } catch (error) {
      toast.error('Ошибка синхронизации урока', { id: 'sync-lesson' });
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
    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    setSyncingItems(prev => new Set(prev).add(stepId));
    try {
      toast.loading('Синхронизация шага...', { id: 'sync-step' });
      
      if (!step.stepikStepId) {
        await stepsApi.syncStep(stepId);
      } else {
        await stepsApi.updateStepInStepik(stepId);
      }
      
      // Перезагружаем шаги для получения актуальных stepikStepId
      if (selectedLesson) {
        const lessonSteps = await stepsApi.getLessonSteps(selectedLesson.id);
        setSteps(lessonSteps);
      }
      
      // Очищаем флаги несинхронизированности для синхронизированного шага
      markStepAsSynced(stepId);
      
      // Обновляем сохраненные позиции после синхронизации
      if (selectedLesson) {
        const lessonSteps = await stepsApi.getLessonSteps(selectedLesson.id);
        saveSyncedStepPositions(lessonSteps);
      }
      
      // Проверяем позиции после синхронизации
      setTimeout(() => checkAndMarkPositionChanges(), 0);
      
      toast.success('Шаг синхронизирован!', { id: 'sync-step' });
      if (step.stepikStepId) {
        setStepsDiffersFromStepik((prev) => {
          const next = new Set(prev);
          next.delete(stepId);
          return next;
        });
      }
    } catch (error) {
      toast.error('Ошибка синхронизации шага', { id: 'sync-step' });
      console.error('Failed to sync step:', error);
    } finally {
      setSyncingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(stepId);
        return newSet;
      });
    }
  };

  const handleCheckStepWithStepik = async (step: Step) => {
    if (!step.stepikStepId) return;
    setStepsChecking((prev) => new Set(prev).add(step.id));
    try {
      const stepikData = await stepsApi.getStepFromStepik(step.id);
      const matches = stepMatchesStepik(step, stepikData);
      const newDiffers = new Set(stepsDiffersFromStepik);
      const newDetails = new Map(stepsDiffDetails);
      
      if (matches) {
        newDiffers.delete(step.id);
        newDetails.delete(step.id);
      } else {
        newDiffers.add(step.id);
        newDetails.set(step.id, getStepDiff(step, stepikData));
      }
      
      setStepsDiffersFromStepik(newDiffers);
      setStepsDiffDetails(newDetails);
      
      if (matches) {
        toast.success('Локальный шаг совпадает со Stepik');
      }
    } catch (error) {
      toast.error('Не удалось проверить шаг');
      console.error('Failed to check step vs Stepik:', error);
    } finally {
      setStepsChecking((prev) => {
        const next = new Set(prev);
        next.delete(step.id);
        return next;
      });
    }
  };

  const handleReorderModels = async (reorderedModels: Model[]) => {
    reorderModels(reorderedModels);
    try {
      await Promise.all(
        reorderedModels.map((section, index) =>
          sectionsApi.updateSection({ sectionId: section.id, position: index + 1 })
        )
      );
      // Проверяем изменения позиций и помечаем как несинхронизированные
      checkAndMarkPositionChanges();
      toast.success('Порядок модулей сохранён');
    } catch (error) {
      toast.error('Ошибка сохранения порядка');
    }
  };

  const handleReorderLessons = async (reorderedLessons: Lesson[]) => {
    reorderLessons(reorderedLessons);
    try {
      await Promise.all(
        reorderedLessons.map((lesson, index) =>
          lessonsApi.updateLesson({ lessonId: lesson.id, position: index + 1 })
        )
      );
      // Проверяем изменения позиций и помечаем как несинхронизированные
      checkAndMarkPositionChanges();
      toast.success('Порядок уроков сохранён');
    } catch (error) {
      toast.error('Ошибка сохранения порядка');
    }
  };

  const handleReorderSteps = async (reorderedSteps: Step[]) => {
    reorderSteps(reorderedSteps);
    try {
      await Promise.all(
        reorderedSteps.map((step, index) =>
          stepsApi.updateStep({ stepId: step.id, position: index + 1 })
        )
      );
      // Проверяем изменения позиций и помечаем как несинхронизированные
      checkAndMarkPositionChanges();
      toast.success('Порядок шагов сохранён');
    } catch (error) {
      toast.error('Ошибка сохранения порядка');
    }
  };

  const handleOpenStepTypeChange = (step: Step) => {
    setSelectedStep(step);
    setStepTypeChangeData({ newType: step.type });
    setIsStepTypeChangeModalOpen(true);
  };

  const handleChangeStepType = async () => {
    if (!selectedStep) return;
    
    setIsSaving(true);
    try {
      // Извлекаем текст из content или stepikBlockData
      let textContent = selectedStep.content?.trim();
      
      if (!textContent) {
        // Пытаемся извлечь текст из stepikBlockData
        if (selectedStep.stepikBlockData) {
          try {
            const parsed = typeof selectedStep.stepikBlockData === 'string' 
              ? JSON.parse(selectedStep.stepikBlockData) 
              : selectedStep.stepikBlockData;
            
            textContent = parsed?.text?.trim() || null;
          } catch (error) {
            console.error('Failed to parse stepikBlockData:', error);
          }
        }
      }
      
      // Проверяем, что у шага есть текст для генерации
      if (!textContent || textContent.length === 0) {
        toast.error('У шага нет текста. Добавьте текст перед изменением типа.');
        return;
      }

      // Получаем строку типа для AI (MATCHING -> "matching")
      const aiStepType = stepTypeToAIString(stepTypeChangeData.newType);
      
      // Создаем или получаем sessionId для генерации
      const sessionId = getOrCreateGenerateSession(aiStepType);

      toast.loading('Генерация нового шага через AI...', { id: 'change-step-type' });
      
      // Вызываем бэкенд - он сам вызовет AI для генерации нового шага
      const updatedStep = await stepsApi.changeStepType(
        selectedStep.id,
        stepTypeChangeData.newType,
        sessionId
      );
      
      updateStep(updatedStep);
      toast.success('Тип шага изменен! AI создал новую структуру шага.', { id: 'change-step-type' });
      setIsStepTypeChangeModalOpen(false);
      setIsStepViewModalOpen(false);
      setSelectedStep(null);
    } catch (error) {
      toast.error('Не удалось изменить тип шага', { id: 'change-step-type' });
      console.error('Failed to change step type:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const isStepUnsynced = (step: Step): boolean => {
    return step.stepikStepId !== undefined && step.stepikStepId !== null && unsyncedSteps.has(step.id);
  };

  const isLessonUnsynced = (lesson: Lesson): boolean => {
    return lesson.stepikLessonId !== undefined && lesson.stepikLessonId !== null && unsyncedLessons.has(lesson.id);
  };

  const isModelUnsynced = (section: Model): boolean => {
    return section.stepikSectionId !== undefined && section.stepikSectionId !== null && unsyncedSections.has(section.id);
  };

  const handleUpdateModelTitle = async (id: number, title: string) => {
    const section = sections.find((s) => s.id === id);
    if (!section) return;
    try {
      await sectionsApi.updateSection({ sectionId: id, title });
      updateModel({ ...section, title, needsSync: true });
      // Помечаем модуль как требующий синхронизации, если он синхронизирован со Stepik
      if (section.stepikSectionId) {
        markModelAsUnsynced(id);
      }
      toast.success('Название модуля обновлено');
    } catch (error) {
      console.error('Failed to update section title:', error);
      toast.error('Не удалось обновить название модуля');
    }
  };

  const handleUpdateLessonTitle = async (id: number, title: string) => {
    const lesson = lessons.find((l) => l.id === id);
    if (!lesson) return;
    try {
      await lessonsApi.updateLesson({ lessonId: id, title });
      updateLesson({ ...lesson, title, needsSync: true });
      // Помечаем урок и его модуль как требующие синхронизации, если урок синхронизирован со Stepik
      if (lesson.stepikLessonId) {
        markLessonAsUnsynced(id, lesson.sectionId);
      }
      toast.success('Название урока обновлено');
    } catch (error) {
      console.error('Failed to update lesson title:', error);
      toast.error('Не удалось обновить название урока');
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <PageLoader />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/courses')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-dark-100">{selectedCourse?.title}</h1>
            {selectedCourse?.stepikCourseId ? (
              <a 
                href={`https://stepik.org/course/${selectedCourse.stepikCourseId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Badge variant="success" className="flex items-center gap-1 cursor-pointer hover:bg-green-500/30">
                  <CheckCircle className="w-3 h-3" />
                  Stepik #{selectedCourse.stepikCourseId}
                  <ExternalLink className="w-3 h-3" />
                </Badge>
              </a>
            ) : (
              <Badge variant="warning" className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                Не синхронизирован
              </Badge>
            )}
          </div>
          <p className="text-dark-400 text-sm">{selectedCourse?.description}</p>
        </div>
        <Button
          variant="secondary"
          icon={<Sparkles className="w-4 h-4" />}
          onClick={() => navigate('/ai-generator')}
        >
          AI Генератор
        </Button>
        {needsRefresh && (
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={async () => {
              if (!courseId) return;
              try {
                const course = await coursesApi.getCourse(parseInt(courseId));
                setSelectedCourse(course);
                const courseSections = await sectionsApi.getCourseSections(parseInt(courseId));
                setModels(courseSections);
                setNeedsRefresh(false);
                toast.success('Данные обновлены');
              } catch (error) {
                toast.error('Ошибка обновления данных');
              }
            }}
            title="Обновить данные"
          >
            Обновить
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-red-400 hover:text-red-300"
          onClick={() => setIsDeleteCourseModalOpen(true)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex gap-6">
        <div className="flex-shrink-0 w-80 min-w-[280px]">
          <ModelsColumn
            sections={sections}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            onAddClick={() => setIsModelModalOpen(true)}
            onReorder={handleReorderModels}
            isUnsynced={isModelUnsynced}
            onSync={handleSyncModel}
            onDeleteLocal={handleDeleteModelLocal}
            onDeleteFromStepik={handleDeleteModelFromStepik}
            deletingItems={deletingItems}
            onUpdateTitle={handleUpdateModelTitle}
          />
        </div>
        <div className="flex-shrink-0 w-80 min-w-[280px]">
          <LessonsColumn
            lessons={lessons}
            selectedLesson={selectedLesson}
            hasSelectedModel={!!selectedModel}
            onSelectLesson={setSelectedLesson}
            onAddClick={() => setIsLessonModalOpen(true)}
            onReorder={handleReorderLessons}
            isUnsynced={isLessonUnsynced}
            onSync={handleSyncLesson}
            onDeleteLocal={handleDeleteLessonLocal}
            onDeleteFromStepik={handleDeleteLessonFromStepik}
            deletingItems={deletingItems}
            syncingItems={syncingItems}
            onUpdateTitle={handleUpdateLessonTitle}
          />
        </div>
        <div className="flex-shrink-0 w-96 min-w-[320px]">
          <StepsColumn
            steps={steps}
            selectedLesson={selectedLesson}
            onStepClick={(step) => { setSelectedStep(step); setIsStepViewModalOpen(true); }}
            onAddClick={() => selectedLesson && (setSelectedLessonId(selectedLesson.id), setMode('generate'), navigate('/ai-generator'))}
            onReorder={handleReorderSteps}
            isUnsynced={isStepUnsynced}
            stepsDiffersFromStepik={stepsDiffersFromStepik}
            stepsDiffDetails={stepsDiffDetails}
            stepsChecking={stepsChecking}
            onShowDiff={(step) => setDiffModalStepId(step.id)}
            onSync={handleSyncStep}
            onCheckStepik={handleCheckStepWithStepik}
            onDeleteLocal={handleDeleteStepLocal}
            onDeleteFromStepik={handleDeleteStepFromStepik}
            deletingItems={deletingItems}
            syncingItems={syncingItems}
          />
        </div>
      </div>

      <CreateModelModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        title={formData.title}
        description={formData.description}
        onTitleChange={(v) => setFormData((f) => ({ ...f, title: v }))}
        onDescriptionChange={(v) => setFormData((f) => ({ ...f, description: v }))}
        onSubmit={handleCreateModel}
        isSaving={isSaving}
      />
      <CreateLessonModal
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        title={formData.title}
        onTitleChange={(v) => setFormData((f) => ({ ...f, title: v }))}
        onSubmit={handleCreateLesson}
        isSaving={isSaving}
      />
      <CreateStepModal
        isOpen={isStepModalOpen}
        onClose={() => setIsStepModalOpen(false)}
        type={formData.type}
        description={formData.description}
        onTypeChange={(v) => setFormData((f) => ({ ...f, type: v }))}
        onDescriptionChange={(v) => setFormData((f) => ({ ...f, description: v }))}
        onSubmit={handleCreateStep}
        isSaving={isSaving}
      />
      <StepViewModal
        isOpen={isStepViewModalOpen}
        onClose={() => { setIsStepViewModalOpen(false); setSelectedStep(null); }}
        selectedStep={selectedStep}
        canChangeType={selectedStep ? getStepDisplayType(selectedStep) !== 'CODE' : false}
        canEditTask={selectedStep ? (EDIT_TASK_BLOCK_NAMES as readonly string[]).includes(getStepBlockName(selectedStep)) : false}
        isCodeBlock={selectedStep ? getStepBlockName(selectedStep) === 'code' : false}
        onOpenStepTypeChange={() => selectedStep && (handleOpenStepTypeChange(selectedStep), setIsStepViewModalOpen(false))}
        onEditTask={() => {
          if (!selectedStep) return;
          const blockName = getStepBlockName(selectedStep);
          if (blockName === 'code') handleOpenCodeStepEdit(selectedStep);
          else if (blockName === 'choice') handleOpenChoiceEdit(selectedStep);
          else if (blockName === 'matching') handleOpenMatchingEdit(selectedStep);
          else if (blockName === 'text') handleOpenTextEdit(selectedStep);
          else if (blockName === 'free-answer') handleOpenFreeAnswerEdit(selectedStep);
          else if (blockName === 'math') handleOpenMathEdit(selectedStep);
          else if (blockName === 'number') handleOpenNumberEdit(selectedStep);
          else if (blockName === 'sorting') handleOpenSortingEdit(selectedStep);
          else if (blockName === 'string') handleOpenStringEdit(selectedStep);
          else if (blockName === 'fill-blanks') handleOpenFillBlanksEdit(selectedStep);
          else if (blockName === 'table') handleOpenTableEdit(selectedStep);
          else if (blockName === 'random-tasks') handleOpenRandomTasksEdit(selectedStep);
          setIsStepViewModalOpen(false);
        }}
        onOpenContentEdit={() => selectedStep && (handleOpenContentEdit(selectedStep), setIsStepViewModalOpen(false))}
      />

      {/* Edit Step Content Modal */}
      <Modal 
        isOpen={isStepContentEditModalOpen} 
        onClose={() => {
          setIsStepContentEditModalOpen(false);
          setContentEditData({ userInput: '', generatedContent: null });
    setSelectedLlmModel('');
        }} 
        title="Изменить контент шага через AI"
        size="lg"
      >
        {selectedStep && (() => {
          let currentStepikBlock: StepikBlockRequest | null = null;
          if (selectedStep.stepikBlockData) {
            try {
              const parsed = typeof selectedStep.stepikBlockData === 'string' 
                ? JSON.parse(selectedStep.stepikBlockData) 
                : selectedStep.stepikBlockData;
              currentStepikBlock = parsed as StepikBlockRequest;
            } catch (error) {
              console.error('Failed to parse stepikBlockData:', error);
            }
          }

          const textContent = (currentStepikBlock as any)?.text || selectedStep.content || '';

          return (
            <div className="space-y-4">
              {/* Текущий контент */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Текущий контент:
                </label>
                <div className="px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-dark-100 min-h-[100px] max-h-[200px] overflow-y-auto prose prose-invert max-w-none">
                  {textContent ? (
                    <div dangerouslySetInnerHTML={{ __html: textContent }} />
                  ) : (
                    <p className="text-dark-500">Нет содержимого</p>
                  )}
                </div>
              </div>

              {/* Текущий stepikBlockRequest */}
              {currentStepikBlock && (
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Текущий StepikBlockRequest:
                  </label>
                  <div className="px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-dark-100 min-h-[100px] max-h-[200px] overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap break-words">
                      {JSON.stringify(currentStepikBlock, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

            {/* Поле для ввода запроса */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Введите запрос для изменения контента:
                </label>
                <Textarea
                  placeholder="Например: 'Сделай вопрос более сложным' или 'Добавь больше вариантов ответа'"
                  value={contentEditData.userInput}
                  onChange={(e) => setContentEditData(prev => ({ ...prev, userInput: e.target.value }))}
                  rows={4}
                  disabled={isGeneratingContent}
                />
              </div>
              <LlmModelSelect
                label="Модель LLM (опционально)"
                value={selectedLlmModel}
                onChange={setSelectedLlmModel}
                menuPlacement="bottom"
              />
            </div>

            {/* Кнопка генерации */}
            {!contentEditData.generatedContent && (
              <div className="flex justify-end gap-3">
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setIsStepContentEditModalOpen(false);
                    setContentEditData({ userInput: '', generatedContent: null });
    setSelectedLlmModel('');
                  }}
                  disabled={isGeneratingContent}
                >
                  Отмена
                </Button>
                <Button 
                  onClick={handleGenerateNewContent} 
                  isLoading={isGeneratingContent}
                  disabled={!contentEditData.userInput.trim()}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Сгенерировать новый контент
                </Button>
              </div>
            )}

            {/* Предпросмотр нового контента */}
            {contentEditData.generatedContent && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Новый контент (предпросмотр):
                  </label>
                  <div className="px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-dark-100 min-h-[100px] max-h-[300px] overflow-y-auto prose prose-invert max-w-none">
                    {contentEditData.generatedContent.text ? (
                      <div dangerouslySetInnerHTML={{ __html: contentEditData.generatedContent.text }} />
                    ) : (
                      <p className="text-dark-500">Контент сгенерирован (не текстовый тип)</p>
                    )}
                  </div>
                </div>

                {/* Новый StepikBlockRequest */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Новый StepikBlockRequest:
                  </label>
                  <div className="px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-dark-100 min-h-[100px] max-h-[200px] overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap break-words">
                      {JSON.stringify(contentEditData.generatedContent, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      setContentEditData(prev => ({ ...prev, generatedContent: null }));
                    }}
                    disabled={isSaving}
                  >
                    Сгенерировать заново
                  </Button>
                  <Button 
                    onClick={handleSaveContentChanges}
                    isLoading={isSaving}
                  >
                    Сохранить изменения
                  </Button>
                </div>
              </div>
            )}
            </div>
          );
        })()}
      </Modal>

      <StepTypeChangeModal
        isOpen={isStepTypeChangeModalOpen}
        onClose={() => { setIsStepTypeChangeModalOpen(false); setStepTypeChangeData({ newType: 'TEXT' }); }}
        selectedStep={selectedStep}
        newType={stepTypeChangeData.newType}
        onNewTypeChange={(v) => setStepTypeChangeData({ newType: v })}
        onChangeType={handleChangeStepType}
        isSaving={isSaving}
      />
      <StepDiffModal
        isOpen={diffModalStepId != null}
        onClose={() => setDiffModalStepId(null)}
        step={steps.find((s) => s.id === diffModalStepId!) ?? null}
        diff={diffModalStepId != null ? stepsDiffDetails.get(diffModalStepId!) : undefined}
      />

      {/* Code Step Edit Modal */}
      <Modal
        isOpen={isCodeStepEditModalOpen}
        onClose={() => {
          setIsCodeStepEditModalOpen(false);
          setSelectedStep(null);
        }}
        title="Редактировать задачу по программированию"
        size="lg"
      >
        <div className="space-y-4">
          <Textarea
            label="Условие задачи"
            value={codeStepEditData.text}
            onChange={(e) => setCodeStepEditData(prev => ({ ...prev, text: e.target.value }))}
            rows={3}
            placeholder="Опишите, что должен сделать студент..."
          />
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Язык программирования</label>
            <select
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-xl text-dark-100"
              value={codeStepEditData.templates_data}
              onChange={(e) => setCodeStepEditData(prev => ({ ...prev, templates_data: e.target.value }))}
            >
              <option value="::python3">Python 3</option>
              <option value="::java21">Java 21</option>
              <option value="::java17">Java 17</option>
              <option value="::java11">Java 11</option>
              <option value="::go">Go</option>
              <option value="::cpp">C++</option>
              <option value="::c">C</option>
              <option value="::csharp">C#</option>
              <option value="::kotlin">Kotlin</option>
              <option value="::rust">Rust</option>
              <option value="::javascript">JavaScript</option>
              <option value="::ruby">Ruby</option>
              <option value="::scala">Scala</option>
              <option value="::haskell">Haskell</option>
              <option value="::pascal">Pascal</option>
              <option value="::r">R</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Код (шаблон или чекер)</label>
            <textarea
              value={codeStepEditData.code}
              onChange={(e) => setCodeStepEditData(prev => ({ ...prev, code: e.target.value }))}
              rows={8}
              placeholder="Вставьте код шаблона или чекера (Python: generate/check)..."
              className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-dark-100 font-mono text-sm placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Тестовые случаи (ввод → ожидаемый вывод)</label>
            <div className="space-y-2">
              {codeStepEditData.test_cases.map((pair, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input
                    type="text"
                    placeholder="Ввод (stdin)"
                    value={pair[0]}
                    onChange={(e) => {
                      const next = [...codeStepEditData.test_cases];
                      next[i] = [e.target.value, next[i][1]];
                      setCodeStepEditData(prev => ({ ...prev, test_cases: next }));
                    }}
                    className="flex-1 px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-dark-100 text-sm font-mono"
                  />
                  <span className="text-dark-500 pt-2">→</span>
                  <input
                    type="text"
                    placeholder="Ожидаемый вывод"
                    value={pair[1]}
                    onChange={(e) => {
                      const next = [...codeStepEditData.test_cases];
                      next[i] = [next[i][0], e.target.value];
                      setCodeStepEditData(prev => ({ ...prev, test_cases: next }));
                    }}
                    className="flex-1 px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-dark-100 text-sm font-mono"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 text-red-400 hover:text-red-300"
                    onClick={() => {
                      const next = codeStepEditData.test_cases.filter((_, j) => j !== i);
                      if (next.length === 0) next.push(['', '']);
                      setCodeStepEditData(prev => ({ ...prev, test_cases: next }));
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => setCodeStepEditData(prev => ({ ...prev, test_cases: [...prev.test_cases, ['', '']] }))}
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить тест
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Лимит времени (сек)"
              type="number"
              value={String(codeStepEditData.execution_time_limit)}
              onChange={(e) => setCodeStepEditData(prev => ({ ...prev, execution_time_limit: Math.max(1, parseInt(e.target.value, 10) || 5) }))}
            />
            <Input
              label="Лимит памяти (МБ)"
              type="number"
              value={String(codeStepEditData.execution_memory_limit)}
              onChange={(e) => setCodeStepEditData(prev => ({ ...prev, execution_memory_limit: Math.max(64, parseInt(e.target.value, 10) || 256) }))}
            />
          </div>
          <Textarea
            label="Сообщение при правильном ответе (feedback_correct)"
            value={codeStepEditData.feedback_correct || ''}
            onChange={(e) => setCodeStepEditData(prev => ({ ...prev, feedback_correct: e.target.value }))}
            rows={2}
            placeholder="Введите сообщение, которое показывается при правильном ответе..."
          />
          <Textarea
            label="Сообщение при неправильном ответе (feedback_wrong)"
            value={codeStepEditData.feedback_wrong || ''}
            onChange={(e) => setCodeStepEditData(prev => ({ ...prev, feedback_wrong: e.target.value }))}
            rows={2}
            placeholder="Введите сообщение, которое показывается при неправильном ответе..."
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => { setIsCodeStepEditModalOpen(false); setSelectedStep(null); setEditStepData({ title: '', cost: '' }); }}>
              Отмена
            </Button>
            <Button onClick={handleSaveCodeStepEdit} isLoading={isSaving}>
              Сохранить
            </Button>
          </div>
        </div>
      </Modal>

      {/* Choice Step Edit Modal */}
      <Modal
        isOpen={isChoiceEditModalOpen}
        onClose={() => {
          setIsChoiceEditModalOpen(false);
          setSelectedStep(null);
          setEditStepData({ title: '', cost: '' });
        }}
        title="Выбор ответа"
        subtitle="Создайте вопрос с вариантами ответов"
        icon={<ListChecks className="w-5 h-5" />}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setIsChoiceEditModalOpen(false); setSelectedStep(null); setEditStepData({ title: '', cost: '' }); }}>
              Отмена
            </Button>
            <Button variant="success" onClick={handleSaveChoiceEdit} isLoading={isSaving}>
              <CheckCircle className="w-4 h-4" />
              Сохранить
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Условие задания */}
          <FormSection title="Условие задания" icon={<FileText className="w-4 h-4" />}>
            <Textarea
              value={choiceEditData.text}
              onChange={(e) => setChoiceEditData((prev) => ({ ...prev, text: e.target.value }))}
              rows={3}
              placeholder="Введите вопрос..."
              hint="Можно использовать HTML для форматирования"
            />
          </FormSection>

          {/* Варианты ответов */}
          <FormSection 
            title="Варианты ответов" 
            icon={<ListChecks className="w-4 h-4" />}
            description="Отметьте правильные варианты галочкой"
            variant="highlight"
          >
            <div className="space-y-3">
              {choiceEditData.options.map((opt, i) => (
                <OptionCard
                  key={i}
                  isCorrect={opt.is_correct}
                  showCorrectIndicator
                  onDelete={() => {
                    const next = choiceEditData.options.filter((_, j) => j !== i);
                    if (next.length === 0) next.push({ text: '', is_correct: false, feedback: '' });
                    setChoiceEditData((prev) => ({ ...prev, options: next }));
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex gap-3 items-start">
                      <Checkbox
                        checked={opt.is_correct}
                        onChange={(v) => {
                          const next = [...choiceEditData.options];
                          next[i] = { ...next[i], is_correct: v };
                          setChoiceEditData((prev) => ({ ...prev, options: next }));
                        }}
                        variant="success"
                      />
                      <div className="flex-1 space-y-2">
                        <textarea
                          value={opt.text}
                          onChange={(e) => {
                            const next = [...choiceEditData.options];
                            next[i] = { ...next[i], text: e.target.value };
                            setChoiceEditData((prev) => ({ ...prev, options: next }));
                          }}
                          rows={2}
                          placeholder="Введите текст варианта ответа..."
                          className={`w-full px-3 py-2 bg-dark-700/50 border rounded-lg text-sm placeholder-dark-500 resize-none focus:ring-2 focus:ring-primary-500/50 ${
                            opt.is_correct 
                              ? 'border-emerald-500/40 text-emerald-100' 
                              : 'border-dark-600 text-dark-100'
                          }`}
                        />
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-3.5 h-3.5 text-dark-500" />
                          <input
                            type="text"
                            value={opt.feedback}
                            onChange={(e) => {
                              const next = [...choiceEditData.options];
                              next[i] = { ...next[i], feedback: e.target.value };
                              setChoiceEditData((prev) => ({ ...prev, options: next }));
                            }}
                            placeholder="Комментарий при выборе этого варианта (опционально)"
                            className="flex-1 px-3 py-1.5 bg-dark-700/30 border border-dark-600/50 rounded-lg text-dark-300 text-xs placeholder-dark-500 focus:ring-2 focus:ring-primary-500/50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </OptionCard>
              ))}
            </div>
            <AddButton
              variant="dashed"
              fullWidth
              className="mt-3"
              onClick={() =>
                setChoiceEditData((prev) => ({
                  ...prev,
                  options: [...prev.options, { text: '', is_correct: false, feedback: '' }],
                }))
              }
            >
              Добавить вариант ответа
            </AddButton>
          </FormSection>

          {/* Обратная связь */}
          <FormSection title="Обратная связь" icon={<MessageCircle className="w-4 h-4" />} variant="success">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea
                label="При правильном ответе"
                value={choiceEditData.feedback_correct || ''}
                onChange={(e) => setChoiceEditData((prev) => ({ ...prev, feedback_correct: e.target.value }))}
                rows={2}
                placeholder="Правильно! Отличная работа..."
              />
              <Textarea
                label="При неправильном ответе"
                value={choiceEditData.feedback_wrong || ''}
                onChange={(e) => setChoiceEditData((prev) => ({ ...prev, feedback_wrong: e.target.value }))}
                rows={2}
                placeholder="К сожалению, это неверно..."
              />
            </div>
          </FormSection>
        </div>
      </Modal>

      {/* Text Step Edit Modal */}
      <Modal
        isOpen={isTextEditModalOpen}
        onClose={() => {
          setIsTextEditModalOpen(false);
          setSelectedStep(null);
          setEditStepData({ title: '', cost: '' });
        }}
        title="Текстовый блок"
        subtitle="Информационный блок с текстом"
        icon={<AlignLeft className="w-5 h-5" />}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setIsTextEditModalOpen(false); setSelectedStep(null); setEditStepData({ title: '', cost: '' }); }}>
              Отмена
            </Button>
            <Button variant="success" onClick={handleSaveTextEdit} isLoading={isSaving}>
              <CheckCircle className="w-4 h-4" />
              Сохранить
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Содержимое */}
          <FormSection title="Содержимое" icon={<FileText className="w-4 h-4" />}>
            <Textarea
              value={textEditData.text}
              onChange={(e) => setTextEditData({ text: e.target.value })}
              rows={8}
              placeholder="Введите текст для отображения студенту..."
              hint="Можно использовать HTML для форматирования"
            />
          </FormSection>

          {/* Обратная связь */}
          <FormSection title="Обратная связь" icon={<MessageCircle className="w-4 h-4" />} variant="success">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea
                label="При правильном ответе"
                value={textEditData.feedback_correct || ''}
                onChange={(e) => setTextEditData((prev) => ({ ...prev, feedback_correct: e.target.value }))}
                rows={2}
                placeholder="Отлично!..."
              />
              <Textarea
                label="При неправильном ответе"
                value={textEditData.feedback_wrong || ''}
                onChange={(e) => setTextEditData((prev) => ({ ...prev, feedback_wrong: e.target.value }))}
                rows={2}
                placeholder="Попробуйте ещё раз..."
              />
            </div>
          </FormSection>
        </div>
      </Modal>

      {/* Matching Step Edit Modal */}
      <Modal
        isOpen={isMatchingEditModalOpen}
        onClose={() => {
          setIsMatchingEditModalOpen(false);
          setSelectedStep(null);
        }}
        title="Сопоставление"
        subtitle="Создайте пары для сопоставления"
        icon={<Link2 className="w-5 h-5" />}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setIsMatchingEditModalOpen(false); setSelectedStep(null); setEditStepData({ title: '', cost: '' }); }}>
              Отмена
            </Button>
            <Button variant="success" onClick={handleSaveMatchingEdit} isLoading={isSaving}>
              <CheckCircle className="w-4 h-4" />
              Сохранить
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Условие задания */}
          <FormSection title="Условие задания" icon={<FileText className="w-4 h-4" />}>
            <Textarea
              value={matchingEditData.text}
              onChange={(e) => setMatchingEditData((prev) => ({ ...prev, text: e.target.value }))}
              rows={3}
              placeholder="Опишите задание для студента..."
              hint="Можно использовать HTML для форматирования"
            />
          </FormSection>

          {/* Пары для сопоставления */}
          <FormSection 
            title="Пары для сопоставления" 
            icon={<ArrowLeftRight className="w-4 h-4" />}
            description="Соедините элементы левого столбца с правым"
            variant="highlight"
          >
            <div className="space-y-3">
              {matchingEditData.pairs.map((pair, i) => (
                <OptionCard
                  key={i}
                  onDelete={() => {
                    const next = matchingEditData.pairs.filter((_, j) => j !== i);
                    if (next.length === 0) next.push({ first: '', second: '' });
                    setMatchingEditData((prev) => ({ ...prev, pairs: next }));
                  }}
                >
                  <div className="flex gap-3 items-center">
                    <div className="flex-1">
                      <div className="text-xs text-dark-500 mb-1">Левая часть</div>
                      <input
                        type="text"
                        value={pair.first}
                        onChange={(e) => {
                          const next = [...matchingEditData.pairs];
                          next[i] = { ...next[i], first: e.target.value };
                          setMatchingEditData((prev) => ({ ...prev, pairs: next }));
                        }}
                        placeholder="Элемент слева..."
                        className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 text-sm focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
                      />
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                      <div className="w-8 h-px bg-gradient-to-r from-primary-500/50 to-emerald-500/50"></div>
                      <ArrowLeftRight className="w-4 h-4 text-primary-400" />
                      <div className="w-8 h-px bg-gradient-to-r from-primary-500/50 to-emerald-500/50"></div>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-dark-500 mb-1">Правая часть</div>
                      <input
                        type="text"
                        value={pair.second}
                        onChange={(e) => {
                          const next = [...matchingEditData.pairs];
                          next[i] = { ...next[i], second: e.target.value };
                          setMatchingEditData((prev) => ({ ...prev, pairs: next }));
                        }}
                        placeholder="Соответствующий элемент..."
                        className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 text-sm focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
                      />
                    </div>
                  </div>
                </OptionCard>
              ))}
            </div>
            <AddButton
              variant="dashed"
              fullWidth
              className="mt-3"
              onClick={() =>
                setMatchingEditData((prev) => ({
                  ...prev,
                  pairs: [...prev.pairs, { first: '', second: '' }],
                }))
              }
              icon={<Link2 className="w-4 h-4" />}
            >
              Добавить пару
            </AddButton>
          </FormSection>

          {/* Обратная связь */}
          <FormSection title="Обратная связь" icon={<MessageCircle className="w-4 h-4" />} variant="success">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea
                label="При правильном ответе"
                value={matchingEditData.feedback_correct || ''}
                onChange={(e) => setMatchingEditData((prev) => ({ ...prev, feedback_correct: e.target.value }))}
                rows={2}
                placeholder="Все пары соединены правильно!..."
              />
              <Textarea
                label="При неправильном ответе"
                value={matchingEditData.feedback_wrong || ''}
                onChange={(e) => setMatchingEditData((prev) => ({ ...prev, feedback_wrong: e.target.value }))}
                rows={2}
                placeholder="Попробуйте ещё раз..."
              />
            </div>
          </FormSection>
        </div>
      </Modal>

      {/* Free-answer Step Edit Modal */}
      <Modal
        isOpen={isFreeAnswerEditModalOpen}
        onClose={() => { setIsFreeAnswerEditModalOpen(false); setSelectedStep(null); }}
        title="Свободный ответ"
        subtitle="Задание с развёрнутым текстовым ответом"
        icon={<MessageSquareText className="w-5 h-5" />}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setIsFreeAnswerEditModalOpen(false); setSelectedStep(null); setEditStepData({ title: '', cost: '' }); }}>
              Отмена
            </Button>
            <Button variant="success" onClick={handleSaveFreeAnswerEdit} isLoading={isSaving}>
              <CheckCircle className="w-4 h-4" />
              Сохранить
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Условие задания */}
          <FormSection title="Условие задания" icon={<FileText className="w-4 h-4" />}>
            <Textarea
              value={freeAnswerEditData.text}
              onChange={(e) => setFreeAnswerEditData((prev) => ({ ...prev, text: e.target.value }))}
              rows={4}
              placeholder="Опишите задание для студента..."
              hint="Можно использовать HTML для форматирования"
            />
          </FormSection>

          {/* Настройки */}
          <FormSection title="Настройки ответа" icon={<Settings2 className="w-4 h-4" />}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-800/50 border border-dark-700/50">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Paperclip className="w-4 h-4" />
                </div>
                <Toggle
                  checked={freeAnswerEditData.is_attachments_enabled}
                  onChange={(v) => setFreeAnswerEditData((prev) => ({ ...prev, is_attachments_enabled: v }))}
                  label="Вложения"
                  description="Разрешить прикреплять файлы"
                  size="sm"
                />
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-800/50 border border-dark-700/50">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <Code className="w-4 h-4" />
                </div>
                <Toggle
                  checked={freeAnswerEditData.is_html_enabled}
                  onChange={(v) => setFreeAnswerEditData((prev) => ({ ...prev, is_html_enabled: v }))}
                  label="HTML"
                  description="Разрешить форматирование"
                  size="sm"
                />
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-800/50 border border-dark-700/50">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <Toggle
                  checked={freeAnswerEditData.manual_scoring}
                  onChange={(v) => setFreeAnswerEditData((prev) => ({ ...prev, manual_scoring: v }))}
                  label="Ручная оценка"
                  description="Преподаватель проверяет"
                  size="sm"
                />
              </div>
            </div>
          </FormSection>

          {/* Обратная связь */}
          <FormSection title="Обратная связь" icon={<MessageCircle className="w-4 h-4" />} variant="success">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea
                label="При правильном ответе"
                value={freeAnswerEditData.feedback_correct || ''}
                onChange={(e) => setFreeAnswerEditData((prev) => ({ ...prev, feedback_correct: e.target.value }))}
                rows={2}
                placeholder="Отличная работа!..."
              />
              <Textarea
                label="При неправильном ответе"
                value={freeAnswerEditData.feedback_wrong || ''}
                onChange={(e) => setFreeAnswerEditData((prev) => ({ ...prev, feedback_wrong: e.target.value }))}
                rows={2}
                placeholder="Попробуйте ещё раз..."
              />
            </div>
          </FormSection>
        </div>
      </Modal>

      {/* Math Step Edit Modal */}
      <Modal
        isOpen={isMathEditModalOpen}
        onClose={() => { setIsMathEditModalOpen(false); setSelectedStep(null); }}
        title="Математическая задача"
        subtitle="Задание с числовым или формульным ответом"
        icon={<Calculator className="w-5 h-5" />}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setIsMathEditModalOpen(false); setSelectedStep(null); setEditStepData({ title: '', cost: '' }); }}>
              Отмена
            </Button>
            <Button variant="success" onClick={handleSaveMathEdit} isLoading={isSaving}>
              <CheckCircle className="w-4 h-4" />
              Сохранить
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Условие */}
          <FormSection title="Условие задания" icon={<FileText className="w-4 h-4" />}>
            <Textarea
              value={mathEditData.text}
              onChange={(e) => setMathEditData((prev) => ({ ...prev, text: e.target.value }))}
              rows={4}
              placeholder="Введите условие математической задачи..."
              hint="Можно использовать LaTeX для формул"
            />
          </FormSection>

          {/* Ответ */}
          <FormSection title="Правильный ответ" icon={<Calculator className="w-4 h-4" />} variant="highlight">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Ответ (число или формула)"
                value={mathEditData.answer}
                onChange={(e) => setMathEditData((prev) => ({ ...prev, answer: e.target.value }))}
                placeholder="например: 42 или 1.5"
                icon={<Hash className="w-4 h-4" />}
              />
              <Input
                label="Допустимая погрешность"
                value={mathEditData.maxError}
                onChange={(e) => setMathEditData((prev) => ({ ...prev, maxError: e.target.value }))}
                placeholder="1e-06"
                hint="Для сравнения с плавающей точкой"
              />
            </div>
          </FormSection>

          {/* Обратная связь */}
          <FormSection title="Обратная связь" icon={<MessageCircle className="w-4 h-4" />} variant="success">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea
                label="При правильном ответе"
                value={mathEditData.feedback_correct || ''}
                onChange={(e) => setMathEditData((prev) => ({ ...prev, feedback_correct: e.target.value }))}
                rows={2}
                placeholder="Верно!..."
              />
              <Textarea
                label="При неправильном ответе"
                value={mathEditData.feedback_wrong || ''}
                onChange={(e) => setMathEditData((prev) => ({ ...prev, feedback_wrong: e.target.value }))}
                rows={2}
                placeholder="Проверьте вычисления..."
              />
            </div>
          </FormSection>
        </div>
      </Modal>

      {/* Number Step Edit Modal */}
      <Modal
        isOpen={isNumberEditModalOpen}
        onClose={() => { setIsNumberEditModalOpen(false); setSelectedStep(null); }}
        title="Числовой ответ"
        subtitle="Задание с вводом числа"
        icon={<Hash className="w-5 h-5" />}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setIsNumberEditModalOpen(false); setSelectedStep(null); setEditStepData({ title: '', cost: '' }); }}>
              Отмена
            </Button>
            <Button variant="success" onClick={handleSaveNumberEdit} isLoading={isSaving}>
              <CheckCircle className="w-4 h-4" />
              Сохранить
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Условие */}
          <FormSection title="Условие задания" icon={<FileText className="w-4 h-4" />}>
            <Textarea
              value={numberEditData.text}
              onChange={(e) => setNumberEditData((prev) => ({ ...prev, text: e.target.value }))}
              rows={3}
              placeholder="Введите условие задачи..."
            />
          </FormSection>

          {/* Правильные ответы */}
          <FormSection 
            title="Правильные ответы" 
            icon={<Hash className="w-4 h-4" />}
            description="Укажите допустимые числовые ответы с погрешностью"
            variant="highlight"
          >
            <div className="space-y-3">
              {numberEditData.options.map((opt, i) => (
                <OptionCard
                  key={i}
                  onDelete={() => {
                    const next = numberEditData.options.filter((_, j) => j !== i);
                    if (next.length === 0) next.push({ answer: '', maxError: '' });
                    setNumberEditData((prev) => ({ ...prev, options: next }));
                  }}
                >
                  <div className="flex gap-3 items-center">
                    <div className="flex-1">
                      <div className="text-xs text-dark-500 mb-1">Правильный ответ</div>
                      <input
                        type="text"
                        value={opt.answer}
                        onChange={(e) => {
                          const next = [...numberEditData.options];
                          next[i] = { ...next[i], answer: e.target.value };
                          setNumberEditData((prev) => ({ ...prev, options: next }));
                        }}
                        placeholder="42"
                        className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 text-sm focus:ring-2 focus:ring-primary-500/50"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-dark-500 mb-1">Погрешность (опционально)</div>
                      <input
                        type="text"
                        value={opt.maxError}
                        onChange={(e) => {
                          const next = [...numberEditData.options];
                          next[i] = { ...next[i], maxError: e.target.value };
                          setNumberEditData((prev) => ({ ...prev, options: next }));
                        }}
                        placeholder="0.01"
                        className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 text-sm focus:ring-2 focus:ring-primary-500/50"
                      />
                    </div>
                  </div>
                </OptionCard>
              ))}
            </div>
            <AddButton
              variant="dashed"
              fullWidth
              className="mt-3"
              onClick={() => setNumberEditData((prev) => ({ ...prev, options: [...prev.options, { answer: '', maxError: '' }] }))}
              icon={<Plus className="w-4 h-4" />}
            >
              Добавить вариант ответа
            </AddButton>
          </FormSection>

          {/* Обратная связь */}
          <FormSection title="Обратная связь" icon={<MessageCircle className="w-4 h-4" />} variant="success">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea
                label="При правильном ответе"
                value={numberEditData.feedback_correct || ''}
                onChange={(e) => setNumberEditData((prev) => ({ ...prev, feedback_correct: e.target.value }))}
                rows={2}
                placeholder="Верно!..."
              />
              <Textarea
                label="При неправильном ответе"
                value={numberEditData.feedback_wrong || ''}
                onChange={(e) => setNumberEditData((prev) => ({ ...prev, feedback_wrong: e.target.value }))}
                rows={2}
                placeholder="Неверно, попробуйте ещё..."
              />
            </div>
          </FormSection>
        </div>
      </Modal>

      {/* Sorting Step Edit Modal */}
      <Modal
        isOpen={isSortingEditModalOpen}
        onClose={() => { setIsSortingEditModalOpen(false); setSelectedStep(null); }}
        title="Сортировка"
        subtitle="Расположите элементы в правильном порядке"
        icon={<ArrowUpDown className="w-5 h-5" />}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setIsSortingEditModalOpen(false); setSelectedStep(null); setEditStepData({ title: '', cost: '' }); }}>
              Отмена
            </Button>
            <Button variant="success" onClick={handleSaveSortingEdit} isLoading={isSaving}>
              <CheckCircle className="w-4 h-4" />
              Сохранить
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Условие */}
          <FormSection title="Условие задания" icon={<FileText className="w-4 h-4" />}>
            <Textarea
              value={sortingEditData.text}
              onChange={(e) => setSortingEditData((prev) => ({ ...prev, text: e.target.value }))}
              rows={3}
              placeholder="Расположите элементы в правильном порядке..."
            />
          </FormSection>

          {/* Элементы для сортировки */}
          <FormSection 
            title="Элементы для сортировки" 
            icon={<ArrowUpDown className="w-4 h-4" />}
            description="Перетаскивайте элементы, чтобы задать правильный порядок"
            variant="highlight"
          >
            <SortableList
              items={sortingEditData.options}
              onReorder={(reordered) => {
                setSortingEditData((prev) => ({ ...prev, options: reordered }));
              }}
              className="pl-0"
              renderItem={(opt, index) => (
                <div className="flex gap-3 items-center p-3 rounded-xl bg-dark-800/50 border border-dark-600 hover:border-primary-500/30 transition-colors group">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-dark-500 cursor-grab active:cursor-grabbing" />
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-500/10 text-primary-400 text-sm font-medium">
                      {index + 1}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => {
                      const next = [...sortingEditData.options];
                      const optIndex = next.findIndex((o) => o.id === opt.id);
                      if (optIndex !== -1) {
                        next[optIndex] = { ...next[optIndex], text: e.target.value };
                        setSortingEditData((prev) => ({ ...prev, options: next }));
                      }
                    }}
                    placeholder="Введите текст элемента..."
                    className="flex-1 px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 text-sm focus:ring-2 focus:ring-primary-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = sortingEditData.options.filter((o) => o.id !== opt.id);
                      if (next.length === 0) next.push({ id: Date.now(), text: '' });
                      setSortingEditData((prev) => ({ ...prev, options: next }));
                    }}
                    className="p-2 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            />
            <AddButton
              variant="dashed"
              fullWidth
              className="mt-3"
              onClick={() => {
                const newId = Math.max(...sortingEditData.options.map(o => o.id), 0) + 1;
                setSortingEditData((prev) => ({ ...prev, options: [...prev.options, { id: newId, text: '' }] }));
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              Добавить элемент
            </AddButton>
          </FormSection>

          {/* Обратная связь */}
          <FormSection title="Обратная связь" icon={<MessageCircle className="w-4 h-4" />} variant="success">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea
                label="При правильном ответе"
                value={sortingEditData.feedback_correct || ''}
                onChange={(e) => setSortingEditData((prev) => ({ ...prev, feedback_correct: e.target.value }))}
                rows={2}
                placeholder="Правильный порядок!..."
              />
              <Textarea
                label="При неправильном ответе"
                value={sortingEditData.feedback_wrong || ''}
                onChange={(e) => setSortingEditData((prev) => ({ ...prev, feedback_wrong: e.target.value }))}
                rows={2}
                placeholder="Порядок неверный..."
              />
            </div>
          </FormSection>
        </div>
      </Modal>

      {/* String Step Edit Modal */}
      <Modal
        isOpen={isStringEditModalOpen}
        onClose={() => { setIsStringEditModalOpen(false); setSelectedStep(null); }}
        title="Строковый ответ"
        subtitle="Задание с вводом текстовой строки"
        icon={<Type className="w-5 h-5" />}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setIsStringEditModalOpen(false); setSelectedStep(null); setEditStepData({ title: '', cost: '' }); }}>
              Отмена
            </Button>
            <Button variant="success" onClick={handleSaveStringEdit} isLoading={isSaving}>
              <CheckCircle className="w-4 h-4" />
              Сохранить
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Условие */}
          <FormSection title="Условие задания" icon={<FileText className="w-4 h-4" />}>
            <Textarea
              value={stringEditData.text}
              onChange={(e) => setStringEditData((prev) => ({ ...prev, text: e.target.value }))}
              rows={3}
              placeholder="Введите условие задания..."
            />
          </FormSection>

          {/* Шаблон ответа */}
          <FormSection 
            title="Шаблон ответа" 
            icon={<Regex className="w-4 h-4" />}
            description="Укажите ожидаемый ответ или регулярное выражение"
            variant="highlight"
          >
            <Input
              value={stringEditData.pattern}
              onChange={(e) => setStringEditData((prev) => ({ ...prev, pattern: e.target.value }))}
              placeholder="Регулярное выражение или точная строка"
              icon={<Regex className="w-4 h-4" />}
            />
          </FormSection>

          {/* Настройки */}
          <FormSection title="Настройки проверки" icon={<Settings2 className="w-4 h-4" />}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-800/50 border border-dark-700/50">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Regex className="w-4 h-4" />
                </div>
                <Toggle
                  checked={stringEditData.use_re}
                  onChange={(v) => setStringEditData((prev) => ({ ...prev, use_re: v }))}
                  label="Регулярные выражения"
                  description="Использовать regex"
                  size="sm"
                />
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-800/50 border border-dark-700/50">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <Type className="w-4 h-4" />
                </div>
                <Toggle
                  checked={stringEditData.match_substring}
                  onChange={(v) => setStringEditData((prev) => ({ ...prev, match_substring: v }))}
                  label="Совпадение подстроки"
                  description="Частичное совпадение"
                  size="sm"
                />
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-800/50 border border-dark-700/50">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <Type className="w-4 h-4" />
                </div>
                <Toggle
                  checked={stringEditData.case_sensitive}
                  onChange={(v) => setStringEditData((prev) => ({ ...prev, case_sensitive: v }))}
                  label="Учитывать регистр"
                  description="Case-sensitive"
                  size="sm"
                />
              </div>
            </div>
          </FormSection>

          {/* Код проверки */}
          <FormSection 
            title="Код проверки" 
            icon={<Code className="w-4 h-4" />}
            description="Python-код для дополнительной валидации (необязательно)"
          >
            <textarea
              value={stringEditData.code}
              onChange={(e) => setStringEditData((prev) => ({ ...prev, code: e.target.value }))}
              rows={4}
              placeholder="# Python-код проверки..."
              className="w-full px-4 py-3 bg-dark-900/50 border border-dark-600 rounded-xl text-dark-100 font-mono text-sm focus:ring-2 focus:ring-primary-500/50"
            />
          </FormSection>

          {/* Обратная связь */}
          <FormSection title="Обратная связь" icon={<MessageCircle className="w-4 h-4" />} variant="success">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea
                label="При правильном ответе"
                value={stringEditData.feedback_correct || ''}
                onChange={(e) => setStringEditData((prev) => ({ ...prev, feedback_correct: e.target.value }))}
                rows={2}
                placeholder="Верно!..."
              />
              <Textarea
                label="При неправильном ответе"
                value={stringEditData.feedback_wrong || ''}
                onChange={(e) => setStringEditData((prev) => ({ ...prev, feedback_wrong: e.target.value }))}
                rows={2}
                placeholder="Попробуйте ещё..."
              />
            </div>
          </FormSection>
        </div>
      </Modal>

      {/* Fill-blanks Step Edit Modal */}
      <Modal
        isOpen={isFillBlanksEditModalOpen}
        onClose={() => { setIsFillBlanksEditModalOpen(false); setSelectedStep(null); }}
        title="Заполнить пропуски"
        subtitle="Создайте текст с пропусками для заполнения"
        icon={<TextCursorInput className="w-5 h-5" />}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setIsFillBlanksEditModalOpen(false); setSelectedStep(null); setEditStepData({ title: '', cost: '' }); }}>
              Отмена
            </Button>
            <Button variant="success" onClick={handleSaveFillBlanksEdit} isLoading={isSaving}>
              <CheckCircle className="w-4 h-4" />
              Сохранить
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Текст задания */}
          <FormSection title="Условие задания" icon={<FileText className="w-4 h-4" />}>
            <Textarea
              value={fillBlanksEditData.text}
              onChange={(e) => setFillBlanksEditData((prev) => ({ ...prev, text: e.target.value }))}
              rows={3}
              placeholder="Введите описание задания..."
              hint="Можно использовать HTML для форматирования"
            />
          </FormSection>

          {/* Настройки */}
          <FormSection title="Настройки" icon={<Settings2 className="w-4 h-4" />}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Toggle
                checked={fillBlanksEditData.isCaseSensitive}
                onChange={(v) => setFillBlanksEditData((prev) => ({ ...prev, isCaseSensitive: v }))}
                label="Учитывать регистр"
                description="Ответ должен точно совпадать по регистру"
                size="sm"
              />
              <Toggle
                checked={fillBlanksEditData.isDetailedFeedback}
                onChange={(v) => setFillBlanksEditData((prev) => ({ ...prev, isDetailedFeedback: v }))}
                label="Детальный фидбэк"
                description="Показывать подробную информацию"
                size="sm"
              />
              <Toggle
                checked={fillBlanksEditData.isPartiallyCorrect}
                onChange={(v) => setFillBlanksEditData((prev) => ({ ...prev, isPartiallyCorrect: v }))}
                label="Частичные баллы"
                description="Начислять баллы за часть ответов"
                size="sm"
              />
            </div>
          </FormSection>

          {/* Компоненты */}
          <FormSection 
            title="Компоненты" 
            icon={<ListChecks className="w-4 h-4" />}
            description="Текстовые фрагменты и пропуски для заполнения"
            variant="highlight"
          >
            <div className="space-y-3">
              {fillBlanksEditData.components.map((c, i) => (
                <OptionCard
                  key={i}
                  onDelete={() => {
                    const next = fillBlanksEditData.components.filter((_, j) => j !== i);
                    if (next.length === 0) next.push({ type: 'text' as const, text: '', options: [] });
                    setFillBlanksEditData((prev) => ({ ...prev, components: next }));
                  }}
                  className={c.type === 'blank' ? 'border-primary-500/30 bg-primary-500/5' : ''}
                >
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <div className="flex-shrink-0">
                        <select
                          value={c.type}
                          onChange={(e) => {
                            const next = [...fillBlanksEditData.components];
                            const newType = e.target.value as 'text' | 'blank';
                            next[i] = { 
                              ...next[i], 
                              type: newType,
                              inputType: newType === 'blank' && !next[i].inputType ? 'input' : next[i].inputType
                            };
                            setFillBlanksEditData((prev) => ({ ...prev, components: next }));
                          }}
                          className="px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 text-sm focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 cursor-pointer"
                        >
                          <option value="text">📝 Текст</option>
                          <option value="blank">✏️ Пропуск</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={c.text}
                          onChange={(e) => {
                            const next = [...fillBlanksEditData.components];
                            next[i] = { ...next[i], text: e.target.value };
                            setFillBlanksEditData((prev) => ({ ...prev, components: next }));
                          }}
                          placeholder={c.type === 'text' ? 'Введите текст...' : 'Текст перед пропуском (опционально)'}
                          className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 text-sm placeholder-dark-500 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
                        />
                      </div>
                    </div>
                    
                    {c.type === 'blank' && (
                      <div className="ml-0 pl-4 border-l-2 border-primary-500/30 space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-dark-400">Тип ввода:</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...fillBlanksEditData.components];
                                next[i] = { ...next[i], inputType: 'input' };
                                setFillBlanksEditData((prev) => ({ ...prev, components: next }));
                              }}
                              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                                (c.inputType || 'input') === 'input'
                                  ? 'bg-primary-500/20 border-primary-500/50 text-primary-300'
                                  : 'bg-dark-700/50 border-dark-600 text-dark-400 hover:border-dark-500'
                              }`}
                            >
                              Текстовое поле
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...fillBlanksEditData.components];
                                next[i] = { ...next[i], inputType: 'select' };
                                setFillBlanksEditData((prev) => ({ ...prev, components: next }));
                              }}
                              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                                c.inputType === 'select'
                                  ? 'bg-primary-500/20 border-primary-500/50 text-primary-300'
                                  : 'bg-dark-700/50 border-dark-600 text-dark-400 hover:border-dark-500'
                              }`}
                            >
                              Выпадающий список
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <span className="text-xs text-dark-400">Варианты ответов:</span>
                          {c.options.map((o, j) => (
                            <div key={j} className="flex gap-2 items-center group">
                              <Checkbox
                                checked={o.is_correct}
                                onChange={(v) => {
                                  const next = [...fillBlanksEditData.components];
                                  const opts = [...(next[i].options || [])];
                                  opts[j] = { ...opts[j], is_correct: v };
                                  next[i] = { ...next[i], options: opts };
                                  setFillBlanksEditData((prev) => ({ ...prev, components: next }));
                                }}
                                variant="success"
                              />
                              <input
                                type="text"
                                value={o.text}
                                onChange={(e) => {
                                  const next = [...fillBlanksEditData.components];
                                  const opts = [...(next[i].options || [])];
                                  opts[j] = { ...opts[j], text: e.target.value };
                                  next[i] = { ...next[i], options: opts };
                                  setFillBlanksEditData((prev) => ({ ...prev, components: next }));
                                }}
                                placeholder="Введите вариант ответа..."
                                className={`flex-1 px-3 py-1.5 bg-dark-700/50 border rounded-lg text-sm placeholder-dark-500 focus:ring-2 focus:ring-primary-500/50 ${
                                  o.is_correct 
                                    ? 'border-emerald-500/40 text-emerald-200' 
                                    : 'border-dark-600 text-dark-100'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const next = [...fillBlanksEditData.components];
                                  const opts = (next[i].options || []).filter((_, k) => k !== j);
                                  next[i] = { ...next[i], options: opts };
                                  setFillBlanksEditData((prev) => ({ ...prev, components: next }));
                                }}
                                className="p-1.5 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <AddButton
                            variant="dashed"
                            onClick={() => {
                              const next = [...fillBlanksEditData.components];
                              const opts = [...(next[i].options || []), { text: '', is_correct: false }];
                              next[i] = { ...next[i], options: opts };
                              setFillBlanksEditData((prev) => ({ ...prev, components: next }));
                            }}
                          >
                            Добавить вариант
                          </AddButton>
                        </div>
                      </div>
                    )}
                  </div>
                </OptionCard>
              ))}
            </div>
            
            <div className="flex gap-2 mt-4">
              <AddButton
                variant="default"
                onClick={() => setFillBlanksEditData((prev) => ({ ...prev, components: [...prev.components, { type: 'text', text: '', options: [] }] }))}
                icon={<FileText className="w-4 h-4" />}
              >
                Добавить текст
              </AddButton>
              <AddButton
                variant="default"
                onClick={() => setFillBlanksEditData((prev) => ({ ...prev, components: [...prev.components, { type: 'blank', text: '', options: [], inputType: 'input' }] }))}
                icon={<TextCursorInput className="w-4 h-4" />}
              >
                Добавить пропуск
              </AddButton>
            </div>
          </FormSection>

          {/* Обратная связь */}
          <FormSection title="Обратная связь" icon={<MessageCircle className="w-4 h-4" />} variant="success">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea
                label="При правильном ответе"
                value={fillBlanksEditData.feedback_correct || ''}
                onChange={(e) => setFillBlanksEditData((prev) => ({ ...prev, feedback_correct: e.target.value }))}
                rows={2}
                placeholder="Отлично! Вы справились..."
              />
              <Textarea
                label="При неправильном ответе"
                value={fillBlanksEditData.feedback_wrong || ''}
                onChange={(e) => setFillBlanksEditData((prev) => ({ ...prev, feedback_wrong: e.target.value }))}
                rows={2}
                placeholder="Попробуйте ещё раз..."
              />
            </div>
          </FormSection>
        </div>
      </Modal>

      {/* Table Step Edit Modal */}
      <Modal
        isOpen={isTableEditModalOpen}
        onClose={() => { setIsTableEditModalOpen(false); setSelectedStep(null); }}
        title="Таблица выбора"
        subtitle="Создайте таблицу с правильными ответами"
        icon={<Table2 className="w-5 h-5" />}
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setIsTableEditModalOpen(false); setSelectedStep(null); setEditStepData({ title: '', cost: '' }); }}>
              Отмена
            </Button>
            <Button variant="success" onClick={handleSaveTableEdit} isLoading={isSaving}>
              <CheckCircle className="w-4 h-4" />
              Сохранить
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Условие задания */}
          <FormSection title="Условие задания" icon={<FileText className="w-4 h-4" />}>
            <Textarea
              value={tableEditData.text}
              onChange={(e) => setTableEditData((prev) => ({ ...prev, text: e.target.value }))}
              rows={3}
              placeholder="Опишите задание для студента..."
              hint="Можно использовать HTML для форматирования"
            />
          </FormSection>

          {/* Колонки */}
          <FormSection 
            title="Колонки таблицы" 
            icon={<Columns className="w-4 h-4" />}
            description="Заголовки колонок для выбора"
          >
            <div className="flex flex-wrap gap-2">
              {tableEditData.columnNames.map((col, i) => (
                <div key={i} className="group flex items-center gap-1 p-1 pr-2 rounded-lg bg-dark-800/50 border border-dark-600 hover:border-primary-500/30 transition-colors">
                  <div className="flex items-center justify-center w-6 h-6 rounded bg-primary-500/10 text-primary-400 text-xs font-medium">
                    {i + 1}
                  </div>
                  <input
                    type="text"
                    value={col}
                    onChange={(e) => {
                      const next = [...tableEditData.columnNames];
                      next[i] = e.target.value;
                      setTableEditData((prev) => ({ ...prev, columnNames: next }));
                    }}
                    placeholder={`Колонка ${i + 1}`}
                    className="w-28 px-2 py-1 bg-transparent border-none text-dark-100 text-sm focus:outline-none focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = tableEditData.columnNames.filter((_, j) => j !== i);
                      if (next.length === 0) next.push('');
                      const rows = tableEditData.rows.map((r) => ({ ...r, columns: r.columns.filter((_, j) => j !== i) }));
                      setTableEditData((prev) => ({ ...prev, columnNames: next, rows }));
                    }}
                    className="p-1 rounded text-dark-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <AddButton
              variant="dashed"
              className="mt-3"
              onClick={() => {
                setTableEditData((prev) => ({
                  ...prev,
                  columnNames: [...prev.columnNames, ''],
                  rows: prev.rows.map((r) => ({ ...r, columns: [...r.columns, false] })),
                }));
              }}
              icon={<Columns className="w-4 h-4" />}
            >
              Добавить колонку
            </AddButton>
          </FormSection>

          {/* Строки и ячейки */}
          <FormSection 
            title="Строки и правильные ответы" 
            icon={<Rows className="w-4 h-4" />}
            description="Отметьте правильные ячейки для каждой строки"
            variant="highlight"
          >
            {/* Заголовок таблицы */}
            {tableEditData.columnNames.length > 0 && (
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-dark-700/50">
                <div className="w-40 text-xs font-medium text-dark-400 uppercase tracking-wider">Строка</div>
                <div className="flex-1 flex gap-2">
                  {tableEditData.columnNames.map((col, ci) => (
                    <div 
                      key={ci} 
                      className="flex-1 min-w-[80px] text-center text-xs font-medium text-primary-400 truncate"
                      title={col || `Колонка ${ci + 1}`}
                    >
                      {col || `Кол. ${ci + 1}`}
                    </div>
                  ))}
                </div>
                <div className="w-8"></div>
              </div>
            )}
            
            {/* Строки */}
            <div className="space-y-2">
              {tableEditData.rows.map((row, ri) => (
                <div key={ri} className="group flex items-center gap-2 p-2 rounded-xl bg-dark-800/30 border border-dark-700/30 hover:border-dark-600 transition-colors">
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => {
                      const next = [...tableEditData.rows];
                      next[ri] = { ...next[ri], name: e.target.value };
                      setTableEditData((prev) => ({ ...prev, rows: next }));
                    }}
                    placeholder={`Строка ${ri + 1}`}
                    className="w-40 px-3 py-1.5 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 text-sm focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
                  />
                  <div className="flex-1 flex gap-2">
                    {row.columns.map((ch, ci) => (
                      <div key={ci} className="flex-1 min-w-[80px] flex justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...tableEditData.rows];
                            const cols = [...next[ri].columns];
                            cols[ci] = !cols[ci];
                            next[ri] = { ...next[ri], columns: cols };
                            setTableEditData((prev) => ({ ...prev, rows: next }));
                          }}
                          className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                            ch 
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/20' 
                              : 'bg-dark-700/50 border-dark-600 text-dark-500 hover:border-dark-500 hover:text-dark-400'
                          }`}
                          title={`${tableEditData.columnNames[ci] || `Колонка ${ci + 1}`}: ${ch ? 'Правильно' : 'Неправильно'}`}
                        >
                          {ch ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <span className="text-lg opacity-30">○</span>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = tableEditData.rows.filter((_, j) => j !== ri);
                      if (next.length === 0) next.push({ name: '', columns: tableEditData.columnNames.map(() => false) });
                      setTableEditData((prev) => ({ ...prev, rows: next }));
                    }}
                    className="w-8 p-1.5 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <AddButton
              variant="dashed"
              fullWidth
              className="mt-3"
              onClick={() =>
                setTableEditData((prev) => ({ ...prev, rows: [...prev.rows, { name: '', columns: prev.columnNames.map(() => false) }] }))
              }
              icon={<Rows className="w-4 h-4" />}
            >
              Добавить строку
            </AddButton>
          </FormSection>

          {/* Обратная связь */}
          <FormSection title="Обратная связь" icon={<MessageCircle className="w-4 h-4" />} variant="success">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea
                label="При правильном ответе"
                value={tableEditData.feedback_correct || ''}
                onChange={(e) => setTableEditData((prev) => ({ ...prev, feedback_correct: e.target.value }))}
                rows={2}
                placeholder="Отлично! Все ответы верны..."
              />
              <Textarea
                label="При неправильном ответе"
                value={tableEditData.feedback_wrong || ''}
                onChange={(e) => setTableEditData((prev) => ({ ...prev, feedback_wrong: e.target.value }))}
                rows={2}
                placeholder="Попробуйте ещё раз..."
              />
            </div>
          </FormSection>
        </div>
      </Modal>

      {/* Random-tasks Step Edit Modal */}
      <Modal
        isOpen={isRandomTasksEditModalOpen}
        onClose={() => { setIsRandomTasksEditModalOpen(false); setSelectedStep(null); }}
        title="Случайные задачи"
        subtitle="Генерация задач с динамическими параметрами"
        icon={<Shuffle className="w-5 h-5" />}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setIsRandomTasksEditModalOpen(false); setSelectedStep(null); setEditStepData({ title: '', cost: '' }); }}>
              Отмена
            </Button>
            <Button variant="success" onClick={handleSaveRandomTasksEdit} isLoading={isSaving}>
              <CheckCircle className="w-4 h-4" />
              Сохранить
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Условие */}
          <FormSection title="Условие задания" icon={<FileText className="w-4 h-4" />}>
            <Textarea
              value={randomTasksEditData.text}
              onChange={(e) => setRandomTasksEditData((prev) => ({ ...prev, text: e.target.value }))}
              rows={3}
              placeholder="Общее описание задачи..."
            />
          </FormSection>

          {/* Шаблон задачи */}
          <FormSection 
            title="Шаблон задачи (task)" 
            icon={<Code className="w-4 h-4" />}
            description="Python-код для генерации текста и параметров задачи"
            variant="highlight"
          >
            <textarea
              value={randomTasksEditData.task}
              onChange={(e) => setRandomTasksEditData((prev) => ({ ...prev, task: e.target.value }))}
              rows={5}
              placeholder="# Код генерации задачи..."
              className="w-full px-4 py-3 bg-dark-900/50 border border-dark-600 rounded-xl text-dark-100 font-mono text-sm focus:ring-2 focus:ring-primary-500/50"
            />
          </FormSection>

          {/* Шаблон решения */}
          <FormSection 
            title="Шаблон решения (solve)" 
            icon={<Code className="w-4 h-4" />}
            description="Python-код для вычисления правильного ответа"
          >
            <textarea
              value={randomTasksEditData.solve}
              onChange={(e) => setRandomTasksEditData((prev) => ({ ...prev, solve: e.target.value }))}
              rows={5}
              placeholder="# Код решения..."
              className="w-full px-4 py-3 bg-dark-900/50 border border-dark-600 rounded-xl text-dark-100 font-mono text-sm focus:ring-2 focus:ring-primary-500/50"
            />
          </FormSection>

          {/* Погрешность */}
          <FormSection title="Настройки проверки" icon={<Settings2 className="w-4 h-4" />}>
            <Input
              label="Допустимая погрешность (max_error)"
              value={randomTasksEditData.maxError}
              onChange={(e) => setRandomTasksEditData((prev) => ({ ...prev, maxError: e.target.value }))}
              placeholder="0.01"
              hint="Для числовых ответов"
              icon={<Hash className="w-4 h-4" />}
            />
          </FormSection>

          {/* Обратная связь */}
          <FormSection title="Обратная связь" icon={<MessageCircle className="w-4 h-4" />} variant="success">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea
                label="При правильном ответе"
                value={randomTasksEditData.feedback_correct || ''}
                onChange={(e) => setRandomTasksEditData((prev) => ({ ...prev, feedback_correct: e.target.value }))}
                rows={2}
                placeholder="Верно!..."
              />
              <Textarea
                label="При неправильном ответе"
                value={randomTasksEditData.feedback_wrong || ''}
                onChange={(e) => setRandomTasksEditData((prev) => ({ ...prev, feedback_wrong: e.target.value }))}
                rows={2}
                placeholder="Неверно..."
              />
            </div>
          </FormSection>
        </div>
      </Modal>

      {/* Delete Course Modal */}
      <Modal
        isOpen={isDeleteCourseModalOpen}
        onClose={() => setIsDeleteCourseModalOpen(false)}
        title="Удаление курса"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-dark-200">
            Выберите тип удаления для курса <strong>"{selectedCourse?.title}"</strong>:
          </p>
          
          {selectedCourse?.stepikCourseId && (
            <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <p className="text-sm text-orange-400 mb-2">
              ⚠️ Внимание! Каскадное удаление со Stepik удалит:
              </p>
              <ul className="text-sm text-dark-300 list-disc list-inside space-y-1">
                <li>Курс и все его модули</li>
                <li>Все уроки в модулях</li>
                <li>Все шаги в уроках</li>
              </ul>
                <p className="text-xs text-dark-400 mt-2">
                  Рекомендуется удалять сущности в порядке их позиций (1→2→3) для избежания проблем с позициями на Stepik.
                </p>
            </div>
          )}

          <div className="space-y-2">
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={async () => {
                if (!selectedCourse) return;
                if (!confirm(`Удалить курс "${selectedCourse.title}" локально?`)) return;
                
                try {
                  await coursesApi.deleteCourse(selectedCourse.id);
                  toast.success('Курс удален локально');
                  navigate('/courses');
                } catch (error) {
                  toast.error('Ошибка удаления курса');
                } finally {
                  setIsDeleteCourseModalOpen(false);
                }
              }}
              disabled={!!selectedCourse?.stepikCourseId}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить локально
              {selectedCourse?.stepikCourseId && (
                <span className="ml-auto text-xs text-dark-500">(Сначала удалите со Stepik)</span>
              )}
            </Button>

            {selectedCourse?.stepikCourseId && (
              <>
                <Button
                  variant="secondary"
                  className="w-full justify-start text-orange-400 hover:text-orange-300"
                  onClick={async () => {
                    if (!selectedCourse) return;
                    const warningText = `Внимание! Будет удалено каскадно со Stepik: курс "${selectedCourse.title}", все модули, уроки и шаги.\n\nРекомендуется удалять сущности в порядке их позиций (1→2→3) для избежания проблем с позициями на Stepik.\n\nПродолжить?`;
                    if (!confirm(warningText)) return;
                    
                    setDeletingItems(prev => new Set(prev).add(selectedCourse.id));
                    const success: string[] = [];
                    const errors: string[] = [];
                    
                    try {
                      await stepikApi.deleteCourseFromStepik(selectedCourse.id);
                      success.push(`Курс "${selectedCourse.title}" успешно удален со Stepik`);
                      toast.success('Курс удален со Stepik');
                      setNeedsRefresh(true);
                    } catch (error) {
                      const errorMsg = error instanceof Error ? error.message : 'Неизвестная ошибка';
                      errors.push(`Курс "${selectedCourse.title}": ${errorMsg}`);
                      toast.error('Ошибка при удалении курса со Stepik');
                    } finally {
                      setDeletingItems(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(selectedCourse.id);
                        return newSet;
                      });
                      setIsDeleteCourseModalOpen(false);
                      
                      if (errors.length > 0 || success.length > 0) {
                        setDeleteResult({ success, errors });
                        setIsDeleteResultModalOpen(true);
                      }
                    }
                  }}
                  disabled={deletingItems.has(selectedCourse?.id || 0)}
                >
                  <StepikIcon className="w-4 h-4 mr-2" size={16} />
                  Удалить со Stepik
                  {deletingItems.has(selectedCourse?.id || 0) && (
                    <Loader2 className="w-4 h-4 ml-auto animate-spin" />
                  )}
                </Button>

                <Button
                  variant="secondary"
                  className="w-full justify-start text-red-400 hover:text-red-300"
                  onClick={async () => {
                    if (!selectedCourse) return;
                    const warningText = `ВНИМАНИЕ! Будет удалено ВЕЗДЕ (локально И со Stepik): курс "${selectedCourse.title}", все модули, уроки и шаги.\n\nЭто действие нельзя отменить!\n\nПродолжить?`;
                    if (!confirm(warningText)) return;
                    
                    setDeletingItems(prev => new Set(prev).add(selectedCourse.id));
                    const success: string[] = [];
                    const errors: string[] = [];
                    
                    try {
                      // Сначала удаляем со Stepik
                      if (selectedCourse.stepikCourseId) {
                        try {
                          await stepikApi.deleteCourseFromStepik(selectedCourse.id);
                          success.push(`Курс "${selectedCourse.title}" удален со Stepik`);
                        } catch (error) {
                          const errorMsg = error instanceof Error ? error.message : 'Неизвестная ошибка';
                          errors.push(`Ошибка удаления со Stepik: ${errorMsg}`);
                        }
                      }
                      
                      // Затем удаляем локально
                      try {
                        await coursesApi.deleteCourse(selectedCourse.id);
                        success.push(`Курс "${selectedCourse.title}" удален локально`);
                        toast.success('Курс удален везде');
                        navigate('/courses');
                      } catch (error) {
                        const errorMsg = error instanceof Error ? error.message : 'Неизвестная ошибка';
                        errors.push(`Ошибка локального удаления: ${errorMsg}`);
                        toast.error('Ошибка при локальном удалении');
                      }
                    } finally {
                      setDeletingItems(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(selectedCourse.id);
                        return newSet;
                      });
                      setIsDeleteCourseModalOpen(false);
                      
                      if (errors.length > 0 || success.length > 0) {
                        setDeleteResult({ success, errors });
                        setIsDeleteResultModalOpen(true);
                      }
                    }
                  }}
                  disabled={deletingItems.has(selectedCourse?.id || 0)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Удалить везде
                  {deletingItems.has(selectedCourse?.id || 0) && (
                    <Loader2 className="w-4 h-4 ml-auto animate-spin" />
                  )}
                </Button>
              </>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-dark-700">
            <Button variant="ghost" onClick={() => setIsDeleteCourseModalOpen(false)}>
              Отмена
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Result Modal */}
      <Modal
        isOpen={isDeleteResultModalOpen}
        onClose={() => {
          setIsDeleteResultModalOpen(false);
          setDeleteResult(null);
        }}
        title="Результаты удаления"
        size="md"
      >
        {deleteResult && (
          <div className="space-y-4">
            {deleteResult.success.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-green-400 mb-2">Успешно удалено:</h3>
                <ul className="text-sm text-dark-300 space-y-1">
                  {deleteResult.success.map((msg, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{msg}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {deleteResult.errors.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-400 mb-2">Ошибки:</h3>
                <ul className="text-sm text-dark-300 space-y-1">
                  {deleteResult.errors.map((msg, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>{msg}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-dark-700">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsDeleteResultModalOpen(false);
                  setDeleteResult(null);
                }}
              >
                Закрыть
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}

