import { Request, Response } from 'express';
import { logger } from './lib/logger.js';

// Simple health check endpoint for Docker Swarm/Traefik
export const healthCheck = () => {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  };

  // Log health check (apenas em debug para não poluir os logs)
  logger.debug('Health check requested', healthData);
  
  return healthData;
};

// Função para log de inicialização da aplicação
export const logApplicationStart = () => {
  logger.system('application_start', {
    nodeVersion: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV,
    port: process.env.PORT || 3000,
    pid: process.pid
  });
};

// Função para log de shutdown da aplicação
export const logApplicationShutdown = () => {
  logger.system('application_shutdown', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
};
