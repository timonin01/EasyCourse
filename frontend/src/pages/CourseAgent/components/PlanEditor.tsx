import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import type { CountStepDTO, CourseAgentLessonPlan } from '../../../types';

const STEP_TYPE_LABELS: Record<string, string> = {
  text: 'Теория',
  choice: 'Тест',
  matching: 'Соответствие',
  sorting: 'Сортировка',
  table: 'Таблица',
  'fill-blanks': 'Пропуски',
  string: 'Ввод строки',
  number: 'Ввод числа',
  'free-answer': 'Свободный ответ',
  math: 'Математика',
  'random-tasks': 'Случайные задачи',
  code: 'Код',
};

const STEP_TYPE_OPTIONS = Object.entries(STEP_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export function StepPlanEditor({
  steps,
  disabled,
  onChange,
}: {
  steps: CountStepDTO[];
  disabled: boolean;
  onChange: (steps: CountStepDTO[]) => void;
}) {
  const updateStep = (index: number, patch: Partial<CountStepDTO>) => {
    onChange(steps.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  };

  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <div
          key={index}
          className="grid gap-2 rounded-lg border border-dark-700/60 bg-dark-900 p-2.5 md:grid-cols-[minmax(120px,0.8fr)_72px_minmax(140px,1.5fr)_32px]"
        >
          <Select
            aria-label={`Тип шага ${index + 1}`}
            options={STEP_TYPE_OPTIONS}
            value={step.type}
            disabled={disabled}
            onChange={(event) => updateStep(index, { type: event.target.value })}
            className="rounded-lg py-2 text-sm"
          />
          <Input
            aria-label={`Количество шагов ${index + 1}`}
            type="number"
            min={1}
            value={step.count}
            disabled={disabled}
            onChange={(event) => updateStep(index, {
              count: Math.max(1, Number.parseInt(event.target.value, 10) || 1),
            })}
            className="py-2 text-sm"
          />
          <Input
            aria-label={`Тема шага ${index + 1}`}
            value={step.specificInput ?? ''}
            placeholder="Тема или инструкция"
            disabled={disabled}
            onChange={(event) => updateStep(index, { specificInput: event.target.value })}
            className="py-2 text-sm"
          />
          <button
            type="button"
            aria-label={`Удалить шаг ${index + 1}`}
            disabled={disabled}
            onClick={() => onChange(steps.filter((_, i) => i !== index))}
            className="flex h-9 w-8 items-center justify-center rounded-lg text-dark-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        icon={<Plus />}
        disabled={disabled}
        onClick={() => onChange([
          ...steps,
          {
            type: 'text',
            count: 1,
            specificInput: 'По теме урока',
            useSummarizedEnabled: false,
          },
        ])}
      >
        Добавить тип шага
      </Button>
    </div>
  );
}

export function LessonPlanEditor({
  lessons,
  disabled,
  onChange,
}: {
  lessons: CourseAgentLessonPlan[];
  disabled: boolean;
  onChange: (lessons: CourseAgentLessonPlan[]) => void;
}) {
  return (
    <div className="space-y-3">
      {lessons.map((lesson, lessonIndex) => (
        <div key={lessonIndex} className="rounded-lg border border-dark-700 bg-dark-900 p-3">
          <Input
            label={`Урок ${lessonIndex + 1}`}
            value={lesson.title}
            disabled={disabled}
            onChange={(event) => onChange(lessons.map((item, index) => (
              index === lessonIndex ? { ...item, title: event.target.value } : item
            )))}
            className="py-2 text-sm"
          />
          <div className="mt-3">
            <StepPlanEditor
              steps={lesson.steps ?? []}
              disabled={disabled}
              onChange={(steps) => onChange(lessons.map((item, index) => (
                index === lessonIndex ? { ...item, steps } : item
              )))}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
