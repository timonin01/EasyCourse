import { Sparkles } from 'lucide-react';
import { Card, Spinner } from '../../../components/ui';
import { AI_PROMPT_LIMITS, clampPromptLength } from '../../../constants/aiPromptLimits';
import type { BatchGenerationHistory, CountStepDTO } from '../../../types';
import type { BatchPlanItem } from '../../../utils/batchSteps';
import { BatchGenerator } from './BatchGenerator';
import { BatchResultsPreview } from './BatchResultsPreview';
import { BatchHistoryPanel } from './BatchHistoryPanel';
import { BatchProgressStepper, type BatchStepStatus } from './BatchProgressStepper';
import type { BatchResultItem } from '../types';

interface BatchModePanelProps {
  batchUserInput: string;
  onBatchUserInputChange: (value: string) => void;
  batchExplicitSteps: CountStepDTO[];
  onBatchExplicitStepsChange: (steps: CountStepDTO[]) => void;
  isGeneratingBatch: boolean;
  batchResults: BatchResultItem[];
  batchPlanItems: BatchPlanItem[];
  batchStepStatuses: BatchStepStatus[];
  batchProgressPercent: number;
  isSavingBatch: boolean;
  selectedLessonId: number | null;
  batchHistoryRefreshKey: number;
  onBatchAnalyze: () => void;
  onSaveBatchSteps: (indices: number[]) => void;
  onSaveAllBatchSteps: () => void;
  onEditBatchStep: (index: number) => void;
  onViewBatchSteps: (entry: BatchGenerationHistory) => void;
  onRerunBatchHistory: (entry: BatchGenerationHistory) => void;
}

export function BatchModePanel({
  batchUserInput,
  onBatchUserInputChange,
  batchExplicitSteps,
  onBatchExplicitStepsChange,
  isGeneratingBatch,
  batchResults,
  batchPlanItems,
  batchStepStatuses,
  batchProgressPercent,
  isSavingBatch,
  selectedLessonId,
  batchHistoryRefreshKey,
  onBatchAnalyze,
  onSaveBatchSteps,
  onSaveAllBatchSteps,
  onEditBatchStep,
  onViewBatchSteps,
  onRerunBatchHistory,
}: BatchModePanelProps) {
  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      <div className="space-y-4 pb-4">
        <Card>
          <BatchGenerator
            userInput={batchUserInput}
            onUserInputChange={(value) => onBatchUserInputChange(clampPromptLength(value, AI_PROMPT_LIMITS.batch))}
            explicitSteps={batchExplicitSteps}
            onExplicitStepsChange={onBatchExplicitStepsChange}
            onGenerate={onBatchAnalyze}
            isLoading={isGeneratingBatch}
          />
        </Card>

        {batchResults.length > 0 ? (
          <Card>
            <BatchResultsPreview
              results={batchResults}
              onSaveSelected={onSaveBatchSteps}
              onSaveAll={onSaveAllBatchSteps}
              isSaving={isSavingBatch}
              selectedLessonId={selectedLessonId}
              onEditStep={onEditBatchStep}
            />
          </Card>
        ) : isGeneratingBatch && batchPlanItems.length > 0 ? (
          <Card>
            <BatchProgressStepper
              items={batchPlanItems}
              stepStatuses={batchStepStatuses}
              progressPercent={batchProgressPercent}
            />
          </Card>
        ) : isGeneratingBatch ? (
          <Card>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Spinner size="lg" />
                <p className="text-sm text-dark-400 mt-4">Подготовка batch-генерации...</p>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-primary-600/20 rounded-2xl mb-4">
                <Sparkles className="w-12 h-12 text-primary-400" />
              </div>
              <h3 className="text-lg font-medium text-dark-200 mb-2">Batch генерация шагов</h3>
              <p className="text-dark-400 max-w-md">
                Введите запрос или выберите типы шагов для пакетной генерации.
                Вы можете использовать текстовое описание или явно указать типы и количество.
              </p>
              <BatchHistoryPanel
                refreshTrigger={batchHistoryRefreshKey}
                onViewSteps={onViewBatchSteps}
                onRerun={onRerunBatchHistory}
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
