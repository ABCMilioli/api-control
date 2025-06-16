import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Configurar logs do Prisma
// prisma.$on('query', (e: any) => {
//   logger.database((e.level as any), undefined, e.duration, undefined);
// });
//
// prisma.$on('error', (e: any) => {
//   logger.database((e.level as any), e.target, undefined, e);
// });
//
// prisma.$on('info', (e: any) => {
//   logger.database((e.level as any), e.target, undefined, e.message);
// });
//
// prisma.$on('warn', (e: any) => {
//   logger.database((e.level as any), e.target, undefined, e.message);
// });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Função para testar a conexão
export async function testDatabaseConnection() {
  const startTime = Date.now();
  try {
    logger.system('database_connection_test_start');
    await prisma.$connect();
    const duration = Date.now() - startTime;
    logger.database('connection_test', 'postgres', duration);
    logger.system('database_connected', { duration: `${duration}ms` });
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.database('connection_test_failed', 'postgres', duration, error);
    logger.error('Database connection failed', error);
    return false;
  }
}

// Função para desconectar
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    logger.system('database_disconnected');
  } catch (error) {
    logger.error('Error disconnecting from database', error);
  }
}
