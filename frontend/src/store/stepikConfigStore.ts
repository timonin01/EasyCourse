import { create } from 'zustand';
import { authApi } from '../api/auth.api';

interface StepikConfigState {
  hasConfig: boolean | null;
  isLoading: boolean;
  fetchStatus: (userId: number) => Promise<boolean>;
  setHasConfig: (hasConfig: boolean) => void;
  clear: () => void;
}

export const useStepikConfigStore = create<StepikConfigState>((set) => ({
  hasConfig: null,
  isLoading: false,

  fetchStatus: async (userId: number) => {
    set((state) => ({ isLoading: state.hasConfig === null }));
    try {
      const hasConfig = await authApi.hasStepikOAuthConfig(userId);
      set({ hasConfig, isLoading: false });
      return hasConfig;
    } catch (error) {
      console.error('Failed to check Stepik OAuth config:', error);
      set({ hasConfig: false, isLoading: false });
      return false;
    }
  },

  setHasConfig: (hasConfig) => set({ hasConfig, isLoading: false }),

  clear: () => set({ hasConfig: null, isLoading: false }),
}));
