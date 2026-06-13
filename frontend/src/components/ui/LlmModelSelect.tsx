import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LLM_MODEL_OPTIONS } from '../../constants/llmModels';

interface LlmModelSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
  menuPlacement?: 'top' | 'bottom';
}

interface MenuPosition {
  top: number;
  left: number;
  width: number;
}

function ModelIcon({ src, alt }: { src?: string; alt: string }) {
  if (!src) {
    return <span className="w-4 h-4 flex-shrink-0" aria-hidden />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-4 h-4 flex-shrink-0 object-contain"
    />
  );
}

export function LlmModelSelect({
  label,
  value,
  onChange,
  className,
  id,
  menuPlacement = 'bottom',
}: LlmModelSelectProps) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const selectId = id || label?.toLowerCase().replace(/\s/g, '-');
  const selected = LLM_MODEL_OPTIONS.find((opt) => opt.value === value) ?? LLM_MODEL_OPTIONS[0];

  const updateMenuPosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const gap = 6;
    const estimatedMenuHeight = LLM_MODEL_OPTIONS.length * 44 + 8;
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
  }, [open, menuPlacement]);

  const menu = open && menuPosition
    ? createPortal(
        <ul
          ref={menuRef}
          role="listbox"
          aria-labelledby={selectId}
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            width: menuPosition.width,
          }}
          className="fixed z-[100] overflow-hidden rounded-xl border border-dark-600 bg-dark-800 py-1 shadow-2xl shadow-black/40"
        >
          {LLM_MODEL_OPTIONS.map((option) => (
            <li key={option.value || 'auto'} role="option" aria-selected={option.value === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={clsx(
                  'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors',
                  'hover:bg-dark-700',
                  option.value === value ? 'bg-primary-500/10 text-primary-300' : 'text-dark-100'
                )}
              >
                <ModelIcon src={option.icon} alt={option.label} />
                <span className="leading-tight">{option.label}</span>
              </button>
            </li>
          ))}
        </ul>,
        document.body
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
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className={clsx(
            'flex w-full items-center gap-2 px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-xl text-dark-100',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'transition-all duration-200 cursor-pointer hover:border-dark-500',
            className
          )}
        >
          <ModelIcon src={selected.icon} alt={selected.label} />
          <span className="flex-1 truncate text-left text-sm">{selected.label}</span>
          <ChevronDown
            className={clsx(
              'w-4 h-4 flex-shrink-0 text-dark-400 transition-transform',
              open && 'rotate-180'
            )}
          />
        </button>
        {menu}
      </div>
    </div>
  );
}
