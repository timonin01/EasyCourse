import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, PasswordInput, FadeIn } from '../components/ui';
import { authApi } from '../api';
import { useAuthStore } from '../store';
import { extractApiErrorMessage, getApiErrorStatus, isBackendUserNotFound, isNetworkError } from '../utils/apiError';
import { SITE_ORIGIN } from '../constants/seo';
import { usePageMeta } from '../hooks/usePageMeta';

export function Login() {
  usePageMeta({
    title: 'Вход — EasyCourse',
    description: 'Войдите в EasyCourse, чтобы редактировать курсы Stepik и работать с AI-агентом.',
    canonicalUrl: `${SITE_ORIGIN}/login`,
    noIndex: true,
  });

  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authApi.login({
        email: formData.email.trim(),
        password: formData.password,
      });
      login(response.user, response.token);
      toast.success('Добро пожаловать!');
      navigate('/dashboard');
    } catch (error) {
      if (isNetworkError(error)) {
        toast.error(extractApiErrorMessage(error, 'Сервер недоступен'));
      } else {
        const status = getApiErrorStatus(error);
        if (status === 404 && isBackendUserNotFound(error)) {
          toast.error('Пользователь с таким email не найден');
        } else if (status === 404) {
          toast.error('API недоступен (404). Перезапустите Vite и Docker: backend на http://127.0.0.1:8081');
        } else if (status === 401) {
          toast.error('Неверный пароль');
        } else if (status === 403) {
          toast.error(extractApiErrorMessage(error, 'Email не подтверждён'));
        } else {
          toast.error(extractApiErrorMessage(error, 'Не удалось войти'));
        }
      }
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <FadeIn className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-lg mb-4">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-dark-100">EasyCourse</h1>
          </Link>
          <p className="text-dark-400 mt-2">Войдите в свой аккаунт</p>
        </div>

        <div className="surface rounded-brand-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="email"
              placeholder="Email"
              icon={<Mail className="w-5 h-5" />}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <PasswordInput
              placeholder="Пароль"
              icon={<Lock className="w-5 h-5" />}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              icon={<ArrowRight className="w-5 h-5" />}
            >
              Войти
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-dark-400">
              Нет аккаунта?{' '}
              <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
                Зарегистрируйтесь
              </Link>
            </p>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
