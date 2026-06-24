import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, User, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, PasswordInput, FadeIn } from '../components/ui';
import { authApi } from '../api';
import { extractApiErrorMessage, getApiErrorStatus, isNetworkError } from '../utils/apiError';
import { validateEmail, validateUserName } from '../utils/validation';

export function Register() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameError = validateUserName(formData.name);
    if (nameError) {
      toast.error(nameError);
      return;
    }

    const emailError = validateEmail(formData.email);
    if (emailError) {
      toast.error(emailError);
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      toast.success('Регистрация успешна! Теперь войдите в аккаунт.');
      navigate('/login');
    } catch (error) {
      if (isNetworkError(error)) {
        toast.error(extractApiErrorMessage(error, 'Сервер недоступен'));
      } else {
        const status = getApiErrorStatus(error);
        if (status === 409) {
          toast.error('Email уже зарегистрирован. Попробуйте войти.');
        } else {
          toast.error(extractApiErrorMessage(error, 'Ошибка регистрации'));
        }
      }
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <FadeIn className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 pulse-glow">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">EasyCourse</h1>
          <p className="text-dark-400 mt-2">Создайте аккаунт</p>
        </div>

        {/* Form */}
        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="text"
              placeholder="Имя"
              icon={<User className="w-5 h-5" />}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

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
              minLength={6}
            />

            <PasswordInput
              placeholder="Подтвердите пароль"
              icon={<Lock className="w-5 h-5" />}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              minLength={6}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              icon={<ArrowRight className="w-5 h-5" />}
            >
              Зарегистрироваться
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-dark-400">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
                Войдите
              </Link>
            </p>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}

