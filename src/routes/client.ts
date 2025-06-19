import { Router, Request, Response, RequestHandler } from 'express';
import { clientService } from '../services/clientService.js';
import { logger } from '../lib/logger.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Listar todos os clientes
const listClients: RequestHandler = async (req, res) => {
  try {
    const { search } = req.query;
    const clients = await clientService.listClients(search as string);
    res.json(clients);
    return;
  } catch (error) {
    logger.error('Erro ao buscar clientes', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Erro ao buscar clientes' });
    return;
  }
};

// Buscar cliente por ID
const getClient: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await clientService.getClient(id);

    if (!client) {
      res.status(404).json({ error: 'Cliente não encontrado' });
      return;
    }

    res.json(client);
    return;
  } catch (error) {
    logger.error('Erro ao buscar cliente', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      clientId: req.params.id
    });
    res.status(500).json({ error: 'Erro ao buscar cliente' });
    return;
  }
};

// Criar novo cliente
const createClient: RequestHandler = async (req, res) => {
  try {
    const { name, email, company, phone, notes, status } = req.body;

    if (!name || !email) {
      res.status(400).json({ error: 'Nome e email são obrigatórios' });
      return;
    }

    const client = await clientService.createClient({
      name,
      email,
      company,
      phone,
      notes,
      status
    });

    res.status(201).json(client);
    return;
  } catch (error) {
    logger.error('Erro ao criar cliente', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Erro ao criar cliente' });
    return;
  }
};

// Atualizar cliente
const updateClient: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, company, phone, notes, status } = req.body;

    if (!name || !email) {
      res.status(400).json({ error: 'Nome e email são obrigatórios' });
      return;
    }

    const client = await clientService.updateClient(id, {
      name,
      email,
      company,
      phone,
      notes,
      status
    });

    res.json(client);
    return;
  } catch (error) {
    logger.error('Erro ao atualizar cliente', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      clientId: req.params.id
    });
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
    return;
  }
};

// Deletar cliente
const deleteClient: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await clientService.deleteClient(id);

    res.status(204).send();
    return;
  } catch (error) {
    logger.error('Erro ao deletar cliente', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      clientId: req.params.id
    });
    res.status(500).json({ error: 'Erro ao deletar cliente' });
    return;
  }
};

// Contagem de status dos clientes
const getClientStatusCounts: RequestHandler = async (req, res) => {
  try {
    const counts = await clientService.getClientStatusCounts();
    res.json(counts);
    return;
  } catch (error) {
    logger.error('Erro ao buscar contagem de status', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Erro ao buscar contagem de status' });
    return;
  }
};

// Registrar rotas protegidas por autenticação JWT
router.get('/', authMiddleware, listClients);
router.get('/:id', authMiddleware, getClient);
router.post('/', authMiddleware, createClient);
router.put('/:id', authMiddleware, updateClient);
router.delete('/:id', authMiddleware, deleteClient);
router.get('/status-counts', authMiddleware, getClientStatusCounts);

export { router as clientRouter }; 