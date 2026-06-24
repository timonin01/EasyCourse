import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { useSubscriptionStore } from './subscriptionStore';
import { useStepikConfigStore } from './stepikConfigStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('userId', user.id.toString());
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        useSubscriptionStore.getState().clear();
        useStepikConfigStore.getState().clear();
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (user) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

