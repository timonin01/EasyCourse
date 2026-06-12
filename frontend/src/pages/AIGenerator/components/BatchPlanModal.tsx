import { useState, useEffect } from 'react';
import { Modal, Button, Input, Toggle } from '../../../components/ui';
import { Plus, X, CheckCircle } from 'lucide-react';
import type { BatchStepDTO, CountStepDTO } from '../../../types';

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

interface BatchPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: BatchStepDTO | null;
  onPlanChange: (plan: BatchStepDTO) => void;
  onConfirm: (plan: BatchStepDTO) => void;
}

export function BatchPlanModal({
  isOpen,
  onClose,
  plan,
  onPlanChange,
  onConfirm,
}: BatchPlanModalProps) {
  const [localPlan, setLocalPlan] = useState<BatchStepDTO>({ steps: [] });

  useEffect(() => {
    if (plan) {
      setLocalPlan(plan);
    }
  }, [plan]);

  const handleAddStep = () => {
    const newStep: CountStepDTO = {
      type: 'text',
      count: 1,
      specificInput: '',
      useSummarizedEnabled: false,
    };
    setLocalPlan({
      steps: [...localPlan.steps, newStep],
    });
  };

  const handleRemoveStep = (index: number) => {
    setLocalPlan({
      steps: localPlan.steps.filter((_, i) => i !== index),
    });
  };

  const handleUpdateStep = (
    index: number,
    field: keyof CountStepDTO,
    value: string | number | boolean
  ) => {
    const newSteps = [...localPlan.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setLocalPlan({ steps: newSteps });
  };

  const handleConfirm = () => {
    onPlanChange(localPlan);
    onConfirm(localPlan);
  };

  const totalSteps = localPlan.steps.reduce((sum, step) => sum + (step.count || 1), 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="План генерации шагов">
      <div className="space-y-4">
        <div className="p-3 bg-primary-600/10 rounded-lg border border-primary-600/20">
          <p className="text-sm text-dark-200">
            Всего будет сгенерировано: <strong>{totalSteps}</strong> шагов
          </p>
        </div>

        <div className="space-y-2">
          {localPlan.steps.length === 0 ? (
            <div className="text-center py-8 text-dark-400">
              <p>Нет шагов в плане</p>
            </div>
          ) : (
            localPlan.steps.map((step, index) => (
              <div
                key={index}
                className="flex gap-2 items-start p-3 bg-dark-800 rounded-lg border border-dark-600"
              >
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-200 text-sm"
                      value={step.type}
                      onChange={(e) => handleUpdateStep(index, 'type', e.target.value)}
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
                        handleUpdateStep(index, 'count', parseInt(e.target.value) || 1)
                      }
                      className="text-sm"
                    />

                    <Input
                      placeholder="Специфичный запрос"
                      value={step.specificInput || ''}
                      onChange={(e) => handleUpdateStep(index, 'specificInput', e.target.value)}
                      className="text-sm"
                    />
                  </div>

                  {step.type !== 'text' && (
                    <div className="pt-1 border-t border-dark-700/60 mt-2">
                      <Toggle
                        size="sm"
                        checked={step.useSummarizedEnabled ?? false}
                        onChange={(checked) =>
                          handleUpdateStep(index, 'useSummarizedEnabled', checked)
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
                  onClick={() => handleRemoveStep(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <Button
          variant="secondary"
          onClick={handleAddStep}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить тип шага
        </Button>

        <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={localPlan.steps.length === 0}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Подтвердить и сгенерировать
          </Button>
        </div>
      </div>
    </Modal>
  );
}
