import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, PasswordInput, FadeIn } from '../components/ui';
import { ProductIntro } from '../components/auth/ProductIntro';
import { authApi } from '../api';
import { useAuthStore } from '../store';
import { extractApiErrorMessage, getApiErrorStatus, isNetworkError } from '../utils/apiError';

export function Login() {
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
        if (status === 404) {
          toast.error('Пользователь с таким email не найден');
        } else if (status === 401) {
          toast.error('Неверный пароль');
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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Описание продукта — десктоп */}
      <div className="hidden lg:flex lg:w-1/2 border-r border-dark-700 bg-dark-900/50">
        <ProductIntro />
      </div>

      {/* Форма входа */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <FadeIn className="w-full max-w-md">
          {/* Logo — мобильная версия */}
          <div className="text-center mb-8 lg:mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 pulse-glow">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text">EasyCourse</h1>
            <p className="text-dark-400 mt-2">Войдите в свой аккаунт</p>
          </div>

          {/* Краткое описание — только мобильная */}
          <div className="lg:hidden mb-6">
            <ProductIntro compact />
          </div>

          <div className="glass rounded-2xl p-8">
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
    </div>
  );
}
