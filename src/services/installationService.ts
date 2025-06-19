import { prisma } from '../lib/database.js';
import { notificationService } from './notificationService.js';
import { webhookService } from './webhookService.js';
import { systemConfigService } from './systemConfigService.js';
import { logger } from '../lib/logger.js';
import geoip from 'geoip-lite';

export const installationService = {
  async listInstallations() {
    const installations = await prisma.installation.findMany({
      orderBy: {
        timestamp: 'desc'
      },
      include: {
        apiKey: true
      }
    });
    return installations;
  },

  async getInstallationStatus(id: string) {
    const installation = await prisma.installation.findUnique({ 
      where: { id } 
    });
    
    if (!installation) {
      return { active: false, message: 'Instalação não encontrada' };
    }
    
    return { 
      active: installation.success, 
      message: installation.success ? 'Instalação ativa' : 'Instalação revogada' 
    };
  },

  async createFailedInstallation(data: {
    apiKeyId: string;
    ipAddress: string;
    userAgent?: string;
    reason: string;
  }) {
    logger.info('Criando instalação falhada', { data });

    const installation = await prisma.installation.create({
      data: {
        apiKeyId: data.apiKeyId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        location: geoip.lookup(data.ipAddress)?.city,
        success: false
      }
    });

    logger.info('Instalação falhada criada', { 
      installationId: installation.id,
      apiKeyId: data.apiKeyId,
      reason: data.reason
    });

    // Verificar se deve notificar sobre tentativas de acesso negadas
    const shouldNotifyAccessDenied = await systemConfigService.shouldNotifyAccessDenied();
    
    if (shouldNotifyAccessDenied) {
      try {
        await notificationService.createNotification({
          title: 'Tentativa de Acesso Negada',
          message: `Tentativa de instalação falhada do IP ${data.ipAddress}. Motivo: ${data.reason}`,
          type: 'warning'
        });
        logger.info('Notificação de acesso negado criada com sucesso');
      } catch (error) {
        logger.error('Erro ao criar notificação de acesso negado', { 
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    // Disparar webhook para evento de instalação falhada
    try {
      logger.info('🚀 [INSTALLATION-WEBHOOK] Iniciando disparo de webhook para instalação falhada', { 
        installationId: installation.id,
        apiKeyId: data.apiKeyId,
        event: 'installation.failed'
      });
      
      await webhookService.dispatchWebhook('installation.failed', {
        installationId: installation.id,
        apiKeyId: data.apiKeyId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        location: geoip.lookup(data.ipAddress)?.city,
        error: data.reason,
        timestamp: installation.timestamp,
        timestampISO: installation.timestamp.toISOString()
      });
      
      logger.info('✅ [INSTALLATION-WEBHOOK] Webhook disparado com sucesso para instalação falhada', { 
        installationId: installation.id,
        apiKeyId: data.apiKeyId,
        event: 'installation.failed'
      });
    } catch (error) {
      logger.error('💥 [INSTALLATION-WEBHOOK] Erro ao disparar webhook para instalação falhada', { 
        installationId: installation.id,
        apiKeyId: data.apiKeyId,
        event: 'installation.failed',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }

    return installation;
  },

  async createSuccessfulInstallation(data: {
    apiKeyId: string;
    ipAddress: string;
    userAgent?: string;
    replacedInstallationId?: string | null;
  }) {
    logger.info('Criando instalação bem-sucedida', { data });

    const installation = await prisma.installation.create({
      data: {
        apiKeyId: data.apiKeyId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        location: geoip.lookup(data.ipAddress)?.city,
        success: true
      }
    });

    // Atualizar currentInstallations na APIKey
    const currentInstallations = await prisma.installation.count({
      where: { apiKeyId: data.apiKeyId, success: true }
    });

    await prisma.aPIKey.update({
      where: { id: data.apiKeyId },
      data: {
        currentInstallations,
        lastUsed: new Date()
      }
    });

    logger.info('Instalação bem-sucedida criada', { 
      installationId: installation.id,
      apiKeyId: data.apiKeyId,
      currentInstallations,
      replacedInstallationId: data.replacedInstallationId
    });

    // Verificar se deve notificar sobre chaves próximas do limite
    const shouldNotifyKeyLimit = await systemConfigService.shouldNotifyKeyLimit();
    const apiKey = await prisma.aPIKey.findUnique({ where: { id: data.apiKeyId } });
    
    if (shouldNotifyKeyLimit && apiKey) {
      const usagePercentage = (currentInstallations / apiKey.maxInstallations) * 100;
      
      // Notificar quando atingir 80% do limite
      if (usagePercentage >= 80) {
        try {
          await notificationService.createNotification({
            title: 'API Key Próxima do Limite',
            message: `A API Key do cliente ${apiKey.clientName} está com ${currentInstallations}/${apiKey.maxInstallations} instalações (${usagePercentage.toFixed(1)}%)`,
            type: 'warning'
          });
          logger.info('Notificação de limite próximo criada com sucesso');
        } catch (error) {
          logger.error('Erro ao criar notificação de limite próximo', { 
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }
    }

    // Disparar webhook para evento de instalação bem-sucedida
    try {
      logger.info('🚀 [INSTALLATION-WEBHOOK] Iniciando disparo de webhook para instalação bem-sucedida', { 
        installationId: installation.id,
        apiKeyId: data.apiKeyId,
        event: 'installation.success'
      });
      
      await webhookService.dispatchWebhook('installation.success', {
        installationId: installation.id,
        apiKeyId: data.apiKeyId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        location: geoip.lookup(data.ipAddress)?.city,
        currentInstallations,
        replacedInstallationId: data.replacedInstallationId,
        timestamp: installation.timestamp,
        timestampISO: installation.timestamp.toISOString()
      });
      
      logger.info('✅ [INSTALLATION-WEBHOOK] Webhook disparado com sucesso para instalação bem-sucedida', { 
        installationId: installation.id,
        apiKeyId: data.apiKeyId,
        event: 'installation.success'
      });
    } catch (error) {
      logger.error('💥 [INSTALLATION-WEBHOOK] Erro ao disparar webhook para instalação bem-sucedida', { 
        installationId: installation.id,
        apiKeyId: data.apiKeyId,
        event: 'installation.success',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }

    return installation;
  },

  async replaceOldInstallation(installationId: string) {
    logger.info('Substituindo instalação antiga', { installationId });

    const installation = await prisma.installation.update({
      where: { id: installationId },
      data: { success: false }
    });

    logger.info('Instalação antiga substituída', { installationId });

    return installation;
  },

  async validateAPIKey(data: {
    apiKey: string;
    ipAddress: string;
    userAgent?: string;
  }) {
    logger.info('Iniciando validação de API Key', { 
      ipAddress: data.ipAddress,
      userAgent: data.userAgent
    });

    // Buscar a chave API
    const apiKeyData = await prisma.aPIKey.findFirst({
      where: { 
        key: data.apiKey,
        isActive: true
      }
    });

    // Se a chave não existe ou está inativa
    if (!apiKeyData) {
      logger.warn('API Key inválida ou inativa', { apiKey: data.apiKey });
      
      // Buscar ou criar API Key especial para tentativas inválidas
      let invalidApiKey = await prisma.aPIKey.findFirst({
        where: { 
          key: 'INVALID_API_KEY',
          clientName: 'Sistema - Tentativas Inválidas'
        }
      });

      if (!invalidApiKey) {
        // Verificar se o cliente especial existe
        let systemClient = await prisma.client.findFirst({
          where: { 
            email: 'system@api-control.com',
            name: 'Sistema - Tentativas Inválidas'
          }
        });

        if (!systemClient) {
          // Criar cliente especial se não existir
          systemClient = await prisma.client.create({
            data: {
              name: 'Sistema - Tentativas Inválidas',
              email: 'system@api-control.com',
              company: 'Sistema Interno',
              notes: 'Cliente especial para rastreamento de tentativas inválidas',
              status: 'BLOCKED' // Sempre bloqueado
            }
          });
          logger.info('Cliente especial para tentativas inválidas criado', { 
            clientId: systemClient.id 
          });
        }

        // Criar API Key especial se não existir
        invalidApiKey = await prisma.aPIKey.create({
          data: {
            key: 'INVALID_API_KEY',
            clientId: systemClient.id,
            clientName: systemClient.name,
            clientEmail: systemClient.email,
            maxInstallations: 999999, // Limite alto para não bloquear
            isActive: false, // Sempre inativa
            expiresAt: new Date('2099-12-31') // Nunca expira
          }
        });
        logger.info('API Key especial para tentativas inválidas criada', { 
          apiKeyId: invalidApiKey.id 
        });
      }

      // Criar instalação falhada para rastreamento
      await this.createFailedInstallation({
        apiKeyId: invalidApiKey.id,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        reason: 'API_KEY_INACTIVE'
      });

      // Verificar se deve notificar sobre tentativas de acesso negadas
      const shouldNotifyAccessDenied = await systemConfigService.shouldNotifyAccessDenied();
      
      if (shouldNotifyAccessDenied) {
        try {
          await notificationService.createNotification({
            title: 'Tentativa de Acesso Negada',
            message: `Tentativa de instalação com API Key inválida do IP ${data.ipAddress}. Chave: ${data.apiKey}`,
            type: 'warning'
          });
          logger.info('Notificação de acesso negado criada com sucesso para API Key inválida');
        } catch (error) {
          logger.error('Erro ao criar notificação de acesso negado', { 
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }

      return {
        success: false,
        error: 'API_KEY_INACTIVE',
        description: 'A chave de API informada está desativada ou não existe.',
        code: 401
      };
    }

    // Verificar se a chave expirou
    if (apiKeyData.expiresAt && new Date() > apiKeyData.expiresAt) {
      logger.warn('API Key expirada', { 
        apiKeyId: apiKeyData.id,
        expiresAt: apiKeyData.expiresAt 
      });

      // Criar notificação para a expiração da API Key
      try {
        await notificationService.createNotification({
          title: 'API Key Expirada',
          message: `A API Key do cliente ${apiKeyData.clientName} expirou em ${new Date(apiKeyData.expiresAt).toLocaleDateString('pt-BR')}`,
          type: 'error'
        });
      } catch (error) {
        logger.error('Erro ao criar notificação para API Key expirada', { 
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }

      await this.createFailedInstallation({
        apiKeyId: apiKeyData.id,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        reason: 'API_KEY_EXPIRED'
      });

      return {
        success: false,
        error: 'API_KEY_EXPIRED',
        description: 'A chave de API informada está expirada.',
        code: 401
      };
    }

    // Buscar instalações ativas
    const activeInstallations = await prisma.installation.findMany({
      where: { apiKeyId: apiKeyData.id, success: true },
      orderBy: { timestamp: 'asc' }
    });

    let replacedInstallationId: string | null = null;
    
    // Se já atingiu o limite, derruba a mais antiga
    if (activeInstallations.length >= apiKeyData.maxInstallations) {
      const toRemove = activeInstallations[0];
      await this.replaceOldInstallation(toRemove.id);
      replacedInstallationId = toRemove.id;
      
      logger.info('Substituindo instalação antiga para permitir nova', { 
        apiKeyId: apiKeyData.id,
        removedInstallationId: toRemove.id,
        currentInstallations: activeInstallations.length,
        maxInstallations: apiKeyData.maxInstallations
      });
      
      // Disparar webhook para evento de limite atingido
      try {
        logger.info('🚀 [INSTALLATION-WEBHOOK] Iniciando disparo de webhook para limite de instalações atingido', { 
          apiKeyId: apiKeyData.id,
          event: 'installation.limit_reached'
        });
        
        await webhookService.dispatchWebhook('installation.limit_reached', {
          apiKeyId: apiKeyData.id,
          clientName: apiKeyData.clientName,
          maxInstallations: apiKeyData.maxInstallations,
          currentInstallations: activeInstallations.length,
          replacedInstallationId: toRemove.id,
          timestamp: new Date().toISOString()
        });
        
        logger.info('✅ [INSTALLATION-WEBHOOK] Webhook disparado com sucesso para limite de instalações atingido', { 
          apiKeyId: apiKeyData.id,
          event: 'installation.limit_reached'
        });
      } catch (error) {
        logger.error('💥 [INSTALLATION-WEBHOOK] Erro ao disparar webhook para limite de instalações atingido', { 
          apiKeyId: apiKeyData.id,
          event: 'installation.limit_reached',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    // Registrar a nova instalação
    const newInstallation = await this.createSuccessfulInstallation({
      apiKeyId: apiKeyData.id,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      replacedInstallationId
    });

    logger.info('Validação bem-sucedida', { 
      apiKeyId: apiKeyData.id,
      installationId: newInstallation.id,
      replacedInstallationId
    });

    return {
      success: true,
      valid: true,
      data: {
        clientName: apiKeyData.clientName,
        installationId: newInstallation.id,
        replacedInstallationId
      }
    };
  }
}; 