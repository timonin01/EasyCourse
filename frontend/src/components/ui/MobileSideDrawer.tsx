import { clsx } from 'clsx';
import { PanelRightOpen, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';

interface MobileSideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  dense?: boolean;
}

export function MobileSideDrawer({ isOpen, onClose, label, children, dense = false }: MobileSideDrawerProps) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 xl:hidden"
          onClick={onClose}
          aria-label="Закрыть панель"
        />
      )}

      <div
        className={clsx(
          'fixed inset-y-0 right-0 z-50 flex w-[min(100vw-2rem,420px)] flex-col border-l border-dark-700 bg-dark-900 shadow-2xl transition-transform duration-200 xl:hidden',
          isOpen ? 'translate-x-0' : 'pointer-events-none translate-x-full',
        )}
        aria-hidden={!isOpen}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-dark-700/60 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <span className="text-sm font-semibold text-dark-200">{label}</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-dark-400 transition-colors hover:bg-dark-800 hover:text-dark-100"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className={clsx('flex min-h-0 flex-1 flex-col overflow-hidden', dense ? 'p-0' : 'p-4')}>
          {children}
        </div>
      </div>
    </>
  );
}

interface SidePanelOpenButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
}

export function SidePanelOpenButton({ label, onClick, className }: SidePanelOpenButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={onClick}
      className={clsx('xl:hidden', className)}
    >
      <PanelRightOpen className="mr-1 h-4 w-4" />
      {label}
    </Button>
  );
}
