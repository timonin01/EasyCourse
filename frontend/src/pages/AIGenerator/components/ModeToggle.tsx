import type { AIGeneratorMode } from '../types';

const MODES: { id: AIGeneratorMode; label: string }[] = [
  { id: 'chat', label: '💬 Свободный чат' },
  { id: 'generate', label: '✨ Генерация шагов' },
  { id: 'batch', label: '📦 Batch генерация' },
];

interface ModeToggleProps {
  mode: AIGeneratorMode;
  onModeChange: (mode: AIGeneratorMode) => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="mb-4 flex gap-2 flex-shrink-0 min-w-0 overflow-x-auto scrollbar-thin scrollbar-thumb-dark-700">
      {MODES.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onModeChange(id)}
          className={`flex-1 min-w-[7.5rem] px-2 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
            mode === id ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
