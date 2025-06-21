import { Router, Request, Response, RequestHandler } from 'express';
import { installationService } from '../services/installationService.js';
import { logger } from '../lib/logger.js';

const router = Router();

const listInstallations: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  logger.info('Buscando lista de instalações');
  
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;
    
    const filters: any = {};
    if (status && status !== 'all') {
      filters.success = status === 'success';
    }
    if (search) {
      filters.search = search;
    }
    
    const result = await installationService.listInstallations(page, limit, filters);
    
    logger.info('Instalações encontradas', { 
      count: result.installations.length,
      total: result.pagination.total,
      page: result.pagination.page
    });
    
    res.json(result);
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
    const status = await installationService.getInstallationStatus(id);
    res.json(status);
    return;
  } catch (error) {
    logger.error('Erro ao verificar status da instalação', { error });
    res.status(500).json({ active: false, message: 'Erro ao verificar status da instalação' });
    return;
  }
});

router.get('/', listInstallations);

export { router as installationRouter }; 