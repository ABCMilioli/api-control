import { Router, Request, Response, RequestHandler } from 'express';
import { installationService } from '../services/installationService.js';
import { logger } from '../lib/logger.js';

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
    const result = await installationService.validateAPIKey({
      apiKey,
      ipAddress,
      userAgent
    });

    res.status(result.code || 200).json(result);
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