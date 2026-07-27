import { Sparkles, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
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
  sidePanelAction?: ReactNode;
}

export function AIGeneratorHeader({
  mode,
  generatedStepHistoryRefreshKey,
  onClear,
  onOpenGeneratedStepFromHistory,
  sidePanelAction,
}: AIGeneratorHeaderProps) {
  return (
    <PageHeader
      size="workspace"
      className="mb-4 flex-shrink-0"
      icon={<Sparkles className="w-6 h-6 text-primary-400" />}
      title="Генерация шагов"
      description={MODE_SUBTITLES[mode]}
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {sidePanelAction}
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
