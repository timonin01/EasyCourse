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
  AlertTriangle,
  GripVertical,
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMemo, useState, type ReactNode } from 'react';
import { Button } from '../../../components/ui/Button';
import { getStepTypeLabel } from '../../../constants/stepTypeLabels';
import type { Lesson, Model, Step } from '../../../types';
import type {
  CourseTreeHighlight,
  CourseTreeLessonNode,
  CourseTreeSectionNode,
  CourseTreeSelection,
} from '../types';
import { parseTreeId, treeId, type TreeDragId } from '../utils/treeDragIds';

interface CourseTreePanelProps {
  sections: CourseTreeSectionNode[];
  isLoading: boolean;
  expandedSections: Set<number>;
  expandedLessons: Set<number>;
  highlight: CourseTreeHighlight;
  selection: CourseTreeSelection | null;
  busyIds?: Set<number>;
  canCreate?: boolean;
  structureLocked?: boolean;
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
  onReorderSections: (ordered: Model[]) => void;
  onReorderLessons: (sectionId: number, ordered: Lesson[]) => void;
  onReorderSteps: (lessonId: number, ordered: Step[]) => void;
  onRequestMoveStep: (sourceStepId: number, targetLessonId: number) => void;
  onRequestMoveLesson: (sourceLessonId: number, targetSectionId: number) => void;
  onRefresh: () => void;
  embedded?: boolean;
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

function TreeSortableRow({
  id,
  disabled,
  children,
}: {
  id: TreeDragId;
  disabled: boolean;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 20 : 'auto' as const,
  };

  return (
    <div ref={setNodeRef} style={style} className="group/sortable flex items-stretch gap-0.5">
      {!disabled && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-0.5 flex h-7 w-4 shrink-0 cursor-grab items-center justify-center rounded text-dark-600 opacity-0 transition-opacity group-hover/sortable:opacity-100 hover:text-dark-300 active:cursor-grabbing"
          aria-label="Перетащить"
          title="Перетащить"
          onClick={(event) => event.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      )}
      {disabled && <div className="w-4 shrink-0" aria-hidden />}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function DropZone({
  id,
  active,
  children,
}: {
  id: TreeDragId;
  active: boolean;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'rounded-lg transition-colors',
        active && isOver && 'bg-primary-500/10 ring-1 ring-primary-500/40',
      )}
    >
      {children}
    </div>
  );
}

function findLessonIdForStep(sections: CourseTreeSectionNode[], stepId: number): number | null {
  for (const sectionNode of sections) {
    for (const lessonNode of sectionNode.lessons) {
      if (lessonNode.steps?.some((step) => step.id === stepId)) {
        return lessonNode.lesson.id;
      }
    }
  }
  return null;
}

function findSectionIdForLesson(sections: CourseTreeSectionNode[], lessonId: number): number | null {
  for (const sectionNode of sections) {
    if (sectionNode.lessons.some((lessonNode) => lessonNode.lesson.id === lessonId)) {
      return sectionNode.section.id;
    }
  }
  return null;
}

function resolveTargetLessonId(
  sections: CourseTreeSectionNode[],
  over: ReturnType<typeof parseTreeId>,
): number | null {
  if (!over) return null;
  if (over.type === 'lesson' || over.type === 'lesson-drop') return over.id;
  if (over.type === 'step') return findLessonIdForStep(sections, over.id);
  return null;
}

function resolveTargetSectionId(
  sections: CourseTreeSectionNode[],
  over: ReturnType<typeof parseTreeId>,
): number | null {
  if (!over) return null;
  if (over.type === 'section' || over.type === 'section-drop') return over.id;
  if (over.type === 'lesson' || over.type === 'lesson-drop') {
    return findSectionIdForLesson(sections, over.id);
  }
  if (over.type === 'step') {
    const lessonId = findLessonIdForStep(sections, over.id);
    return lessonId == null ? null : findSectionIdForLesson(sections, lessonId);
  }
  return null;
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
  structureLocked = false,
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
  onReorderSections,
  onReorderLessons,
  onReorderSteps,
  onRequestMoveStep,
  onRequestMoveLesson,
  onRefresh,
  embedded = false,
}: CourseTreePanelProps) {
  const [activeDragId, setActiveDragId] = useState<TreeDragId | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sectionIds = useMemo(
    () => sections.map((node) => treeId('section', node.section.id)),
    [sections],
  );

  const activeDrag = activeDragId ? parseTreeId(activeDragId) : null;
  const draggingStep = activeDrag?.type === 'step';
  const draggingLesson = activeDrag?.type === 'lesson';

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id) as TreeDragId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    if (structureLocked) return;

    const active = parseTreeId(event.active.id);
    const over = event.over ? parseTreeId(event.over.id) : null;
    if (!active || !over) return;

    if (active.type === 'section' && (over.type === 'section' || over.type === 'section-drop')) {
      const overSectionId = over.type === 'section-drop' ? over.id : over.id;
      const oldIndex = sections.findIndex((node) => node.section.id === active.id);
      const newIndex = sections.findIndex((node) => node.section.id === overSectionId);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
      onReorderSections(arrayMove(sections, oldIndex, newIndex).map((node) => node.section));
      return;
    }

    if (active.type === 'lesson') {
      const sourceSectionId = findSectionIdForLesson(sections, active.id);
      const targetSectionId = resolveTargetSectionId(sections, over);
      if (sourceSectionId == null || targetSectionId == null) return;

      if (sourceSectionId !== targetSectionId) {
        onRequestMoveLesson(active.id, targetSectionId);
        return;
      }

      if (over.type !== 'lesson') return;
      const sectionNode = sections.find((node) => node.section.id === sourceSectionId);
      if (!sectionNode) return;
      const lessons = sectionNode.lessons.map((node) => node.lesson);
      const oldIndex = lessons.findIndex((lesson) => lesson.id === active.id);
      const newIndex = lessons.findIndex((lesson) => lesson.id === over.id);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
      onReorderLessons(sourceSectionId, arrayMove(lessons, oldIndex, newIndex));
      return;
    }

    if (active.type === 'step') {
      const sourceLessonId = findLessonIdForStep(sections, active.id);
      const targetLessonId = resolveTargetLessonId(sections, over);
      if (sourceLessonId == null || targetLessonId == null) return;

      if (sourceLessonId !== targetLessonId) {
        onRequestMoveStep(active.id, targetLessonId);
        return;
      }

      if (over.type !== 'step') return;
      for (const sectionNode of sections) {
        const lessonNode = sectionNode.lessons.find((node) => node.lesson.id === sourceLessonId);
        if (!lessonNode?.steps) continue;
        const oldIndex = lessonNode.steps.findIndex((step) => step.id === active.id);
        const newIndex = lessonNode.steps.findIndex((step) => step.id === over.id);
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
        onReorderSteps(sourceLessonId, arrayMove(lessonNode.steps, oldIndex, newIndex));
        return;
      }
    }
  };

  const overlayLabel = (() => {
    if (!activeDrag) return null;
    if (activeDrag.type === 'section') {
      return sections.find((node) => node.section.id === activeDrag.id)?.section.title ?? 'Модуль';
    }
    if (activeDrag.type === 'lesson') {
      for (const sectionNode of sections) {
        const lesson = sectionNode.lessons.find((node) => node.lesson.id === activeDrag.id)?.lesson;
        if (lesson) return lesson.title;
      }
      return 'Урок';
    }
    if (activeDrag.type === 'step') {
      for (const sectionNode of sections) {
        for (const lessonNode of sectionNode.lessons) {
          const step = lessonNode.steps?.find((item) => item.id === activeDrag.id);
          if (step) return `${step.position}. ${getStepTypeLabel(step.type.toLowerCase())}`;
        }
      }
      return 'Шаг';
    }
    return null;
  })();

  return (
    <div
      className={clsx(
        'flex h-full min-h-0 flex-col bg-dark-900',
        embedded ? 'rounded-none border-0' : 'rounded-xl border border-dark-700/60',
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-dark-700/60 px-4 py-3">
        <div
          className={clsx(
            'flex items-center gap-2 text-sm font-semibold text-dark-200',
            embedded && 'sr-only',
          )}
        >
          <ListTree className="h-4 w-4 text-dark-400" />
          Структура курса
        </div>
        <div className={clsx('flex items-center gap-0.5', embedded && 'ml-auto')}>
          {canCreate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCreateSection}
              disabled={isLoading || structureLocked}
              title={structureLocked ? 'Дождитесь окончания генерации' : 'Добавить модуль'}
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
      {structureLocked && (
        <div className="flex shrink-0 items-start gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200/90">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
          <span>Пока агент генерирует план или шаги, не меняйте структуру курса вручную — кнопки временно отключены.</span>
        </div>
      )}
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
              <Button
                variant="secondary"
                size="sm"
                onClick={onCreateSection}
                disabled={structureLocked}
                icon={<Plus className="h-4 w-4" />}
              >
                Добавить модуль
              </Button>
            )}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveDragId(null)}
          >
            <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {sections.map((sectionNode) => {
                  const sectionId = sectionNode.section.id;
                  const sectionExpanded = expandedSections.has(sectionId);
                  const sectionActive = selection?.type === 'section' && selection.id === sectionId;
                  const sectionMarked = isHighlighted(highlight, 'section', sectionId);
                  const sectionBusy = structureLocked || busyIds.has(sectionId);
                  const lessonIds = sectionNode.lessons.map((node) => treeId('lesson', node.lesson.id));

                  return (
                    <TreeSortableRow
                      key={sectionId}
                      id={treeId('section', sectionId)}
                      disabled={structureLocked}
                    >
                      <DropZone
                        id={treeId('section-drop', sectionId)}
                        active={draggingLesson}
                      >
                        <div>
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
                                      disabled={structureLocked}
                                      className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-primary-400 transition-colors hover:bg-primary-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <Plus className="h-3 w-3" />
                                      Урок
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <SortableContext items={lessonIds} strategy={verticalListSortingStrategy}>
                                  <div className="space-y-1">
                                    {sectionNode.lessons.map((lessonNode: CourseTreeLessonNode) => {
                                      const lessonId = lessonNode.lesson.id;
                                      const lessonExpanded = expandedLessons.has(lessonId);
                                      const lessonActive = selection?.type === 'lesson' && selection.id === lessonId;
                                      const lessonMarked = isHighlighted(highlight, 'lesson', lessonId);
                                      const lessonBusy = structureLocked || busyIds.has(lessonId);
                                      const stepIds = (lessonNode.steps ?? []).map((step) => treeId('step', step.id));

                                      return (
                                        <TreeSortableRow
                                          key={lessonId}
                                          id={treeId('lesson', lessonId)}
                                          disabled={structureLocked}
                                        >
                                          <DropZone
                                            id={treeId('lesson-drop', lessonId)}
                                            active={draggingStep}
                                          >
                                            <div>
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
                                                      <SortableContext items={stepIds} strategy={verticalListSortingStrategy}>
                                                        <div className="space-y-0.5">
                                                          {lessonNode.steps.map((step) => {
                                                            const stepActive = selection?.type === 'step' && selection.id === step.id;
                                                            const stepMarked = isHighlighted(highlight, 'step', step.id);
                                                            const stepBusy = structureLocked || busyIds.has(step.id);

                                                            return (
                                                              <TreeSortableRow
                                                                key={step.id}
                                                                id={treeId('step', step.id)}
                                                                disabled={structureLocked}
                                                              >
                                                                <div
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
                                                              </TreeSortableRow>
                                                            );
                                                          })}
                                                        </div>
                                                      </SortableContext>
                                                      {canCreate && (
                                                        <button
                                                          type="button"
                                                          onClick={() => onCreateStep(lessonId)}
                                                          disabled={structureLocked}
                                                          className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs text-dark-500 transition-colors hover:bg-dark-800 hover:text-primary-300 disabled:cursor-not-allowed disabled:opacity-50"
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
                                                          disabled={structureLocked}
                                                          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-primary-400 transition-colors hover:bg-primary-500/10 disabled:cursor-not-allowed disabled:opacity-50"
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
                                          </DropZone>
                                        </TreeSortableRow>
                                      );
                                    })}
                                  </div>
                                </SortableContext>
                              )}
                              {canCreate && sectionNode.lessons.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => onCreateLesson(sectionId)}
                                  disabled={structureLocked}
                                  className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs text-dark-500 transition-colors hover:bg-dark-800 hover:text-primary-300 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Добавить урок
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </DropZone>
                    </TreeSortableRow>
                  );
                })}
              </div>
            </SortableContext>

            <DragOverlay>
              {overlayLabel ? (
                <div className="rounded-lg border border-primary-500/40 bg-dark-850 px-3 py-2 text-xs text-dark-100 shadow-lg">
                  {overlayLabel}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}
