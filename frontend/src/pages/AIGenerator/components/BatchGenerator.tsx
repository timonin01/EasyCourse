import { useState } from 'react';
import { Button, Textarea, Input, Toggle } from '../../../components/ui';
import { CheckCircle, X, Plus } from 'lucide-react';
import type { CountStepDTO } from '../../../types';
import { buildExplicitStepsQuery, mergeExplicitSteps } from '../../../utils/batchSteps';

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
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());

  const handleAddExplicitStep = (type: string) => {
    const newStep: CountStepDTO = {
      type,
      count: 1,
      specificInput: '',
      useSummarizedEnabled: false,
    };
    onExplicitStepsChange(mergeExplicitSteps([...explicitSteps, newStep]));
    setSelectedTypes(new Set([...selectedTypes, type]));
  };

  const handleRemoveExplicitStep = (index: number) => {
    const newSteps = explicitSteps.filter((_, i) => i !== index);
    onExplicitStepsChange(newSteps);
    const removedType = explicitSteps[index].type;
    const newSelected = new Set(selectedTypes);
    newSelected.delete(removedType);
    setSelectedTypes(newSelected);
  };

  const handleUpdateExplicitStep = (index: number, field: keyof CountStepDTO, value: string | number | boolean) => {
    const newSteps = [...explicitSteps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    onExplicitStepsChange(mergeExplicitSteps(newSteps));
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

  return (
    <div className="space-y-4">
      {/* Текстовое поле */}
      <div>
        <Textarea
          label="Описание заданий (опционально, если используете явный выбор)"
          placeholder="Например: Создай задания по массивам в Java..."
          value={userInput}
          onChange={(e) => onUserInputChange(e.target.value)}
          rows={3}
        />
      </div>

      {/* Явный выбор */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-dark-300">
            Явный выбор типов и количества
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const availableTypes = stepTypeOptions.filter(
                (opt) => !explicitSteps.some((step) => step.type === opt.value)
              );
              if (availableTypes.length > 0) {
                handleAddExplicitStep(availableTypes[0].value);
              }
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            Добавить тип
          </Button>
        </div>

        {explicitSteps.length > 0 && (
          <div className="space-y-2">
            {explicitSteps.map((step, index) => (
              <div
                key={index}
                className="flex gap-2 items-start p-3 bg-dark-800 rounded-lg border border-dark-600"
              >
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
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

                    <Input
                      placeholder="Специфичный запрос (опционально)"
                      value={step.specificInput || ''}
                      onChange={(e) => handleUpdateExplicitStep(index, 'specificInput', e.target.value)}
                      className="text-sm"
                    />
                  </div>

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

      {/* Предпросмотр запроса */}
      {(userInput || explicitSteps.length > 0) && (
        <div className="p-3 bg-dark-800 rounded-lg border border-dark-600">
          <p className="text-xs text-dark-400 mb-1">Запрос который будет отправлен:</p>
          <p className="text-sm text-dark-200">{buildUserInputString()}</p>
        </div>
      )}

      {/* Кнопка генерации */}
      <Button
        onClick={onGenerate}
        disabled={!canGenerate() || isLoading}
        className="w-full"
        isLoading={isLoading}
      >
        <CheckCircle className="w-4 h-4 mr-2" />
        Сгенерировать batch шагов
      </Button>
    </div>
  );
}
