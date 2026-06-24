import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  Settings,
  LogOut,
  GraduationCap,
  RefreshCw,
  PanelLeftClose,
  ClipboardCheck,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../store';
import { SidebarUserSubscription } from './SidebarUserSubscription';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Дашборд' },
  { to: '/courses', icon: BookOpen, label: 'Мои курсы' },
  { to: '/stepik-sync', icon: RefreshCw, label: 'Stepik Sync' },
  { to: '/ai-generator', icon: Sparkles, label: 'AI Генератор' },
  { to: '/course-audit', icon: ClipboardCheck, label: 'Аудит курса' },
  { to: '/settings', icon: Settings, label: 'Настройки' },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
  onCollapse?: () => void;
}

export function Sidebar({ className, onNavigate, onCollapse }: SidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    onNavigate?.();
    navigate('/login');
  };

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 z-40 flex h-screen w-64 flex-col glass border-r border-dark-700 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        className
      )}
    >
      {/* Logo */}
      <div className="border-b border-dark-700 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">EasyCourse</h1>
            <p className="text-xs text-dark-500">Создавайте курсы легко</p>
          </div>
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              className="ml-auto hidden rounded-lg p-2 text-dark-400 transition-colors hover:bg-dark-800 hover:text-dark-200 lg:block"
              aria-label="Свернуть меню"
              title="Свернуть меню"
            >
              <PanelLeftClose className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200',
                isActive
                  ? 'border border-primary-600/30 bg-primary-600/20 text-primary-400'
                  : 'text-dark-400 hover:bg-dark-800 hover:text-dark-200'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Subscription + User */}
      <div className="border-t border-dark-700 p-2 pt-3">
        <SidebarUserSubscription />

        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-dark-700">
            <span className="text-sm font-medium text-dark-300">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-dark-200">
              {user?.name || 'Пользователь'}
            </p>
            <p className="truncate text-xs text-dark-500">
              {user?.email || 'email@example.com'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-dark-400 transition-colors hover:bg-dark-800 hover:text-red-400"
            title="Выйти"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
