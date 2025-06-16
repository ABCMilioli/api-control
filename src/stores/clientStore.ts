import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Client } from '../types/index.js';

interface ClientState {
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  initializeMockData: () => void;
}

export const useClientStore = create<ClientState>((set) => ({
  clients: [],
  
  addClient: (clientData) => {
    const newClient: Client = {
      ...clientData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    
    set(state => ({
      clients: [...state.clients, newClient]
    }));
  },
  
  updateClient: (id, updates) => {
    set(state => ({
      clients: state.clients.map(client => 
        client.id === id ? { ...client, ...updates } : client
      )
    }));
  },
  
  initializeMockData: () => {
    const mockClients: Client[] = [
      {
        id: '1',
        name: 'TechCorp Solutions',
        email: 'admin@techcorp.com',
        company: 'TechCorp Solutions Ltd',
        phone: '+55 11 99999-0001',
        notes: 'Cliente premium com múltiplas licenças',
        status: 'active',
        createdAt: new Date('2024-01-15')
      },
      {
        id: '2',
        name: 'InnovaTech Ltd',
        email: 'contact@innovatech.com',
        company: 'InnovaTech Ltd',
        phone: '+55 11 99999-0002',
        notes: 'Startup em crescimento',
        status: 'active',
        createdAt: new Date('2024-02-20')
      },
      {
        id: '3',
        name: 'Digital Dynamics',
        email: 'ops@digitaldynamics.com',
        company: 'Digital Dynamics Corp',
        phone: '+55 11 99999-0003',
        notes: 'Atingiu limite de instalações',
        status: 'active',
        createdAt: new Date('2024-03-10')
      },
      {
        id: '4',
        name: 'CloudFirst Inc',
        email: 'admin@cloudfirst.com',
        company: 'CloudFirst Inc',
        phone: '+55 11 99999-0004',
        notes: 'Conta suspensa temporariamente',
        status: 'suspended',
        createdAt: new Date('2024-01-05')
      }
    ];
    
    set({ clients: mockClients });
  }
}));
