
export interface APIKey {
  id: string;
  key: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  maxInstallations: number;
  currentInstallations: number;
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date | null;
  lastUsed: Date | null;
}

export interface Installation {
  id: string;
  apiKeyId: string;
  ipAddress: string;
  userAgent?: string;
  location?: string;
  timestamp: Date;
  success: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  notes?: string;
  status: 'active' | 'suspended' | 'blocked';
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  nome: string;
  role: 'admin' | 'user';
  ativo: boolean;
  dataCriacao: Date;
  dataAtualizacao: Date;
}

export interface DashboardMetrics {
  totalActiveKeys: number;
  installationsToday: number;
  activeClients: number;
  successRate: number;
}
