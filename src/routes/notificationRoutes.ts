import { Router, Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notificationService.js';
import { logger } from '../lib/logger.js';

const router = Router();

// Listar todas as notificações
router.get('/', async (req: Request, res: Response) => {
  try {
    logger.info('Buscando todas as notificações');

    const notifications = await notificationService.getNotifications();
    res.json(notifications);
  } catch (error) {
    logger.error('Erro ao buscar notificações', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
});

// Listar notificações não lidas
router.get('/unread', async (req: Request, res: Response) => {
  try {
    logger.info('Buscando notificações não lidas');

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

// Marcar notificação como lida
router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.markAsRead(id);
    res.json(notification);
  } catch (error) {
    logger.error('Erro ao marcar notificação como lida', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      notificationId: req.params.id
    });
    res.status(500).json({ error: 'Erro ao marcar notificação como lida' });
  }
});

// Marcar todas as notificações como lidas
router.patch('/read-all', async (req: Request, res: Response) => {
  try {
    const result = await notificationService.markAllAsRead();
    res.json(result);
  } catch (error) {
    logger.error('Erro ao marcar todas as notificações como lidas', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Erro ao marcar todas as notificações como lidas' });
  }
});

// Excluir notificação
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await notificationService.deleteNotification(id);
    res.status(204).send();
  } catch (error) {
    logger.error('Erro ao excluir notificação', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      notificationId: req.params.id
    });
    res.status(500).json({ error: 'Erro ao excluir notificação' });
  }
});

export { router as notificationRouter }; 