import { prisma } from '../lib/database.js';
import { Client } from '../types/index.js';

export class ClientService {
  // Buscar todos os clientes
  static async getAll(): Promise<Client[]> {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return clients.map((client) => ({
      id: client.id,
      name: client.name,
      email: client.email,
      company: client.company || undefined,
      phone: client.phone || undefined,
      notes: client.notes || undefined,
      status: client.status.toLowerCase() as 'active' | 'suspended' | 'blocked',
      createdAt: client.createdAt
    }));
  }

  // Buscar cliente por ID
  static async getById(id: string): Promise<Client | null> {
    const client = await prisma.client.findUnique({
      where: { id }
    });

    if (!client) return null;

    return {
      id: client.id,
      name: client.name,
      email: client.email,
      company: client.company || undefined,
      phone: client.phone || undefined,
      notes: client.notes || undefined,
      status: client.status.toLowerCase() as 'active' | 'suspended' | 'blocked',
      createdAt: client.createdAt
    };
  }

  // Criar novo cliente
  static async create(data: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    const client = await prisma.client.create({
      data: {
        name: data.name,
        email: data.email,
        company: data.company,
        phone: data.phone,
        notes: data.notes,
        status: data.status.toUpperCase() as 'ACTIVE' | 'SUSPENDED' | 'BLOCKED'
      }
    });

    return {
      id: client.id,
      name: client.name,
      email: client.email,
      company: client.company || undefined,
      phone: client.phone || undefined,
      notes: client.notes || undefined,
      status: client.status.toLowerCase() as 'active' | 'suspended' | 'blocked',
      createdAt: client.createdAt
    };
  }

  // Atualizar cliente
  static async update(id: string, data: Partial<Omit<Client, 'id' | 'createdAt'>>): Promise<Client> {
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status.toUpperCase();

    const client = await prisma.client.update({
      where: { id },
      data: updateData
    });

    return {
      id: client.id,
      name: client.name,
      email: client.email,
      company: client.company || undefined,
      phone: client.phone || undefined,
      notes: client.notes || undefined,
      status: client.status.toLowerCase() as 'active' | 'suspended' | 'blocked',
      createdAt: client.createdAt
    };
  }

  // Deletar cliente
  static async delete(id: string): Promise<void> {
    await prisma.client.delete({
      where: { id }
    });
  }

  // Buscar clientes por termo de pesquisa
  static async search(searchTerm: string): Promise<Client[]> {
    const clients = await prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { company: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    return clients.map((client) => ({
      id: client.id,
      name: client.name,
      email: client.email,
      company: client.company || undefined,
      phone: client.phone || undefined,
      notes: client.notes || undefined,
      status: client.status.toLowerCase() as 'active' | 'suspended' | 'blocked',
      createdAt: client.createdAt
    }));
  }

  // Contar clientes por status
  static async getStatusCounts() {
    const [active, suspended, blocked] = await Promise.all([
      prisma.client.count({ where: { status: 'ACTIVE' } }),
      prisma.client.count({ where: { status: 'SUSPENDED' } }),
      prisma.client.count({ where: { status: 'BLOCKED' } })
    ]);

    return { active, suspended, blocked };
  }
}
