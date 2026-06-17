import { useCallback, useEffect, useState } from 'react';
import {
  Clock,
  History,
  RotateCcw,
  Play,
  Trash2,
  ChevronRight,
  Layers,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Modal, Badge, Spinner } from '../../../components/ui';
import { agentApi } from '../../../api';
import type { BatchGenerationHistory, CountStepDTO } from '../../../types';
import { countTotalBatchSteps } from '../../../utils/batchSteps';
import { getStepTypeLabel } from '../../../constants/stepTypeLabels';

const STEP_TYPE_EMOJI: Record<string, string> = {
  text: '📝',
  choice: '✅',
  matching: '🔗',
  sorting: '📊',
  'fill-blanks': '✏️',
  string: '🔤',
  number: '🔢',
  'free-answer': '💬',
  math: '∑',
  'random-tasks': '🎲',
  table: '📋',
  code: '💻',
};

function getEntryTimestamp(entry: BatchGenerationHistory): number {
  if (entry.createdAt) {
    return new Date(entry.createdAt).getTime();
  }
  return Date.now();
}

function formatRelativeTime(entry: BatchGenerationHistory): string {
  const diff = Date.now() - getEntryTimestamp(entry);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин. назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч. назад`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} дн. назад`;
  return new Date(getEntryTimestamp(entry)).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: days > 365 ? 'numeric' : undefined,
  });
}

function getStatusBadge(status?: string) {
  switch (status) {
    case 'COMPLETED':
      return <Badge variant="success">Готово</Badge>;
    case 'FAILED':
      return <Badge variant="danger">Ошибка</Badge>;
    case 'RUNNING':
      return <Badge variant="warning">В процессе</Badge>;
    default:
      return null;
  }
}

function aggregateStepTypes(steps: CountStepDTO[]): Array<{ type: string; count: number }> {
  const map = new Map<string, number>();
  for (const step of steps) {
    map.set(step.type, (map.get(step.type) || 0) + (step.count || 1));
  }
  return Array.from(map.entries()).map(([type, count]) => ({ type, count }));
}

interface BatchHistoryEntryCardProps {
  entry: BatchGenerationHistory;
  compact?: boolean;
  onRestore: (entry: BatchGenerationHistory) => void;
  onRerun: (entry: BatchGenerationHistory) => void;
  onRemove: (id: number) => void;
}

function BatchHistoryEntryCard({
  entry,
  compact,
  onRestore,
  onRerun,
  onRemove,
}: BatchHistoryEntryCardProps) {
  const totalSteps = countTotalBatchSteps(entry.plan.steps);
  const typeSummary = aggregateStepTypes(entry.plan.steps);
  const previewText = entry.userInput.trim();

  return (
    <div className="group relative rounded-xl border border-dark-700/80 bg-dark-800/60 hover:bg-dark-800 hover:border-primary-600/30 transition-all duration-200">
      <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-gradient-to-b from-primary-500/60 to-primary-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className={`${compact ? 'p-3' : 'p-4'} pl-4`}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 text-xs text-dark-500 min-w-0 flex-wrap">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{formatRelativeTime(entry)}</span>
            {getStatusBadge(entry.status)}
            <span className="text-dark-600">·</span>
            <span className="flex items-center gap-1 text-dark-400">
              <Layers className="w-3.5 h-3.5" />
              {totalSteps} {totalSteps === 1 ? 'шаг' : totalSteps < 5 ? 'шага' : 'шагов'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onRemove(entry.id)}
            className="p-1 rounded-md text-dark-600 hover:text-red-400 hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
            title="Удалить из истории"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {previewText && (
          <p className={`text-sm text-dark-200 mb-3 ${compact ? 'line-clamp-2' : 'line-clamp-3'} text-left`}>
            {previewText}
          </p>
        )}

        {entry.status === 'FAILED' && entry.errorMessage && (
          <p className="text-xs text-red-400 mb-3 line-clamp-2">{entry.errorMessage}</p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          {typeSummary.map(({ type, count }) => (
            <span
              key={type}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-dark-900/80 border border-dark-700/60 text-xs text-dark-300"
            >
              <span>{STEP_TYPE_EMOJI[type] || '•'}</span>
              <span className="truncate max-w-[120px]">{getStepTypeLabel(type)}</span>
              {count > 1 && (
                <span className="text-primary-400 font-medium">×{count}</span>
              )}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRestore(entry)}
            className="text-dark-400 hover:text-dark-200 h-8 px-2.5"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            В форму
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onRerun(entry)}
            className="h-8 px-2.5"
          >
            <Play className="w-3.5 h-3.5 mr-1.5" />
            Повторить
          </Button>
        </div>
      </div>
    </div>
  );
}

interface BatchHistoryPanelProps {
  variant?: 'inline' | 'compact';
  maxPreview?: number;
  refreshTrigger?: number;
  onRestore: (entry: BatchGenerationHistory) => void;
  onRerun: (entry: BatchGenerationHistory) => void;
}

export function BatchHistoryPanel({
  variant = 'inline',
  maxPreview = 3,
  refreshTrigger = 0,
  onRestore,
  onRerun,
}: BatchHistoryPanelProps) {
  const [batchHistory, setBatchHistory] = useState<BatchGenerationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const history = await agentApi.getBatchHistory();
      setBatchHistory(history);
    } catch {
      toast.error('Не удалось загрузить историю batch-генераций');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory, refreshTrigger]);

  const handleRemove = async (id: number) => {
    try {
      await agentApi.deleteBatchHistory(id);
      setBatchHistory((prev) => prev.filter((entry) => entry.id !== id));
      toast.success('Запись удалена');
    } catch {
      toast.error('Не удалось удалить запись');
    }
  };

  const handleClearAll = async () => {
    if (batchHistory.length === 0) return;
    try {
      await Promise.all(batchHistory.map((entry) => agentApi.deleteBatchHistory(entry.id)));
      setBatchHistory([]);
      toast.success('История очищена');
      setIsModalOpen(false);
    } catch {
      toast.error('Не удалось очистить историю');
      void loadHistory();
    }
  };

  if (isLoading && batchHistory.length === 0) {
    if (variant === 'compact') return null;
    return (
      <div className="mt-8 w-full max-w-lg flex justify-center py-6">
        <Spinner />
      </div>
    );
  }

  if (batchHistory.length === 0) {
    if (variant === 'compact') return null;

    return (
      <div className="mt-8 w-full max-w-lg">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-dark-500" />
          <h4 className="text-sm font-medium text-dark-400">История генераций</h4>
        </div>
        <div className="rounded-xl border border-dashed border-dark-700 bg-dark-800/30 px-4 py-6 text-center">
          <History className="w-8 h-8 text-dark-600 mx-auto mb-2" />
          <p className="text-sm text-dark-500">Пока нет сохранённых batch-запросов</p>
          <p className="text-xs text-dark-600 mt-1">
            После подтверждения плана запросы появятся здесь
          </p>
        </div>
      </div>
    );
  }

  const previewEntries = batchHistory.slice(0, maxPreview);
  const hasMore = batchHistory.length > maxPreview;

  if (variant === 'compact') {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-dark-800/60 border border-dark-700/60 hover:border-primary-600/30 hover:bg-dark-800 transition-colors text-left"
        >
          <History className="w-4 h-4 text-primary-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-dark-200">История</p>
            <p className="text-xs text-dark-500 truncate">
              {batchHistory.length} {batchHistory.length === 1 ? 'запрос' : batchHistory.length < 5 ? 'запроса' : 'запросов'}
            </p>
          </div>
          <Badge variant="info">{batchHistory.length}</Badge>
          <ChevronRight className="w-4 h-4 text-dark-500" />
        </button>

        <BatchHistoryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          entries={batchHistory}
          onRestore={onRestore}
          onRerun={onRerun}
          onRemove={handleRemove}
          onClearAll={handleClearAll}
        />
      </>
    );
  }

  return (
    <div className="mt-8 w-full max-w-lg text-left">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary-400" />
          <h4 className="text-sm font-medium text-dark-300">История генераций</h4>
          <Badge variant="info">{batchHistory.length}</Badge>
        </div>
        {batchHistory.length > 1 && (
          <button
            type="button"
            onClick={() => void handleClearAll()}
            className="text-xs text-dark-500 hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Очистить
          </button>
        )}
      </div>

      <div className="space-y-2">
        {previewEntries.map((entry) => (
          <BatchHistoryEntryCard
            key={entry.id}
            entry={entry}
            compact
            onRestore={onRestore}
            onRerun={onRerun}
            onRemove={handleRemove}
          />
        ))}
      </div>

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="mt-3 w-full text-dark-400 hover:text-dark-200 border border-dashed border-dark-700 hover:border-dark-600"
        >
          Показать всю историю ({batchHistory.length})
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      )}

      <BatchHistoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entries={batchHistory}
        onRestore={onRestore}
        onRerun={onRerun}
        onRemove={handleRemove}
        onClearAll={handleClearAll}
      />
    </div>
  );
}

interface BatchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: BatchGenerationHistory[];
  onRestore: (entry: BatchGenerationHistory) => void;
  onRerun: (entry: BatchGenerationHistory) => void;
  onRemove: (id: number) => void;
  onClearAll: () => void;
}

function BatchHistoryModal({
  isOpen,
  onClose,
  entries,
  onRestore,
  onRerun,
  onRemove,
  onClearAll,
}: BatchHistoryModalProps) {
  const handleRestore = (entry: BatchGenerationHistory) => {
    onRestore(entry);
    onClose();
  };

  const handleRerun = (entry: BatchGenerationHistory) => {
    onRerun(entry);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="История batch-генераций"
      subtitle={`${entries.length} сохранённых запросов`}
      icon={<History className="w-5 h-5 text-primary-400" />}
      size="lg"
      footer={
        entries.length > 0 ? (
          <div className="flex justify-between w-full">
            <Button variant="ghost" onClick={onClearAll} className="text-red-400 hover:text-red-300">
              <Trash2 className="w-4 h-4 mr-2" />
              Очистить всё
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Закрыть
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        {entries.map((entry) => (
          <BatchHistoryEntryCard
            key={entry.id}
            entry={entry}
            onRestore={handleRestore}
            onRerun={handleRerun}
            onRemove={onRemove}
          />
        ))}
      </div>
    </Modal>
  );
}
