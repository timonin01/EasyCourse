import { useState, useEffect } from 'react';
import { Save, Key, User, Lock, ExternalLink, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { MainLayout } from '../components/Layout';
import { Card, Button, Input, Badge } from '../components/ui';
import { SubscriptionPanel } from '../components/subscription/SubscriptionPanel';
import { authApi } from '../api';
import { useAuthStore } from '../store';
import { extractApiErrorMessage, getApiErrorStatus } from '../utils/apiError';
import { validateEmail, validateUserName } from '../utils/validation';

export function Settings() {
  const { user, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [hasStepikConfig, setHasStepikConfig] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [stepikConfig, setStepikConfig] = useState({
    clientId: '',
    clientSecret: '',
  });

  useEffect(() => {
    const checkStepikConfig = async () => {
      if (!user?.id) return;
      try {
        const hasConfig = await authApi.hasStepikOAuthConfig(user.id);
        setHasStepikConfig(hasConfig);
        if (hasConfig) {
          const config = await authApi.getStepikOAuthConfig(user.id);
          setStepikConfig({
            clientId: config.clientId || '',
            clientSecret: '••••••••••••',
          });
        }
      } catch (error) {
        console.error('Failed to check Stepik config:', error);
      }
    };
    checkStepikConfig();
  }, [user?.id]);

  const handleUpdateProfile = async () => {
    if (!user?.id) return;

    const nameError = validateUserName(profileData.name);
    if (nameError) {
      toast.error(nameError);
      return;
    }

    const emailError = validateEmail(profileData.email);
    if (emailError) {
      toast.error(emailError);
      return;
    }

    setIsLoading(true);

    try {
      const updatedUser = await authApi.updateUser({
        userId: user.id,
        name: profileData.name.trim(),
        email: profileData.email.trim(),
      });
      updateUser(updatedUser);
      toast.success('Профиль обновлен!');
    } catch (error) {
      const status = getApiErrorStatus(error);
      if (status === 409) {
        toast.error('Этот email уже используется другим аккаунтом');
      } else {
        toast.error(extractApiErrorMessage(error, 'Не удалось обновить профиль'));
      }
      console.error('Update profile error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user?.id) return;
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Пароль должен быть не менее 6 символов');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.updateUser({
        userId: user.id,
        password: passwordData.newPassword,
      });
      toast.success('Пароль обновлен!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Не удалось обновить пароль'));
      console.error('Update password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStepikConfig = async () => {
    if (!user?.id) return;
    
    if (!stepikConfig.clientId || (!hasStepikConfig && !stepikConfig.clientSecret)) {
      toast.error('Заполните все поля');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.updateStepikOAuthConfig(user.id, {
        clientId: stepikConfig.clientId,
        clientSecret: stepikConfig.clientSecret === '••••••••••••' 
          ? '' 
          : stepikConfig.clientSecret,
      });
      setHasStepikConfig(true);
      toast.success('Stepik настройки обновлены!');
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      const msg = status != null ? `Не удалось обновить настройки (ошибка ${status})` : 'Не удалось обновить настройки';
      toast.error(msg);
      console.error('Update Stepik config error:', status, (error as { response?: unknown })?.response, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearStepikConfig = async () => {
    if (!user?.id) return;
    if (!confirm('Вы уверены, что хотите удалить настройки Stepik?')) return;

    try {
      await authApi.clearStepikOAuthConfig(user.id);
      setHasStepikConfig(false);
      setStepikConfig({ clientId: '', clientSecret: '' });
      toast.success('Настройки Stepik удалены');
    } catch (error) {
      toast.error('Не удалось удалить настройки');
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-dark-100 mb-2">Настройки</h1>
        <p className="text-dark-400 mb-8">Управляйте своим аккаунтом и интеграциями</p>

        <SubscriptionPanel />

        {/* Profile Settings */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary-400" />
            Профиль
          </h2>
          <div className="space-y-4">
            <Input
              label="Имя"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
            />
            <Button onClick={handleUpdateProfile} isLoading={isLoading} icon={<Save className="w-4 h-4" />}>
              Сохранить
            </Button>
          </div>
        </Card>

        {/* Password Settings */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary-400" />
            Смена пароля
          </h2>
          <div className="space-y-4">
            <Input
              label="Новый пароль"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            />
            <Input
              label="Подтвердите пароль"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            />
            <Button 
              onClick={handleUpdatePassword} 
              isLoading={isLoading}
              disabled={!passwordData.newPassword || !passwordData.confirmPassword}
              icon={<Lock className="w-4 h-4" />}
            >
              Обновить пароль
            </Button>
          </div>
        </Card>

        {/* Stepik Integration */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-100 flex items-center gap-2">
              <Key className="w-5 h-5 text-primary-400" />
              Stepik API
            </h2>
            {hasStepikConfig ? (
              <Badge variant="success">
                <Check className="w-3 h-3 mr-1" />
                Настроено
              </Badge>
            ) : (
              <Badge variant="warning">
                <X className="w-3 h-3 mr-1" />
                Не настроено
              </Badge>
            )}
          </div>
          
          <p className="text-dark-400 text-sm mb-4">
            Для синхронизации курсов со Stepik вам нужно создать OAuth2 приложение на{' '}
            <a 
              href="https://stepik.org/oauth2/applications/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300 inline-flex items-center gap-1"
            >
              stepik.org/oauth2/applications
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>

          <div className="space-y-4">
            <Input
              label="Client ID"
              value={stepikConfig.clientId}
              onChange={(e) => setStepikConfig({ ...stepikConfig, clientId: e.target.value })}
              placeholder="Введите Client ID"
            />
            <Input
              label="Client Secret"
              type="password"
              value={stepikConfig.clientSecret}
              onChange={(e) => setStepikConfig({ ...stepikConfig, clientSecret: e.target.value })}
              placeholder={hasStepikConfig ? '••••••••••••' : 'Введите Client Secret'}
            />
            <div className="flex gap-3">
              <Button 
                onClick={handleUpdateStepikConfig} 
                isLoading={isLoading}
                icon={<Save className="w-4 h-4" />}
              >
                Сохранить
              </Button>
              {hasStepikConfig && (
                <Button variant="danger" onClick={handleClearStepikConfig}>
                  Удалить
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 p-4 bg-dark-800 rounded-xl">
            <h3 className="text-sm font-medium text-dark-300 mb-2">Инструкция:</h3>
            <ol className="text-sm text-dark-400 space-y-1 list-decimal list-inside">
              <li>Перейдите на stepik.org/oauth2/applications</li>
              <li>Создайте новое приложение (тип: Confidential)</li>
              <li>Redirect URI: оставьте пустым или укажите localhost</li>
              <li>Скопируйте Client ID и Client Secret</li>
              <li>Вставьте их в поля выше</li>
            </ol>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}

