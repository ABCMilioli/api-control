import { Router, Request, Response } from 'express';
import { prisma } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { authMiddleware } from '../middleware/auth.js';
import { webhookService } from '../services/webhookService.js';

const router = Router();

// Listar todas as configurações de webhook
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const webhooks = await prisma.webhookConfig.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Não retornar a chave secreta por segurança
    const webhooksWithoutSecret = webhooks.map(webhook => {
      const { secret, ...webhookWithoutSecret } = webhook;
      return webhookWithoutSecret;
    });

    res.json(webhooksWithoutSecret);
  } catch (error) {
    logger.error('Erro ao listar webhooks', { error: error instanceof Error ? error.message : 'Erro desconhecido' });
    res.status(500).json({ error: 'Erro ao listar configurações de webhook' });
  }
});

// Buscar configuração de webhook por ID
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const webhook = await prisma.webhookConfig.findUnique({
      where: { id }
    });

    if (!webhook) {
      res.status(404).json({ error: 'Configuração de webhook não encontrada' });
      return;
    }

    // Não retornar a chave secreta por segurança
    const { secret, ...webhookWithoutSecret } = webhook;
    res.json(webhookWithoutSecret);
  } catch (error) {
    logger.error('Erro ao buscar webhook', { error: error instanceof Error ? error.message : 'Erro desconhecido' });
    res.status(500).json({ error: 'Erro ao buscar configuração de webhook' });
  }
});

// Criar nova configuração de webhook
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, url, secret, events, isActive, retryCount, timeout } = req.body;

    // Validações
    if (!name || !url || !events) {
      res.status(400).json({ error: 'Nome, URL e eventos são obrigatórios' });
      return;
    }

    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({ error: 'Pelo menos um evento deve ser selecionado' });
      return;
    }

    // Validar URL
    try {
      new URL(url);
    } catch {
      res.status(400).json({ error: 'URL inválida' });
      return;
    }

    // Verificar se já existe webhook com a mesma URL
    const existingWebhook = await prisma.webhookConfig.findFirst({
      where: { url }
    });

    if (existingWebhook) {
      res.status(409).json({ error: 'Já existe uma configuração de webhook com esta URL' });
      return;
    }

    const webhook = await prisma.webhookConfig.create({
      data: {
        name,
        url,
        secret: secret || null,
        events: events,
        isActive: isActive !== undefined ? isActive : true,
        retryCount: retryCount || 3,
        timeout: timeout || 30000
      }
    });

    logger.info('Webhook criado com sucesso', { webhookId: webhook.id, name: webhook.name });

    // Não retornar a chave secreta
    const { secret: _, ...webhookWithoutSecret } = webhook;
    res.status(201).json(webhookWithoutSecret);
  } catch (error) {
    logger.error('Erro ao criar webhook', { error: error instanceof Error ? error.message : 'Erro desconhecido' });
    res.status(500).json({ error: 'Erro ao criar configuração de webhook' });
  }
});

// Atualizar configuração de webhook
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, url, secret, events, isActive, retryCount, timeout } = req.body;

    // Verificar se o webhook existe
    const existingWebhook = await prisma.webhookConfig.findUnique({
      where: { id }
    });

    if (!existingWebhook) {
      res.status(404).json({ error: 'Configuração de webhook não encontrada' });
      return;
    }

    // Validações
    if (!name || !url || !events) {
      res.status(400).json({ error: 'Nome, URL e eventos são obrigatórios' });
      return;
    }

    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({ error: 'Pelo menos um evento deve ser selecionado' });
      return;
    }

    // Validar URL
    try {
      new URL(url);
    } catch {
      res.status(400).json({ error: 'URL inválida' });
      return;
    }

    // Verificar se a nova URL já existe em outro webhook
    if (url !== existingWebhook.url) {
      const urlExists = await prisma.webhookConfig.findFirst({
        where: { 
          url,
          id: { not: id }
        }
      });

      if (urlExists) {
        res.status(409).json({ error: 'Já existe uma configuração de webhook com esta URL' });
        return;
      }
    }

    const webhook = await prisma.webhookConfig.update({
      where: { id },
      data: {
        name,
        url,
        secret: secret !== undefined ? secret : existingWebhook.secret,
        events: events,
        isActive: isActive !== undefined ? isActive : existingWebhook.isActive,
        retryCount: retryCount || existingWebhook.retryCount,
        timeout: timeout || existingWebhook.timeout
      }
    });

    logger.info('Webhook atualizado com sucesso', { webhookId: webhook.id, name: webhook.name });

    // Não retornar a chave secreta
    const { secret: _, ...webhookWithoutSecret } = webhook;
    res.json(webhookWithoutSecret);
  } catch (error) {
    logger.error('Erro ao atualizar webhook', { error: error instanceof Error ? error.message : 'Erro desconhecido' });
    res.status(500).json({ error: 'Erro ao atualizar configuração de webhook' });
  }
});

// Deletar configuração de webhook
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar se o webhook existe
    const existingWebhook = await prisma.webhookConfig.findUnique({
      where: { id }
    });

    if (!existingWebhook) {
      res.status(404).json({ error: 'Configuração de webhook não encontrada' });
      return;
    }

    await prisma.webhookConfig.delete({
      where: { id }
    });

    logger.info('Webhook deletado com sucesso', { webhookId: id, name: existingWebhook.name });
    res.json({ success: true, message: 'Configuração de webhook removida com sucesso' });
  } catch (error) {
    logger.error('Erro ao deletar webhook', { error: error instanceof Error ? error.message : 'Erro desconhecido' });
    res.status(500).json({ error: 'Erro ao remover configuração de webhook' });
  }
});

// Ativar/Desativar webhook
router.patch('/:id/toggle', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar se o webhook existe
    const existingWebhook = await prisma.webhookConfig.findUnique({
      where: { id }
    });

    if (!existingWebhook) {
      res.status(404).json({ error: 'Configuração de webhook não encontrada' });
      return;
    }

    const webhook = await prisma.webhookConfig.update({
      where: { id },
      data: {
        isActive: !existingWebhook.isActive
      }
    });

    logger.info('Status do webhook alterado', { 
      webhookId: webhook.id, 
      name: webhook.name, 
      isActive: webhook.isActive 
    });

    // Não retornar a chave secreta
    const { secret, ...webhookWithoutSecret } = webhook;
    res.json(webhookWithoutSecret);
  } catch (error) {
    logger.error('Erro ao alterar status do webhook', { error: error instanceof Error ? error.message : 'Erro desconhecido' });
    res.status(500).json({ error: 'Erro ao alterar status da configuração de webhook' });
  }
});

// Testar webhook
router.post('/:id/test', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar se o webhook existe
    const existingWebhook = await prisma.webhookConfig.findUnique({
      where: { id }
    });

    if (!existingWebhook) {
      res.status(404).json({ error: 'Configuração de webhook não encontrada' });
      return;
    }

    logger.info('Iniciando teste de webhook', { webhookId: id, webhookName: existingWebhook.name });

    const result = await webhookService.testWebhook(id);

    logger.info('Teste de webhook concluído', { 
      webhookId: id, 
      success: result.success,
      statusCode: result.statusCode 
    });

    res.json({
      success: result.success,
      statusCode: result.statusCode,
      response: result.response,
      error: result.error,
      retryCount: result.retryCount
    });
  } catch (error) {
    logger.error('Erro ao testar webhook', { 
      webhookId: req.params.id,
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    });
    res.status(500).json({ error: 'Erro ao testar webhook' });
  }
});

// Testar webhook com eventos específicos
router.post('/:id/test-events', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { events } = req.body; // Array de eventos para testar

    // Verificar se o webhook existe
    const existingWebhook = await prisma.webhookConfig.findUnique({
      where: { id }
    });

    if (!existingWebhook) {
      res.status(404).json({ error: 'Configuração de webhook não encontrada' });
      return;
    }

    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({ error: 'É necessário especificar pelo menos um evento para testar' });
      return;
    }

    logger.info('Iniciando teste de webhook com eventos específicos', { 
      webhookId: id, 
      webhookName: existingWebhook.name,
      events 
    });

    const results = [];

    // Testar cada evento
    for (const event of events) {
      try {
        // Dados de teste baseados no tipo de evento
        let testData: any = {
          test: true,
          message: `Teste do evento ${event}`,
          timestamp: new Date().toISOString()
        };

        // Adicionar dados específicos baseados no evento
        switch (event) {
          case 'client.created':
            testData = {
              ...testData,
              clientId: 'test-client-123',
              name: 'Cliente Teste',
              email: 'teste@exemplo.com',
              company: 'Empresa Teste',
              status: 'ACTIVE',
              createdAt: new Date().toISOString()
            };
            break;
          
          case 'client.updated':
            testData = {
              ...testData,
              clientId: 'test-client-123',
              name: 'Cliente Teste Atualizado',
              email: 'teste@exemplo.com',
              company: 'Empresa Teste Atualizada',
              status: 'ACTIVE',
              previousStatus: 'ACTIVE',
              updatedAt: new Date().toISOString()
            };
            break;
          
          case 'client.suspended':
            testData = {
              ...testData,
              clientId: 'test-client-123',
              name: 'Cliente Teste',
              email: 'teste@exemplo.com',
              company: 'Empresa Teste',
              previousStatus: 'ACTIVE',
              newStatus: 'SUSPENDED'
            };
            break;
          
          case 'client.blocked':
            testData = {
              ...testData,
              clientId: 'test-client-123',
              name: 'Cliente Teste',
              email: 'teste@exemplo.com',
              company: 'Empresa Teste',
              previousStatus: 'ACTIVE',
              newStatus: 'BLOCKED'
            };
            break;
          
          case 'client.deleted':
            testData = {
              ...testData,
              clientId: 'test-client-123',
              name: 'Cliente Teste',
              email: 'teste@exemplo.com',
              company: 'Empresa Teste',
              status: 'ACTIVE',
              deletedAt: new Date().toISOString()
            };
            break;
          
          case 'key.created':
            testData = {
              ...testData,
              apiKeyId: 'test-key-123',
              clientId: 'test-client-123',
              clientName: 'Cliente Teste',
              maxInstallations: 100,
              currentInstallations: 0,
              isActive: true,
              createdAt: new Date().toISOString()
            };
            break;
          
          case 'key.updated':
            testData = {
              ...testData,
              apiKeyId: 'test-key-123',
              clientId: 'test-client-123',
              clientName: 'Cliente Teste',
              maxInstallations: 200,
              currentInstallations: 5,
              isActive: true,
              updatedAt: new Date().toISOString()
            };
            break;
          
          case 'installation.success':
            testData = {
              ...testData,
              installationId: 'test-installation-123',
              apiKeyId: 'test-key-123',
              ipAddress: '192.168.1.100',
              userAgent: 'Mozilla/5.0 (Test Browser)',
              location: 'São Paulo, BR',
              timestamp: new Date().toISOString()
            };
            break;
          
          case 'installation.failed':
            testData = {
              ...testData,
              installationId: 'test-installation-123',
              apiKeyId: 'test-key-123',
              ipAddress: '192.168.1.100',
              userAgent: 'Mozilla/5.0 (Test Browser)',
              error: 'API Key inválida',
              timestamp: new Date().toISOString()
            };
            break;
          
          default:
            // Para eventos não específicos, usar dados genéricos
            testData = {
              ...testData,
              eventType: event,
              testData: 'Dados de teste genéricos'
            };
        }

        const result = await webhookService.sendWebhook({
          ...existingWebhook,
          events: existingWebhook.events as string[]
        }, event, testData);
        
        results.push({
          event,
          success: result.success,
          statusCode: result.statusCode,
          response: result.response,
          error: result.error,
          retryCount: result.retryCount
        });

        logger.info('Teste de evento concluído', { 
          webhookId: id, 
          event,
          success: result.success,
          statusCode: result.statusCode 
        });

      } catch (error) {
        logger.error('Erro ao testar evento', { 
          webhookId: id, 
          event,
          error: error instanceof Error ? error.message : 'Erro desconhecido' 
        });
        
        results.push({
          event,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          retryCount: 0
        });
      }
    }

    logger.info('Teste de webhook com eventos concluído', { 
      webhookId: id, 
      totalEvents: events.length,
      successfulEvents: results.filter(r => r.success).length,
      failedEvents: results.filter(r => !r.success).length
    });

    res.json({
      webhookId: id,
      webhookName: existingWebhook.name,
      webhookUrl: existingWebhook.url,
      events: results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
  } catch (error) {
    logger.error('Erro ao testar webhook com eventos', { 
      webhookId: req.params.id,
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    });
    res.status(500).json({ error: 'Erro ao testar webhook com eventos' });
  }
});

// Obter estatísticas de webhooks
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const stats = await webhookService.getWebhookStats();
    res.json(stats);
  } catch (error) {
    logger.error('Erro ao buscar estatísticas de webhooks', { 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    });
    res.status(500).json({ error: 'Erro ao buscar estatísticas de webhooks' });
  }
});

export { router as webhookRouter }; 