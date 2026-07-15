import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  FileText,
  ListTree,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../../../components/ui/Button';
import { getStepTypeLabel } from '../../../constants/stepTypeLabels';
import type { CourseTreeHighlight, CourseTreeSectionNode, CourseTreeSelection } from '../types';

interface CourseTreePanelProps {
  sections: CourseTreeSectionNode[];
  isLoading: boolean;
  expandedSections: Set<number>;
  expandedLessons: Set<number>;
  highlight: CourseTreeHighlight;
  selection: CourseTreeSelection | null;
  busyIds?: Set<number>;
  canCreate?: boolean;
  onToggleSection: (sectionId: number) => void;
  onToggleLesson: (lessonId: number, isExpanded: boolean) => void;
  onSelectNode: (selection: CourseTreeSelection) => void;
  onCreateSection: () => void;
  onCreateLesson: (sectionId: number) => void;
  onCreateStep: (lessonId: number) => void;
  onRenameSection: (sectionId: number) => void;
  onRenameLesson: (lessonId: number) => void;
  onDeleteSection: (sectionId: number) => void;
  onDeleteLesson: (lessonId: number) => void;
  onDeleteStep: (stepId: number) => void;
  onRefresh: () => void;
}

function isHighlighted(
  highlight: CourseTreeHighlight,
  type: CourseTreeSelection['type'],
  id: number,
): boolean {
  if (type === 'section') return highlight.sectionIds.has(id);
  if (type === 'lesson') return highlight.lessonIds.has(id);
  return highlight.stepIds.has(id);
}

function RowActions({
  busy,
  onAdd,
  onRename,
  onDelete,
  addLabel,
  renameLabel,
  deleteLabel,
}: {
  busy: boolean;
  onAdd?: () => void;
  onRename?: () => void;
  onDelete: () => void;
  addLabel?: string;
  renameLabel?: string;
  deleteLabel: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 opacity-100 xl:opacity-0 xl:group-hover:opacity-100">
      {onAdd && (
        <button
          type="button"
          title={addLabel}
          aria-label={addLabel}
          disabled={busy}
          onClick={(event) => {
            event.stopPropagation();
            onAdd();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-dark-500 transition-colors hover:bg-primary-500/10 hover:text-primary-300 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
      {onRename && (
        <button
          type="button"
          title={renameLabel}
          aria-label={renameLabel}
          disabled={busy}
          onClick={(event) => {
            event.stopPropagation();
            onRename();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-dark-500 transition-colors hover:bg-dark-700 hover:text-dark-200 disabled:opacity-50"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        type="button"
        title={deleteLabel}
        aria-label={deleteLabel}
        disabled={busy}
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-dark-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

export function CourseTreePanel({
  sections,
  isLoading,
  expandedSections,
  expandedLessons,
  highlight,
  selection,
  busyIds = new Set(),
  canCreate = false,
  onToggleSection,
  onToggleLesson,
  onSelectNode,
  onCreateSection,
  onCreateLesson,
  onCreateStep,
  onRenameSection,
  onRenameLesson,
  onDeleteSection,
  onDeleteLesson,
  onDeleteStep,
  onRefresh,
}: CourseTreePanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-dark-700/60 bg-dark-900">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-dark-700/60 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-dark-200">
          <ListTree className="h-4 w-4 text-dark-400" />
          Структура курса
        </div>
        <div className="flex items-center gap-0.5">
          {canCreate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCreateSection}
              disabled={isLoading}
              title="Добавить модуль"
              aria-label="Добавить модуль"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            title="Обновить структуру"
            aria-label="Обновить структуру"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {isLoading && sections.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-dark-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Загрузка…
          </div>
        ) : sections.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-2 py-8 text-center">
            <p className="text-sm text-dark-500">В курсе пока нет модулей</p>
            {canCreate && (
              <Button variant="secondary" size="sm" onClick={onCreateSection} icon={<Plus className="h-4 w-4" />}>
                Добавить модуль
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {sections.map((sectionNode) => {
              const sectionId = sectionNode.section.id;
              const sectionExpanded = expandedSections.has(sectionId);
              const sectionActive = selection?.type === 'section' && selection.id === sectionId;
              const sectionMarked = isHighlighted(highlight, 'section', sectionId);
              const sectionBusy = busyIds.has(sectionId);

              return (
                <div key={sectionId}>
                  <div
                    className={clsx(
                      'group flex items-center gap-1 rounded-lg pr-1 transition-colors',
                      sectionActive && 'bg-dark-800',
                      sectionMarked && !sectionActive && 'bg-primary-500/10 ring-1 ring-primary-500/30',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleSection(sectionId)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-dark-500 hover:bg-dark-800 hover:text-dark-300"
                      aria-label={sectionExpanded ? 'Свернуть модуль' : 'Развернуть модуль'}
                    >
                      {sectionExpanded
                        ? <ChevronDown className="h-4 w-4" />
                        : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectNode({ type: 'section', id: sectionId })}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-dark-200 hover:bg-dark-800"
                    >
                      <FolderOpen className="h-4 w-4 shrink-0 text-dark-500" />
                      <span className="truncate">{sectionNode.section.title}</span>
                    </button>
                    <RowActions
                      busy={sectionBusy}
                      addLabel="Добавить урок"
                      renameLabel="Переименовать модуль"
                      deleteLabel="Удалить модуль"
                      onAdd={canCreate ? () => onCreateLesson(sectionId) : undefined}
                      onRename={() => onRenameSection(sectionId)}
                      onDelete={() => onDeleteSection(sectionId)}
                    />
                  </div>

                  {sectionExpanded && (
                    <div className="ml-4 space-y-1 border-l border-dark-700/60 pl-2">
                      {sectionNode.lessons.length === 0 ? (
                        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                          <span className="text-xs text-dark-500">Нет уроков</span>
                          {canCreate && (
                            <button
                              type="button"
                              onClick={() => onCreateLesson(sectionId)}
                              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-primary-400 transition-colors hover:bg-primary-500/10"
                            >
                              <Plus className="h-3 w-3" />
                              Урок
                            </button>
                          )}
                        </div>
                      ) : (
                        <>
                          {sectionNode.lessons.map((lessonNode) => {
                            const lessonId = lessonNode.lesson.id;
                            const lessonExpanded = expandedLessons.has(lessonId);
                            const lessonActive = selection?.type === 'lesson' && selection.id === lessonId;
                            const lessonMarked = isHighlighted(highlight, 'lesson', lessonId);
                            const lessonBusy = busyIds.has(lessonId);

                            return (
                              <div key={lessonId}>
                                <div
                                  className={clsx(
                                    'group flex items-center gap-1 rounded-lg pr-1 transition-colors',
                                    lessonActive && 'bg-dark-800',
                                    lessonMarked && !lessonActive && 'bg-primary-500/10 ring-1 ring-primary-500/30',
                                  )}
                                >
                                  <button
                                    type="button"
                                    onClick={() => onToggleLesson(lessonId, lessonExpanded)}
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-dark-500 hover:bg-dark-800 hover:text-dark-300"
                                    aria-label={lessonExpanded ? 'Свернуть урок' : 'Развернуть урок'}
                                  >
                                    {lessonExpanded
                                      ? <ChevronDown className="h-3.5 w-3.5" />
                                      : <ChevronRight className="h-3.5 w-3.5" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onSelectNode({ type: 'lesson', id: lessonId })}
                                    className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-dark-300 hover:bg-dark-800"
                                  >
                                    <FileText className="h-3.5 w-3.5 shrink-0 text-dark-500" />
                                    <span className="truncate">{lessonNode.lesson.title}</span>
                                  </button>
                                  <RowActions
                                    busy={lessonBusy}
                                    addLabel="Добавить шаг"
                                    renameLabel="Переименовать урок"
                                    deleteLabel="Удалить урок"
                                    onAdd={canCreate ? () => onCreateStep(lessonId) : undefined}
                                    onRename={() => onRenameLesson(lessonId)}
                                    onDelete={() => onDeleteLesson(lessonId)}
                                  />
                                </div>

                                {lessonExpanded && (
                                  <div className="ml-4 space-y-0.5 border-l border-dark-700/60 pl-2">
                                    {lessonNode.stepsLoading ? (
                                      <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-dark-500">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Загрузка шагов…
                                      </div>
                                    ) : lessonNode.steps && lessonNode.steps.length > 0 ? (
                                      <>
                                        {lessonNode.steps.map((step) => {
                                          const stepActive = selection?.type === 'step' && selection.id === step.id;
                                          const stepMarked = isHighlighted(highlight, 'step', step.id);
                                          const stepBusy = busyIds.has(step.id);

                                          return (
                                            <div
                                              key={step.id}
                                              className={clsx(
                                                'group flex items-center gap-1 rounded-lg pr-1 transition-colors',
                                                stepActive && 'bg-dark-800',
                                                stepMarked && !stepActive && 'bg-primary-500/10 ring-1 ring-primary-500/30',
                                              )}
                                            >
                                              <button
                                                type="button"
                                                onClick={() => onSelectNode({ type: 'step', id: step.id })}
                                                className={clsx(
                                                  'flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors',
                                                  stepActive
                                                    ? 'text-dark-100'
                                                    : 'text-dark-400 hover:bg-dark-800 hover:text-dark-200',
                                                  stepMarked && !stepActive && 'text-primary-200',
                                                )}
                                              >
                                                <span className="w-5 shrink-0 text-dark-500">{step.position}</span>
                                                <span className="truncate">{getStepTypeLabel(step.type.toLowerCase())}</span>
                                              </button>
                                              <RowActions
                                                busy={stepBusy}
                                                deleteLabel="Удалить шаг"
                                                onDelete={() => onDeleteStep(step.id)}
                                              />
                                            </div>
                                          );
                                        })}
                                        {canCreate && (
                                          <button
                                            type="button"
                                            onClick={() => onCreateStep(lessonId)}
                                            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs text-dark-500 transition-colors hover:bg-dark-800 hover:text-primary-300"
                                          >
                                            <Plus className="h-3.5 w-3.5" />
                                            Добавить шаг
                                          </button>
                                        )}
                                      </>
                                    ) : (
                                      <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                                        <span className="text-xs text-dark-500">Нет шагов</span>
                                        {canCreate && (
                                          <button
                                            type="button"
                                            onClick={() => onCreateStep(lessonId)}
                                            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-primary-400 transition-colors hover:bg-primary-500/10"
                                          >
                                            <Plus className="h-3 w-3" />
                                            Шаг
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {canCreate && (
                            <button
                              type="button"
                              onClick={() => onCreateLesson(sectionId)}
                              className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs text-dark-500 transition-colors hover:bg-dark-800 hover:text-primary-300"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Добавить урок
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
