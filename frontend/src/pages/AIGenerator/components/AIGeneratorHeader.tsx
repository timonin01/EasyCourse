import { Sparkles, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui';
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
    <div className="flex items-center justify-between mb-4 flex-shrink-0">
      <div>
        <h1 className="text-2xl font-bold text-dark-100 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary-400" />
          AI Ассистент
        </h1>
        <p className="text-dark-400 text-sm">{MODE_SUBTITLES[mode]}</p>
      </div>
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
    </div>
  );
}
