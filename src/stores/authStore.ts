import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api.js';

interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: { nome: string; email: string }) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      initializeAuth: () => {
        const state = get();
        if (!state.token || !state.user) {
          set({
            user: null,
            token: null,
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

          const data = await response.json();
          set({ 
            user: data.user, 
            token: data.token,
            isAuthenticated: true 
          });
          return true;
        } catch (error) {
          return false;
        }
      },

      updateProfile: async (data: { nome: string; email: string }) => {
        try {
          const response = await api.put('/users/me', data);
          if (!response.ok) return false;
          const updatedUser = await response.json();
          set({ user: updatedUser });
          return true;
        } catch (error) {
          return false;
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        try {
          const response = await api.put('/users/me/password', { currentPassword, newPassword });
          const data = await response.json();
          if (!response.ok) {
            return { success: false, message: data.error || 'Erro ao alterar senha' };
          }
          return { success: true, message: data.message || 'Senha alterada com sucesso' };
        } catch (error) {
          return { success: false, message: 'Erro ao alterar senha' };
        }
      },

      logout: () => {
        set({ 
          user: null, 
          token: null,
          isAuthenticated: false 
        });
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
