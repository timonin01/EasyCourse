import { Button, Textarea, Input, Toggle } from '../../../components/ui';
import { CheckCircle, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import type { CountStepDTO } from '../../../types';
import { AI_PROMPT_LIMITS, clampPromptLength } from '../../../constants/aiPromptLimits';
import { getBatchGenerationHint, getBatchStepLimitMessage } from '../../../constants/batchLimits';
import { BATCH_PROMPT_SUGGESTIONS } from '../../../constants/aiPromptSuggestions';
import { buildExplicitStepsQuery, countTotalBatchSteps } from '../../../utils/batchSteps';
import { useSubscription } from '../../../hooks/useSubscription';
import { PromptSuggestionChips } from './PromptSuggestionChips';

const stepTypeOptions = [
  { value: 'text', label: '📝 Текстовый контент' },
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

interface BatchGeneratorProps {
  userInput: string;
  onUserInputChange: (value: string) => void;
  explicitSteps: CountStepDTO[];
  onExplicitStepsChange: (steps: CountStepDTO[]) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export function BatchGenerator({
  userInput,
  onUserInputChange,
  explicitSteps,
  onExplicitStepsChange,
  onGenerate,
  isLoading,
}: BatchGeneratorProps) {
  const { isPro, maxBatchSteps, aiUsed, aiLimit } = useSubscription();

  const handleAddExplicitStep = (type: string) => {
    const newStep: CountStepDTO = {
      type,
      count: 1,
      specificInput: '',
      useSummarizedEnabled: false,
    };
    onExplicitStepsChange([...explicitSteps, newStep]);
  };

  const handleRemoveExplicitStep = (index: number) => {
    onExplicitStepsChange(explicitSteps.filter((_, i) => i !== index));
  };

  const handleUpdateExplicitStep = (index: number, field: keyof CountStepDTO, value: string | number | boolean) => {
    const newSteps = [...explicitSteps];
    let nextValue: string | number | boolean = value;
    if (field === 'specificInput' && typeof value === 'string') {
      nextValue = clampPromptLength(value, AI_PROMPT_LIMITS.generate);
    }
    newSteps[index] = { ...newSteps[index], [field]: nextValue };
    onExplicitStepsChange(newSteps);
  };

  const buildUserInputString = (): string => {
    if (explicitSteps.length === 0) {
      return userInput;
    }

    return buildExplicitStepsQuery(
      explicitSteps,
      (type) => stepTypeOptions.find((opt) => opt.value === type)?.label || type,
      userInput
    );
  };

  const canGenerate = () => {
    return userInput.trim().length > 0 || explicitSteps.length > 0;
  };

  const totalSteps = countTotalBatchSteps(explicitSteps);
  const exceedsLimit = explicitSteps.length > 0 && totalSteps > maxBatchSteps;
  const limitMessage = getBatchStepLimitMessage(isPro, totalSteps, maxBatchSteps);

  const handleGenerateClick = () => {
    if (exceedsLimit) {
      toast.error(limitMessage);
      return;
    }
    onGenerate();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-dark-400">{getBatchGenerationHint(isPro, maxBatchSteps)}</p>

      {!isPro && aiLimit !== null && (
        <p className="text-xs text-dark-500">
          AI-генерации в этом месяце: {aiUsed} / {aiLimit}
        </p>
      )}

      <div>
        <Textarea
          label="Описание заданий (опционально, если используете явный выбор)"
          placeholder="Например: Создай задания по массивам в Java..."
          value={userInput}
          onChange={(e) => onUserInputChange(e.target.value)}
          rows={3}
          maxLength={AI_PROMPT_LIMITS.batch}
          showCount
        />
        {!userInput.trim() && explicitSteps.length === 0 && (
          <PromptSuggestionChips
            suggestions={BATCH_PROMPT_SUGGESTIONS}
            onSelect={onUserInputChange}
            maxLength={AI_PROMPT_LIMITS.batch}
            className="justify-start mt-2"
          />
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-dark-300">
            Явный выбор типов и количества
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAddExplicitStep('text')}
          >
            <Plus className="w-4 h-4 mr-1" />
            Добавить тип
          </Button>
        </div>

        {explicitSteps.length > 0 && (
          <div className="space-y-2">
            <div className="rounded-xl border border-dark-700/80 bg-dark-800/50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className={`text-xs font-medium ${exceedsLimit ? 'text-red-400' : 'text-dark-400'}`}>
                  Шагов в плане: {totalSteps} / {maxBatchSteps}
                  {exceedsLimit && ` — ${limitMessage}`}
                </span>
                <span className="text-xs tabular-nums text-dark-500">
                  {Math.min(100, Math.round((totalSteps / maxBatchSteps) * 100))}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-dark-700">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    exceedsLimit
                      ? 'bg-gradient-to-r from-red-600 to-red-400'
                      : 'bg-gradient-to-r from-primary-600 to-primary-400'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.round((totalSteps / maxBatchSteps) * 100))}%`,
                  }}
                />
              </div>
            </div>
            {explicitSteps.map((step, index) => (
              <div
                key={index}
                className="flex gap-2 items-start p-3 bg-dark-800 rounded-lg border border-dark-600"
              >
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-200 text-sm"
                      value={step.type}
                      onChange={(e) => handleUpdateExplicitStep(index, 'type', e.target.value)}
                    >
                      {stepTypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <Input
                      type="number"
                      min="1"
                      placeholder="Количество"
                      value={step.count || 1}
                      onChange={(e) =>
                        handleUpdateExplicitStep(index, 'count', parseInt(e.target.value) || 1)
                      }
                      className="text-sm"
                    />
                  </div>

                  <Textarea
                    placeholder="Описание шага (опционально) — тема, сложность, примеры..."
                    value={step.specificInput || ''}
                    onChange={(e) => handleUpdateExplicitStep(index, 'specificInput', e.target.value)}
                    rows={3}
                    className="text-sm resize-y min-h-[5.5rem]"
                    maxLength={AI_PROMPT_LIMITS.generate}
                    showCount
                  />

                  {step.type !== 'text' && (
                    <div className="pt-1 border-t border-dark-700/60 mt-2">
                      <Toggle
                        size="sm"
                        checked={step.useSummarizedEnabled ?? false}
                        onChange={(checked) =>
                          handleUpdateExplicitStep(index, 'useSummarizedEnabled', checked)
                        }
                        label="Использовать контекст из текстовых шагов"
                        description="Если включено, задания будут формироваться с опорой на сгенерированные текстовые шаги (если они есть)."
                      />
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveExplicitStep(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {explicitSteps.length === 0 && (
          <div className="text-center py-6 bg-dark-800 rounded-lg border border-dashed border-dark-600">
            <p className="text-sm text-dark-400">
              Нажмите "Добавить тип" чтобы явно указать типы и количество шагов
            </p>
          </div>
        )}
      </div>

      {(userInput || explicitSteps.length > 0) && (
        <div className="p-3 bg-dark-800 rounded-lg border border-dark-600">
          <p className="text-xs text-dark-400 mb-1">Запрос который будет отправлен:</p>
          <p className="text-sm text-dark-200">{buildUserInputString()}</p>
        </div>
      )}

      <Button
        onClick={handleGenerateClick}
        disabled={!canGenerate() || isLoading || exceedsLimit}
        className="w-full"
        isLoading={isLoading}
      >
        <CheckCircle className="w-4 h-4 mr-2" />
        Сгенерировать batch шагов
      </Button>
    </div>
  );
}
