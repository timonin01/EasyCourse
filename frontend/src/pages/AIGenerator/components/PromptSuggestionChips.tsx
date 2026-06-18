import type { PromptSuggestion } from '../../../constants/aiPromptSuggestions';
import { clampPromptLength } from '../../../constants/aiPromptLimits';

interface PromptSuggestionChipsProps {
  suggestions: PromptSuggestion[];
  onSelect: (prompt: string) => void;
  className?: string;
  maxLength?: number;
}

export function PromptSuggestionChips({
  suggestions,
  onSelect,
  className = '',
  maxLength,
}: PromptSuggestionChipsProps) {
  return (
    <div className={`flex flex-wrap justify-center gap-2 mt-4 ${className}`}>
      {suggestions.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() =>
            onSelect(
              maxLength != null ? clampPromptLength(item.prompt, maxLength) : item.prompt
            )
          }
          className="rounded-full border border-dark-600 bg-dark-800/80 px-3 py-1.5 text-xs text-dark-300 transition-colors hover:border-primary-500/40 hover:bg-primary-900/20 hover:text-primary-300"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
