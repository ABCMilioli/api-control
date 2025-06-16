import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { APIKey } from '../types/index.js';

interface APIKeyState {
  apiKeys: APIKey[];
  loading: boolean;
  addAPIKey: (apiKey: APIKey) => void;
  updateAPIKey: (id: string, apiKey: Partial<APIKey>) => void;
  revokeAPIKey: (id: string) => void;
  deleteAPIKey: (id: string) => void;
  generateKey: () => string;
  initializeMockData: () => void;
  removeAPIKey: (id: string) => void;
  getAPIKey: (id: string) => APIKey | undefined;
  clearAPIKeys: () => void;
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

export const useAPIKeyStore = create<APIKeyState>()(
  persist(
    (set, get) => ({
      apiKeys: [],
      loading: false,
      
      addAPIKey: (apiKey) => set((state) => ({ 
        apiKeys: [...state.apiKeys, apiKey] 
      })),
      
      updateAPIKey: (id, updatedAPIKey) => set((state) => ({
        apiKeys: state.apiKeys.map((key) =>
          key.id === id ? { ...key, ...updatedAPIKey } : key
        ),
      })),
      
      revokeAPIKey: (id) => set(state => ({
        apiKeys: state.apiKeys.map(key => 
          key.id === id ? { ...key, isActive: false } : key
        )
      })),

      deleteAPIKey: (id) => set(state => ({
        apiKeys: state.apiKeys.filter(key => key.id !== id)
      })),
      
      generateKey: generateAPIKey,
      
      initializeMockData: () => {
        const mockKeys: APIKey[] = [
          {
            id: '1',
            key: 'ak_1a2b3c4d5e6f7g8h9i0j1k2l3m4n',
            clientId: '1',
            clientName: 'TechCorp Solutions',
            clientEmail: 'admin@techcorp.com',
            maxInstallations: 100,
            currentInstallations: 45,
            isActive: true,
            createdAt: new Date('2024-01-15'),
            expiresAt: new Date('2024-12-31'),
            lastUsed: new Date('2024-06-14')
          },
          {
            id: '2',
            key: 'ak_5o6p7q8r9s0t1u2v3w4x5y6z7a8b',
            clientId: '2',
            clientName: 'InnovaTech Ltd',
            clientEmail: 'contact@innovatech.com',
            maxInstallations: 50,
            currentInstallations: 12,
            isActive: true,
            createdAt: new Date('2024-02-20'),
            expiresAt: new Date('2024-11-30'),
            lastUsed: new Date('2024-06-13')
          },
          {
            id: '3',
            key: 'ak_9c0d1e2f3g4h5i6j7k8l9m0n1o2p',
            clientId: '3',
            clientName: 'Digital Dynamics',
            clientEmail: 'ops@digitaldynamics.com',
            maxInstallations: 25,
            currentInstallations: 25,
            isActive: true,
            createdAt: new Date('2024-03-10'),
            expiresAt: new Date('2024-12-15'),
            lastUsed: new Date('2024-06-15')
          },
          {
            id: '4',
            key: 'ak_3q4r5s6t7u8v9w0x1y2z3a4b5c6d',
            clientId: '4',
            clientName: 'CloudFirst Inc',
            clientEmail: 'admin@cloudfirst.com',
            maxInstallations: 75,
            currentInstallations: 8,
            isActive: false,
            createdAt: new Date('2024-01-05'),
            expiresAt: new Date('2024-06-30'),
            lastUsed: new Date('2024-05-20')
          }
        ];
        
        set({ apiKeys: mockKeys });
      },

      removeAPIKey: (id) => set((state) => ({ 
        apiKeys: state.apiKeys.filter((key) => key.id !== id) 
      })),

      getAPIKey: (id) => get().apiKeys.find((key) => key.id === id),

      clearAPIKeys: () => set({ apiKeys: [] }),
    }),
    {
      name: 'api-key-storage',
    }
  )
);
