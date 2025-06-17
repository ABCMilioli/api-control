import { Router, Request, Response, RequestHandler } from 'express';
import { prisma } from '../lib/database.js';
import { logger } from '../lib/logger.js';

const router = Router();

const listInstallations: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  logger.info('Buscando lista de instalações');
  
  try {
    const installations = await prisma.installation.findMany({
      orderBy: {
        timestamp: 'desc'
      },
      include: {
        apiKey: true
      }
    });

    logger.info('Instalações encontradas', { count: installations.length });
    res.json(installations);
  } catch (error) {
    logger.error('Erro ao buscar instalações', { 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      error: 'Erro ao buscar instalações',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

router.get('/', listInstallations);

export { router as installationRouter }; 