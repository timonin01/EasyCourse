import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useStepikConfigStore } from '../store/stepikConfigStore';

export function useStepikOAuthStatus() {
  const user = useAuthStore((state) => state.user);
  const { hasConfig, isLoading, fetchStatus, setHasConfig } = useStepikConfigStore();

  useEffect(() => {
    if (user?.id) {
      void fetchStatus(user.id);
    }
  }, [user?.id, fetchStatus]);

  return {
    hasConfig,
    isCheckingConfig: hasConfig === null || isLoading,
    setHasConfig,
    refresh: () => (user?.id ? fetchStatus(user.id) : Promise.resolve(false)),
  };
}
