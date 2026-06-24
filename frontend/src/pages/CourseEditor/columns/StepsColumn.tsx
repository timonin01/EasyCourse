import { Plus, Trash2, Upload, Loader2, AlertTriangle, CheckCircle, RefreshCw, FileText } from 'lucide-react';
import { Button, Card, SortableList, Badge, Tooltip, EmptyState } from '../../../components/ui';
import { StepikIcon } from '../../../components/StepikIcon';
import { getStepDisplayType } from '../../../types';
import type { Lesson, Step } from '../../../types';
import type { StepDiffInfo } from '../../../utils/stepikCompare';
import { formatStepDiffTooltip } from '../../../utils/stepikCompare';

interface StepsColumnProps {
  steps: Step[];
  selectedLesson: Lesson | null;
  onStepClick: (step: Step) => void;
  onAddClick: () => void;
  onReorder: (items: Step[]) => void;
  isUnsynced: (s: Step) => boolean;
  stepsDiffersFromStepik: Set<number>;
  stepsDiffDetails: Map<number, StepDiffInfo>;
  stepsChecking: Set<number>;
  onShowDiff?: (step: Step) => void;
  onSync: (id: number) => void;
  onCheckStepik: (step: Step) => void;
  onDeleteLocal: (id: number) => void;
  onDeleteFromStepik: (id: number) => void;
  deletingItems: Set<number>;
  syncingItems: Set<number>;
}

export function StepsColumn({
  steps,
  selectedLesson,
  onStepClick,
  onAddClick,
  onReorder,
  isUnsynced,
  stepsDiffersFromStepik,
  stepsDiffDetails,
  stepsChecking,
  onShowDiff,
  onSync,
  onCheckStepik,
  onDeleteLocal,
  onDeleteFromStepik,
  deletingItems,
  syncingItems,
}: StepsColumnProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-dark-200">Шаги</h2>
        <Button size="sm" disabled={!selectedLesson} onClick={onAddClick}><Plus className="w-4 h-4" /></Button>
      </div>
      {selectedLesson && steps.length > 0 ? (
        <SortableList
          items={steps}
          onReorder={onReorder}
          animateItems
          renderItem={(step, index) => {
            const stepUnsynced = isUnsynced(step);
            const stepDiffers = stepsDiffersFromStepik.has(step.id);
            const borderColor = stepDiffers
              ? 'border-l-2 border-l-pink-500'
              : stepUnsynced
                ? 'border-l-2 border-l-orange-500'
                : step.stepikStepId
                  ? 'border-l-2 border-l-green-500'
                  : 'border-l-2 border-l-yellow-500';
            return (
              <Card
                padding="sm"
                className={`cursor-pointer hover:bg-dark-800 transition-colors ${borderColor}`}
                onClick={() => onStepClick(step)}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                    stepUnsynced ? 'bg-dark-700 text-orange-400' : step.stepikStepId ? 'bg-dark-700 text-green-400' : 'bg-dark-700 text-dark-400'
                  }`}>
                    {stepUnsynced ? <AlertTriangle className="w-2.5 h-2.5" /> : step.stepikStepId ? <CheckCircle className="w-2.5 h-2.5" /> : index + 1}
                  </span>
                  <Badge variant={stepUnsynced ? 'warning' : step.stepikStepId ? 'success' : 'info'} className="flex-shrink-0 text-xs px-1.5 py-0.5">{getStepDisplayType(step)}</Badge>
                  <span className="flex-1 text-xs truncate text-dark-400 min-w-0">{step.content?.substring(0, 20) || 'Без контента'}...</span>
                  {stepUnsynced && <span className="text-xs text-orange-400 flex-shrink-0">!</span>}
                  {stepDiffers && (
                    <span
                      role="button"
                      tabIndex={0}
                      className="text-xs text-pink-400 cursor-pointer flex-shrink-0"
                      title={formatStepDiffTooltip(stepsDiffDetails.get(step.id) ?? {})}
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowDiff?.(step);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          onShowDiff?.(step);
                        }
                      }}
                    >
                      ⚠
                    </span>
                  )}
                  {step.stepikStepId && !stepUnsynced && !stepDiffers && (
                    <span className="text-xs text-green-400 flex-shrink-0 hidden sm:inline">#{String(step.stepikStepId).slice(-4)}</span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`p-0.5 flex-shrink-0 ${stepUnsynced ? 'text-orange-400 hover:text-orange-300' : step.stepikStepId ? 'text-green-400 hover:text-green-300' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onSync(step.id); }}
                    disabled={syncingItems.has(step.id) || deletingItems.has(step.id)}
                    title={stepUnsynced ? 'Синхронизировать изменения' : step.stepikStepId ? 'Обновить в Stepik' : 'Синхронизировать'}
                  >
                    {syncingItems.has(step.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  </Button>
                  {step.stepikStepId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0.5 text-primary-400 hover:text-primary-300 flex-shrink-0"
                      onClick={(e) => { e.stopPropagation(); onCheckStepik(step); }}
                      disabled={syncingItems.has(step.id) || deletingItems.has(step.id) || stepsChecking.has(step.id)}
                      title="Проверить соответствие Stepik"
                    >
                      {stepsChecking.has(step.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    </Button>
                  )}
                  <div className="flex gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Tooltip
                      label={step.stepikStepId ? 'Сначала удалите шаг со Stepik' : 'Удалить локально'}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0.5 text-red-400"
                        disabled={deletingItems.has(step.id) || !!step.stepikStepId}
                        onClick={() => onDeleteLocal(step.id)}
                      >
                        {deletingItems.has(step.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      </Button>
                    </Tooltip>
                    {step.stepikStepId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0.5 text-orange-400 hover:text-orange-300"
                        disabled={deletingItems.has(step.id)}
                        onClick={() => onDeleteFromStepik(step.id)}
                        title="Удалить со Stepik"
                      >
                        {deletingItems.has(step.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <StepikIcon className="w-3 h-3" size={12} />}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          }}
        />
      ) : selectedLesson ? (
        <EmptyState
          compact
          icon={Plus}
          title="Нет шагов"
          description="Добавьте первый шаг в урок"
          action={
            <Button size="sm" onClick={onAddClick}>
              <Plus className="w-4 h-4 mr-1" />
              Добавить шаг
            </Button>
          }
        />
      ) : (
        <EmptyState
          compact
          icon={FileText}
          title="Выберите урок"
          description="Сначала выберите урок в средней колонке"
        />
      )}
    </div>
  );
}
