import { Copy, Save, Sparkles, FolderOpen, RefreshCw, Pencil } from 'lucide-react';
import { clsx } from 'clsx';
import type { CSSProperties } from 'react';
import { Button, Card, Badge, Spinner } from '../../../components/ui';
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
    defaultWidth: 320,
    minWidth: 260,
    maxWidth: 560,
  });

  return (
    <div
      className={clsx(
        'relative flex w-full flex-col min-h-0 max-h-[35vh] xl:max-h-none xl:flex-shrink-0 xl:w-[var(--preview-width)]',
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
      <h2 className="font-semibold text-dark-200 mb-4 flex-shrink-0">Предпросмотр</h2>
      <Card className="flex-1 overflow-auto min-h-0">
        {previewStep ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="success">Шаг сгенерирован</Badge>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={onEdit} title="Редактировать шаг">
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRegenerate}
                  disabled={isLoading || !lastGeneratePrompt}
                  title="Перегенерировать с тем же запросом"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="ghost" size="sm" onClick={onCopy}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <StepView step={previewStep} variant="preview" />

            <div className="pt-4 border-t border-dark-700">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-dark-300">Сохранить в урок:</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefreshLessons}
                  disabled={isLoadingLessons}
                  title="Обновить список уроков"
                >
                  {isLoadingLessons ? <Spinner size="sm" /> : <FolderOpen className="w-4 h-4" />}
                </Button>
              </div>

              {allLessonsCount === 0 ? (
                <div className="text-center py-4 bg-dark-800 rounded-lg mb-3">
                  <FolderOpen className="w-8 h-8 text-dark-500 mx-auto mb-2" />
                  <p className="text-sm text-dark-400">Нет доступных уроков</p>
                  <p className="text-xs text-dark-500 mt-1">Создайте курс, модуль и урок</p>
                </div>
              ) : (
                <LessonSelect
                  groupedLessons={groupedLessons}
                  selectedLessonId={selectedLessonId}
                  onLessonChange={onLessonChange}
                  className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-dark-200 text-sm mb-3"
                />
              )}

              <Button
                className="w-full"
                onClick={onSave}
                disabled={!selectedLessonId || allLessonsCount === 0}
                icon={<Save className="w-4 h-4" />}
              >
                Сохранить шаг
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-dark-600 mx-auto mb-4" />
            <p className="text-dark-500">Сгенерированный контент появится здесь</p>
          </div>
        )}
      </Card>
    </div>
  );
}
