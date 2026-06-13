import { api } from './axios';
import type { SubscriptionStatus } from '../constants/subscription';

export const subscriptionApi = {
  getStatus: async (): Promise<SubscriptionStatus> => {
    const response = await api.get<SubscriptionStatus>('/v1/subscription/status');
    return response.data;
  },
};
