import { clsx } from 'clsx';
import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  variant?: 'default' | 'success' | 'primary';
}

export function Checkbox({ 
  checked, 
  onChange, 
  label, 
  description,
  disabled = false,
  variant = 'default'
}: CheckboxProps) {
  const variants = {
    default: {
      checked: 'bg-dark-600 border-dark-500',
      unchecked: 'border-dark-600 hover:border-dark-500',
      icon: 'text-white',
    },
    success: {
      checked: 'bg-emerald-500 border-emerald-500',
      unchecked: 'border-dark-600 hover:border-emerald-500/50',
      icon: 'text-white',
    },
    primary: {
      checked: 'bg-primary-500 border-primary-500',
      unchecked: 'border-dark-600 hover:border-primary-500/50',
      icon: 'text-white',
    },
  };

  return (
    <label className={clsx(
      'flex items-start gap-3 cursor-pointer group',
      disabled && 'opacity-50 cursor-not-allowed'
    )}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={clsx(
          'flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all duration-200',
          'flex items-center justify-center',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900',
          checked ? variants[variant].checked : variants[variant].unchecked
        )}
      >
        {checked && (
          <Check className={clsx('w-3 h-3', variants[variant].icon)} strokeWidth={3} />
        )}
      </button>
      {(label || description) && (
        <div className="flex-1 min-w-0 pt-0.5">
          {label && (
            <span className={clsx(
              'block text-sm font-medium transition-colors',
              checked ? 'text-dark-100' : 'text-dark-300 group-hover:text-dark-200'
            )}>
              {label}
            </span>
          )}
          {description && (
            <span className="block text-xs text-dark-500 mt-0.5">{description}</span>
          )}
        </div>
      )}
    </label>
  );
}
