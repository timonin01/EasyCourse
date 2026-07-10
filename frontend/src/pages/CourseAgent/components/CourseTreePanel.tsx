import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  FileText,
  ListTree,
  Loader2,
  RefreshCw,
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
  onToggleSection: (sectionId: number) => void;
  onToggleLesson: (lessonId: number, isExpanded: boolean) => void;
  onSelectNode: (selection: CourseTreeSelection) => void;
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

export function CourseTreePanel({
  sections,
  isLoading,
  expandedSections,
  expandedLessons,
  highlight,
  selection,
  onToggleSection,
  onToggleLesson,
  onSelectNode,
  onRefresh,
}: CourseTreePanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-dark-700/60 bg-dark-900">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-dark-700/60 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-dark-200">
          <ListTree className="h-4 w-4 text-dark-400" />
          Структура курса
        </div>
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

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {isLoading && sections.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-dark-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Загрузка…
          </div>
        ) : sections.length === 0 ? (
          <div className="px-2 py-8 text-center text-sm text-dark-500">
            В курсе пока нет модулей
          </div>
        ) : (
          <div className="space-y-1">
            {sections.map((sectionNode) => {
              const sectionId = sectionNode.section.id;
              const sectionExpanded = expandedSections.has(sectionId);
              const sectionActive = selection?.type === 'section' && selection.id === sectionId;
              const sectionMarked = isHighlighted(highlight, 'section', sectionId);

              return (
                <div key={sectionId}>
                  <div
                    className={clsx(
                      'flex items-center gap-1 rounded-lg pr-1 transition-colors',
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
                  </div>

                  {sectionExpanded && (
                    <div className="ml-4 space-y-1 border-l border-dark-700/60 pl-2">
                      {sectionNode.lessons.length === 0 ? (
                        <div className="px-2 py-1.5 text-xs text-dark-500">Нет уроков</div>
                      ) : (
                        sectionNode.lessons.map((lessonNode) => {
                          const lessonId = lessonNode.lesson.id;
                          const lessonExpanded = expandedLessons.has(lessonId);
                          const lessonActive = selection?.type === 'lesson' && selection.id === lessonId;
                          const lessonMarked = isHighlighted(highlight, 'lesson', lessonId);

                          return (
                            <div key={lessonId}>
                              <div
                                className={clsx(
                                  'flex items-center gap-1 rounded-lg pr-1 transition-colors',
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
                              </div>

                              {lessonExpanded && (
                                <div className="ml-4 space-y-0.5 border-l border-dark-700/60 pl-2">
                                  {lessonNode.stepsLoading ? (
                                    <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-dark-500">
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      Загрузка шагов…
                                    </div>
                                  ) : lessonNode.steps && lessonNode.steps.length > 0 ? (
                                    lessonNode.steps.map((step) => {
                                      const stepActive = selection?.type === 'step' && selection.id === step.id;
                                      const stepMarked = isHighlighted(highlight, 'step', step.id);

                                      return (
                                        <button
                                          key={step.id}
                                          type="button"
                                          onClick={() => onSelectNode({ type: 'step', id: step.id })}
                                          className={clsx(
                                            'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors',
                                            stepActive
                                              ? 'bg-dark-800 text-dark-100'
                                              : 'text-dark-400 hover:bg-dark-800 hover:text-dark-200',
                                            stepMarked && !stepActive && 'bg-primary-500/10 text-primary-200 ring-1 ring-primary-500/30',
                                          )}
                                        >
                                          <span className="w-5 shrink-0 text-dark-500">{step.position}</span>
                                          <span className="truncate">{getStepTypeLabel(step.type.toLowerCase())}</span>
                                        </button>
                                      );
                                    })
                                  ) : (
                                    <div className="px-2 py-1.5 text-xs text-dark-500">Нет шагов</div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
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
