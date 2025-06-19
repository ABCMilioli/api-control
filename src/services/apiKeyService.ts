import { prisma } from '../lib/database.js';
import { notificationService } from './notificationService.js';
import { webhookService } from './webhookService.js';
import { systemConfigService } from './systemConfigService.js';
import { logger } from '../lib/logger.js';

export const apiKeyService = {
  async listAPIKeys() {
    const apiKeys = await prisma.aPIKey.findMany({
      include: {
        client: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return apiKeys;
  },

  async getAPIKey(id: string) {
    const apiKey = await prisma.aPIKey.findUnique({
      where: { id },
      include: {
        client: true
      }
    });
    return apiKey;
  },

  async createAPIKey(data: {
    key: string;
    clientId: string;
    clientName: string;
    clientEmail: string;
    maxInstallations?: number;
    isActive?: boolean;
    expiresAt?: Date;
  }) {
    logger.info('Iniciando criação de nova API Key', { data });

    // Verificar se o cliente existe
    const client = await prisma.client.findUnique({
      where: { id: data.clientId }
    });

    if (!client) {
      logger.error('Cliente não encontrado', { clientId: data.clientId });
      throw new Error('Cliente não encontrado');
    }

    // Usar configurações do sistema para valores padrão
    const defaultLimit = await systemConfigService.getDefaultLimit();
    const defaultExpiry = await systemConfigService.getDefaultExpiry();
    
    // Calcular data de expiração baseada na configuração padrão
    const calculatedExpiresAt = data.expiresAt || new Date(Date.now() + (defaultExpiry * 24 * 60 * 60 * 1000));
    
    // Usar limite padrão se não especificado
    const maxInstallations = data.maxInstallations || defaultLimit;

    logger.info('Usando configurações do sistema', {
      defaultLimit,
      defaultExpiry,
      calculatedExpiresAt,
      maxInstallations
    });

    const apiKey = await prisma.aPIKey.create({
      data: {
        key: data.key,
        clientId: data.clientId,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        maxInstallations,
        isActive: data.isActive !== undefined ? data.isActive : true,
        expiresAt: calculatedExpiresAt
      }
    });

    logger.info('API Key criada com sucesso', { 
      apiKeyId: apiKey.id, 
      clientId: apiKey.clientId,
      maxInstallations,
      expiresAt: calculatedExpiresAt
    });

    // Criar notificação
    try {
      await notificationService.createNotification({
        title: 'Nova API Key Criada',
        message: `Uma nova API Key foi criada para o cliente ${apiKey.clientName}`,
        type: 'info'
      });
      logger.info('Notificação criada com sucesso para nova API Key');
    } catch (error) {
      logger.error('Erro ao criar notificação para nova API Key', { 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }

    // Disparar webhook para evento de API Key criada
    try {
      logger.info('🚀 [APIKEY-WEBHOOK] Iniciando disparo de webhook para API Key criada', { 
        apiKeyId: apiKey.id,
        clientId: apiKey.clientId,
        clientName: apiKey.clientName,
        event: 'key.created'
      });
      
      await webhookService.dispatchWebhook('key.created', {
        apiKeyId: apiKey.id,
        clientId: apiKey.clientId,
        clientName: apiKey.clientName,
        clientEmail: apiKey.clientEmail,
        maxInstallations: apiKey.maxInstallations,
        currentInstallations: apiKey.currentInstallations,
        isActive: apiKey.isActive,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
        timestamp: new Date().toISOString()
      });
      
      logger.info('✅ [APIKEY-WEBHOOK] Webhook disparado com sucesso para API Key criada', { 
        apiKeyId: apiKey.id,
        clientName: apiKey.clientName,
        event: 'key.created'
      });
    } catch (error) {
      logger.error('💥 [APIKEY-WEBHOOK] Erro ao disparar webhook para API Key criada', { 
        apiKeyId: apiKey.id,
        clientName: apiKey.clientName,
        event: 'key.created',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }

    return apiKey;
  },

  async updateAPIKey(id: string, updates: any) {
    logger.info('Iniciando atualização de API Key', { 
      apiKeyId: id,
      updates
    });

    // Buscar a API Key antes de atualizar
    const oldApiKey = await prisma.aPIKey.findUnique({
      where: { id }
    });

    if (!oldApiKey) {
      logger.error('API Key não encontrada', { apiKeyId: id });
      throw new Error('API Key não encontrada');
    }

    const apiKey = await prisma.aPIKey.update({
      where: { id },
      data: updates
    });

    logger.info('API Key atualizada com sucesso', { 
      apiKeyId: id,
      updates
    });

    // Criar notificação
    try {
      await notificationService.createNotification({
        title: 'API Key Atualizada',
        message: `A API Key do cliente ${apiKey.clientName} foi atualizada. Alterações: ${Object.keys(updates).join(', ')}`,
        type: 'info'
      });
      logger.info('Notificação criada com sucesso para API Key atualizada');
    } catch (error) {
      logger.error('Erro ao criar notificação para API Key atualizada', { 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }

    // Disparar webhook para evento de API Key atualizada
    try {
      logger.info('🚀 [APIKEY-WEBHOOK] Iniciando disparo de webhook para API Key atualizada', { 
        apiKeyId: apiKey.id,
        clientId: apiKey.clientId,
        clientName: apiKey.clientName,
        event: 'key.updated'
      });
      
      await webhookService.dispatchWebhook('key.updated', {
        apiKeyId: apiKey.id,
        clientId: apiKey.clientId,
        clientName: apiKey.clientName,
        clientEmail: apiKey.clientEmail,
        maxInstallations: apiKey.maxInstallations,
        currentInstallations: apiKey.currentInstallations,
        isActive: apiKey.isActive,
        previousData: {
          maxInstallations: oldApiKey.maxInstallations,
          isActive: oldApiKey.isActive,
          expiresAt: oldApiKey.expiresAt
        },
        updatedAt: new Date().toISOString(),
        timestamp: new Date().toISOString()
      });
      
      logger.info('✅ [APIKEY-WEBHOOK] Webhook disparado com sucesso para API Key atualizada', { 
        apiKeyId: apiKey.id,
        clientName: apiKey.clientName,
        event: 'key.updated'
      });
    } catch (error) {
      logger.error('💥 [APIKEY-WEBHOOK] Erro ao disparar webhook para API Key atualizada', { 
        apiKeyId: apiKey.id,
        clientName: apiKey.clientName,
        event: 'key.updated',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }

    return apiKey;
  },

  async revokeAPIKey(id: string) {
    logger.info('Iniciando revogação de API Key', { apiKeyId: id });

    const apiKey = await prisma.aPIKey.update({
      where: { id },
      data: { isActive: false }
    });

    logger.info('API Key revogada com sucesso', { apiKeyId: id });

    // Criar notificação
    try {
      await notificationService.createNotification({
        title: 'API Key Revogada',
        message: `A API Key do cliente ${apiKey.clientName} foi revogada`,
        type: 'warning'
      });
      logger.info('Notificação criada com sucesso para API Key revogada');
    } catch (error) {
      logger.error('Erro ao criar notificação para API Key revogada', { 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }

    // Disparar webhook para evento de API Key revogada
    try {
      logger.info('🚀 [APIKEY-WEBHOOK] Iniciando disparo de webhook para API Key revogada', { 
        apiKeyId: apiKey.id,
        clientId: apiKey.clientId,
        clientName: apiKey.clientName,
        event: 'key.deactivated'
      });
      
      await webhookService.dispatchWebhook('key.deactivated', {
        apiKeyId: apiKey.id,
        clientId: apiKey.clientId,
        clientName: apiKey.clientName,
        clientEmail: apiKey.clientEmail,
        isActive: false,
        revokedAt: new Date().toISOString(),
        timestamp: new Date().toISOString()
      });
      
      logger.info('✅ [APIKEY-WEBHOOK] Webhook disparado com sucesso para API Key revogada', { 
        apiKeyId: apiKey.id,
        clientName: apiKey.clientName,
        event: 'key.deactivated'
      });
    } catch (error) {
      logger.error('💥 [APIKEY-WEBHOOK] Erro ao disparar webhook para API Key revogada', { 
        apiKeyId: apiKey.id,
        clientName: apiKey.clientName,
        event: 'key.deactivated',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }

    return apiKey;
  },

  async deleteAPIKey(id: string) {
    logger.info('Iniciando exclusão de API Key', { apiKeyId: id });

    // Buscar a API Key antes de excluir
    const apiKey = await prisma.aPIKey.findUnique({
      where: { id }
    });

    if (!apiKey) {
      logger.error('API Key não encontrada', { apiKeyId: id });
      throw new Error('API Key não encontrada');
    }

    // Criar notificação antes de excluir
    try {
      await notificationService.createNotification({
        title: 'API Key Excluída',
        message: `A API Key do cliente ${apiKey.clientName} foi excluída`,
        type: 'warning'
      });
      logger.info('Notificação criada com sucesso para API Key excluída');
    } catch (error) {
      logger.error('Erro ao criar notificação para API Key excluída', { 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }

    // Disparar webhook para evento de API Key excluída
    try {
      logger.info('🚀 [APIKEY-WEBHOOK] Iniciando disparo de webhook para API Key excluída', { 
        apiKeyId: apiKey.id,
        clientId: apiKey.clientId,
        clientName: apiKey.clientName,
        event: 'key.deleted'
      });
      
      await webhookService.dispatchWebhook('key.deleted', {
        apiKeyId: apiKey.id,
        clientId: apiKey.clientId,
        clientName: apiKey.clientName,
        clientEmail: apiKey.clientEmail,
        maxInstallations: apiKey.maxInstallations,
        currentInstallations: apiKey.currentInstallations,
        isActive: apiKey.isActive,
        deletedAt: new Date().toISOString(),
        timestamp: new Date().toISOString()
      });
      
      logger.info('✅ [APIKEY-WEBHOOK] Webhook disparado com sucesso para API Key excluída', { 
        apiKeyId: apiKey.id,
        clientName: apiKey.clientName,
        event: 'key.deleted'
      });
    } catch (error) {
      logger.error('💥 [APIKEY-WEBHOOK] Erro ao disparar webhook para API Key excluída', { 
        apiKeyId: apiKey.id,
        clientName: apiKey.clientName,
        event: 'key.deleted',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }

    await prisma.aPIKey.delete({
      where: { id }
    });

    logger.info('API Key excluída com sucesso', { apiKeyId: id });
  }
}; 