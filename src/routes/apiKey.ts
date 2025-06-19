import { Router, Request, Response, RequestHandler } from 'express';
import { apiKeyService } from '../services/apiKeyService.js';
import { logger } from '../lib/logger.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const createAPIKey: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  logger.info('Iniciando criação de nova API Key', { body: req.body });
  
  try {
    const { key, clientId, clientName, clientEmail, maxInstallations, isActive, expiresAt } = req.body;

    // Validação dos campos obrigatórios
    if (!key || !clientId || !clientName || !clientEmail || !maxInstallations) {
      logger.error('Campos obrigatórios faltando', { 
        key: !!key, 
        clientId: !!clientId, 
        clientName: !!clientName, 
        clientEmail: !!clientEmail, 
        maxInstallations: !!maxInstallations 
      });
      res.status(400).json({ error: 'Campos obrigatórios faltando' });
      return;
    }

    const apiKey = await apiKeyService.createAPIKey({
      key,
      clientId,
      clientName,
      clientEmail,
      maxInstallations,
      isActive,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    res.status(201).json(apiKey);
  } catch (error) {
    logger.error('Erro ao criar API Key', { 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      error: 'Erro ao criar API Key',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

// Rota para listar todas as API Keys
const listAPIKeys: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  logger.info('Buscando lista de API Keys');
  
  try {
    const apiKeys = await apiKeyService.listAPIKeys();
    logger.info('API Keys encontradas', { count: apiKeys.length });
    res.json(apiKeys);
  } catch (error) {
    logger.error('Erro ao buscar API Keys', { 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      error: 'Erro ao buscar API Keys',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

// Rota para atualizar uma API Key
const updateAPIKey: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body;
  logger.info('Iniciando atualização de API Key', { 
    apiKeyId: id,
    updates,
    timestamp: new Date().toISOString()
  });

  try {
    const apiKey = await apiKeyService.updateAPIKey(id, updates);

    logger.info('API Key atualizada com sucesso', { 
      apiKeyId: id,
      updates,
      timestamp: new Date().toISOString()
    });

    res.json(apiKey);
  } catch (error) {
    logger.error('Erro ao atualizar API Key', { 
      apiKeyId: id,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      error: 'Erro ao atualizar API Key',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

// Rota para revogar uma API Key
const revokeAPIKey: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  logger.info('Iniciando revogação de API Key', { apiKeyId: id });

  try {
    const apiKey = await apiKeyService.revokeAPIKey(id);

    logger.info('API Key revogada com sucesso', { apiKeyId: id });
    res.json(apiKey);
  } catch (error) {
    logger.error('Erro ao revogar API Key', { 
      apiKeyId: id,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      error: 'Erro ao revogar API Key',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

// Rota para deletar uma API Key
const deleteAPIKey: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  logger.info('Iniciando exclusão de API Key', { apiKeyId: id });

  try {
    await apiKeyService.deleteAPIKey(id);

    res.status(204).send();
  } catch (error) {
    logger.error('Erro ao excluir API Key', { 
      apiKeyId: id,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      error: 'Erro ao excluir API Key',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

// Registrar rotas protegidas por autenticação JWT
router.post('/', authMiddleware, createAPIKey);
router.get('/', authMiddleware, listAPIKeys);
router.put('/:id', authMiddleware, updateAPIKey);
router.put('/:id/revoke', authMiddleware, revokeAPIKey);
router.delete('/:id', authMiddleware, deleteAPIKey);

export { router as apiKeyRouter }; 