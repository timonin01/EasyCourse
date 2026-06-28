import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { scaleIn } from './motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  footer?: ReactNode;
}

export function Modal({ isOpen, onClose, title, subtitle, icon, children, size = 'md', footer }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-[90vw]',
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          <motion.div
            className={clsx(
              'relative w-full flex flex-col surface',
              'rounded-brand-xl shadow-2xl shadow-black/40',
              'max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)]',
              sizes[size]
            )}
            initial={scaleIn.initial}
            animate={scaleIn.animate}
            exit={scaleIn.exit}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex-shrink-0 border-b border-dark-700/60">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  {icon && <span className="text-primary-400 shrink-0">{icon}</span>}
                  <div className="min-w-0">
                    <h2 className="text-heading text-dark-100 truncate">{title}</h2>
                    {subtitle && <p className="text-caption text-dark-400 mt-0.5">{subtitle}</p>}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className={clsx(
                    'p-2 rounded-lg transition-colors duration-150',
                    'text-dark-400 hover:text-dark-200 hover:bg-dark-800',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0">
              {children}
            </div>

            {footer && (
              <div className="flex-shrink-0 border-t border-dark-700/60 px-5 py-4 bg-dark-900/40">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
