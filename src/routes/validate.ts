import { Router, Request, Response, RequestHandler } from 'express';
import { prisma } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import geoip from 'geoip-lite';

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
      // Registrar tentativa falha
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

    // Verificar limite de instalações
    if (apiKeyData.currentInstallations >= apiKeyData.maxInstallations) {
      logger.warn('Limite de instalações excedido', { 
        apiKeyId: apiKeyData.id,
        current: apiKeyData.currentInstallations,
        max: apiKeyData.maxInstallations
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
      res.status(403).json({
        success: false,
        error: 'INSTALLATION_LIMIT_EXCEEDED',
        description: 'Limite de instalações excedido para esta chave.',
        code: 403
      });
      return;
    }

    // Atualizar contagem de instalações e último uso
    await prisma.aPIKey.update({
      where: { id: apiKeyData.id },
      data: {
        currentInstallations: apiKeyData.currentInstallations + 1,
        lastUsed: new Date()
      }
    });

    // Registrar instalação bem-sucedida
    const installation = await prisma.installation.create({
      data: {
        apiKeyId: apiKeyData.id,
        ipAddress,
        userAgent,
        location: geoip.lookup(ipAddress)?.city,
        success: true
      }
    });

    logger.info('Validação bem-sucedida', { 
      apiKeyId: apiKeyData.id,
      installationId: installation.id
    });

    res.json({
      success: true,
      valid: true,
      data: {
        clientName: apiKeyData.clientName,
        remainingInstallations: apiKeyData.maxInstallations - (apiKeyData.currentInstallations + 1),
        installationId: installation.id
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