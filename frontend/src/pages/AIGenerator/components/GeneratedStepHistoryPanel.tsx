import { useCallback, useEffect, useState } from 'react';
import {
  Clock,
  History,
  Eye,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Modal, Badge } from '../../../components/ui';
import { agentApi } from '../../../api';
import type { GeneratedStepHistory } from '../../../types';
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

function getEntryTimestamp(entry: GeneratedStepHistory): number {
  if (entry.createdAt) {
    return new Date(entry.createdAt).getTime();
  }
  return Date.now();
}

function formatRelativeTime(entry: GeneratedStepHistory): string {
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

function stripHtml(text?: string | null): string {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getPreviewText(entry: GeneratedStepHistory): string {
  const fromPrompt = entry.userPrompt?.trim();
  if (fromPrompt) return fromPrompt;

  const fromStep = stripHtml(entry.generatedStep?.text);
  if (fromStep) return fromStep;

  return entry.content?.trim() || 'Сгенерированный шаг';
}

interface GeneratedStepHistoryCardProps {
  entry: GeneratedStepHistory;
  onOpen: (entry: GeneratedStepHistory) => void;
}

function GeneratedStepHistoryCard({ entry, onOpen }: GeneratedStepHistoryCardProps) {
  const previewText = getPreviewText(entry);
  const stepPreview = stripHtml(entry.generatedStep?.text);

  return (
    <div className="group relative rounded-xl border border-dark-700/80 bg-dark-800/60 hover:bg-dark-800 hover:border-primary-600/30 transition-all duration-200">
      <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-gradient-to-b from-primary-500/60 to-primary-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-4 pl-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 text-xs text-dark-500 min-w-0 flex-wrap">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{formatRelativeTime(entry)}</span>
            <span className="text-dark-600">·</span>
            <span className="inline-flex items-center gap-1 text-dark-400">
              <span>{STEP_TYPE_EMOJI[entry.stepType] || '•'}</span>
              <span>{getStepTypeLabel(entry.stepType)}</span>
            </span>
          </div>
        </div>

        <p className="text-sm text-dark-200 mb-2 line-clamp-2 text-left">{previewText}</p>

        {stepPreview && stepPreview !== previewText && (
          <p className="text-xs text-dark-500 mb-3 line-clamp-2 text-left">{stepPreview}</p>
        )}

        <Button
          variant="primary"
          size="sm"
          onClick={() => onOpen(entry)}
          className="h-8 px-2.5"
        >
          <Eye className="w-3.5 h-3.5 mr-1.5" />
          Открыть шаг
        </Button>
      </div>
    </div>
  );
}

interface GeneratedStepHistoryPanelProps {
  refreshTrigger?: number;
  onOpen: (entry: GeneratedStepHistory) => void;
}

export function GeneratedStepHistoryPanel({
  refreshTrigger = 0,
  onOpen,
}: GeneratedStepHistoryPanelProps) {
  const [history, setHistory] = useState<GeneratedStepHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const entries = await agentApi.getGeneratedStepsHistory();
      setHistory(entries);
    } catch {
      toast.error('Не удалось загрузить историю сгенерированных шагов');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory, refreshTrigger]);

  const handleOpen = (entry: GeneratedStepHistory) => {
    onOpen(entry);
    setIsModalOpen(false);
  };

  if (isLoading && history.length === 0) {
    return (
      <button
        type="button"
        disabled
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-800/60 border border-dark-700/60 text-left opacity-70"
      >
        <History className="w-4 h-4 text-primary-400 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm text-dark-200 whitespace-nowrap">История шагов</p>
          <p className="text-xs text-dark-500 whitespace-nowrap">Загрузка...</p>
        </div>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-800/60 border border-dark-700/60 hover:border-primary-600/30 hover:bg-dark-800 transition-colors text-left"
      >
        <History className="w-4 h-4 text-primary-400 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm text-dark-200 whitespace-nowrap">История шагов</p>
          <p className="text-xs text-dark-500 whitespace-nowrap">
            {history.length > 0
              ? `${history.length} ${history.length === 1 ? 'шаг' : history.length < 5 ? 'шага' : 'шагов'}`
              : 'Пока пусто'}
          </p>
        </div>
        {history.length > 0 && <Badge variant="info">{history.length}</Badge>}
        <ChevronRight className="w-4 h-4 text-dark-500" />
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="История сгенерированных шагов"
        subtitle={history.length > 0 ? `${history.length} сохранённых шагов` : 'Пока нет сохранённых шагов'}
        icon={<History className="w-5 h-5 text-primary-400" />}
        size="lg"
        footer={
          <div className="flex justify-end w-full">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Закрыть
            </Button>
          </div>
        }
      >
        {history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-dark-700 bg-dark-800/30 px-4 py-8 text-center">
            <History className="w-8 h-8 text-dark-600 mx-auto mb-2" />
            <p className="text-sm text-dark-500">Пока нет сгенерированных шагов</p>
            <p className="text-xs text-dark-600 mt-1">
              После генерации шаги появятся здесь и будут доступны в любом браузере
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {history.map((entry) => (
              <GeneratedStepHistoryCard key={entry.id} entry={entry} onOpen={handleOpen} />
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
