import { clsx } from 'clsx';
import type { ChangeEvent, TextareaHTMLAttributes } from 'react';
import { clampPromptLength } from '../../constants/aiPromptLimits';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  showCount?: boolean;
  maxLength?: number;
}

export function Textarea({
  label,
  error,
  hint,
  showCount,
  maxLength,
  className,
  id,
  value,
  onChange,
  ...props
}: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s/g, '-');
  const charCount = typeof value === 'string' ? value.length : 0;

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (!onChange) {
      return;
    }

    const nextValue =
      maxLength != null
        ? clampPromptLength(event.target.value, maxLength)
        : event.target.value;

    if (nextValue === event.target.value) {
      onChange(event);
      return;
    }

    onChange({
      ...event,
      target: { ...event.target, value: nextValue },
      currentTarget: { ...event.currentTarget, value: nextValue },
    });
  };

  const counter =
    showCount && maxLength ? (
      <span
        className={clsx(
          'text-xs',
          charCount >= maxLength ? 'text-amber-400' : 'text-dark-500'
        )}
      >
        {charCount}/{maxLength}
      </span>
    ) : null;

  return (
    <div className="space-y-1.5">
      {(label || counter) && (
        <div className="flex items-center justify-between gap-2">
          {label ? (
            <label htmlFor={textareaId} className="block text-sm font-medium text-dark-300">
              {label}
            </label>
          ) : (
            <span />
          )}
          {counter}
        </div>
      )}
      <textarea
        id={textareaId}
        value={value}
        maxLength={maxLength}
        onChange={handleChange}
        className={clsx(
          'block w-full px-4 py-3 bg-dark-800/80 border border-dark-600 rounded-xl text-dark-100 placeholder-dark-500',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 focus:bg-dark-800',
          'hover:border-dark-500 hover:bg-dark-800',
          'transition-all duration-200 resize-none',
          'scrollbar-thin scrollbar-thumb-dark-700 scrollbar-track-transparent',
          error && 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-dark-500">{hint}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
