
import { logger } from '../lib/logger';

export interface RequestContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
  sessionId?: string;
}

export const logRequest = (
  method: string,
  url: string,
  statusCode: number,
  startTime: number,
  context?: RequestContext
) => {
  const responseTime = Date.now() - startTime;
  
  logger.httpRequest(method, url, statusCode, responseTime, {
    userId: context?.userId,
    ip: context?.ip,
    userAgent: context?.userAgent,
    url,
    method
  });
};

export const logError = (
  error: Error,
  context?: RequestContext & { url?: string; method?: string }
) => {
  logger.error('Application Error', {
    error: error.message,
    stack: error.stack,
    name: error.name
  }, context);
};

export const logAuth = (
  action: 'login' | 'logout' | 'register' | 'token_refresh',
  userId?: string,
  success: boolean = true,
  context?: RequestContext
) => {
  logger.auth(action, userId, success, context);
};
