import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, User, ArrowRight, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, PasswordInput, FadeIn } from '../components/ui';
import { authApi } from '../api';
import { useAuthStore } from '../store';
import { extractApiErrorMessage, getApiErrorStatus, isNetworkError } from '../utils/apiError';
import { validateEmail, validateUserName } from '../utils/validation';

type RegisterStep = 'form' | 'verify';

export function Register() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [step, setStep] = useState<RegisterStep>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [verificationCode, setVerificationCode] = useState('');

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
      const response = await authApi.requestRegistration({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      toast.success(response.message);
      setStep('verify');
    } catch (error) {
      handleRegistrationError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = verificationCode.trim();
    if (!/^\d{6}$/.test(code)) {
      toast.error('Введите 6-значный код из письма');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.verifyEmail({
        email: formData.email.trim(),
        code,
      });
      login(response.user, response.token);
      toast.success('Аккаунт подтверждён!');
      navigate('/dashboard');
    } catch (error) {
      handleRegistrationError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const response = await authApi.resendVerification({
        email: formData.email.trim(),
      });
      toast.success(response.message);
    } catch (error) {
      handleRegistrationError(error);
    } finally {
      setIsResending(false);
    }
  };

  const handleRegistrationError = (error: unknown) => {
    if (isNetworkError(error)) {
      toast.error(extractApiErrorMessage(error, 'Сервер недоступен'));
      return;
    }

    const status = getApiErrorStatus(error);
    if (status === 409) {
      toast.error('Email уже зарегистрирован. Попробуйте войти.');
      return;
    }
    if (status === 503) {
      toast.error('Не удалось отправить письмо. Попробуйте позже.');
      return;
    }

    toast.error(extractApiErrorMessage(error, 'Ошибка регистрации'));
    console.error('Registration error:', error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <FadeIn className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-lg mb-4">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-dark-100">EasyCourse</h1>
          <p className="text-dark-400 mt-2">
            {step === 'form' ? 'Создайте аккаунт' : 'Подтвердите email'}
          </p>
        </div>

        <div className="surface rounded-brand-xl p-8">
          {step === 'form' ? (
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
                Получить код
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-5">
              <p className="text-sm text-dark-400 text-center">
                Мы отправили 6-значный код на{' '}
                <span className="text-dark-200">{formData.email.trim()}</span>
              </p>

              <Input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                placeholder="Код из письма"
                icon={<KeyRound className="w-5 h-5" />}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isLoading}
                icon={<ArrowRight className="w-5 h-5" />}
              >
                Подтвердить и войти
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                isLoading={isResending}
                onClick={handleResend}
              >
                Отправить код снова
              </Button>

              <button
                type="button"
                className="w-full text-sm text-dark-400 hover:text-dark-200"
                onClick={() => setStep('form')}
              >
                Изменить данные регистрации
              </button>
            </form>
          )}

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
