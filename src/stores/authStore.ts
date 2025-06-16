
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
        console.log('Initializing auth store...');
        const state = get();
        console.log('Current auth state:', state);
        
        // Auto-login para desenvolvimento
        if (!state.isAuthenticated) {
          console.log('Auto-login for development...');
          set({
            user: {
              id: '1',
              nome: 'Admin',
              email: 'admin@example.com',
              role: 'Administrator'
            },
            isAuthenticated: true
          });
        }
      },

      login: async (email: string, password: string) => {
        console.log('Login attempt:', { email, password });
        
        try {
          // Simulação de login - em produção, faça a validação real
          if (email && password) {
            const user = {
              id: '1',
              nome: 'Admin User',
              email: email,
              role: 'Administrator'
            };
            
            set({ user, isAuthenticated: true });
            console.log('Login successful:', user);
            return true;
          }
          
          console.log('Login failed: invalid credentials');
          return false;
        } catch (error) {
          console.error('Login error:', error);
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
        console.log('Logging out...');
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        console.log('Auth store rehydrated:', state);
        if (state) {
          state.initializeAuth();
        }
      },
    }
  )
);

// Inicializar automaticamente
console.log('Auth store created, initializing...');
useAuthStore.getState().initializeAuth();
