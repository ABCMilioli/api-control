import { create } from 'zustand';
import { Client } from '../types/index.js';
import { api } from '../lib/api.js';

interface ClientStore {
  clients: Client[];
  loading: boolean;
  error: string | null;
  selectedClient: Client | null;
  statusCounts: Record<string, number>;
  fetchClients: (search?: string) => Promise<void>;
  fetchClient: (id: string) => Promise<void>;
  createClient: (data: Omit<Client, 'id' | 'createdAt'>) => Promise<void>;
  updateClient: (id: string, data: Partial<Omit<Client, 'id' | 'createdAt'>>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  setSelectedClient: (client: Client | null) => void;
  fetchStatusCounts: () => Promise<void>;
}

export const useClientStore = create<ClientStore>((set) => ({
  clients: [],
  loading: false,
  error: null,
  selectedClient: null,
  statusCounts: {
    ACTIVE: 0,
    SUSPENDED: 0,
    BLOCKED: 0
  },

  fetchClients: async (search?: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      if (!res.ok) throw new Error('Erro ao carregar clientes');
      const clients = await res.json();
      set({ clients, loading: false });
    } catch (error) {
      set({ error: 'Erro ao carregar clientes', loading: false });
    }
  },

  fetchClient: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/clients/${id}`);
      if (!res.ok) throw new Error('Erro ao carregar cliente');
      const client = await res.json();
      set({ selectedClient: client, loading: false });
    } catch (error) {
      set({ error: 'Erro ao carregar cliente', loading: false });
    }
  },

  createClient: async (data: Omit<Client, 'id' | 'createdAt'>) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/clients', data);
      if (!res.ok) throw new Error('Erro ao criar cliente');
      await res.json();
      await useClientStore.getState().fetchClients();
      set({ loading: false });
    } catch (error) {
      set({ error: 'Erro ao criar cliente', loading: false });
    }
  },

  updateClient: async (id: string, data: Partial<Omit<Client, 'id' | 'createdAt'>>) => {
    set({ loading: true, error: null });
    try {
      const res = await api.put(`/clients/${id}`, data);
      if (!res.ok) throw new Error('Erro ao atualizar cliente');
      await res.json();
      await useClientStore.getState().fetchClients();
      set({ loading: false });
    } catch (error) {
      set({ error: 'Erro ao atualizar cliente', loading: false });
    }
  },

  deleteClient: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.delete(`/clients/${id}`);
      if (!res.ok) throw new Error('Erro ao deletar cliente');
      await useClientStore.getState().fetchClients();
      set({ loading: false });
    } catch (error) {
      set({ error: 'Erro ao deletar cliente', loading: false });
    }
  },

  setSelectedClient: (client: Client | null) => {
    set({ selectedClient: client });
  },

  fetchStatusCounts: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/clients/status-counts');
      if (!res.ok) throw new Error('Erro ao carregar contagem de status');
      const counts = await res.json();
      set({ statusCounts: counts, loading: false });
    } catch (error) {
      set({ error: 'Erro ao carregar contagem de status', loading: false });
    }
  }
}));
