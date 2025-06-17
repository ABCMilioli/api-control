import { Router, Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notificationService.js';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';

const router = Router();

// Middleware de autenticação para todas as rotas
router.use((req: Request, res: Response, next: NextFunction) => {
  logger.info('Requisição recebida na rota de notificações', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    body: req.body
  });
  authMiddleware(req, res, next);
});

// Listar todas as notificações do usuário
router.get('/', async (req: Request, res: Response) => {
  try {
    logger.info('Buscando todas as notificações', {
      userId: req.user?.id,
      headers: req.headers
    });

    const userId = req.user?.id;
    const notifications = await notificationService.getNotifications(userId);
    
    logger.info('Notificações encontradas com sucesso', {
      count: notifications.length,
      userId
    });

    res.json(notifications);
  } catch (error) {
    logger.error('Erro ao buscar notificações', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.id
    });
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
});

// Listar notificações não lidas
router.get('/unread', async (req: Request, res: Response) => {
  try {
    logger.info('Buscando notificações não lidas', {
      userId: req.user?.id
    });

    const userId = req.user?.id;
    const notifications = await notificationService.getUnreadNotifications(userId);
    
    logger.info('Notificações não lidas encontradas com sucesso', {
      count: notifications.length,
      userId
    });

    res.json(notifications);
  } catch (error) {
    logger.error('Erro ao buscar notificações não lidas', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.id
    });
    res.status(500).json({ error: 'Erro ao buscar notificações não lidas' });
  }
});

// Marcar uma notificação como lida
router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info('Marcando notificação como lida', {
      notificationId: id,
      userId: req.user?.id
    });

    const notification = await notificationService.markAsRead(id);
    
    logger.info('Notificação marcada como lida com sucesso', {
      notificationId: id,
      userId: req.user?.id
    });

    res.json(notification);
  } catch (error) {
    logger.error('Erro ao marcar notificação como lida', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      notificationId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({ error: 'Erro ao marcar notificação como lida' });
  }
});

// Marcar todas as notificações como lidas
router.patch('/read-all', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    logger.info('Marcando todas as notificações como lidas', {
      userId
    });

    await notificationService.markAllAsRead(userId);
    
    logger.info('Todas as notificações foram marcadas como lidas com sucesso', {
      userId
    });

    res.json({ message: 'Todas as notificações foram marcadas como lidas' });
  } catch (error) {
    logger.error('Erro ao marcar todas as notificações como lidas', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.id
    });
    res.status(500).json({ error: 'Erro ao marcar todas as notificações como lidas' });
  }
});

// Deletar uma notificação
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info('Deletando notificação', {
      notificationId: id,
      userId: req.user?.id
    });

    await notificationService.deleteNotification(id);
    
    logger.info('Notificação deletada com sucesso', {
      notificationId: id,
      userId: req.user?.id
    });

    res.json({ message: 'Notificação deletada com sucesso' });
  } catch (error) {
    logger.error('Erro ao deletar notificação', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      notificationId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({ error: 'Erro ao deletar notificação' });
  }
});

export default router; 