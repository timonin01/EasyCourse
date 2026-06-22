import { FolderOpen } from 'lucide-react';
import { Card } from '../../../components/ui';
import { SubscriptionPanel } from '../../../components/subscription/SubscriptionPanel';
import type { BatchGenerationHistory } from '../../../types';
import type { LessonWithContext } from '../utils/groupLessons';
import { BatchHistoryPanel } from './BatchHistoryPanel';
import { LessonSelect } from './LessonSelect';

interface BatchSettingsSidebarProps {
  groupedLessons: Record<string, LessonWithContext[]>;
  allLessonsCount: number;
  selectedLessonId: number | null;
  batchHistoryRefreshKey: number;
  onLessonChange: (lessonId: number | null) => void;
  onViewBatchSteps: (entry: BatchGenerationHistory) => void;
  onRerunBatchHistory: (entry: BatchGenerationHistory) => void;
}

export function BatchSettingsSidebar({
  groupedLessons,
  allLessonsCount,
  selectedLessonId,
  batchHistoryRefreshKey,
  onLessonChange,
  onViewBatchSteps,
  onRerunBatchHistory,
}: BatchSettingsSidebarProps) {
  return (
    <div className="w-full xl:w-72 2xl:w-80 xl:flex-shrink-0 flex flex-col min-h-0 max-h-[35vh] xl:max-h-none">
      <h2 className="font-semibold text-dark-200 mb-4 flex-shrink-0">Настройки</h2>
      <SubscriptionPanel variant="compact" />
      <div className="mb-4">
        <BatchHistoryPanel
          variant="compact"
          refreshTrigger={batchHistoryRefreshKey}
          onViewSteps={onViewBatchSteps}
          onRerun={onRerunBatchHistory}
        />
      </div>
      <Card className="flex-1 overflow-auto min-h-0">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Сохранить в урок:</label>
            {allLessonsCount === 0 ? (
              <div className="text-center py-4 bg-dark-800 rounded-lg">
                <FolderOpen className="w-8 h-8 text-dark-500 mx-auto mb-2" />
                <p className="text-sm text-dark-400">Нет доступных уроков</p>
              </div>
            ) : (
              <LessonSelect
                groupedLessons={groupedLessons}
                selectedLessonId={selectedLessonId}
                onLessonChange={onLessonChange}
              />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
