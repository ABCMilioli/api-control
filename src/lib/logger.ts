interface LogLevel {
  ERROR: 'ERROR';
  WARN: 'WARN';
  INFO: 'INFO';
  DEBUG: 'DEBUG';
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
  userId?: string;
  ip?: string;
  userAgent?: string;
  url?: string;
  method?: string;
}

class Logger {
  private formatLog(entry: LogEntry): string {
    return JSON.stringify({
      ...entry,
      timestamp: new Date().toISOString(),
      service: 'api-control',
      environment: process.env.NODE_ENV || 'development'
    });
  }

  private log(level: string, message: string, data?: any, context?: Partial<LogEntry>) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      ...context
    };

    const formattedLog = this.formatLog(logEntry);
    
    // Enviar para stdout para captura pelo Docker
    console.log(formattedLog);
  }

  error(message: string, data?: any, context?: Partial<LogEntry>) {
    this.log(LOG_LEVELS.ERROR, message, data, context);
  }

  warn(message: string, data?: any, context?: Partial<LogEntry>) {
    this.log(LOG_LEVELS.WARN, message, data, context);
  }

  info(message: string, data?: any, context?: Partial<LogEntry>) {
    this.log(LOG_LEVELS.INFO, message, data, context);
  }

  debug(message: string, data?: any, context?: Partial<LogEntry>) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
      this.log(LOG_LEVELS.DEBUG, message, data, context);
    }
  }

  // Método específico para logs de requisições HTTP
  httpRequest(method: string, url: string, statusCode: number, responseTime: number, context?: Partial<LogEntry>) {
    this.info(`HTTP ${method} ${url} - ${statusCode}`, {
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`
    }, context);
  }

  // Método para logs de autenticação
  auth(action: string, userId?: string, success: boolean = true, context?: Partial<LogEntry>) {
    const level = success ? LOG_LEVELS.INFO : LOG_LEVELS.WARN;
    this.log(level, `Auth: ${action}`, {
      userId,
      success,
      action
    }, context);
  }

  // Método para logs de database
  database(operation: any, table?: any, duration?: any, error?: any) {
    if (error) {
      this.error(`Database error: ${operation}`, {
        operation,
        table,
        error: error?.message || error,
        duration: duration ? `${duration}ms` : undefined
      });
    } else {
      this.info(`Database: ${operation}`, {
        operation,
        table,
        duration: duration ? `${duration}ms` : undefined
      });
    }
  }

  // Método para logs de sistema
  system(event: string, data?: any) {
    this.info(`System: ${event}`, data);
  }
}

export const logger = new Logger();
export { LOG_LEVELS };
