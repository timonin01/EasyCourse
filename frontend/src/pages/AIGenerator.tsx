import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Trash2, Copy, Save, Bot, User, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { MainLayout } from '../components/Layout';
import { Button, Card, Textarea, Select, LlmModelSelect, Badge, Spinner } from '../components/ui';
import { agentApi, stepsApi, coursesApi, sectionsApi, lessonsApi } from '../api';
import { useCourseStore, useAuthStore, useAIGeneratorStore } from '../store';
import type { ChatMessage, StepType, Lesson, BatchStepDTO, CountStepDTO, StepikBlockRequest } from '../types';
import { BatchGenerator } from './AIGenerator/components/BatchGenerator';
import { BatchPlanModal } from './AIGenerator/components/BatchPlanModal';
import { BatchResultsPreview } from './AIGenerator/components/BatchResultsPreview';
import { BatchProgressStepper, type BatchStepStatus } from './AIGenerator/components/BatchProgressStepper';
import { buildExplicitStepsQuery, countTotalBatchSteps, expandBatchPlanToItems, type BatchPlanItem } from '../utils/batchSteps';
import { getBatchStepLimitMessage } from '../constants/batchLimits';
import { useSubscription } from '../hooks/useSubscription';
import { SubscriptionPanel } from '../components/subscription/SubscriptionPanel';
import { MODEL_PRO_MESSAGE } from '../constants/subscription';
import { extractApiErrorMessage } from '../utils/apiError';

// Простая функция для обработки базового markdown
const renderMarkdown = (text: string): string => {
  if (!text) return '';
  
  let result = text;
  
  // Сначала обрабатываем жирный текст **text** (двойные звездочки)
  result = result.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  
  // Затем обрабатываем курсив *text* (одиночные звездочки)
  // После обработки жирного текста останутся только одиночные звездочки
  result = result.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');
  
  // Обработка переносов строк
  result = result.replace(/\n/g, '<br />');
  
  return result;
};

const stepTypeOptions = [
  { value: 'text', label: '📝 Текстовый контент (урок/задача)' },
  { value: 'choice', label: '✅ Выбор ответа' },
  { value: 'matching', label: '🔗 Сопоставление' },
  { value: 'sorting', label: '📊 Сортировка' },
  { value: 'fill-blanks', label: '✏️ Заполнить пропуски' },
  { value: 'string', label: '🔤 Ввод строки' },
  { value: 'number', label: '🔢 Ввод числа' },
  { value: 'free-answer', label: '💬 Свободный ответ' },
  { value: 'math', label: '🔢 Математическая задача' },
  { value: 'random-tasks', label: '🎲 Случайные задачи' },
  { value: 'table', label: '📋 Таблица' },
  { value: 'code', label: '💻 Задача по программированию' },
];

export function AIGenerator() {
  const { user } = useAuthStore();
  const { addStep } = useCourseStore();
  const {
    mode,
    setMode,
    stepType,
    setStepType,
    generatedStep,
    setGeneratedStep,
    selectedLessonId,
    setSelectedLessonId,
    allLessons,
    setAllLessons,
    getOrCreateChatSession,
    getOrCreateGenerateSession,
    addMessage,
    getMessages,
    setMessages,
    clearSession,
    addBatchHistory,
    getBatchHistory,
  } = useAIGeneratorStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  const [selectedLlmModel, setSelectedLlmModel] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Batch generation state
  const [batchUserInput, setBatchUserInput] = useState('');
  const [batchExplicitSteps, setBatchExplicitSteps] = useState<CountStepDTO[]>([]);
  const [batchPlan, setBatchPlan] = useState<BatchStepDTO | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [batchResults, setBatchResults] = useState<Array<{ step: StepikBlockRequest; index: number; error?: string }>>([]);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [batchPlanItems, setBatchPlanItems] = useState<BatchPlanItem[]>([]);
  const [batchActiveIndex, setBatchActiveIndex] = useState(0);

  const { isPro, canSelectModel, maxBatchSteps, refresh: refreshSubscription } = useSubscription();

  useEffect(() => {
    if (!isGeneratingBatch || batchPlanItems.length === 0) return;

    const interval = setInterval(() => {
      setBatchActiveIndex((prev) => (prev >= batchPlanItems.length - 1 ? prev : prev + 1));
    }, 3500);

    return () => clearInterval(interval);
  }, [isGeneratingBatch, batchPlanItems.length]);

  const batchStepStatuses: BatchStepStatus[] = batchPlanItems.map((item, i) => {
    const result = batchResults.find((r) => r.index === item.index);
    if (result?.error) return 'error';
    if (result && !result.error) return 'done';
    if (isGeneratingBatch) {
      if (i < batchActiveIndex) return 'done';
      if (i === batchActiveIndex) return 'active';
      return 'pending';
    }
    return 'pending';
  });

  const batchProgressPercent =
    batchPlanItems.length > 0
      ? batchResults.some((r) => !r.error)
        ? 100
        : Math.min(100, Math.round(((batchActiveIndex + 1) / batchPlanItems.length) * 100))
      : 0;

  useEffect(() => {
    if (!canSelectModel && selectedLlmModel) {
      setSelectedLlmModel('');
    }
  }, [canSelectModel, selectedLlmModel]);

  const currentSessionId = mode === 'chat'
    ? getOrCreateChatSession() 
    : getOrCreateGenerateSession(stepType);

  const messages = getMessages(currentSessionId);

  useEffect(() => {
    const loadAllLessons = async () => {
      if (!user?.id) return;
      
      setIsLoadingLessons(true);
      try {
        const courses = await coursesApi.getUserCourses(user.id);
        const allLessonsWithContext: Array<Lesson & { modelTitle?: string; courseTitle?: string }> = [];
        
        for (const course of courses) {
          const sections = await sectionsApi.getCourseSections(course.id);
          
          for (const section of sections) {
            const lessons = await lessonsApi.getSectionLessons(section.id);
            
            for (const lesson of lessons) {
              allLessonsWithContext.push({
                ...lesson,
                modelTitle: section.title,
                courseTitle: course.title,
              });
            }
          }
        }
        
        setAllLessons(allLessonsWithContext);
      } catch (error) {
        console.error('Failed to load lessons:', error);
      } finally {
        setIsLoadingLessons(false);
      }
    };
    
    if (allLessons.length === 0) {
      loadAllLessons();
    }
  }, [user?.id, allLessons.length, setAllLessons]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await agentApi.getHistory(currentSessionId);
        if (history.length > 0) {
          setMessages(currentSessionId, history);
        }
      } catch {
      }
    };
    
    if (messages.length === 0) {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessionId]);

  const handleModeChange = (newMode: 'chat' | 'generate' | 'batch') => {
    if (newMode === mode) return;
    setMode(newMode);
    if (newMode !== 'batch') {
      setBatchResults([]);
      setBatchPlan(null);
    }
  };

  const handleStepTypeChange = (newStepType: string) => {
    setStepType(newStepType);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const sessionId = getOrCreateGenerateSession(stepType);
    const userMessage: ChatMessage = { role: 'user', content: input };
    addMessage(sessionId, userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const response = await agentApi.generateStep(sessionId, input, stepType, selectedLlmModel || undefined);
      setGeneratedStep(response);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: `Готово! Сгенерирован шаг типа "${stepType}".\n\nПредпросмотр контента:\n${response.text?.substring(0, 200) || 'Контент сгенерирован'}...`,
      };
      addMessage(sessionId, assistantMessage);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: extractApiErrorMessage(error, 'Произошла ошибка при генерации. Попробуйте ещё раз.'),
      };
      addMessage(sessionId, errorMessage);
      toast.error(extractApiErrorMessage(error, 'Ошибка генерации'));
      void refreshSubscription();
      console.error('AI generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChat = async () => {
    if (!input.trim() || isLoading) return;

    const sessionId = getOrCreateChatSession();
    const userMessage: ChatMessage = { role: 'user', content: input };
    addMessage(sessionId, userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const response = await agentApi.chat(sessionId, input, selectedLlmModel || undefined);
      const assistantMessage: ChatMessage = { role: 'assistant', content: response };
      addMessage(sessionId, assistantMessage);
    } catch (error) {
      const message = extractApiErrorMessage(error, 'Произошла ошибка. Попробуйте ещё раз.');
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: message,
      };
      addMessage(sessionId, errorMessage);
      toast.error(message);
      void refreshSubscription();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSession = async () => {
    try {
      await agentApi.clearSession(currentSessionId);
      clearSession(currentSessionId);
      toast.success('Сессия очищена');
    } catch (error) {
      toast.error('Не удалось очистить сессию');
    }
  };

  const handleSaveStep = async () => {
    if (!generatedStep || !selectedLessonId) {
      toast.error('Выберите урок для сохранения');
      return;
    }

    try {
      const stepTypeMap: Record<string, StepType> = {
        'text': 'TEXT',
        'choice': 'CHOICE',
        'matching': 'MATCHING',
        'sorting': 'SORTING',
        'fill-blanks': 'FILL_BLANK',
        'string': 'STRING',
        'number': 'NUMBER',
        'free-answer': 'FREE_ANSWER',
        'math': 'MATH',
        'random-tasks': 'RANDOM_TASKS',
        'table': 'TABLE',
      };

      const newStep = await stepsApi.createStep({
        lessonId: selectedLessonId,
        type: stepTypeMap[stepType] || 'TEXT',
        content: generatedStep.text || '',
        stepikBlock: generatedStep,
      });
      
      addStep(newStep);
      toast.success('Шаг сохранен!');
      setGeneratedStep(null);
    } catch (error) {
      toast.error('Не удалось сохранить шаг');
      console.error('Save step error:', error);
    }
  };

  const handleCopyContent = () => {
    if (generatedStep?.text) {
      navigator.clipboard.writeText(generatedStep.text);
      toast.success('Скопировано!');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (mode === 'generate') {
        handleSendMessage();
      } else {
        handleChat();
      }
    }
  };

  const handleSend = () => {
    if (mode === 'generate') {
      handleSendMessage();
    } else {
      handleChat();
    }
  };

  const handleRefreshLessons = async () => {
    if (!user?.id) return;
    
    setIsLoadingLessons(true);
    try {
      const courses = await coursesApi.getUserCourses(user.id);
      const allLessonsWithContext: Array<Lesson & { modelTitle?: string; courseTitle?: string }> = [];
      
      for (const course of courses) {
        const sections = await sectionsApi.getCourseSections(course.id);
        
        for (const section of sections) {
          const lessons = await lessonsApi.getSectionLessons(section.id);
          
          for (const lesson of lessons) {
            allLessonsWithContext.push({
              ...lesson,
              modelTitle: section.title,
              courseTitle: course.title,
            });
          }
        }
      }
      
      setAllLessons(allLessonsWithContext);
      toast.success('Список уроков обновлен');
    } catch (error) {
      toast.error('Не удалось загрузить уроки');
    } finally {
      setIsLoadingLessons(false);
    }
  };

  // Batch generation handlers
  const buildBatchUserInput = (): string => {
    if (batchExplicitSteps.length === 0) {
      return batchUserInput;
    }

    return buildExplicitStepsQuery(
      batchExplicitSteps,
      (type) => stepTypeOptions.find((opt) => opt.value === type)?.label || type,
      batchUserInput
    );
  };

  const handleSaveBatchSteps = async (indices: number[]) => {
    if (!selectedLessonId || indices.length === 0) {
      return;
    }

    setIsSavingBatch(true);
    const stepTypeMap: Record<string, StepType> = {
      'text': 'TEXT',
      'choice': 'CHOICE',
      'matching': 'MATCHING',
      'sorting': 'SORTING',
      'fill-blanks': 'FILL_BLANK',
      'string': 'STRING',
      'number': 'NUMBER',
      'free-answer': 'FREE_ANSWER',
      'math': 'MATH',
      'random-tasks': 'RANDOM_TASKS',
      'table': 'TABLE',
      'code': 'CODE',
    };

    let savedCount = 0;
    let failedCount = 0;

    for (const index of indices) {
      const result = batchResults[index];
      if (!result || result.error) {
        failedCount++;
        continue;
      }

      try {
        const stepType = stepTypeMap[result.step.name || 'text'] || 'TEXT';
        const newStep = await stepsApi.createStep({
          lessonId: selectedLessonId,
          type: stepType,
          content: result.step.text || '',
          stepikBlock: result.step,
        });
        
        addStep(newStep);
        savedCount++;
      } catch (error) {
        console.error(`Failed to save step ${index}:`, error);
        failedCount++;
        // Останавливаем сохранение при ошибке
        toast.error(`Ошибка при сохранении шага ${index + 1}. Сохранение остановлено.`);
        break;
      }
    }

    if (savedCount > 0) {
      toast.success(`Сохранено ${savedCount} шагов`);
      setBatchResults([]);
    }
    
    setIsSavingBatch(false);
  };

  const handleSaveAllBatchSteps = async () => {
    const successfulIndices = batchResults
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => !r.error)
      .map(({ i }) => i);
    
    await handleSaveBatchSteps(successfulIndices);
  };

  const handlePlanConfirm = async (plan: BatchStepDTO) => {
    const totalSteps = countTotalBatchSteps(plan.steps);
    const limitMessage = getBatchStepLimitMessage(isPro, totalSteps, maxBatchSteps);
    if (totalSteps > maxBatchSteps) {
      toast.error(limitMessage);
      return;
    }

    setIsPlanModalOpen(false);
    setBatchPlan(plan);

    const planItems = expandBatchPlanToItems(plan);
    setBatchPlanItems(planItems);
    setBatchActiveIndex(0);
    
    // Сохраняем в историю
    addBatchHistory(buildBatchUserInput(), plan);
    
    // Запускаем генерацию с обновленным планом
    const userInputString = buildBatchUserInput();
    setIsGeneratingBatch(true);
    setBatchResults([]);

    try {
      const sessionId = getOrCreateChatSession();
      const results = await agentApi.generateBatchSteps(sessionId, userInputString, plan);
      
      // Преобразуем результаты в формат с индексами
      const formattedResults = results.map((step, index) => ({
        step,
        index,
      }));

      setBatchResults(formattedResults);
      setBatchActiveIndex(planItems.length - 1);
      toast.success(`Сгенерировано ${results.length} шагов`);
      void refreshSubscription();
    } catch (error: any) {
      console.error('Batch generation error:', error);
      
      // Извлекаем детальную информацию об ошибке
      let errorMessage = 'Ошибка при генерации batch шагов';
      let errorDetails = '';
      
      if (error.response?.data) {
        const responseData = error.response.data;
        
        if (typeof responseData === 'string') {
          errorMessage = responseData;
        } else if (responseData.message) {
          errorMessage = responseData.message;
          errorDetails = responseData.details || '';
        } else if (responseData.error) {
          // Формат из GlobalExceptionHandler
          errorMessage = responseData.error || 'Ошибка при генерации batch шагов';
          errorDetails = responseData.message || '';
        } else {
          errorMessage = 'Ошибка при генерации batch шагов';
          errorDetails = JSON.stringify(responseData, null, 2);
        }
      } else if (error.message) {
        errorMessage = error.message;
        // Если в сообщении есть детали (разделены \n\n), извлекаем их
        if (error.message.includes('\n\n')) {
          const parts = error.message.split('\n\n');
          errorMessage = parts[0];
          errorDetails = parts.slice(1).join('\n\n');
        }
      }
      
      // Проверяем, есть ли информация о fallback генерации
      const isFallback = errorMessage.includes('falling back') || errorMessage.includes('Falling back');
      
      // Формируем полное сообщение об ошибке
      let fullErrorMessage = errorMessage;
      if (errorDetails) {
        fullErrorMessage += '\n\nДетали:\n' + errorDetails;
      }
      
      if (isFallback) {
        fullErrorMessage += '\n\n⚠️ Система автоматически переключилась на генерацию шагов по одному.';
      }
      
      // Показываем детальное сообщение об ошибке в toast
      toast.error(fullErrorMessage, {
        duration: 10000,
        style: {
          maxWidth: '600px',
          whiteSpace: 'pre-wrap',
          fontSize: '13px',
          maxHeight: '400px',
          overflowY: 'auto',
        },
      });
      
      // Добавляем ошибку в результаты для отображения в UI
      setBatchResults([{
        step: {} as StepikBlockRequest,
        index: 0,
        error: fullErrorMessage,
      }]);
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  const groupedLessons = allLessons.reduce((acc, lesson) => {
    const courseTitle = lesson.courseTitle || 'Без курса';
    if (!acc[courseTitle]) {
      acc[courseTitle] = [];
    }
    acc[courseTitle].push(lesson);
    return acc;
  }, {} as Record<string, typeof allLessons>);

  return (
    <MainLayout>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] min-h-0 overflow-x-hidden">
        {/* Chat Section */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-dark-100 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary-400" />
                AI Ассистент
              </h1>
              <p className="text-dark-400 text-sm">
                {mode === 'chat' 
                  ? 'Свободный чат с ИИ' 
                  : mode === 'generate'
                  ? 'Генерация контента для курсов'
                  : 'Пакетная генерация нескольких шагов'}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleClearSession}>
              <Trash2 className="w-4 h-4 mr-1" />
              Очистить
            </Button>
          </div>

          {/* Mode Toggle */}
          <div className="mb-4 flex gap-2 flex-shrink-0 min-w-0 overflow-x-hidden">
            <button
              onClick={() => handleModeChange('chat')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                mode === 'chat'
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
              }`}
            >
              💬 Свободный чат
            </button>
            <button
              onClick={() => handleModeChange('generate')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                mode === 'generate'
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
              }`}
            >
              ✨ Генерация шагов
            </button>
            <button
              onClick={() => handleModeChange('batch')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                mode === 'batch'
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
              }`}
            >
              📦 Batch генерация
            </button>
          </div>

          {/* Step Type Selection - only in generate mode */}
          {mode === 'generate' && (
            <div className="mb-4 flex-shrink-0 space-y-3">
              <Select
                label="Тип генерируемого шага"
                options={stepTypeOptions}
                value={stepType}
                onChange={(e) => handleStepTypeChange(e.target.value)}
              />
            </div>
          )}

          {/* Batch mode - scrollable container */}
          {mode === 'batch' && (
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="space-y-4 pb-4">
                {/* Batch Generator */}
                <Card>
                  <BatchGenerator
                    userInput={batchUserInput}
                    onUserInputChange={setBatchUserInput}
                    explicitSteps={batchExplicitSteps}
                    onExplicitStepsChange={setBatchExplicitSteps}
                    onGenerate={async () => {
                      const userInputString = buildBatchUserInput();
                      if (!userInputString.trim()) {
                        toast.error('Введите запрос или выберите типы шагов');
                        return;
                      }

                      if (!selectedLessonId) {
                        toast.error('Выберите урок для сохранения шагов');
                        return;
                      }

                      // Анализируем запрос и получаем план
                      try {
                        setIsGeneratingBatch(true);
                        const plan = await agentApi.analyzeBatchRequest(userInputString);
                        const totalSteps = countTotalBatchSteps(plan.steps);
                        const limitMessage = getBatchStepLimitMessage(isPro, totalSteps, maxBatchSteps);
                        if (totalSteps > maxBatchSteps) {
                          toast.error(limitMessage);
                        }
                        setBatchPlan(plan);
                        setIsPlanModalOpen(true);
                      } catch (error) {
                        console.error('Error analyzing batch request:', error);
                        toast.error('Ошибка при анализе запроса');
                      } finally {
                        setIsGeneratingBatch(false);
                      }
                    }}
                    isLoading={isGeneratingBatch}
                  />
                </Card>

                {/* Batch Results */}
                {batchResults.length > 0 ? (
                  <Card>
                    <BatchResultsPreview
                      results={batchResults}
                      onSaveSelected={handleSaveBatchSteps}
                      onSaveAll={handleSaveAllBatchSteps}
                      isSaving={isSavingBatch}
                      selectedLessonId={selectedLessonId}
                    />
                  </Card>
                ) : isGeneratingBatch && batchPlanItems.length > 0 ? (
                  <Card>
                    <BatchProgressStepper
                      items={batchPlanItems}
                      stepStatuses={batchStepStatuses}
                      progressPercent={batchProgressPercent}
                    />
                  </Card>
                ) : isGeneratingBatch ? (
                  <Card>
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Spinner size="lg" />
                        <p className="text-sm text-dark-400 mt-4">Подготовка batch-генерации...</p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="p-4 bg-primary-600/20 rounded-2xl mb-4">
                        <Sparkles className="w-12 h-12 text-primary-400" />
                      </div>
                      <h3 className="text-lg font-medium text-dark-200 mb-2">
                        Batch генерация шагов
                      </h3>
                      <p className="text-dark-400 max-w-md">
                        Введите запрос или выберите типы шагов для пакетной генерации.
                        Вы можете использовать текстовое описание или явно указать типы и количество.
                      </p>
                      <div className="mt-6">
                        <h4 className="text-md font-medium text-dark-300 mb-3">История генераций:</h4>
                        {getBatchHistory().length === 0 ? (
                          <p className="text-sm text-dark-500">История пуста</p>
                        ) : (
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {getBatchHistory().map((entry, index) => (
                              <div key={index} className="bg-dark-800 p-3 rounded-lg text-sm text-dark-300">
                                <p className="truncate">{entry.userInput}</p>
                                <p className="text-xs text-dark-500">
                                  {new Date(entry.timestamp).toLocaleString()} - {entry.plan.steps.length} типов, {entry.plan.steps.reduce((sum, s) => sum + s.count, 0)} шагов
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast('История batch-генераций (в разработке)', { icon: 'ℹ️' })}
                          className="mt-3 text-dark-400 hover:text-dark-200"
                        >
                          Показать всю историю
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Messages - only in chat and generate modes */}
          {mode !== 'batch' && (
            <Card className="flex-1 overflow-hidden flex flex-col min-h-0" padding="none">
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 min-w-0">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-2">
                  <div className="p-4 bg-primary-600/20 rounded-2xl mb-4">
                    <Bot className="w-12 h-12 text-primary-400" />
                  </div>
                  <h3 className="text-lg font-medium text-dark-200 mb-2">
                    Привет! Я ваш AI-ассистент
                  </h3>
                  <p className="text-dark-400 max-w-md">
                    {mode === 'chat' 
                      ? 'Задайте любой вопрос, и я постараюсь помочь. Я могу объяснить сложные темы, помочь с идеями для курсов или просто поболтать.'
                      : 'Опишите, какой шаг вы хотите создать, и я сгенерирую его для вас. Например: "Создай тест про фотосинтез с 4 вариантами ответа"'
                    }
                  </p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 min-w-0 ${message.role === 'user' ? 'justify-end' : ''}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 bg-primary-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-primary-400" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] min-w-0 break-words rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'bg-dark-800 text-dark-200'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div 
                          className="markdown-content"
                          style={{
                            lineHeight: '1.6',
                          }}
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 bg-dark-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-dark-300" />
                      </div>
                    )}
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary-600/20 rounded-lg flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary-400" />
                  </div>
                  <div className="bg-dark-800 rounded-2xl px-4 py-3">
                    <Spinner size="sm" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-dark-700 flex-shrink-0 min-w-0 overflow-x-hidden">
              <div className="flex gap-2 items-end min-w-0">
                <Textarea
                  placeholder={mode === 'chat' 
                    ? "Напишите сообщение..." 
                    : "Опишите шаг, который хотите создать..."
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  rows={2}
                  className="flex-1 min-w-0 resize-none"
                />
                {/* LLM Model Selection - visible in chat and generate modes */}
                {(mode === 'chat' || mode === 'generate') && (
                  <div className="w-52 flex-shrink-0">
                    <LlmModelSelect
                      label="Модель"
                      value={selectedLlmModel}
                      onChange={setSelectedLlmModel}
                      className="h-11"
                      canSelectModel={canSelectModel}
                      onProModelAttempt={() => toast.error(MODEL_PRO_MESSAGE)}
                    />
                  </div>
                )}
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="h-11 w-11 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
          )}

        </div>

        {/* Preview Section - only in generate mode */}
        {mode === 'generate' && (
          <div className="w-full lg:w-72 xl:w-80 2xl:w-96 lg:flex-shrink-0 flex flex-col min-h-0 max-h-[35vh] lg:max-h-none">
            <h2 className="font-semibold text-dark-200 mb-4 flex-shrink-0">Предпросмотр</h2>
            <Card className="flex-1 overflow-auto min-h-0">
              {generatedStep ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="success">Шаг сгенерирован</Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={handleCopyContent}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-dark-400 mb-2">Тип:</h3>
                    <Badge>{generatedStep.name || stepType}</Badge>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-dark-400 mb-2">Контент:</h3>
                    <div 
                      className="text-sm text-dark-200 bg-dark-800 p-3 rounded-lg prose prose-sm prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: generatedStep.text || '' }}
                    />
                  </div>

                  {generatedStep.source != null && (
                    <div>
                      <h3 className="text-sm font-medium text-dark-400 mb-2">Данные:</h3>
                      <pre className="text-xs text-dark-400 bg-dark-800 p-3 rounded-lg overflow-auto max-h-40">
                        {JSON.stringify(generatedStep.source, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="pt-4 border-t border-dark-700">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-dark-300">
                        Сохранить в урок:
                      </label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleRefreshLessons}
                        disabled={isLoadingLessons}
                        title="Обновить список уроков"
                      >
                        {isLoadingLessons ? (
                          <Spinner size="sm" />
                        ) : (
                          <FolderOpen className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    
                    {allLessons.length === 0 ? (
                      <div className="text-center py-4 bg-dark-800 rounded-lg mb-3">
                        <FolderOpen className="w-8 h-8 text-dark-500 mx-auto mb-2" />
                        <p className="text-sm text-dark-400">Нет доступных уроков</p>
                        <p className="text-xs text-dark-500 mt-1">
                          Создайте курс, модуль и урок
                        </p>
                      </div>
                    ) : (
                      <select
                        className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-dark-200 text-sm mb-3"
                        value={selectedLessonId || ''}
                        onChange={(e) => setSelectedLessonId(Number(e.target.value) || null)}
                      >
                        <option value="">Выберите урок...</option>
                        {Object.entries(groupedLessons).map(([courseTitle, lessons]) => (
                          <optgroup key={courseTitle} label={`📚 ${courseTitle}`}>
                            {lessons.map((lesson) => (
                              <option key={lesson.id} value={lesson.id}>
                                {lesson.modelTitle} → {lesson.title}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    )}
                    
                    <Button 
                      className="w-full" 
                      onClick={handleSaveStep}
                      disabled={!selectedLessonId || allLessons.length === 0}
                      icon={<Save className="w-4 h-4" />}
                    >
                      Сохранить шаг
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                  <p className="text-dark-500">
                    Сгенерированный контент появится здесь
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Batch Settings Section - only in batch mode */}
        {mode === 'batch' && (
          <div className="w-full lg:w-72 xl:w-80 2xl:w-96 lg:flex-shrink-0 flex flex-col min-h-0 max-h-[35vh] lg:max-h-none">
            <h2 className="font-semibold text-dark-200 mb-4 flex-shrink-0 flex items-center justify-between">
              <span>Настройки</span>
              {getBatchHistory().length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    toast('История batch-генераций (в разработке)', { icon: 'ℹ️' });
                  }}
                >
                  <FolderOpen className="w-4 h-4" />
                </Button>
              )}
            </h2>
            <SubscriptionPanel />
            <Card className="flex-1 overflow-auto min-h-0">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Сохранить в урок:
                  </label>
                  {allLessons.length === 0 ? (
                    <div className="text-center py-4 bg-dark-800 rounded-lg">
                      <FolderOpen className="w-8 h-8 text-dark-500 mx-auto mb-2" />
                      <p className="text-sm text-dark-400">Нет доступных уроков</p>
                    </div>
                  ) : (
                    <select
                      className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-dark-200 text-sm"
                      value={selectedLessonId || ''}
                      onChange={(e) => setSelectedLessonId(Number(e.target.value) || null)}
                    >
                      <option value="">Выберите урок...</option>
                      {Object.entries(groupedLessons).map(([courseTitle, lessons]) => (
                        <optgroup key={courseTitle} label={`📚 ${courseTitle}`}>
                          {lessons.map((lesson) => (
                            <option key={lesson.id} value={lesson.id}>
                              {lesson.modelTitle} → {lesson.title}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Batch Plan Modal */}
      <BatchPlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        plan={batchPlan}
        onPlanChange={setBatchPlan}
        onConfirm={handlePlanConfirm}
      />
    </MainLayout>
  );
}
