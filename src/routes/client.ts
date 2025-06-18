import { Router, Request, Response, RequestHandler } from 'express';
import { prisma } from '../lib/database.js';
import { Client } from '../types/index.js';
import { notificationService } from '../services/notificationService.js';
import { logger } from '../lib/logger.js';

const router = Router();

// Função utilitária para converter null para undefined nos campos opcionais
function normalizeClient(client: any): Client {
  return {
    ...client,
    company: client.company ?? undefined,
    phone: client.phone ?? undefined,
    notes: client.notes ?? undefined,
  };
}

// Listar todos os clientes
const listClients: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    let where = {};
    if (search) {
      const searchStr = search as string;
      const or = [];
      if (searchStr) {
        or.push({ name: { contains: searchStr, mode: 'insensitive' } });
        or.push({ email: { contains: searchStr, mode: 'insensitive' } });
        or.push({ company: { contains: searchStr, mode: 'insensitive' } });
      }
      if (or.length > 0) {
        where = { OR: or };
      }
    }
    const clients = await prisma.client.findMany({
      where,
      include: {
        apiKeys: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(clients.map(normalizeClient));
  } catch (error) {
    logger.error('Erro ao buscar clientes', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
};

// Buscar cliente por ID
const getClient: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        apiKeys: true
      }
    });

    if (!client) {
      res.status(404).json({ error: 'Cliente não encontrado' });
      return;
    }

    res.json(normalizeClient(client));
  } catch (error) {
    logger.error('Erro ao buscar cliente', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      clientId: req.params.id
    });
    res.status(500).json({ error: 'Erro ao buscar cliente' });
  }
};

// Criar novo cliente
const createClient: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { name, email, company, phone, notes, status } = req.body as Omit<Client, 'id' | 'createdAt'>;

    if (!name || !email) {
      res.status(400).json({ error: 'Nome e email são obrigatórios' });
      return;
    }

    const existingClient = await prisma.client.findUnique({
      where: { email }
    });

    if (existingClient) {
      res.status(409).json({ error: 'Email já cadastrado' });
      return;
    }

    const client = await prisma.client.create({
      data: {
        name,
        email,
        company,
        phone,
        notes,
        status: status || 'ACTIVE'
      }
    });

    // Criar notificação para o novo cliente
    try {
      await notificationService.createNotification({
        title: 'Novo Cliente Cadastrado',
        message: `${name} foi cadastrado no sistema${company ? ` (${company})` : ''}`,
        type: 'success'
      });
      logger.info('Notificação criada com sucesso para novo cliente');
    } catch (notificationError) {
      logger.error('Erro ao criar notificação para novo cliente', {
        error: notificationError instanceof Error ? notificationError.message : 'Erro desconhecido',
        stack: notificationError instanceof Error ? notificationError.stack : undefined
      });
    }

    res.status(201).json(normalizeClient(client));
  } catch (error) {
    logger.error('Erro ao criar cliente', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
};

// Atualizar cliente
const updateClient: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, company, phone, notes, status } = req.body as Partial<Omit<Client, 'id' | 'createdAt'>>;

    if (!name || !email) {
      res.status(400).json({ error: 'Nome e email são obrigatórios' });
      return;
    }

    const existingClient = await prisma.client.findUnique({
      where: { id }
    });

    if (!existingClient) {
      res.status(404).json({ error: 'Cliente não encontrado' });
      return;
    }

    const emailExists = await prisma.client.findFirst({
      where: {
        email,
        id: { not: id }
      }
    });

    if (emailExists) {
      res.status(409).json({ error: 'Email já cadastrado para outro cliente' });
      return;
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        name,
        email,
        company,
        phone,
        notes,
        status
      }
    });

    // Criar notificação para atualização do cliente
    try {
      await notificationService.createNotification({
        title: 'Cliente Atualizado',
        message: `${name} foi atualizado no sistema${company ? ` (${company})` : ''}`,
        type: 'info'
      });

      // Se o status foi alterado, criar notificação específica
      if (status && status !== existingClient.status) {
        await notificationService.createNotification({
          title: 'Status do Cliente Alterado',
          message: `O status de ${name} foi alterado para ${status}`,
          type: 'warning'
        });
      }
      logger.info('Notificações criadas com sucesso para atualização de cliente');
    } catch (notificationError) {
      logger.error('Erro ao criar notificações para atualização de cliente', {
        error: notificationError instanceof Error ? notificationError.message : 'Erro desconhecido',
        stack: notificationError instanceof Error ? notificationError.stack : undefined
      });
    }

    res.json(normalizeClient(client));
  } catch (error) {
    logger.error('Erro ao atualizar cliente', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      clientId: req.params.id
    });
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
};

// Deletar cliente
const deleteClient: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingClient = await prisma.client.findUnique({
      where: { id }
    });

    if (!existingClient) {
      res.status(404).json({ error: 'Cliente não encontrado' });
      return;
    }

    await prisma.client.delete({
      where: { id }
    });

    // Criar notificação para exclusão do cliente
    try {
      await notificationService.createNotification({
        title: 'Cliente Removido',
        message: `${existingClient.name} foi removido do sistema${existingClient.company ? ` (${existingClient.company})` : ''}`,
        type: 'error'
      });
      logger.info('Notificação criada com sucesso para exclusão de cliente');
    } catch (notificationError) {
      logger.error('Erro ao criar notificação para exclusão de cliente', {
        error: notificationError instanceof Error ? notificationError.message : 'Erro desconhecido',
        stack: notificationError instanceof Error ? notificationError.stack : undefined
      });
    }

    res.status(204).send();
  } catch (error) {
    logger.error('Erro ao deletar cliente', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      clientId: req.params.id
    });
    res.status(500).json({ error: 'Erro ao deletar cliente' });
  }
};

// Contagem de status dos clientes
const getClientStatusCounts: RequestHandler = async (req: Request, res: Response) => {
  try {
    const counts = await prisma.client.groupBy({
      by: ['status'],
      _count: true
    });

    const formattedCounts = counts.reduce((acc: Record<string, number>, curr: { status: string; _count: number }) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {});

    res.json(formattedCounts);
  } catch (error) {
    logger.error('Erro ao buscar contagem de status', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Erro ao buscar contagem de status' });
  }
};

// Registrar rotas
router.get('/', listClients);
router.get('/:id', getClient);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);
router.get('/status-counts', getClientStatusCounts);

export { router as clientRouter }; 