import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, Mail, Lock, User, ArrowRight, KeyRound, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Checkbox, Input, PasswordInput, FadeIn } from '../components/ui';
import { authApi } from '../api';
import { useAuthStore } from '../store';
import { extractApiErrorMessage, getApiErrorStatus, isNetworkError } from '../utils/apiError';
import { validateEmail, validateUserName } from '../utils/validation';
import { SITE_ORIGIN } from '../constants/seo';
import { PRIVACY_CONSENT_VERSION } from '../constants/privacyConsent';
import { usePageMeta } from '../hooks/usePageMeta';

type RegisterStep = 'form' | 'verify';

export function Register() {
  usePageMeta({
    title: 'Регистрация — EasyCourse',
    description: 'Создайте аккаунт EasyCourse и начните собирать курсы для Stepik с помощью AI.',
    canonicalUrl: `${SITE_ORIGIN}/register`,
    noIndex: true,
  });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const [step, setStep] = useState<RegisterStep>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [inviteRequired, setInviteRequired] = useState<boolean | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [privacyConsentVersion, setPrivacyConsentVersion] = useState(PRIVACY_CONSENT_VERSION);

  useEffect(() => {
    authApi.getRegistrationConfig()
      .then((config) => {
        setInviteRequired(config.inviteRequired);
        if (config.privacyConsentVersion) {
          setPrivacyConsentVersion(config.privacyConsentVersion);
        }
      })
      .catch((error) => {
        console.error('Failed to load registration config:', error);
        setInviteRequired(false);
      });
  }, []);

  useEffect(() => {
    const invite = searchParams.get('invite');
    if (invite && inviteRequired) {
      setFormData((prev) => ({ ...prev, inviteCode: invite }));
    }
  }, [searchParams, inviteRequired]);

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

    if (inviteRequired && !formData.inviteCode.trim()) {
      toast.error('Введите код приглашения');
      return;
    }

    if (!privacyAccepted) {
      toast.error('Подтвердите согласие на обработку персональных данных');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.requestRegistration({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        inviteCode: inviteRequired ? formData.inviteCode.trim() : undefined,
        privacyAccepted: true,
        privacyConsentVersion,
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
    if (status === 403) {
      toast.error(extractApiErrorMessage(error, 'Регистрация по приглашению. Проверьте код.'));
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
          <Link to="/" className="inline-flex flex-col items-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-lg mb-4">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-dark-100">EasyCourse</h1>
          </Link>
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

              {inviteRequired && (
                <Input
                  type="text"
                  placeholder="Код приглашения"
                  icon={<Ticket className="w-5 h-5" />}
                  value={formData.inviteCode}
                  onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value })}
                  required
                />
              )}

              <div className="flex items-start gap-3">
                <Checkbox
                  checked={privacyAccepted}
                  onChange={setPrivacyAccepted}
                  variant="primary"
                />
                <p className="pt-0.5 text-sm leading-snug text-dark-300">
                  Я даю{' '}
                  <Link
                    to="/consent"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary-400 hover:text-primary-300"
                  >
                    согласие на обработку персональных данных
                  </Link>
                  {' '}и подтверждаю, что ознакомлен с{' '}
                  <Link
                    to="/privacy"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary-400 hover:text-primary-300"
                  >
                    Политикой обработки персональных данных
                  </Link>
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isLoading}
                disabled={!privacyAccepted}
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

          <div className="mt-6 space-y-3 text-center">
            <p className="text-dark-400">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
                Войти
              </Link>
            </p>
            <p className="text-xs text-dark-500">
              <Link to="/consent" className="hover:text-dark-300">
                Согласие на обработку ПДн
              </Link>
              {' · '}
              <Link to="/privacy" className="hover:text-dark-300">
                Политика
              </Link>
            </p>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
