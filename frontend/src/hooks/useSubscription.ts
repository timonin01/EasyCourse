import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import {
  FREE_AI_LIMIT,
  FREE_MAX_BATCH_STEPS,
  PRO_MAX_BATCH_STEPS,
  type SubscriptionStatus,
} from '../constants/subscription';

const DEFAULT_STATUS: SubscriptionStatus = {
  role: 'DEFAULT',
  pro: false,
  aiUsed: 0,
  aiLimit: FREE_AI_LIMIT,
  maxBatchSteps: FREE_MAX_BATCH_STEPS,
  canChangeStepType: false,
  canSelectModel: false,
};

export function useSubscription() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const { status, isLoading, fetchStatus } = useSubscriptionStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchStatus();
    }
  }, [isAuthenticated, user?.id, fetchStatus]);

  const effectiveStatus = status ?? DEFAULT_STATUS;

  return {
    status: effectiveStatus,
    isLoading,
    isPro: effectiveStatus.pro,
    aiUsed: effectiveStatus.aiUsed,
    aiLimit: effectiveStatus.aiLimit,
    maxBatchSteps: effectiveStatus.maxBatchSteps,
    canChangeStepType: effectiveStatus.canChangeStepType,
    canSelectModel: effectiveStatus.canSelectModel,
    refresh: fetchStatus,
    proMaxBatchSteps: PRO_MAX_BATCH_STEPS,
  };
}
