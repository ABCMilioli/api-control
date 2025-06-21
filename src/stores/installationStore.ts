import { create } from 'zustand';
import { Installation } from '../types/index.js';

interface InstallationState {
  installations: Installation[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  fetchInstallations: (page?: number, limit?: number, filters?: any) => Promise<void>;
  addInstallation: (installation: Omit<Installation, 'id'>) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
}

export const useInstallationStore = create<InstallationState>((set, get) => ({
  installations: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  },
  
  fetchInstallations: async (page = 1, limit = 20, filters = {}) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      
      const response = await fetch(`/api/installations?${params}`);
      if (!response.ok) throw new Error('Erro ao carregar instalações');
      
      const data = await response.json();
      
      set({ 
        installations: data.installations,
        pagination: {
          page: data.pagination.page,
          limit: data.pagination.limit,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        },
        loading: false 
      });
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
  },

  setPage: (page: number) => {
    set(state => ({
      pagination: { ...state.pagination, page }
    }));
  },

  setLimit: (limit: number) => {
    set(state => ({
      pagination: { ...state.pagination, limit, page: 1 }
    }));
  }
}));
