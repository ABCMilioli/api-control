import { Router, Request, Response, RequestHandler } from 'express';
import { prisma } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { notificationService } from '../services/notificationService.js';

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

    // Verificar se o cliente existe
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      logger.error('Cliente não encontrado', { clientId });
      res.status(404).json({ error: 'Cliente não encontrado' });
      return;
    }

    logger.info('Criando API Key no banco de dados', { 
      clientId, 
      clientName, 
      maxInstallations 
    });

    const apiKey = await prisma.aPIKey.create({
      data: {
        key,
        clientId,
        clientName,
        clientEmail,
        maxInstallations,
        isActive,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    // Criar notificação para a criação da API Key
    try {
      logger.info('Iniciando criação de notificação', {
        apiKeyId: apiKey.id,
        clientName: apiKey.clientName
      });

      const notification = await notificationService.createNotification({
        title: 'Nova API Key Criada',
        message: `Uma nova API Key foi criada para o cliente ${apiKey.clientName}`,
        type: 'info'
      });

      logger.info('Notificação criada com sucesso', {
        notificationId: notification.id,
        apiKeyId: apiKey.id
      });
    } catch (notificationError) {
      logger.error('Erro ao criar notificação', {
        error: notificationError instanceof Error ? notificationError.message : 'Erro desconhecido',
        stack: notificationError instanceof Error ? notificationError.stack : undefined,
        apiKeyId: apiKey.id
      });
      // Não interrompe o fluxo se falhar ao criar a notificação
    }

    logger.info('API Key criada com sucesso', { 
      apiKeyId: apiKey.id, 
      clientId: apiKey.clientId 
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
    const apiKeys = await prisma.aPIKey.findMany({
      include: {
        client: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

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
    // Buscar a API Key antes de atualizar para usar nas notificações
    const oldApiKey = await prisma.aPIKey.findUnique({
      where: { id }
    });

    if (!oldApiKey) {
      logger.error('API Key não encontrada', { apiKeyId: id });
      res.status(404).json({ error: 'API Key não encontrada' });
      return;
    }

    logger.info('API Key encontrada, procedendo com atualização', {
      apiKeyId: id,
      oldData: {
        maxInstallations: oldApiKey.maxInstallations,
        isActive: oldApiKey.isActive,
        expiresAt: oldApiKey.expiresAt
      }
    });

    const apiKey = await prisma.aPIKey.update({
      where: { id },
      data: updates
    });

    logger.info('API Key atualizada no banco de dados', {
      apiKeyId: id,
      newData: {
        maxInstallations: apiKey.maxInstallations,
        isActive: apiKey.isActive,
        expiresAt: apiKey.expiresAt
      }
    });

    // Criar notificação para a atualização da API Key
    try {
      logger.info('Iniciando criação de notificação', {
        apiKeyId: id,
        clientName: apiKey.clientName
      });

      const notification = await notificationService.createNotification({
        title: 'API Key Atualizada',
        message: `A API Key do cliente ${apiKey.clientName} foi atualizada. Alterações: ${Object.keys(updates).join(', ')}`,
        type: 'info'
      });

      logger.info('Notificação criada com sucesso', {
        notificationId: notification.id,
        apiKeyId: id
      });
    } catch (notificationError) {
      logger.error('Erro ao criar notificação', {
        error: notificationError instanceof Error ? notificationError.message : 'Erro desconhecido',
        stack: notificationError instanceof Error ? notificationError.stack : undefined,
        apiKeyId: id
      });
      // Não interrompe o fluxo se falhar ao criar a notificação
    }

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
    const apiKey = await prisma.aPIKey.update({
      where: { id },
      data: { isActive: false }
    });

    // Criar notificação para a revogação da API Key
    await notificationService.createNotification({
      title: 'API Key Revogada',
      message: `A API Key do cliente ${apiKey.clientName} foi revogada`,
      type: 'warning'
    });

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
    // Buscar a API Key antes de excluir para ter as informações para a notificação
    const apiKey = await prisma.aPIKey.findUnique({
      where: { id }
    });

    if (!apiKey) {
      res.status(404).json({ error: 'API Key não encontrada' });
      return;
    }

    // Criar notificação antes de excluir
    try {
      logger.info('Iniciando criação de notificação', {
        apiKeyId: apiKey.id,
        clientName: apiKey.clientName
      });

      const notification = await notificationService.createNotification({
        title: 'API Key Excluída',
        message: `A API Key do cliente ${apiKey.clientName} foi excluída`,
        type: 'warning'
      });

      logger.info('Notificação criada com sucesso', {
        notificationId: notification.id,
        apiKeyId: apiKey.id
      });
    } catch (notificationError) {
      logger.error('Erro ao criar notificação', {
        error: notificationError instanceof Error ? notificationError.message : 'Erro desconhecido',
        stack: notificationError instanceof Error ? notificationError.stack : undefined,
        apiKeyId: apiKey.id
      });
      // Não interrompe o fluxo se falhar ao criar a notificação
    }

    await prisma.aPIKey.delete({
      where: { id }
    });

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

// Registrar rotas
router.post('/', createAPIKey);
router.get('/', listAPIKeys);
router.put('/:id', updateAPIKey);
router.put('/:id/revoke', revokeAPIKey);
router.delete('/:id', deleteAPIKey);

export { router as apiKeyRouter }; 