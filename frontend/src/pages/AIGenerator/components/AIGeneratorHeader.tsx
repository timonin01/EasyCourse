import { Sparkles, Trash2 } from 'lucide-react';
import { Button, PageHeader } from '../../../components/ui';
import { MODE_SUBTITLES } from '../constants';
import type { AIGeneratorMode } from '../types';
import { GeneratedStepHistoryPanel } from './GeneratedStepHistoryPanel';
import type { GeneratedStepHistory } from '../../../types';

interface AIGeneratorHeaderProps {
  mode: AIGeneratorMode;
  generatedStepHistoryRefreshKey: number;
  onClear: () => void;
  onOpenGeneratedStepFromHistory: (entry: GeneratedStepHistory) => void;
}

export function AIGeneratorHeader({
  mode,
  generatedStepHistoryRefreshKey,
  onClear,
  onOpenGeneratedStepFromHistory,
}: AIGeneratorHeaderProps) {
  return (
    <PageHeader
      size="workspace"
      className="mb-4 flex-shrink-0"
      icon={<Sparkles className="w-6 h-6 text-primary-400" />}
      title="AI Ассистент"
      description={MODE_SUBTITLES[mode]}
      action={
        <div className="flex items-center gap-2">
          {mode === 'generate' && (
            <GeneratedStepHistoryPanel
              refreshTrigger={generatedStepHistoryRefreshKey}
              onOpen={onOpenGeneratedStepFromHistory}
            />
          )}
          <Button variant="secondary" size="sm" onClick={onClear}>
            <Trash2 className="w-4 h-4 mr-1" />
            {mode === 'batch' ? 'Очистить историю' : 'Очистить'}
          </Button>
        </div>
      }
    />
  );
}
