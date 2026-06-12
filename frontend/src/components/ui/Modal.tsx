import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

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

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-[90vw]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
      {/* Backdrop with gradient */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-black/70 via-dark-900/80 to-black/70 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-600/5 rounded-full blur-3xl" />
      </div>
      
      {/* Modal */}
      <div 
        className={clsx(
          'relative w-full flex flex-col',
          'bg-gradient-to-b from-dark-850 to-dark-900',
          'rounded-2xl shadow-2xl shadow-black/50',
          'border border-dark-700/50',
          'animate-fade-in',
          'max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)]',
          sizes[size]
        )}
        style={{
          animation: 'modal-enter 0.2s ease-out',
        }}
      >
        {/* Header with gradient border */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-dark-600 to-transparent" />
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/20">
                  <span className="text-primary-400">{icon}</span>
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold text-dark-100">{title}</h2>
                {subtitle && (
                  <p className="text-sm text-dark-400 mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className={clsx(
                'p-2 rounded-xl transition-all duration-200',
                'text-dark-400 hover:text-dark-200',
                'hover:bg-dark-800 active:bg-dark-700',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
              )}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content with subtle gradient */}
        <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0 scrollbar-thin scrollbar-thumb-dark-700 scrollbar-track-transparent">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="relative flex-shrink-0">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-dark-600 to-transparent" />
            <div className="px-6 py-4 bg-dark-900/50">
              {footer}
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes modal-enter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

