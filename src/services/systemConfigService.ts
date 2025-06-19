import { prisma } from '../lib/database.js';

export const systemConfigService = {
  async getConfig() {
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
    return config;
  }
}; 