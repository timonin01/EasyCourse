import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, GraduationCap, PanelLeft } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { PageTransition } from './PageTransition';
import { easeOut } from '../ui/motion';

interface MainLayoutProps {
  children: ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

export function MainLayout({ children }: MainLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  );

  const closeMobile = () => setMobileOpen(false);

  const toggleCollapsed = () =>
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });

  const sidebarTranslateClass = mobileOpen
    ? 'translate-x-0'
    : collapsed
      ? '-translate-x-full'
      : '-translate-x-full lg:translate-x-0';

  return (
    <div className="min-h-screen">
      {/* Mobile top bar */}
      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-dark-700 surface px-4 lg:hidden">
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
          <span className="text-sm font-semibold text-dark-100">EasyCourse</span>
        </div>
        <div className="w-9" />
      </header>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: easeOut }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={closeMobile}
            aria-label="Закрыть меню"
          />
        )}
      </AnimatePresence>

      {/* Sidebar — drawer on mobile, fixed on desktop */}
      <Sidebar
        className={sidebarTranslateClass}
        onNavigate={closeMobile}
        onCollapse={toggleCollapsed}
      />

      {/* Close button on mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            type="button"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2, ease: easeOut }}
            onClick={closeMobile}
            className="fixed left-[15.5rem] top-4 z-50 rounded-lg p-2 text-dark-200 hover:bg-dark-800 lg:hidden"
            aria-label="Закрыть меню"
          >
            <X className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Desktop handle to reopen the collapsed sidebar */}
      {collapsed && (
        <button
          type="button"
          onClick={toggleCollapsed}
          className="fixed left-0 top-4 z-50 hidden items-center rounded-r-lg border border-l-0 border-dark-700 surface p-2 text-dark-300 transition-colors hover:bg-dark-800 hover:text-dark-100 lg:flex"
          aria-label="Показать меню"
          title="Показать меню"
        >
          <PanelLeft className="h-5 w-5" />
        </button>
      )}

      <main
        className={
          collapsed
            ? 'min-h-screen overflow-x-hidden pt-14 lg:pt-0'
            : 'min-h-screen overflow-x-hidden pt-14 lg:ml-64 lg:pt-0'
        }
      >
        <div className="p-4 lg:p-8">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </div>
  );
}
