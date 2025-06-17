import { create } from 'zustand';
import { Installation } from '../types/index.js';

interface InstallationState {
  installations: Installation[];
  loading: boolean;
  error: string | null;
  fetchInstallations: () => Promise<void>;
  addInstallation: (installation: Omit<Installation, 'id'>) => void;
}

export const useInstallationStore = create<InstallationState>((set) => ({
  installations: [],
  loading: false,
  error: null,
  
  fetchInstallations: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/installations');
      if (!response.ok) throw new Error('Erro ao carregar instalações');
      const installations = await response.json();
      set({ installations, loading: false });
    } catch (error) {
      set({ 
        error: 'Erro ao carregar instalações',
        loading: false 
      });
    }
  },

  addInstallation: (installationData) => {
    const newInstallation: Installation = {
      ...installationData,
      id: Date.now().toString()
    };
    
    set(state => ({
      installations: [newInstallation, ...state.installations]
    }));
  }
}));
