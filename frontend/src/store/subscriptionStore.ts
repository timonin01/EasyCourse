import { create } from 'zustand';
import type { SubscriptionStatus } from '../constants/subscription';
import { subscriptionApi } from '../api/subscription.api';

interface SubscriptionState {
  status: SubscriptionStatus | null;
  isLoading: boolean;
  fetchStatus: () => Promise<SubscriptionStatus | null>;
  setStatus: (status: SubscriptionStatus | null) => void;
  clear: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  status: null,
  isLoading: false,

  fetchStatus: async () => {
    set({ isLoading: true });
    try {
      const status = await subscriptionApi.getStatus();
      set({ status, isLoading: false });
      return status;
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
      set({ isLoading: false });
      return null;
    }
  },

  setStatus: (status) => set({ status }),

  clear: () => set({ status: null, isLoading: false }),
}));
