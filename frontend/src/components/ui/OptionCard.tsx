import { clsx } from 'clsx';
import { GripVertical, Trash2, Check, X } from 'lucide-react';
import type { ReactNode } from 'react';

interface OptionCardProps {
  children: ReactNode;
  onDelete?: () => void;
  isCorrect?: boolean;
  showCorrectIndicator?: boolean;
  dragHandle?: boolean;
  className?: string;
}

export function OptionCard({ 
  children, 
  onDelete, 
  isCorrect,
  showCorrectIndicator = false,
  dragHandle = false,
  className 
}: OptionCardProps) {
  return (
    <div className={clsx(
      'group relative flex items-start gap-2 p-3 rounded-xl border transition-all duration-200',
      'bg-dark-800/50 hover:bg-dark-800',
      showCorrectIndicator && isCorrect && 'border-emerald-500/40 bg-emerald-500/5',
      showCorrectIndicator && isCorrect === false && 'border-dark-600',
      !showCorrectIndicator && 'border-dark-600 hover:border-dark-500',
      className
    )}>
      {dragHandle && (
        <div className="flex-shrink-0 cursor-grab active:cursor-grabbing text-dark-500 hover:text-dark-400 transition-colors">
          <GripVertical className="w-4 h-4" />
        </div>
      )}
      
      {showCorrectIndicator && (
        <div className={clsx(
          'flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5',
          isCorrect 
            ? 'bg-emerald-500/20 text-emerald-400' 
            : 'bg-dark-700 text-dark-500'
        )}>
          {isCorrect ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        {children}
      </div>
      
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className={clsx(
            'flex-shrink-0 p-1.5 rounded-lg transition-all duration-200',
            'text-dark-500 hover:text-red-400 hover:bg-red-500/10',
            'opacity-0 group-hover:opacity-100'
          )}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
