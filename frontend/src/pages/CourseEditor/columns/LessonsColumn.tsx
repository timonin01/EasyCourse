import { useState } from 'react';
import { Plus, Trash2, Upload, Loader2, FileText, CheckCircle, AlertTriangle, Pencil } from 'lucide-react';
import { Button, Card, SortableList, Tooltip, EmptyState } from '../../../components/ui';
import { StepikIcon } from '../../../components/StepikIcon';
import { EditTitleModal } from '../modals/EditTitleModal';
import type { Lesson } from '../../../types';

interface LessonsColumnProps {
  lessons: Lesson[];
  selectedLesson: Lesson | null;
  hasSelectedModel: boolean;
  onSelectLesson: (l: Lesson) => void;
  onAddClick: () => void;
  onReorder: (items: Lesson[]) => void;
  isUnsynced: (l: Lesson) => boolean;
  onSync: (id: number) => void;
  onDeleteLocal: (id: number) => void;
  onDeleteFromStepik: (id: number) => void;
  deletingItems: Set<number>;
  syncingItems: Set<number>;
  onUpdateTitle: (id: number, title: string) => Promise<void> | void;
}

export function LessonsColumn({
  lessons,
  selectedLesson,
  hasSelectedModel,
  onSelectLesson,
  onAddClick,
  onReorder,
  isUnsynced,
  onSync,
  onDeleteLocal,
  onDeleteFromStepik,
  deletingItems,
  syncingItems,
  onUpdateTitle,
}: LessonsColumnProps) {
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const handleEditClick = (lesson: Lesson, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLesson(lesson);
  };

  const handleSaveTitle = async (newTitle: string) => {
    if (editingLesson) {
      await onUpdateTitle(editingLesson.id, newTitle);
      setEditingLesson(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-dark-200">Уроки</h2>
        <Button size="sm" disabled={!hasSelectedModel} onClick={onAddClick}><Plus className="w-4 h-4" /></Button>
      </div>
      {hasSelectedModel && lessons.length > 0 ? (
        <SortableList
          items={lessons}
          onReorder={onReorder}
          animateItems
          renderItem={(lesson) => {
            const lessonUnsynced = isUnsynced(lesson);
            const borderColor = lessonUnsynced
              ? 'border-l-2 border-l-orange-500'
              : lesson.stepikLessonId
                ? 'border-l-2 border-l-green-500'
                : 'border-l-2 border-l-yellow-500';
            return (
              <Card
                hover
                padding="sm"
                className={`${selectedLesson?.id === lesson.id ? 'ring-2 ring-primary-500' : ''} ${borderColor}`}
                onClick={() => onSelectLesson(lesson)}
              >
                <div className="flex items-center gap-2">
                  {lessonUnsynced ? (
                    <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  ) : lesson.stepikLessonId ? (
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="flex-1 text-sm truncate" title={lesson.title}>
                        {lesson.title}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="p-1 text-dark-400 hover:text-dark-200"
                        onClick={(e) => handleEditClick(lesson, e)}
                        title="Редактировать название урока"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  {lessonUnsynced && <span className="text-xs text-orange-400">Не синхр.</span>}
                  {lesson.stepikLessonId && !lessonUnsynced && (
                    <span className="text-xs text-green-400">#{lesson.stepikLessonId}</span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`p-1 ${lessonUnsynced ? 'text-orange-400 hover:text-orange-300' : lesson.stepikLessonId ? 'text-green-400 hover:text-green-300' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onSync(lesson.id); }}
                    disabled={syncingItems.has(lesson.id) || deletingItems.has(lesson.id)}
                    title={lessonUnsynced ? 'Синхронизировать изменения' : lesson.stepikLessonId ? 'Обновить в Stepik' : 'Синхронизировать'}
                  >
                    {syncingItems.has(lesson.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  </Button>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Tooltip
                      label={lesson.stepikLessonId ? 'Сначала удалите урок со Stepik' : 'Удалить локально'}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 text-red-400"
                        disabled={deletingItems.has(lesson.id) || !!lesson.stepikLessonId}
                        onClick={() => onDeleteLocal(lesson.id)}
                      >
                        {deletingItems.has(lesson.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      </Button>
                    </Tooltip>
                    {lesson.stepikLessonId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 text-orange-400 hover:text-orange-300"
                        disabled={deletingItems.has(lesson.id)}
                        onClick={() => onDeleteFromStepik(lesson.id)}
                        title="Удалить со Stepik (каскадно). Рекомендуется удалять в порядке позиций (1→2→3)."
                      >
                        {deletingItems.has(lesson.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <StepikIcon className="w-3 h-3" size={12} />}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          }}
        />
      ) : hasSelectedModel ? (
        <EmptyState
          compact
          icon={FileText}
          title="Нет уроков"
          description="Добавьте урок в выбранный модуль"
          action={
            <Button size="sm" onClick={onAddClick}>
              <Plus className="w-4 h-4 mr-1" />
              Добавить урок
            </Button>
          }
        />
      ) : (
        <EmptyState
          compact
          icon={FileText}
          title="Выберите модуль"
          description="Сначала выберите модуль слева"
        />
      )}

      {/* Модальное окно редактирования названия */}
      {editingLesson && (
        <EditTitleModal
          isOpen={!!editingLesson}
          onClose={() => setEditingLesson(null)}
          currentTitle={editingLesson.title}
          onSave={handleSaveTitle}
          label="урока"
        />
      )}
    </div>
  );
}
