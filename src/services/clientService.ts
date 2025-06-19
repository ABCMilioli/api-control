import { prisma } from '../lib/database.js';
import { Client } from '../types/index.js';
import { notificationService } from './notificationService.js';
import { webhookService } from './webhookService.js';
import { logger } from '../lib/logger.js';

function normalizeClient(client: any): Client {
  return {
    ...client,
    company: client.company ?? undefined,
    phone: client.phone ?? undefined,
    notes: client.notes ?? undefined,
  };
}

export const clientService = {
  async listClients(search?: string): Promise<Client[]> {
    let where = {};
    if (search) {
      const or = [];
      if (search) {
        or.push({ name: { contains: search, mode: 'insensitive' } });
        or.push({ email: { contains: search, mode: 'insensitive' } });
        or.push({ company: { contains: search, mode: 'insensitive' } });
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
    return clients.map(normalizeClient);
  },

  async getClient(id: string): Promise<Client | null> {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        apiKeys: true
      }
    });
    return client ? normalizeClient(client) : null;
  },

  async createClient(data: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    logger.info('Iniciando criação de cliente', { data });
    
    const { name, email, company, phone, notes, status } = data;

    if (!name || !email) {
      logger.error('Campos obrigatórios faltando', { name, email });
      throw new Error('Nome e email são obrigatórios');
    }

    const existingClient = await prisma.client.findUnique({
      where: { email }
    });

    if (existingClient) {
      logger.error('Email já cadastrado', { email });
      throw new Error('Email já cadastrado');
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

    logger.info('Cliente criado com sucesso', { clientId: client.id });

    try {
      // Criar notificação para o novo cliente
      await notificationService.createNotification({
        title: 'Novo Cliente Cadastrado',
        message: `${name} foi cadastrado no sistema${company ? ` (${company})` : ''}`,
        type: 'success'
      });
      logger.info('Notificação criada com sucesso para novo cliente');
    } catch (error) {
      logger.error('Erro ao criar notificação para novo cliente', { 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });
    }

    // Disparar webhook para evento de cliente criado
    try {
      logger.info('🚀 [CLIENT-WEBHOOK] Iniciando disparo de webhook para cliente criado', { 
        clientId: client.id,
        clientName: client.name,
        event: 'client.created'
      });
      
      await webhookService.dispatchWebhook('client.created', {
        clientId: client.id,
        name: client.name,
        email: client.email,
        company: client.company,
        status: client.status,
        createdAt: client.createdAt,
        timestamp: new Date().toISOString()
      });
      
      logger.info('✅ [CLIENT-WEBHOOK] Webhook disparado com sucesso para cliente criado', { 
        clientId: client.id,
        clientName: client.name,
        event: 'client.created'
      });
    } catch (error) {
      logger.error('💥 [CLIENT-WEBHOOK] Erro ao disparar webhook para cliente criado', { 
        clientId: client.id,
        clientName: client.name,
        event: 'client.created',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });
    }

    return normalizeClient(client);
  },

  async updateClient(id: string, data: Partial<Omit<Client, 'id' | 'createdAt'>>): Promise<Client> {
    logger.info('🔍 [DEBUG] MÉTODO updateClient INICIADO', { id, data });
    logger.info('Iniciando atualização de cliente', { id, data });
    
    const { name, email, company, phone, notes, status } = data;

    if (!name || !email) {
      logger.error('Campos obrigatórios faltando', { name, email });
      throw new Error('Nome e email são obrigatórios');
    }

    const existingClient = await prisma.client.findUnique({
      where: { id }
    });

    if (!existingClient) {
      logger.error('Cliente não encontrado', { id });
      throw new Error('Cliente não encontrado');
    }

    const emailExists = await prisma.client.findFirst({
      where: {
        email,
        id: { not: id }
      }
    });

    if (emailExists) {
      logger.error('Email já cadastrado para outro cliente', { email });
      throw new Error('Email já cadastrado para outro cliente');
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

    logger.info('Cliente atualizado com sucesso', { clientId: client.id });

    try {
      // Criar notificação para atualização do cliente
      await notificationService.createNotification({
        title: 'Cliente Atualizado',
        message: `${name} foi atualizado no sistema${company ? ` (${company})` : ''}`,
        type: 'info'
      });
      logger.info('Notificação criada com sucesso para atualização de cliente');

      // Se o status foi alterado, criar notificação específica
      if (status && status !== existingClient.status) {
        await notificationService.createNotification({
          title: 'Status do Cliente Alterado',
          message: `O status de ${name} foi alterado para ${status}`,
          type: 'warning'
        });
        logger.info('Notificação criada com sucesso para alteração de status');
      }
    } catch (error) {
      logger.error('Erro ao criar notificação para atualização de cliente', { 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });
    }

    // Disparar webhook para evento de cliente atualizado
    logger.info('🔍 [DEBUG] Antes de chamar webhook service - client.updated');
    try {
      logger.info('🚀 [CLIENT-WEBHOOK] Iniciando disparo de webhook para cliente atualizado', { 
        clientId: client.id,
        clientName: client.name,
        event: 'client.updated',
        previousStatus: existingClient.status,
        newStatus: client.status
      });
      
      await webhookService.dispatchWebhook('client.updated', {
        clientId: client.id,
        name: client.name,
        email: client.email,
        company: client.company,
        status: client.status,
        previousStatus: existingClient.status,
        updatedAt: new Date().toISOString(),
        timestamp: new Date().toISOString()
      });
      
      logger.info('✅ [CLIENT-WEBHOOK] Webhook disparado com sucesso para cliente atualizado', { 
        clientId: client.id,
        clientName: client.name,
        event: 'client.updated'
      });
    } catch (error) {
      logger.error('💥 [CLIENT-WEBHOOK] Erro ao disparar webhook para cliente atualizado', { 
        clientId: client.id,
        clientName: client.name,
        event: 'client.updated',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
    logger.info('🔍 [DEBUG] Depois de chamar webhook service - client.updated');

    // Se o status foi alterado para SUSPENDED ou BLOCKED, disparar webhook específico
    if (status && status !== existingClient.status && (status === 'SUSPENDED' || status === 'BLOCKED')) {
      logger.info('🔍 [DEBUG] Antes de chamar webhook service - mudança de status');
      try {
        const eventName = status === 'SUSPENDED' ? 'client.suspended' : 'client.blocked';
        
        logger.info('🚀 [CLIENT-WEBHOOK] Iniciando disparo de webhook para mudança de status', { 
          clientId: client.id,
          clientName: client.name,
          event: eventName,
          previousStatus: existingClient.status,
          newStatus: status
        });
        
        await webhookService.dispatchWebhook(eventName, {
          clientId: client.id,
          name: client.name,
          email: client.email,
          company: client.company,
          previousStatus: existingClient.status,
          newStatus: status,
          timestamp: new Date().toISOString()
        });
        
        logger.info(`✅ [CLIENT-WEBHOOK] Webhook disparado com sucesso para ${eventName}`, { 
          clientId: client.id,
          clientName: client.name,
          event: eventName
        });
      } catch (error) {
        logger.error(`💥 [CLIENT-WEBHOOK] Erro ao disparar webhook para ${status}`, { 
          clientId: client.id,
          clientName: client.name,
          event: status === 'SUSPENDED' ? 'client.suspended' : 'client.blocked',
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
      logger.info('🔍 [DEBUG] Depois de chamar webhook service - mudança de status');
    }

    return normalizeClient(client);
  },

  async deleteClient(id: string): Promise<void> {
    logger.info('Iniciando exclusão de cliente', { id });

    const existingClient = await prisma.client.findUnique({
      where: { id }
    });

    if (!existingClient) {
      logger.error('Cliente não encontrado', { id });
      throw new Error('Cliente não encontrado');
    }

    await prisma.client.delete({
      where: { id }
    });

    logger.info('Cliente excluído com sucesso', { clientId: id });

    try {
      // Criar notificação para exclusão do cliente
      await notificationService.createNotification({
        title: 'Cliente Removido',
        message: `${existingClient.name} foi removido do sistema${existingClient.company ? ` (${existingClient.company})` : ''}`,
        type: 'error'
      });
      logger.info('Notificação criada com sucesso para exclusão de cliente');
    } catch (error) {
      logger.error('Erro ao criar notificação para exclusão de cliente', { 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });
    }

    // Disparar webhook para evento de cliente removido
    try {
      logger.info('🚀 [CLIENT-WEBHOOK] Iniciando disparo de webhook para cliente removido', { 
        clientId: existingClient.id,
        clientName: existingClient.name,
        event: 'client.deleted',
        status: existingClient.status
      });
      
      await webhookService.dispatchWebhook('client.deleted', {
        clientId: existingClient.id,
        name: existingClient.name,
        email: existingClient.email,
        company: existingClient.company,
        status: existingClient.status,
        deletedAt: new Date().toISOString(),
        timestamp: new Date().toISOString()
      });
      
      logger.info('✅ [CLIENT-WEBHOOK] Webhook disparado com sucesso para cliente removido', { 
        clientId: existingClient.id,
        clientName: existingClient.name,
        event: 'client.deleted'
      });
    } catch (error) {
      logger.error('💥 [CLIENT-WEBHOOK] Erro ao disparar webhook para cliente removido', { 
        clientId: existingClient.id,
        clientName: existingClient.name,
        event: 'client.deleted',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  },

  async getClientStatusCounts(): Promise<Record<string, number>> {
    const counts = await prisma.client.groupBy({
      by: ['status'],
      _count: true
    });

    return counts.reduce((acc: Record<string, number>, curr: { status: string; _count: number }) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {});
  }
};
