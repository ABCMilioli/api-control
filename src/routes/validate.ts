import { Router, Request, Response, RequestHandler } from 'express';
import { prisma } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import geoip from 'geoip-lite';
import { notificationService } from '../services/notificationService.js';

const router = Router();

interface ValidateRequest {
  apiKey: string;
  ipAddress?: string;
  userAgent?: string;
}

const validateAPIKey: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const { apiKey, userAgent } = req.body as ValidateRequest;
  const ipAddress = req.body.ipAddress || req.ip;

  logger.info('Iniciando validação de API Key', { 
    ipAddress,
    userAgent
  });

  try {
    // Buscar a chave API
    const apiKeyData = await prisma.aPIKey.findFirst({
      where: { 
        key: apiKey,
        isActive: true
      }
    });

    // Se a chave não existe ou está inativa
    if (!apiKeyData) {
      logger.warn('API Key inválida ou inativa', { apiKey });
      await prisma.installation.create({
        data: {
          apiKeyId: 'invalid',
          ipAddress,
          userAgent,
          location: geoip.lookup(ipAddress)?.city,
          success: false
        }
      });
      res.status(401).json({
        success: false,
        error: 'API_KEY_INACTIVE',
        description: 'A chave de API informada está desativada ou não existe.',
        code: 401
      });
      return;
    }

    // Verificar se a chave expirou
    if (apiKeyData.expiresAt && new Date() > apiKeyData.expiresAt) {
      logger.warn('API Key expirada', { 
        apiKeyId: apiKeyData.id,
        expiresAt: apiKeyData.expiresAt 
      });

      // Criar notificação para a expiração da API Key
      await notificationService.createNotification({
        title: 'API Key Expirada',
        message: `A API Key do cliente ${apiKeyData.clientName} expirou em ${new Date(apiKeyData.expiresAt).toLocaleDateString('pt-BR')}`,
        type: 'error'
      });

      await prisma.installation.create({
        data: {
          apiKeyId: apiKeyData.id,
          ipAddress,
          userAgent,
          location: geoip.lookup(ipAddress)?.city,
          success: false
        }
      });
      res.status(401).json({
        success: false,
        error: 'API_KEY_EXPIRED',
        description: 'A chave de API informada está expirada.',
        code: 401
      });
      return;
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
      await prisma.installation.update({
        where: { id: toRemove.id },
        data: { success: false }
      });
      replacedInstallationId = toRemove.id;
    }

    // Registrar a nova instalação
    const newInstallation = await prisma.installation.create({
      data: {
        apiKeyId: apiKeyData.id,
        ipAddress,
        userAgent,
        location: geoip.lookup(ipAddress)?.city,
        success: true
      }
    });

    // Atualizar currentInstallations na APIKey
    await prisma.aPIKey.update({
      where: { id: apiKeyData.id },
      data: {
        currentInstallations: await prisma.installation.count({
          where: { apiKeyId: apiKeyData.id, success: true }
        }),
        lastUsed: new Date()
      }
    });

    logger.info('Validação bem-sucedida', { 
      apiKeyId: apiKeyData.id,
      installationId: newInstallation.id,
      replacedInstallationId
    });

    res.json({
      success: true,
      valid: true,
      data: {
        clientName: apiKeyData.clientName,
        installationId: newInstallation.id,
        replacedInstallationId
      }
    });
  } catch (error) {
    logger.error('Erro ao validar API Key', { 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      description: 'Erro interno ao validar API Key. Tente novamente mais tarde.',
      code: 500,
      details: process.env.NODE_ENV === 'development' ? { stack: error instanceof Error ? error.stack : error } : undefined
    });
  }
};

router.post('/', validateAPIKey);

export { router as validateRouter }; 