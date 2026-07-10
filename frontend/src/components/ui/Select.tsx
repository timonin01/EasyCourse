import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ChangeEvent, SelectHTMLAttributes } from 'react';

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  menuPlacement?: 'top' | 'bottom';
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
}

interface MenuPosition {
  top: number;
  left: number;
  width: number;
}

export function Select({
  label,
  error,
  options,
  className,
  id,
  value,
  disabled,
  menuPlacement = 'bottom',
  onChange,
  'aria-label': ariaLabel,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const selectId = id || label?.toLowerCase().replace(/\s/g, '-');
  const stringValue = value === undefined || value === null ? '' : String(value);
  const selected = options.find((option) => option.value === stringValue) ?? options[0];

  const updateMenuPosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const gap = 6;
    const estimatedMenuHeight = Math.min(options.length * 44 + 8, 280);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp =
      menuPlacement === 'top' ||
      (menuPlacement === 'bottom' && spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow);

    setMenuPosition({
      top: openUp ? rect.top - estimatedMenuHeight - gap : rect.bottom + gap,
      left: rect.left,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (!open) return;

    updateMenuPosition();

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleReposition = () => updateMenuPosition();

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [open, menuPlacement, options.length]);

  const handleSelect = (nextValue: string) => {
    onChange?.({
      target: { value: nextValue },
      currentTarget: { value: nextValue },
    } as ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  };

  const menu = open && menuPosition
    ? createPortal(
        <ul
          ref={menuRef}
          role="listbox"
          aria-labelledby={label ? selectId : undefined}
          aria-label={!label ? ariaLabel : undefined}
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            width: menuPosition.width,
            maxHeight: 280,
          }}
          className="fixed z-[100] overflow-y-auto overflow-x-hidden rounded-xl border border-dark-600 bg-dark-800 py-1 shadow-2xl shadow-black/40"
        >
          {options.map((option) => (
            <li key={option.value} role="option" aria-selected={option.value === stringValue}>
              <button
                type="button"
                onClick={() => handleSelect(option.value)}
                className={clsx(
                  'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-dark-700',
                  option.value === stringValue
                    ? 'bg-primary-500/10 text-primary-300'
                    : 'text-dark-100',
                )}
              >
                <span className="flex-1 truncate leading-tight">{option.label}</span>
              </button>
            </li>
          ))}
        </ul>,
        document.body,
      )
    : null;

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-dark-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <button
          ref={buttonRef}
          id={selectId}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={!label ? ariaLabel : undefined}
          onClick={() => {
            if (!disabled) {
              setOpen((prev) => !prev);
            }
          }}
          className={clsx(
            'flex w-full items-center gap-2 px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-xl text-dark-100',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'transition-all duration-200 cursor-pointer hover:border-dark-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:ring-red-500',
            className,
          )}
        >
          <span className="flex-1 truncate text-left text-sm">
            {selected?.label ?? 'Выберите…'}
          </span>
          <ChevronDown
            className={clsx(
              'h-4 w-4 shrink-0 text-dark-400 transition-transform',
              open && 'rotate-180',
            )}
          />
        </button>
        {menu}
      </div>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
