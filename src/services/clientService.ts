import { prisma } from '../lib/database.js';
import { Client } from '../types/index.js';

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
    const { name, email, company, phone, notes, status } = data;

    if (!name || !email) {
      throw new Error('Nome e email são obrigatórios');
    }

    const existingClient = await prisma.client.findUnique({
      where: { email }
    });

    if (existingClient) {
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
    return normalizeClient(client);
  },

  async updateClient(id: string, data: Partial<Omit<Client, 'id' | 'createdAt'>>): Promise<Client> {
    const { name, email, company, phone, notes, status } = data;

    if (!name || !email) {
      throw new Error('Nome e email são obrigatórios');
    }

    const existingClient = await prisma.client.findUnique({
      where: { id }
    });

    if (!existingClient) {
      throw new Error('Cliente não encontrado');
    }

    const emailExists = await prisma.client.findFirst({
      where: {
        email,
        id: { not: id }
      }
    });

    if (emailExists) {
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
    return normalizeClient(client);
  },

  async deleteClient(id: string): Promise<void> {
    const existingClient = await prisma.client.findUnique({
      where: { id }
    });

    if (!existingClient) {
      throw new Error('Cliente não encontrado');
    }

    await prisma.client.delete({
      where: { id }
    });
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
