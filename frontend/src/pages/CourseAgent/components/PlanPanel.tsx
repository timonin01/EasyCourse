import {
  Check,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  FileText,
  ListPlus,
  Pencil,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { CountStepDTO, CoursePlanDTO, PlanActionDTO } from '../../../types';
import { LessonPlanEditor, StepPlanEditor } from './PlanEditor';
import { ExecuteProgress } from './ExecuteProgress';
import { isCreateAction, isCopyAction, isDeleteAction, isDeletePlan, planSummaryLabel } from '../utils/planIntent';

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

function StepChips({ steps, accent = 'neutral' }: { steps?: CountStepDTO[]; accent?: 'neutral' | 'create' }) {
  if (!steps || steps.length === 0) {
    return <span className="text-xs text-dark-500">без шагов</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {steps.map((step, index) => (
        <span
          key={index}
          className={clsx(
            'rounded-md border px-1.5 py-0.5 text-[11px]',
            accent === 'create'
              ? 'border-primary-500/30 bg-primary-500/10 text-primary-300'
              : 'border-dark-600 bg-dark-800 text-dark-400',
          )}
        >
          {stepLabel(step)}
        </span>
      ))}
    </div>
  );
}

function actionBlockTitle(action: PlanActionDTO): string {
  if (action.type === 'CREATE_SECTION') {
    return action.section?.title ? `Модуль «${action.section.title}»` : 'Новый модуль';
  }
  if (action.type === 'CREATE_LESSONS') {
    return `Уроки в модуле «${action.targetSectionTitle ?? '—'}»`;
  }
  if (action.type === 'CREATE_STEPS') {
    const lesson = action.targetLessonTitle ?? '—';
    const section = action.targetSectionTitle;
    return section ? `Шаги: ${section} → ${lesson}` : `Шаги в уроке «${lesson}»`;
  }
  if (action.type === 'COPY_STEP') {
    const lesson = action.targetLessonTitle ?? '—';
    const section = action.targetSectionTitle;
    const step = action.targetStepTitle ?? 'шаг';
    return section
      ? `Копия: ${step} → ${section} / ${lesson}`
      : `Копия: ${step} → «${lesson}»`;
  }
  return 'Действие';
}

function deleteCascadeLabel(action: PlanActionDTO): string | null {
  const lessons = action.cascadeLessonCount ?? 0;
  const steps = action.cascadeStepCount ?? 0;
  if (action.type === 'DELETE_SECTION' && (lessons > 0 || steps > 0)) {
    return `Каскадно: ${lessons} урок., ${steps} шаг.`;
  }
  if (action.type === 'DELETE_LESSON' && steps > 0) {
    return `Каскадно: ${steps} шаг.`;
  }
  return null;
}

function DeleteActionPreview({ action }: { action: PlanActionDTO }) {
  const cascade = deleteCascadeLabel(action);
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-2.5 py-2 text-xs text-dark-300">
      {action.type === 'DELETE_SECTION' && (
        <div>Модуль: {action.targetSectionTitle ?? '—'}</div>
      )}
      {action.type === 'DELETE_LESSON' && (
        <>
          <div>Модуль: {action.targetSectionTitle ?? '—'}</div>
          <div>Урок: {action.targetLessonTitle ?? '—'}</div>
        </>
      )}
      {action.type === 'DELETE_STEP' && (
        <>
          <div>Модуль: {action.targetSectionTitle ?? '—'}</div>
          <div>Урок: {action.targetLessonTitle ?? '—'}</div>
          <div>Шаг: {action.targetStepTitle ?? '—'}</div>
        </>
      )}
      {cascade && (
        <div className="mt-1 text-amber-400/90">{cascade}</div>
      )}
      {action.deleteFromStepik && (
        <div className="mt-1 text-red-300">Также будет удалено на Stepik</div>
      )}
      {!action.deleteFromStepik && (
        <div className="mt-1 text-dark-500">Только локально (не опубликовано на Stepik)</div>
      )}
    </div>
  );
}

function DeletePlanWarning({ actions }: { actions: PlanActionDTO[] }) {
  const deleteActions = actions.filter(isDeleteAction);
  if (deleteActions.length === 0) return null;

  const stepikCount = deleteActions.filter((a) => a.deleteFromStepik).length;
  const totalLessons = deleteActions.reduce((sum, a) => sum + (a.cascadeLessonCount ?? 0), 0);
  const totalSteps = deleteActions.reduce((sum, a) => sum + (a.cascadeStepCount ?? 0), 0);

  return (
    <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-xs text-red-200">
      <div className="font-medium text-red-300">Безвозвратное удаление</div>
      <p className="mt-1 text-dark-300">
        Выбранные элементы будут удалены из EasyCourse
        {stepikCount > 0 ? ' и с платформы Stepik' : ''}.
        Вложенные уроки и шаги удаляются автоматически (каскад).
      </p>
      {(totalLessons > 0 || totalSteps > 0) && (
        <p className="mt-1 text-amber-300/90">
          Итого затронуто: {totalLessons > 0 ? `${totalLessons} урок.` : ''}
          {totalLessons > 0 && totalSteps > 0 ? ', ' : ''}
          {totalSteps > 0 ? `${totalSteps} шаг.` : ''}
        </p>
      )}
    </div>
  );
}

function CreateEntityCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-primary-500/30 bg-primary-500/5 px-2.5 py-2 text-xs text-dark-300">
      {children}
    </div>
  );
}

function ActionPreview({ action }: { action: PlanActionDTO }) {
  if (isDeleteAction(action)) {
    return <DeleteActionPreview action={action} />;
  }

  if (action.type === 'CREATE_SECTION' && action.section) {
    return (
      <CreateEntityCard>
        <div className="text-sm font-medium text-primary-200">{action.section.title}</div>
        {action.section.description && (
          <div className="mt-1 text-xs text-dark-500">{action.section.description}</div>
        )}
        <div className="mt-2 space-y-1.5">
          {action.section.lessons?.map((lesson, index) => (
            <div key={index} className="rounded-lg border border-primary-500/20 bg-primary-500/5 px-2.5 py-2">
              <div className="mb-1 text-xs text-primary-300">Урок {index + 1}: {lesson.title}</div>
              <StepChips steps={lesson.steps} accent="create" />
            </div>
          ))}
        </div>
      </CreateEntityCard>
    );
  }

  if (action.type === 'CREATE_LESSONS') {
    return (
      <div className="space-y-2">
        <div className="text-xs text-dark-500">
          Модуль: {action.targetSectionTitle ?? '—'}
        </div>
        {action.lessons?.map((lesson, index) => (
          <CreateEntityCard key={index}>
            <div className="mb-1 text-xs text-primary-300">{lesson.title}</div>
            <StepChips steps={lesson.steps} accent="create" />
          </CreateEntityCard>
        ))}
      </div>
    );
  }

  if (action.type === 'CREATE_STEPS') {
    return (
      <div className="space-y-2">
        <div className="text-xs text-dark-500">
          {action.targetSectionTitle ? `${action.targetSectionTitle} → ` : ''}
          {action.targetLessonTitle ?? '—'}
        </div>
        <CreateEntityCard>
          <StepChips steps={action.steps} accent="create" />
        </CreateEntityCard>
      </div>
    );
  }

  if (action.type === 'COPY_STEP') {
    return (
      <CreateEntityCard>
        <div className="text-sm font-medium text-primary-200">
          {action.targetStepTitle ?? 'Шаг'}
        </div>
        <div className="mt-1 text-xs text-dark-400">
          → {action.targetSectionTitle ? `${action.targetSectionTitle} / ` : ''}
          {action.targetLessonTitle ?? '—'}
        </div>
        <div className="mt-1 text-xs text-dark-500">
          Точная копия содержимого. Исходный шаг останется на месте. На Stepik не публикуется автоматически.
        </div>
      </CreateEntityCard>
    );
  }

  return null;
}

function ActionPlanEditor({
  action,
  disabled,
  onChange,
}: {
  action: PlanActionDTO;
  disabled: boolean;
  onChange: (action: PlanActionDTO) => void;
}) {
  if (action.type === 'CREATE_SECTION' && action.section) {
    return (
      <div className="space-y-3">
        <Input
          label="Название модуля"
          value={action.section.title}
          disabled={disabled}
          onChange={(event) => onChange({
            ...action,
            section: { ...action.section!, title: event.target.value },
          })}
        />
        <Input
          label="Описание"
          value={action.section.description ?? ''}
          disabled={disabled}
          onChange={(event) => onChange({
            ...action,
            section: { ...action.section!, description: event.target.value },
          })}
        />
        <LessonPlanEditor
          lessons={action.section.lessons ?? []}
          disabled={disabled}
          onChange={(lessons) => onChange({
            ...action,
            section: { ...action.section!, lessons },
          })}
        />
      </div>
    );
  }

  if (action.type === 'CREATE_LESSONS') {
    return (
      <LessonPlanEditor
        lessons={action.lessons ?? []}
        disabled={disabled}
        onChange={(lessons) => onChange({ ...action, lessons })}
      />
    );
  }

  if (action.type === 'CREATE_STEPS') {
    return (
      <StepPlanEditor
        steps={action.steps ?? []}
        disabled={disabled}
        onChange={(steps) => onChange({ ...action, steps })}
      />
    );
  }

  return null;
}

function PlanTreePreview({ plan }: { plan: CoursePlanDTO }) {
  return (
    <div className="space-y-3">
      {plan.message && <p className="text-sm text-dark-200">{plan.message}</p>}
      {plan.actions?.map((action, index) => (
        <div key={index}>
          <ActionPreview action={action} />
        </div>
      ))}
    </div>
  );
}

function PlanManualEditor({
  plan,
  isExecuting,
  onChange,
}: {
  plan: CoursePlanDTO;
  isExecuting: boolean;
  onChange: (plan: CoursePlanDTO) => void;
}) {
  const actions = plan.actions ?? [];

  const updateAction = (index: number, updated: PlanActionDTO) => {
    onChange({
      ...plan,
      actions: actions.map((action, actionIndex) => (actionIndex === index ? updated : action)),
    });
  };

  const removeAction = (index: number) => {
    const nextActions = actions.filter((_, actionIndex) => actionIndex !== index);
    onChange({ ...plan, actions: nextActions });
  };

  return (
    <div className="space-y-4">
      <Input
        label="Описание плана"
        value={plan.message ?? ''}
        disabled={isExecuting}
        onChange={(event) => onChange({ ...plan, message: event.target.value })}
        className="py-2 text-sm"
      />
      {actions.map((action, index) => (
        <div
          key={`${action.type}-${index}`}
          className={clsx(
            'rounded-lg border p-3',
            isCreateAction(action) || isCopyAction(action)
              ? 'border-primary-500/30 bg-primary-500/5'
              : isDeleteAction(action)
                ? 'border-red-500/30 bg-red-500/5'
                : 'border-dark-700/60 bg-dark-900/50',
          )}
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="text-xs font-medium uppercase tracking-wide text-dark-500">
              {actionBlockTitle(action)}
            </div>
            {isCreateAction(action) && actions.filter(isCreateAction).length > 1 && (
              <button
                type="button"
                aria-label="Удалить блок из плана"
                disabled={isExecuting}
                onClick={() => removeAction(index)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-dark-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {isCreateAction(action) ? (
            <ActionPlanEditor
              action={action}
              disabled={isExecuting}
              onChange={(updated) => updateAction(index, updated)}
            />
          ) : (
            <ActionPreview action={action} />
          )}
        </div>
      ))}
    </div>
  );
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

  const isDelete = isDeletePlan(plan);
  const canManualEdit = !isDelete && (plan.actions?.some(isCreateAction) ?? false);
  const intentLabel = planSummaryLabel(plan);

  const IntentIcon = isDelete
    ? Trash2
    : plan.actions?.some((action) => action.type === 'CREATE_SECTION')
      ? FolderPlus
      : plan.actions?.some((action) => action.type === 'CREATE_LESSONS')
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
            {isDelete && <DeletePlanWarning actions={plan.actions ?? []} />}
            {isEditing && canManualEdit ? (
              <PlanManualEditor plan={plan} isExecuting={isExecuting} onChange={onChange} />
            ) : (
              <PlanTreePreview plan={plan} />
            )}

            <p className="mt-3 text-xs text-dark-500">
              {isDelete
                ? 'Подтвердите удаление или отмените план. Изменить его через чат нельзя. Удаление необратимо.'
                : isEditing
                  ? 'Измените поля вручную или нажмите «Готово», чтобы вернуться к preview.'
                  : canManualEdit
                    ? 'Измените план вручную, через чат или подтвердите выполнение.'
                    : 'Измените план через чат или подтвердите выполнение.'}
            </p>

            {isExecuting && (
              <ExecuteProgress plan={plan} isDelete={isDelete} />
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-dark-700/60 px-4 py-3">
            {canManualEdit && (
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
              disabled={isExecuting || (canManualEdit && (plan.actions?.length ?? 0) === 0)}
              isLoading={isExecuting}
              icon={!isExecuting ? <Check className="h-4 w-4" /> : undefined}
            >
              {isExecuting
                ? (isDelete ? 'Удаляю…' : 'Генерирую…')
                : (isDelete ? 'Удалить навсегда' : 'Сгенерировать')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
