import { create } from 'zustand';
import { APIKey } from '../types/index.js';
import { api } from '../lib/api.js';

interface APIKeyState {
  apiKeys: APIKey[];
  loading: boolean;
  error: string | null;
  addAPIKey: (apiKey: Omit<APIKey, 'id' | 'createdAt' | 'currentInstallations' | 'lastUsed'>) => Promise<void>;
  updateAPIKey: (id: string, apiKey: Partial<APIKey>) => Promise<void>;
  revokeAPIKey: (id: string) => Promise<void>;
  deleteAPIKey: (id: string) => Promise<void>;
  generateKey: () => string;
  fetchAPIKeys: () => Promise<void>;
}

// Função para gerar chave API
const generateAPIKey = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'ak_';
  for (let i = 0; i < 28; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const useAPIKeyStore = create<APIKeyState>()((set, get) => ({
  apiKeys: [],
  loading: false,
  error: null,

  fetchAPIKeys: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api-keys');
      if (!response.ok) throw new Error('Erro ao carregar API Keys');
      const apiKeys = await response.json();
      set({ apiKeys, loading: false });
    } catch (error) {
      set({ error: 'Erro ao carregar API Keys', loading: false });
    }
  },

  addAPIKey: async (apiKey) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/api-keys', apiKey);
      if (!response.ok) throw new Error('Erro ao criar API Key');
      const newAPIKey = await response.json();
      set(state => ({ 
        apiKeys: [...state.apiKeys, newAPIKey],
        loading: false 
      }));
    } catch (error) {
      set({ error: 'Erro ao criar API Key', loading: false });
    }
  },

  updateAPIKey: async (id, updatedAPIKey) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/api-keys/${id}`, updatedAPIKey);
      if (!response.ok) throw new Error('Erro ao atualizar API Key');
      const updated = await response.json();
      set(state => ({
        apiKeys: state.apiKeys.map(key => key.id === id ? updated : key),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Erro ao atualizar API Key', loading: false });
    }
  },

  revokeAPIKey: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/api-keys/${id}/revoke`);
      if (!response.ok) throw new Error('Erro ao revogar API Key');
      set(state => ({
        apiKeys: state.apiKeys.map(key => 
          key.id === id ? { ...key, isActive: false } : key
        ),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Erro ao revogar API Key', loading: false });
    }
  },

  deleteAPIKey: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.delete(`/api-keys/${id}`);
      if (!response.ok) throw new Error('Erro ao deletar API Key');
      set(state => ({
        apiKeys: state.apiKeys.filter(key => key.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Erro ao deletar API Key', loading: false });
    }
  },

  generateKey: generateAPIKey
}));
