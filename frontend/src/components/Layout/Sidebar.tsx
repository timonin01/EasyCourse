import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Sparkles, 
  Settings, 
  LogOut,
  GraduationCap,
  RefreshCw
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../store';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Дашборд' },
  { to: '/courses', icon: BookOpen, label: 'Мои курсы' },
  { to: '/stepik-sync', icon: RefreshCw, label: 'Stepik Sync' },
  { to: '/ai-generator', icon: Sparkles, label: 'AI Генератор' },
  { to: '/settings', icon: Settings, label: 'Настройки' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass border-r border-dark-700 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">EasyCourse</h1>
            <p className="text-xs text-dark-500">Создавайте курсы легко</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-primary-600/20 text-primary-400 border border-primary-600/30'
                  : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-dark-700">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 bg-dark-700 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-dark-300">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-dark-200 truncate">
              {user?.name || 'Пользователь'}
            </p>
            <p className="text-xs text-dark-500 truncate">
              {user?.email || 'email@example.com'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-dark-400 hover:text-red-400 hover:bg-dark-800 rounded-lg transition-colors"
            title="Выйти"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

