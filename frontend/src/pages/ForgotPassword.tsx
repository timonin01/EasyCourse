import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, ArrowRight, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, PasswordInput, FadeIn } from '../components/ui';
import { authApi } from '../api';
import { extractApiErrorMessage, getApiErrorStatus, isNetworkError } from '../utils/apiError';
import { FIELD_LIMITS, validateEmail } from '../utils/validation';
import { SITE_ORIGIN } from '../constants/seo';
import { usePageMeta } from '../hooks/usePageMeta';

type ForgotPasswordStep = 'email' | 'code' | 'password';

export function ForgotPassword() {
  usePageMeta({
    title: 'Сброс пароля — EasyCourse',
    description: 'Восстановите доступ к аккаунту EasyCourse по коду из письма.',
    canonicalUrl: `${SITE_ORIGIN}/forgot-password`,
    noIndex: true,
  });

  const navigate = useNavigate();
  const [step, setStep] = useState<ForgotPasswordStep>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleError = (error: unknown, fallback: string) => {
    if (isNetworkError(error)) {
      toast.error(extractApiErrorMessage(error, 'Сервер недоступен'));
      return;
    }

    const status = getApiErrorStatus(error);
    if (status === 400) {
      toast.error(extractApiErrorMessage(error, 'Неверный код подтверждения'));
      return;
    }
    if (status === 503) {
      toast.error('Не удалось отправить письмо. Попробуйте позже.');
      return;
    }

    toast.error(extractApiErrorMessage(error, fallback));
    console.error('Forgot password error:', error);
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) {
      toast.error(emailError);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.forgotPassword({ email: email.trim() });
      toast.success(`${response.message} Если письма нет — проверьте папку «Спам».`);
      setStep('code');
    } catch (error) {
      handleError(error, 'Не удалось отправить код');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = verificationCode.trim();
    if (!/^\d{6}$/.test(code)) {
      toast.error('Введите 6-значный код из письма');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.verifyResetCode({
        email: email.trim(),
        code,
      });
      setResetToken(response.resetToken);
      setStep('password');
    } catch (error) {
      handleError(error, 'Не удалось проверить код');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < FIELD_LIMITS.password.min) {
      toast.error(`Пароль должен быть не короче ${FIELD_LIMITS.password.min} символов`);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (!resetToken) {
      toast.error('Сессия сброса истекла. Запросите код снова.');
      setStep('email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.resetPassword({
        resetToken,
        newPassword,
      });
      toast.success(response.message);
      navigate('/login');
    } catch (error) {
      handleError(error, 'Не удалось сменить пароль');
    } finally {
      setIsLoading(false);
    }
  };

  const stepTitle =
    step === 'email'
      ? 'Сброс пароля'
      : step === 'code'
        ? 'Введите код из письма'
        : 'Новый пароль';

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
          <p className="text-dark-400 mt-2">{stepTitle}</p>
        </div>

        <div className="surface rounded-brand-xl p-8">
          {step === 'email' && (
            <form onSubmit={handleRequestCode} className="space-y-5">
              <p className="text-sm text-dark-400 text-center">
                Укажите email аккаунта — мы отправим код для сброса пароля.
              </p>

              <Input
                type="email"
                placeholder="Email"
                icon={<Mail className="w-5 h-5" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isLoading}
                icon={<ArrowRight className="w-5 h-5" />}
              >
                Отправить код
              </Button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <p className="text-sm text-dark-400 text-center">
                Мы отправили 6-значный код на{' '}
                <span className="text-dark-200">{email.trim()}</span>
              </p>

              <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-center text-xs leading-relaxed text-amber-200/90">
                Если письмо не пришло в течение нескольких минут, проверьте папку «Спам» или
                «Нежелательная почта».
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
                Проверить код
              </Button>

              <button
                type="button"
                className="w-full text-sm text-dark-400 hover:text-dark-200"
                onClick={() => {
                  setVerificationCode('');
                  setStep('email');
                }}
              >
                Изменить email
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <p className="text-sm text-dark-400 text-center">
                Придумайте новый пароль для входа в аккаунт.
              </p>

              <PasswordInput
                placeholder="Новый пароль"
                icon={<Lock className="w-5 h-5" />}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={FIELD_LIMITS.password.min}
              />

              <PasswordInput
                placeholder="Подтвердите пароль"
                icon={<Lock className="w-5 h-5" />}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={FIELD_LIMITS.password.min}
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isLoading}
                icon={<ArrowRight className="w-5 h-5" />}
              >
                Сохранить пароль
              </Button>
            </form>
          )}

          <div className="mt-6 space-y-3 text-center">
            <p className="text-dark-400">
              Вспомнили пароль?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
