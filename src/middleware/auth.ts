import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/database.js';
import { logger } from '../lib/logger.js';

// Estendendo a interface Request para incluir o usuário
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Se for uma requisição OPTIONS (preflight), permite passar
    if (req.method === 'OPTIONS') {
      return next();
    }

    // Se for uma requisição para a rota de notificações, permite passar
    if (req.path.startsWith('/api/notifications')) {
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      logger.warn('Tentativa de acesso sem token de autenticação', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      logger.warn('Token mal formatado', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      return res.status(401).json({ error: 'Token mal formatado' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });

      if (!user) {
        logger.warn('Usuário não encontrado', {
          userId: decoded.id,
          path: req.path,
          method: req.method
        });
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }

      req.user = user;
      next();
    } catch (error) {
      logger.error('Erro ao verificar token', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ error: 'Token inválido' });
    }
  } catch (error) {
    logger.error('Erro no middleware de autenticação', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      path: req.path,
      method: req.method
    });
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}; 