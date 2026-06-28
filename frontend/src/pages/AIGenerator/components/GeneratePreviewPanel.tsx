import { Copy, Save, Sparkles, FolderOpen, RefreshCw, Pencil } from 'lucide-react';
import { clsx } from 'clsx';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Badge, Spinner, EmptyState } from '../../../components/ui';
import { StepView } from '../../../components/StepView';
import type { Step } from '../../../types';
import type { LessonWithContext } from '../utils/groupLessons';
import { LessonSelect } from './LessonSelect';
import { useResizableWidth } from '../../../hooks/useResizableWidth';

interface GeneratePreviewPanelProps {
  previewStep: Step | null;
  isLoading: boolean;
  lastGeneratePrompt: string;
  groupedLessons: Record<string, LessonWithContext[]>;
  allLessonsCount: number;
  selectedLessonId: number | null;
  isLoadingLessons: boolean;
  onEdit: () => void;
  onRegenerate: () => void;
  onCopy: () => void;
  onRefreshLessons: () => void;
  onLessonChange: (lessonId: number | null) => void;
  onSave: () => void;
}

export function GeneratePreviewPanel({
  previewStep,
  isLoading,
  lastGeneratePrompt,
  groupedLessons,
  allLessonsCount,
  selectedLessonId,
  isLoadingLessons,
  onEdit,
  onRegenerate,
  onCopy,
  onRefreshLessons,
  onLessonChange,
  onSave,
}: GeneratePreviewPanelProps) {
  const { width, isResizing, startResize } = useResizableWidth({
    storageKey: 'ai-generator-preview-width',
    defaultWidth: 360,
    minWidth: 280,
    maxWidth: 560,
  });

  return (
    <div
      className={clsx(
        'relative flex h-full min-h-0 flex-1 flex-col xl:flex-none xl:shrink-0 xl:w-[var(--preview-width)]',
        isResizing && 'select-none'
      )}
      style={{ '--preview-width': `${width}px` } as CSSProperties}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Изменить ширину предпросмотра"
        title="Потяните, чтобы изменить ширину"
        onMouseDown={startResize}
        className={clsx(
          'absolute -left-3 top-0 z-10 hidden h-full w-6 cursor-col-resize xl:block',
          'before:absolute before:left-1/2 before:top-0 before:h-full before:w-1 before:-translate-x-1/2 before:rounded-full before:transition-colors',
          isResizing
            ? 'before:bg-primary-400'
            : 'before:bg-transparent hover:before:bg-dark-600'
        )}
      />
      <h2 className="mb-3 shrink-0 font-semibold text-dark-200">Предпросмотр</h2>
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden" padding="none">
        {previewStep ? (
          <>
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-dark-700/60 px-4 py-3">
              <Badge variant="success">Шаг сгенерирован</Badge>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={onEdit} title="Редактировать шаг">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRegenerate}
                  disabled={isLoading || !lastGeneratePrompt}
                  title="Перегенерировать с тем же запросом"
                >
                  <RefreshCw className={clsx('h-4 w-4', isLoading && 'animate-spin')} />
                </Button>
                <Button variant="ghost" size="sm" onClick={onCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4">
              <StepView step={previewStep} variant="preview" />
            </div>

            <div className="shrink-0 border-t border-dark-700/60 p-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-dark-300">Сохранить в урок:</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefreshLessons}
                  disabled={isLoadingLessons}
                  title="Обновить список уроков"
                >
                  {isLoadingLessons ? <Spinner size="sm" /> : <FolderOpen className="h-4 w-4" />}
                </Button>
              </div>

              {allLessonsCount === 0 ? (
                <EmptyState
                  compact
                  icon={FolderOpen}
                  title="Нет доступных уроков"
                  description="Создайте курс, модуль и урок"
                  action={
                    <Link to="/courses">
                      <Button variant="secondary" size="sm">
                        Перейти к курсам
                      </Button>
                    </Link>
                  }
                  className="mb-3 rounded-lg bg-dark-800"
                />
              ) : (
                <LessonSelect
                  groupedLessons={groupedLessons}
                  selectedLessonId={selectedLessonId}
                  onLessonChange={onLessonChange}
                  className="mb-3 w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-sm text-dark-200"
                />
              )}

              <Button
                className="w-full"
                onClick={onSave}
                disabled={!selectedLessonId || allLessonsCount === 0}
                icon={<Save className="h-4 w-4" />}
              >
                Сохранить шаг
              </Button>
            </div>
          </>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <EmptyState
              compact
              icon={Sparkles}
              title="Сгенерированный контент появится здесь"
              description="Опишите шаг в чате и нажмите отправить"
              className="flex-1 justify-center"
            />
          </div>
        )}
      </Card>
    </div>
  );
}
