
import { create } from 'zustand';
import { Installation } from '../types';

interface InstallationState {
  installations: Installation[];
  addInstallation: (installation: Omit<Installation, 'id'>) => void;
  initializeMockData: () => void;
}

export const useInstallationStore = create<InstallationState>((set) => ({
  installations: [],
  
  addInstallation: (installationData) => {
    const newInstallation: Installation = {
      ...installationData,
      id: Date.now().toString()
    };
    
    set(state => ({
      installations: [newInstallation, ...state.installations]
    }));
  },
  
  initializeMockData: () => {
    const mockInstallations: Installation[] = [];
    
    // Gerar instalações dos últimos 30 dias
    for (let i = 0; i < 120; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      mockInstallations.push({
        id: i.toString(),
        apiKeyId: ['1', '2', '3', '4'][Math.floor(Math.random() * 4)],
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Docker/24.0.5',
        location: ['São Paulo, BR', 'Rio de Janeiro, BR', 'Belo Horizonte, BR', 'Brasília, BR'][Math.floor(Math.random() * 4)],
        timestamp: date,
        success: Math.random() > 0.1
      });
    }
    
    // Ordenar por data mais recente
    mockInstallations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    set({ installations: mockInstallations });
  }
}));
