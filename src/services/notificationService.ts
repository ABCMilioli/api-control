import { prisma } from '../lib/database.js';
import { logger } from '../lib/logger.js';

type NotificationType = 'info' | 'warning' | 'success' | 'error';

export interface CreateNotificationData {
  title: string;
  message: string;
  type: NotificationType;
  userId?: string;
}

export const notificationService = {
  async createNotification(data: CreateNotificationData) {
    try {
      logger.info('Iniciando criação de notificação', { 
        data,
        timestamp: new Date().toISOString()
      });

      const notification = await prisma.notification.create({
        data: {
          ...data,
          type: data.type as any,
          timestamp: new Date(),
        },
      });

      logger.info('Notificação criada com sucesso', { 
        notificationId: notification.id,
        type: notification.type,
        timestamp: notification.timestamp
      });

      return notification;
    } catch (error) {
      logger.error('Erro ao criar notificação', { 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined,
        data
      });
      throw error;
    }
  },

  async getNotifications(userId?: string) {
    try {
      logger.info('Iniciando busca de notificações', { 
        userId,
        timestamp: new Date().toISOString()
      });

      const notifications = await prisma.notification.findMany({
        where: userId ? { userId } : undefined,
        orderBy: { timestamp: 'desc' },
      });

      logger.info('Notificações encontradas com sucesso', { 
        count: notifications.length,
        userId,
        types: notifications.map(n => n.type)
      });

      return notifications;
    } catch (error) {
      logger.error('Erro ao buscar notificações', { 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined,
        userId
      });
      throw error;
    }
  },

  async getUnreadNotifications(userId?: string) {
    try {
      logger.info('Iniciando busca de notificações não lidas', { 
        userId,
        timestamp: new Date().toISOString()
      });

      const notifications = await prisma.notification.findMany({
        where: {
          read: false,
          ...(userId ? { userId } : {}),
        },
        orderBy: { timestamp: 'desc' },
      });

      logger.info('Notificações não lidas encontradas com sucesso', { 
        count: notifications.length,
        userId,
        types: notifications.map(n => n.type)
      });

      return notifications;
    } catch (error) {
      logger.error('Erro ao buscar notificações não lidas', { 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined,
        userId
      });
      throw error;
    }
  },

  async markAsRead(id: string) {
    try {
      logger.info('Iniciando marcação de notificação como lida', { 
        notificationId: id,
        timestamp: new Date().toISOString()
      });

      const notification = await prisma.notification.update({
        where: { id },
        data: { read: true },
      });

      logger.info('Notificação marcada como lida com sucesso', { 
        notificationId: id,
        type: notification.type,
        timestamp: notification.timestamp
      });

      return notification;
    } catch (error) {
      logger.error('Erro ao marcar notificação como lida', { 
        notificationId: id,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  },

  async markAllAsRead(userId?: string) {
    try {
      logger.info('Iniciando marcação de todas as notificações como lidas', { 
        userId,
        timestamp: new Date().toISOString()
      });

      const result = await prisma.notification.updateMany({
        where: {
          read: false,
          ...(userId ? { userId } : {}),
        },
        data: { read: true },
      });

      logger.info('Todas as notificações foram marcadas como lidas com sucesso', { 
        count: result.count,
        userId,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      logger.error('Erro ao marcar todas as notificações como lidas', { 
        userId,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  },

  async deleteNotification(id: string) {
    try {
      logger.info('Iniciando exclusão de notificação', { 
        notificationId: id,
        timestamp: new Date().toISOString()
      });

      const notification = await prisma.notification.delete({
        where: { id },
      });

      logger.info('Notificação excluída com sucesso', { 
        notificationId: id,
        type: notification.type,
        timestamp: notification.timestamp
      });

      return notification;
    } catch (error) {
      logger.error('Erro ao excluir notificação', { 
        notificationId: id,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  },
}; 