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

// Nova rota para verificar status de uma instalação
router.get('/status/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const installation = await prisma.installation.findUnique({ where: { id } });
    if (!installation) {
      res.status(404).json({ active: false, message: 'Instalação não encontrada' });
      return;
    }
    res.json({ active: installation.success, message: installation.success ? 'Instalação ativa' : 'Instalação revogada' });
    return;
  } catch (error) {
    logger.error('Erro ao verificar status da instalação', { error });
    res.status(500).json({ active: false, message: 'Erro ao verificar status da instalação' });
    return;
  }
});

router.get('/', listInstallations);

export { router as installationRouter }; 