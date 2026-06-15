import { useState, type ReactNode } from 'react';
import { Menu, X, GraduationCap } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen">
      {/* Mobile top bar */}
      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-dark-700 glass px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-dark-300 hover:bg-dark-800"
          aria-label="Открыть меню"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold gradient-text">EasyCourse</span>
        </div>
        <div className="w-9" />
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
          aria-label="Закрыть меню"
        />
      )}

      {/* Sidebar — drawer on mobile, fixed on desktop */}
      <Sidebar
        className={
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }
        onNavigate={closeMobile}
      />

      {/* Close button on mobile drawer */}
      {mobileOpen && (
        <button
          type="button"
          onClick={closeMobile}
          className="fixed left-[15.5rem] top-4 z-50 rounded-lg p-2 text-dark-200 hover:bg-dark-800 lg:hidden"
          aria-label="Закрыть меню"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      <main className="min-h-screen pt-14 lg:ml-64 lg:pt-0">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
