import {
  Check,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  FileText,
  ListPlus,
  Loader2,
  Pencil,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { CountStepDTO, CoursePlanDTO } from '../../../types';
import { LessonPlanEditor, StepPlanEditor } from './PlanEditor';
import { isDeleteIntent } from '../utils/planIntent';

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

function stepLabel(step: CountStepDTO): string {
  const label = STEP_TYPE_LABELS[step.type?.toLowerCase()] ?? step.type;
  const count = step.count && step.count > 1 ? ` ×${step.count}` : '';
  return `${label}${count}`;
}

function StepChips({ steps }: { steps?: CountStepDTO[] }) {
  if (!steps || steps.length === 0) {
    return <span className="text-xs text-dark-500">без шагов</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {steps.map((step, index) => (
        <span
          key={index}
          className="rounded-md border border-dark-600 bg-dark-800 px-1.5 py-0.5 text-[11px] text-dark-400"
        >
          {stepLabel(step)}
        </span>
      ))}
    </div>
  );
}

function PlanTreePreview({ plan }: { plan: CoursePlanDTO }) {
  if (plan.intent === 'CREATE_SECTION' && plan.section) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-dark-100">{plan.section.title}</div>
        {plan.section.description && (
          <div className="text-xs text-dark-500">{plan.section.description}</div>
        )}
        <div className="space-y-1.5">
          {plan.section.lessons?.map((lesson, index) => (
            <div key={index} className="rounded-lg border border-dark-700/60 bg-dark-850 px-2.5 py-2">
              <div className="mb-1 text-xs text-dark-300">Урок {index + 1}: {lesson.title}</div>
              <StepChips steps={lesson.steps} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (plan.intent === 'CREATE_LESSON') {
    return (
      <div className="space-y-2">
        <div className="text-xs text-dark-500">
          Модуль: {plan.targetSectionTitle ?? '—'}
        </div>
        {plan.lessons?.map((lesson, index) => (
          <div key={index} className="rounded-lg border border-dark-700/60 bg-dark-850 px-2.5 py-2">
            <div className="mb-1 text-xs text-dark-300">{lesson.title}</div>
            <StepChips steps={lesson.steps} />
          </div>
        ))}
      </div>
    );
  }

  if (plan.intent === 'CREATE_STEPS') {
    return (
      <div className="space-y-2">
        <div className="text-xs text-dark-500">
          Урок: {plan.targetLessonTitle ?? '—'}
        </div>
        <div className="rounded-lg border border-dark-700/60 bg-dark-850 px-2.5 py-2">
          <StepChips steps={plan.steps} />
        </div>
      </div>
    );
  }

  if (isDeleteIntent(plan.intent)) {
    return (
      <div className="space-y-2">
        {plan.message && (
          <p className="text-sm text-dark-200">{plan.message}</p>
        )}
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-2.5 py-2 text-xs text-dark-300">
          {plan.intent === 'DELETE_SECTION' && (
            <div>Модуль: {plan.targetSectionTitle ?? '—'}</div>
          )}
          {plan.intent === 'DELETE_LESSON' && (
            <>
              <div>Модуль: {plan.targetSectionTitle ?? '—'}</div>
              <div>Урок: {plan.targetLessonTitle ?? '—'}</div>
            </>
          )}
          {plan.intent === 'DELETE_STEP' && (
            <>
              <div>Модуль: {plan.targetSectionTitle ?? '—'}</div>
              <div>Урок: {plan.targetLessonTitle ?? '—'}</div>
              <div>Шаг: {plan.targetStepTitle ?? '—'}</div>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}

interface PlanPanelProps {
  plan: CoursePlanDTO;
  isExecuting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onChange: (plan: CoursePlanDTO) => void;
}

export function PlanPanel({
  plan,
  isExecuting,
  onConfirm,
  onCancel,
  onChange,
}: PlanPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const isDelete = isDeleteIntent(plan.intent);

  const intentLabel = isDelete
    ? plan.intent === 'DELETE_SECTION'
      ? 'Удаление модуля'
      : plan.intent === 'DELETE_LESSON'
        ? 'Удаление урока'
        : 'Удаление шага'
    : plan.intent === 'CREATE_SECTION'
      ? 'Новый модуль'
      : plan.intent === 'CREATE_LESSON'
        ? 'Новые уроки'
        : 'Новые шаги';

  const IntentIcon = isDelete
    ? Trash2
    : plan.intent === 'CREATE_SECTION'
      ? FolderPlus
      : plan.intent === 'CREATE_LESSON'
        ? FileText
        : ListPlus;

  return (
    <div className={clsx(
      'flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-dark-850',
      isDelete ? 'border-red-500/30' : 'border-primary-500/30',
    )}>
      <button
        type="button"
        onClick={() => setIsExpanded((value) => !value)}
        className="flex w-full shrink-0 items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-dark-100">
          <IntentIcon className={clsx('h-4 w-4', isDelete ? 'text-red-400' : 'text-primary-400')} />
          План: {intentLabel}
        </div>
        {isExpanded
          ? <ChevronDown className="h-4 w-4 text-dark-500" />
          : <ChevronRight className="h-4 w-4 text-dark-500" />}
      </button>

      {isExpanded && (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto border-t border-dark-700/60 px-4 py-3">
            {isEditing && !isDelete ? (
              <div className="space-y-3">
                {plan.intent === 'CREATE_SECTION' && plan.section && (
                  <>
                    <Input
                      label="Название модуля"
                      value={plan.section.title}
                      disabled={isExecuting}
                      onChange={(event) => onChange({
                        ...plan,
                        section: { ...plan.section!, title: event.target.value },
                      })}
                    />
                    <Input
                      label="Описание"
                      value={plan.section.description ?? ''}
                      disabled={isExecuting}
                      onChange={(event) => onChange({
                        ...plan,
                        section: { ...plan.section!, description: event.target.value },
                      })}
                    />
                    <LessonPlanEditor
                      lessons={plan.section.lessons ?? []}
                      disabled={isExecuting}
                      onChange={(lessons) => onChange({
                        ...plan,
                        section: { ...plan.section!, lessons },
                      })}
                    />
                  </>
                )}
                {plan.intent === 'CREATE_LESSON' && (
                  <LessonPlanEditor
                    lessons={plan.lessons ?? []}
                    disabled={isExecuting}
                    onChange={(lessons) => onChange({ ...plan, lessons })}
                  />
                )}
                {plan.intent === 'CREATE_STEPS' && (
                  <StepPlanEditor
                    steps={plan.steps ?? []}
                    disabled={isExecuting}
                    onChange={(steps) => onChange({ ...plan, steps })}
                  />
                )}
              </div>
            ) : (
              <PlanTreePreview plan={plan} />
            )}

            <p className="mt-3 text-xs text-dark-500">
              {isDelete
                ? 'Подтвердите удаление или отмените план. Изменить его через чат нельзя.'
                : isEditing
                  ? 'Измените поля вручную или нажмите «Готово», чтобы вернуться к preview.'
                  : 'Измените план вручную, через чат или нажмите «Вручную».'}
            </p>

            {isExecuting && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-dark-700 bg-dark-900 px-3 py-2.5">
                <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary-400" />
                <div>
                  <div className="text-sm text-dark-200">
                    {isDelete ? 'Удаляю…' : 'Создаю черновик…'}
                  </div>
                  <div className="text-xs text-dark-500">
                    {isDelete ? 'Это займёт несколько секунд' : 'Это может занять несколько минут'}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-dark-700/60 px-4 py-3">
            {!isDelete && (
              <Button
                variant="ghost"
                size="sm"
                disabled={isExecuting}
                onClick={() => setIsEditing((value) => !value)}
              >
                {isEditing ? <Save className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                {isEditing ? 'Готово' : 'Вручную'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isExecuting}
              title="Отменить"
              aria-label="Отменить"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant={isDelete ? 'danger' : 'primary'}
              size="sm"
              onClick={onConfirm}
              disabled={isExecuting}
              isLoading={isExecuting}
              icon={!isExecuting ? <Check className="h-4 w-4" /> : undefined}
            >
              {isExecuting
                ? (isDelete ? 'Удаляю…' : 'Генерирую…')
                : (isDelete ? 'Удалить' : 'Сгенерировать')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
