import { clsx } from 'clsx';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function Toggle({ 
  checked, 
  onChange, 
  label, 
  description, 
  disabled = false,
  size = 'md' 
}: ToggleProps) {
  const sizes = {
    sm: {
      toggle: 'w-8 h-4',
      dot: 'w-3 h-3',
      translate: 'translate-x-4',
    },
    md: {
      toggle: 'w-11 h-6',
      dot: 'w-5 h-5',
      translate: 'translate-x-5',
    },
  };

  return (
    <label className={clsx(
      'flex items-start gap-3 cursor-pointer group',
      disabled && 'opacity-50 cursor-not-allowed'
    )}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={clsx(
          'relative inline-flex flex-shrink-0 rounded-full transition-colors duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900',
          sizes[size].toggle,
          checked 
            ? 'bg-gradient-to-r from-primary-500 to-primary-600' 
            : 'bg-dark-600 group-hover:bg-dark-500'
        )}
      >
        <span
          className={clsx(
            'pointer-events-none inline-block rounded-full bg-white shadow-lg transform ring-0 transition-transform duration-200',
            sizes[size].dot,
            'translate-y-0.5 translate-x-0.5',
            checked && sizes[size].translate
          )}
        />
      </button>
      <div className="flex-1 min-w-0">
        <span className={clsx(
          'block text-sm font-medium transition-colors',
          checked ? 'text-dark-100' : 'text-dark-300 group-hover:text-dark-200'
        )}>
          {label}
        </span>
        {description && (
          <span className="block text-xs text-dark-500 mt-0.5">{description}</span>
        )}
      </div>
    </label>
  );
}
