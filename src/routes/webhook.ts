import { Router, Request, Response } from 'express';
import { prisma } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { authMiddleware } from '../middleware/auth.js';

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

export { router as webhookRouter }; 