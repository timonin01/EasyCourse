import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Modal, Button, Input, Toggle, Textarea } from '../../../components/ui';
import { Plus, X, CheckCircle } from 'lucide-react';
import type { BatchStepDTO, CountStepDTO } from '../../../types';
import { countTotalBatchSteps } from '../../../utils/batchSteps';
import { getBatchStepLimitMessage } from '../../../constants/batchLimits';
import { useSubscription } from '../../../hooks/useSubscription';
import { PRO_MAX_BATCH_STEPS } from '../../../constants/subscription';
import { AI_PROMPT_LIMITS, clampPromptLength } from '../../../constants/aiPromptLimits';

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
  const { isPro, maxBatchSteps } = useSubscription();

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
    let nextValue: string | number | boolean = value;
    if (field === 'specificInput' && typeof value === 'string') {
      nextValue = clampPromptLength(value, AI_PROMPT_LIMITS.generate);
    }
    newSteps[index] = { ...newSteps[index], [field]: nextValue };
    setLocalPlan({ steps: newSteps });
  };

  const totalSteps = countTotalBatchSteps(localPlan.steps);
  const exceedsLimit = totalSteps > maxBatchSteps;
  const limitMessage = getBatchStepLimitMessage(isPro, totalSteps, maxBatchSteps);

  const handleConfirm = () => {
    if (exceedsLimit) {
      toast.error(limitMessage);
      return;
    }
    onPlanChange(localPlan);
    onConfirm(localPlan);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="План генерации шагов">
      <div className="space-y-4">
        <div className={`p-3 rounded-lg border ${exceedsLimit ? 'bg-red-500/10 border-red-500/30' : 'bg-primary-600/10 border-primary-600/20'}`}>
          <p className="text-sm text-dark-200">
            Всего будет сгенерировано:{' '}
            <strong className={exceedsLimit ? 'text-red-400' : ''}>
              {totalSteps} / {maxBatchSteps}
            </strong>{' '}
            шагов
          </p>
          {exceedsLimit && (
            <p className="text-sm text-red-400 mt-2">{limitMessage}</p>
          )}
          {!exceedsLimit && !isPro && (
            <p className="text-xs text-dark-500 mt-1">
              Бесплатный тариф: до {maxBatchSteps} шагов. Pro: до {PRO_MAX_BATCH_STEPS}.
            </p>
          )}
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
                  <div className="grid grid-cols-2 gap-2">
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
                  </div>

                  <Textarea
                    placeholder="Описание шага (опционально) — тема, сложность, примеры..."
                    value={step.specificInput || ''}
                    onChange={(e) => handleUpdateStep(index, 'specificInput', e.target.value)}
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
            disabled={localPlan.steps.length === 0 || exceedsLimit}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Подтвердить и сгенерировать
          </Button>
        </div>
      </div>
    </Modal>
  );
}
