import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: { nome: string; email: string }) => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      initializeAuth: () => {
        const state = get();
        if (!state.isAuthenticated) {
          set({
            user: null,
            isAuthenticated: false
          });
        }
      },

      login: async (email: string, password: string) => {
        try {
          const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });

          if (!response.ok) {
            return false;
          }

          const user = await response.json();
          set({ user, isAuthenticated: true });
          return true;
        } catch (error) {
          return false;
        }
      },

      updateProfile: (data: { nome: string; email: string }) => {
        const state = get();
        if (state.user) {
          set({
            user: {
              ...state.user,
              nome: data.nome,
              email: data.email
            }
          });
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initializeAuth();
        }
      },
    }
  )
);

useAuthStore.getState().initializeAuth();
