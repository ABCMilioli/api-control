import { prisma } from '../lib/database.js';

// Cache para configurações (evita múltiplas consultas ao banco)
let configCache: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const systemConfigService = {
  async getConfig() {
    // Verificar se o cache ainda é válido
    const now = Date.now();
    if (configCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return configCache;
    }

    let config = await prisma.systemConfig.findUnique({ where: { id: 'main' } });
    if (!config) {
      // Cria com valores padrão se não existir
      config = await prisma.systemConfig.create({
        data: {
          id: 'main',
          defaultLimit: 100,
          defaultExpiry: 365,
          notifyKeyLimit: true,
          notifyAccessDenied: true,
          notifyWeeklyReport: false
        }
      });
    }

    // Atualizar cache
    configCache = config;
    cacheTimestamp = now;
    
    return config;
  },

  async updateConfig(data: Partial<{
    defaultLimit: number;
    defaultExpiry: number;
    notifyKeyLimit: boolean;
    notifyAccessDenied: boolean;
    notifyWeeklyReport: boolean;
  }>) {
    const config = await prisma.systemConfig.update({
      where: { id: 'main' },
      data
    });
    
    // Invalidar cache
    configCache = null;
    
    return config;
  },

  // Métodos específicos para acessar configurações individuais
  async getDefaultLimit(): Promise<number> {
    const config = await this.getConfig();
    return config.defaultLimit;
  },

  async getDefaultExpiry(): Promise<number> {
    const config = await this.getConfig();
    return config.defaultExpiry;
  },

  async shouldNotifyKeyLimit(): Promise<boolean> {
    const config = await this.getConfig();
    return config.notifyKeyLimit;
  },

  async shouldNotifyAccessDenied(): Promise<boolean> {
    const config = await this.getConfig();
    return config.notifyAccessDenied;
  },

  async shouldNotifyWeeklyReport(): Promise<boolean> {
    const config = await this.getConfig();
    return config.notifyWeeklyReport;
  },

  // Invalidar cache (útil para testes ou quando precisamos forçar atualização)
  invalidateCache() {
    configCache = null;
    cacheTimestamp = 0;
  }
}; 