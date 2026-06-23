import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { coursesApi, sectionsApi, lessonsApi, stepsApi, agentApi, stepikApi } from '../../../api';
import { useCourseStore, useAuthStore, useAIGeneratorStore } from '../../../store';
import { useSubscription } from '../../../hooks/useSubscription';
import { STEP_TYPE_CHANGE_PRO_MESSAGE } from '../../../constants/subscription';
import { AI_PROMPT_LIMITS, getPromptLimitMessage } from '../../../constants/aiPromptLimits';
import { extractApiErrorMessage } from '../../../utils/apiError';
import { validateTitle } from '../../../utils/validation';
import type { Model, Lesson, Step, StepType, UpdateStepDTO, StepikBlockRequest } from '../../../types';
import { stepMatchesStepik, getStepDiff } from '../../../utils/stepikCompare';
import { hasPendingStepikUploads, stepNeedsUpload } from '../../../utils/stepikSyncStatus';
import { stepTypeToAIString } from '../types';
import { useStepDiffStorage } from './useStepDiffStorage';
import { useStepBlockEdit } from './useStepBlockEdit';

export function useCourseEditorPage() {
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
    updateCourse,
    lessonsWithNewSteps,
    sectionsWithNewSteps,
    markModelAsSynced,
    markLessonAsSynced,
    markStepAsSynced,
    saveSyncedModelPositions,
    saveSyncedLessonPositions,
    saveSyncedStepPositions,
    checkAndMarkPositionChanges,
  } = useCourseStore();
  const { setSelectedLessonId, setMode, getOrCreateGenerateSession } = useAIGeneratorStore();
  const { canChangeStepType, canSelectModel, refresh: refreshSubscription } = useSubscription();

  const [isLoading, setIsLoading] = useState(true);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [isStepViewModalOpen, setIsStepViewModalOpen] = useState(false);
  const [isStepContentEditModalOpen, setIsStepContentEditModalOpen] = useState(false);
  const [isStepTypeChangeModalOpen, setIsStepTypeChangeModalOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', type: 'TEXT' as StepType });
  const [contentEditData, setContentEditData] = useState({ userInput: '', generatedContent: null as StepikBlockRequest | null });
  const [stepTypeChangeData, setStepTypeChangeData] = useState({ newType: 'TEXT' as StepType });
  const [selectedLlmModel, setSelectedLlmModel] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!canSelectModel && selectedLlmModel) {
      setSelectedLlmModel('');
    }
  }, [canSelectModel, selectedLlmModel]);

  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isDeleteCourseModalOpen, setIsDeleteCourseModalOpen] = useState(false);
  const [isDeleteResultModalOpen, setIsDeleteResultModalOpen] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{ success: string[]; errors: string[] } | null>(null);
  const [deletingItems, setDeletingItems] = useState<Set<number>>(new Set());
  const [syncingItems, setSyncingItems] = useState<Set<number>>(new Set());
  const [needsRefresh, setNeedsRefresh] = useState(false);

  const {
    stepsDiffersFromStepik,
    setStepsDiffersFromStepik,
    stepsDiffDetails,
    setStepsDiffDetails,
    stepsChecking,
    setStepsChecking,
    diffModalStepId,
    setDiffModalStepId,
    loadStepsDiffersFromStorage,
    loadStepsDiffDetailsFromStorage,
  } = useStepDiffStorage(courseId);

  const applyStepUpdate = (updatedStep: Step) => {
    updateStep(updatedStep);
    if (updatedStep.stepikStepId) {
      setStepsDiffersFromStepik((prev) => {
        const next = new Set(prev);
        if (updatedStep.needsStepikSync) {
          next.add(updatedStep.id);
        } else {
          next.delete(updatedStep.id);
        }
        return next;
      });
    }
    if (selectedCourse && updatedStep.needsStepikSync) {
      const patched = { ...selectedCourse, fullySynced: false };
      setSelectedCourse(patched);
      updateCourse(patched);
    }
  };

  const closeStepViewOnBlockSave = () => {
    setIsStepViewModalOpen(false);
    setSelectedStep(null);
  };

  const {
    isBlockEditOpen,
    editingBlock,
    openStepBlockEdit,
    closeBlockEdit,
    handleSaveBlockEdit,
  } = useStepBlockEdit({ applyStepUpdate, onSaved: closeStepViewOnBlockSave });

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
    if (!courseId) return;

    const titleError = validateTitle(formData.title, 'Название модуля');
    if (titleError) {
      toast.error(titleError);
      return;
    }

    setIsSaving(true);
    try {
      const newModel = await sectionsApi.createSection({
        courseId: parseInt(courseId),
        title: formData.title.trim(),
        description: formData.description,
      });
      addModel(newModel);
      toast.success('Модуль создан!');
      setIsModelModalOpen(false);
      setFormData({ title: '', description: '', type: 'TEXT' });
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Не удалось создать модуль'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateLesson = async () => {
    if (!selectedModel) return;

    const titleError = validateTitle(formData.title, 'Название урока');
    if (titleError) {
      toast.error(titleError);
      return;
    }

    setIsSaving(true);
    try {
      const newLesson = await lessonsApi.createLesson({
        sectionId: selectedModel.id,
        title: formData.title.trim(),
      });
      addLesson(newLesson);
      toast.success('Урок создан!');
      setIsLessonModalOpen(false);
      setFormData({ title: '', description: '', type: 'TEXT' });
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Не удалось создать урок'));
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
            applyStepUpdate(updatedStep);
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
          applyStepUpdate(updatedStep);
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
      applyStepUpdate(updatedStep);
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
    if (contentEditData.userInput.length > AI_PROMPT_LIMITS.generate) {
      toast.error(getPromptLimitMessage(contentEditData.userInput.length, AI_PROMPT_LIMITS.generate, 'генерации шага'));
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
      void refreshSubscription();
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Не удалось сгенерировать контент'), { id: 'generate-content' });
      console.error('Failed to generate content:', error);
      void refreshSubscription();
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
      applyStepUpdate(updatedStep);
      
      if (selectedStep.stepikStepId && selectedModel) {
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
    if (!canChangeStepType) {
      toast.error(STEP_TYPE_CHANGE_PRO_MESSAGE);
      return;
    }
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
      
      applyStepUpdate(updatedStep);
      toast.success('Тип шага изменен! AI создал новую структуру шага.', { id: 'change-step-type' });
      setIsStepTypeChangeModalOpen(false);
      setIsStepViewModalOpen(false);
      setSelectedStep(null);
      void refreshSubscription();
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Не удалось изменить тип шага'), { id: 'change-step-type' });
      console.error('Failed to change step type:', error);
      void refreshSubscription();
    } finally {
      setIsSaving(false);
    }
  };

  const isStepUnsynced = (step: Step): boolean => stepNeedsUpload(step) && Boolean(step.stepikStepId);

  const isLessonUnsynced = (lesson: Lesson): boolean =>
    Boolean(lesson.stepikLessonId) &&
    (lessonsWithNewSteps.has(lesson.id) || Boolean(lesson.needsStepikSync));

  const isModelUnsynced = (section: Model): boolean =>
    Boolean(section.stepikSectionId) &&
    (sectionsWithNewSteps.has(section.id) || Boolean(section.needsStepikSync));

  const hasUnsyncedContent = hasPendingStepikUploads({
    course: selectedCourse ?? undefined,
    sections,
    lessons,
    steps,
  });

  const handleUpdateModelTitle = async (id: number, title: string) => {
    const section = sections.find((s) => s.id === id);
    if (!section) return;
    try {
      const updated = await sectionsApi.updateSection({ sectionId: id, title });
      updateModel(updated);
      toast.success('Название модуля обновлено');
    } catch (error) {
      console.error('Failed to update section title:', error);
      throw error;
    }
  };

  const handleUpdateLessonTitle = async (id: number, title: string) => {
    const lesson = lessons.find((l) => l.id === id);
    if (!lesson) return;
    try {
      const updated = await lessonsApi.updateLesson({ lessonId: id, title });
      updateLesson(updated);
      toast.success('Название урока обновлено');
    } catch (error) {
      console.error('Failed to update lesson title:', error);
      throw error;
    }
  };

  return {
    courseId,
    navigate,
    isLoading,
    selectedCourse,
    setSelectedCourse,
    sections,
    setModels,
    selectedModel,
    setSelectedModel,
    lessons,
    selectedLesson,
    setSelectedLesson,
    steps,
    isModelModalOpen,
    setIsModelModalOpen,
    isLessonModalOpen,
    setIsLessonModalOpen,
    isStepModalOpen,
    setIsStepModalOpen,
    isStepViewModalOpen,
    setIsStepViewModalOpen,
    isStepContentEditModalOpen,
    setIsStepContentEditModalOpen,
    isStepTypeChangeModalOpen,
    setIsStepTypeChangeModalOpen,
    selectedStep,
    setSelectedStep,
    formData,
    setFormData,
    contentEditData,
    setContentEditData,
    stepTypeChangeData,
    setStepTypeChangeData,
    selectedLlmModel,
    setSelectedLlmModel,
    isSaving,
    isGeneratingContent,
    isDeleteCourseModalOpen,
    setIsDeleteCourseModalOpen,
    isDeleteResultModalOpen,
    setIsDeleteResultModalOpen,
    deleteResult,
    setDeleteResult,
    deletingItems,
    setDeletingItems,
    syncingItems,
    needsRefresh,
    setNeedsRefresh,
    stepsDiffersFromStepik,
    stepsDiffDetails,
    stepsChecking,
    diffModalStepId,
    setDiffModalStepId,
    canChangeStepType,
    canSelectModel,
    setSelectedLessonId,
    setMode,
    isBlockEditOpen,
    editingBlock,
    openStepBlockEdit,
    closeBlockEdit,
    handleSaveBlockEdit,
    handleCreateModel,
    handleCreateLesson,
    handleCreateStep,
    handleDeleteModelLocal,
    handleDeleteLessonLocal,
    handleDeleteStepLocal,
    handleDeleteModelFromStepik,
    handleDeleteLessonFromStepik,
    handleDeleteStepFromStepik,
    handleOpenContentEdit,
    handleGenerateNewContent,
    handleSaveContentChanges,
    handleSyncModel,
    handleSyncLesson,
    handleSyncStep,
    handleCheckStepWithStepik,
    handleReorderModels,
    handleReorderLessons,
    handleReorderSteps,
    handleOpenStepTypeChange,
    handleChangeStepType,
    isStepUnsynced,
    isLessonUnsynced,
    isModelUnsynced,
    hasUnsyncedContent,
    handleUpdateModelTitle,
    handleUpdateLessonTitle,
  };
}
