import { prisma } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import crypto from 'crypto';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
  webhookId: string;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  response?: string;
  error?: string;
  retryCount: number;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  statusCode?: number;
  response?: string;
  error?: string;
  retryCount: number;
  success: boolean;
  timestamp: Date;
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  secret: string | null;
  events: string[];
  isActive: boolean;
  retryCount: number;
  timeout: number;
  createdAt: Date;
  updatedAt: Date;
}

class WebhookService {
  /**
   * Dispara webhooks para um evento específico
   */
  async dispatchWebhook(event: string, data: any): Promise<void> {
    const startTime = Date.now();
    logger.info('🚀 [WEBHOOK] Iniciando disparo de webhooks', { 
      event, 
      dataKeys: Object.keys(data),
      timestamp: new Date().toISOString(),
      dataSize: JSON.stringify(data).length
    });

    try {
      // Buscar webhooks ativos que escutam este evento
      logger.info('🔍 [WEBHOOK] Buscando webhooks ativos no banco de dados...');
      const webhooks = await prisma.webhookConfig.findMany({
        where: {
          isActive: true
        }
      });

      logger.info('📊 [WEBHOOK] Webhooks encontrados no banco', { 
        totalWebhooks: webhooks.length,
        webhookIds: webhooks.map(w => w.id)
      });

      // Filtrar webhooks que escutam este evento específico
      const filteredWebhooks = webhooks.filter(webhook => {
        const events = webhook.events as string[];
        const hasEvent = events.includes(event);
        logger.info('🔍 [WEBHOOK] Verificando webhook', {
          webhookId: webhook.id,
          webhookName: webhook.name,
          webhookUrl: webhook.url,
          configuredEvents: events,
          targetEvent: event,
          hasEvent: hasEvent
        });
        return hasEvent;
      });

      if (filteredWebhooks.length === 0) {
        logger.warn('⚠️ [WEBHOOK] Nenhum webhook configurado para este evento', { 
          event,
          totalWebhooks: webhooks.length,
          activeWebhooks: webhooks.filter(w => w.isActive).length
        });
        return;
      }

      logger.info('🎯 [WEBHOOK] Webhooks filtrados para o evento', { 
        event, 
        count: filteredWebhooks.length,
        webhookIds: filteredWebhooks.map(w => w.id),
        webhookNames: filteredWebhooks.map(w => w.name),
        webhookUrls: filteredWebhooks.map(w => w.url)
      });

      // Disparar webhooks em paralelo
      logger.info('📤 [WEBHOOK] Iniciando disparo paralelo de webhooks...');
      const deliveryPromises = filteredWebhooks.map(webhook => 
        this.sendWebhook(webhook as WebhookConfig, event, data)
      );

      const results = await Promise.allSettled(deliveryPromises);
      
      // Log dos resultados
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
      
      logger.info('✅ [WEBHOOK] Disparo de webhooks concluído', { 
        event, 
        totalWebhooks: filteredWebhooks.length,
        successful,
        failed,
        duration: Date.now() - startTime
      });

      // Log detalhado de cada resultado
      results.forEach((result, index) => {
        const webhook = filteredWebhooks[index];
        if (result.status === 'fulfilled') {
          logger.info('📋 [WEBHOOK] Resultado do webhook', {
            webhookId: webhook.id,
            webhookName: webhook.name,
            webhookUrl: webhook.url,
            success: result.value.success,
            statusCode: result.value.statusCode,
            retryCount: result.value.retryCount,
            error: result.value.error
          });
        } else {
          logger.error('❌ [WEBHOOK] Erro no webhook', {
            webhookId: webhook.id,
            webhookName: webhook.name,
            webhookUrl: webhook.url,
            error: result.reason
          });
        }
      });

    } catch (error) {
      logger.error('💥 [WEBHOOK] Erro ao disparar webhooks', { 
        event,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined,
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Envia um webhook específico
   */
  async sendWebhook(webhook: WebhookConfig, event: string, data: any): Promise<WebhookDeliveryResult> {
    const startTime = Date.now();
    logger.info('📤 [WEBHOOK] Iniciando envio de webhook', { 
      webhookId: webhook.id,
      webhookName: webhook.name,
      webhookUrl: webhook.url,
      event,
      retryCount: 0,
      timeout: webhook.timeout,
      hasSecret: !!webhook.secret
    });

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      webhookId: webhook.id
    };

    logger.info('📦 [WEBHOOK] Payload preparado', {
      webhookId: webhook.id,
      event: payload.event,
      timestamp: payload.timestamp,
      dataKeys: Object.keys(payload.data),
      payloadSize: JSON.stringify(payload).length
    });

    let retryCount = 0;
    const maxRetries = webhook.retryCount || 3;
    const timeout = webhook.timeout || 30000;

    while (retryCount <= maxRetries) {
      try {
        logger.info('🔄 [WEBHOOK] Tentativa de envio', { 
          webhookId: webhook.id,
          webhookName: webhook.name,
          webhookUrl: webhook.url,
          event,
          retryCount,
          maxRetries,
          timeout
        });

        const result = await this.makeWebhookRequest(webhook, payload, timeout);
        
        // Log do resultado
        await this.logWebhookDelivery(webhook.id, event, payload, result);
        
        if (result.success) {
          logger.info('✅ [WEBHOOK] Webhook enviado com sucesso', { 
            webhookId: webhook.id,
            webhookName: webhook.name,
            webhookUrl: webhook.url,
            event,
            statusCode: result.statusCode,
            responseSize: result.response?.length || 0,
            duration: Date.now() - startTime
          });
          return result;
        } else {
          logger.warn('⚠️ [WEBHOOK] Webhook falhou', { 
            webhookId: webhook.id,
            webhookName: webhook.name,
            webhookUrl: webhook.url,
            event,
            statusCode: result.statusCode,
            error: result.error,
            response: result.response,
            retryCount,
            duration: Date.now() - startTime
          });
        }

        // Se não foi bem-sucedido e ainda há tentativas, aguardar antes de tentar novamente
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          logger.info('⏳ [WEBHOOK] Aguardando antes da próxima tentativa', {
            webhookId: webhook.id,
            delay,
            retryCount,
            nextRetry: retryCount + 1
          });
          await this.delay(delay);
        }

        retryCount++;
      } catch (error) {
        logger.error('💥 [WEBHOOK] Erro ao enviar webhook', { 
          webhookId: webhook.id,
          webhookName: webhook.name,
          webhookUrl: webhook.url,
          event,
          retryCount,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          stack: error instanceof Error ? error.stack : undefined,
          duration: Date.now() - startTime
        });

        const result: WebhookDeliveryResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          retryCount
        };

        await this.logWebhookDelivery(webhook.id, event, payload, result);

        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000;
          logger.info('⏳ [WEBHOOK] Aguardando antes da próxima tentativa (após erro)', {
            webhookId: webhook.id,
            delay,
            retryCount,
            nextRetry: retryCount + 1
          });
          await this.delay(delay);
        }

        retryCount++;
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    const finalResult: WebhookDeliveryResult = {
      success: false,
      error: 'Todas as tentativas falharam',
      retryCount: maxRetries
    };

    logger.error('💥 [WEBHOOK] Todas as tentativas falharam', {
      webhookId: webhook.id,
      webhookName: webhook.name,
      webhookUrl: webhook.url,
      event,
      maxRetries,
      duration: Date.now() - startTime
    });

    await this.logWebhookDelivery(webhook.id, event, payload, finalResult);
    return finalResult;
  }

  /**
   * Faz a requisição HTTP para o webhook
   */
  private async makeWebhookRequest(webhook: WebhookConfig, payload: WebhookPayload, timeout: number): Promise<WebhookDeliveryResult> {
    const startTime = Date.now();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'KeyGuard-API-Control/1.0',
      'X-Webhook-Event': payload.event,
      'X-Webhook-Timestamp': payload.timestamp,
      'X-Webhook-ID': webhook.id
    };

    // Adicionar assinatura se houver chave secreta
    if (webhook.secret) {
      const signature = this.createSignature(payload, webhook.secret);
      headers['X-Webhook-Signature'] = signature;
      logger.info('🔐 [WEBHOOK] Assinatura adicionada', {
        webhookId: webhook.id,
        signatureLength: signature.length
      });
    }

    logger.info('🌐 [WEBHOOK] Fazendo requisição HTTP', {
      webhookId: webhook.id,
      webhookUrl: webhook.url,
      method: 'POST',
      headers: Object.keys(headers),
      timeout,
      payloadSize: JSON.stringify(payload).length
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();

      logger.info('📡 [WEBHOOK] Resposta recebida', {
        webhookId: webhook.id,
        webhookUrl: webhook.url,
        statusCode: response.status,
        statusText: response.statusText,
        responseSize: responseText.length,
        responseHeaders: Object.fromEntries(response.headers.entries()),
        duration: Date.now() - startTime
      });

      return {
        success: response.ok,
        statusCode: response.status,
        response: responseText,
        retryCount: 0
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        logger.error('⏰ [WEBHOOK] Timeout na requisição', {
          webhookId: webhook.id,
          webhookUrl: webhook.url,
          timeout,
          duration: Date.now() - startTime
        });
        return {
          success: false,
          error: 'Timeout',
          retryCount: 0
        };
      }

      logger.error('💥 [WEBHOOK] Erro na requisição HTTP', {
        webhookId: webhook.id,
        webhookUrl: webhook.url,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined,
        duration: Date.now() - startTime
      });

      throw error;
    }
  }

  /**
   * Cria assinatura HMAC para o payload
   */
  private createSignature(payload: WebhookPayload, secret: string): string {
    const payloadString = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
    
    return `sha256=${signature}`;
  }

  /**
   * Registra o resultado do envio do webhook
   */
  private async logWebhookDelivery(
    webhookId: string, 
    event: string, 
    payload: WebhookPayload, 
    result: WebhookDeliveryResult
  ): Promise<void> {
    try {
      logger.info('📝 [WEBHOOK] Registrando resultado do envio', {
        webhookId,
        event,
        success: result.success,
        statusCode: result.statusCode,
        retryCount: result.retryCount,
        error: result.error,
        responseSize: result.response?.length || 0,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('💥 [WEBHOOK] Erro ao registrar log do webhook', {
        webhookId,
        event,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Aguarda um tempo específico
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Testa um webhook enviando um payload de teste
   */
  async testWebhook(webhookId: string): Promise<WebhookDeliveryResult> {
    try {
      logger.info('🧪 [WEBHOOK] Iniciando teste de webhook', { webhookId });
      
      const webhook = await prisma.webhookConfig.findUnique({
        where: { id: webhookId }
      });

      if (!webhook) {
        logger.error('❌ [WEBHOOK] Webhook não encontrado para teste', { webhookId });
        throw new Error('Webhook não encontrado');
      }

      const testData = {
        test: true,
        message: 'Este é um teste de webhook',
        timestamp: new Date().toISOString()
      };

      logger.info('🧪 [WEBHOOK] Dados de teste preparados', { 
        webhookId, 
        webhookName: webhook.name,
        testData
      });

      const result = await this.sendWebhook(webhook as WebhookConfig, 'test.webhook', testData);

      logger.info('🧪 [WEBHOOK] Teste de webhook concluído', { 
        webhookId, 
        success: result.success,
        statusCode: result.statusCode 
      });

      return result;
    } catch (error) {
      logger.error('💥 [WEBHOOK] Erro ao testar webhook', { 
        webhookId,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Retorna estatísticas de webhooks
   */
  async getWebhookStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    events: Record<string, number>;
  }> {
    try {
      logger.info('📊 [WEBHOOK] Buscando estatísticas de webhooks');
      
      const webhooks = await prisma.webhookConfig.findMany();
      
      const stats = {
        total: webhooks.length,
        active: webhooks.filter((w: any) => w.isActive).length,
        inactive: webhooks.filter((w: any) => !w.isActive).length,
        events: {} as Record<string, number>
      };

      // Contar eventos
      webhooks.forEach((webhook: any) => {
        const events = webhook.events as string[];
        events.forEach(event => {
          stats.events[event] = (stats.events[event] || 0) + 1;
        });
      });

      logger.info('📊 [WEBHOOK] Estatísticas calculadas', stats);

      return stats;
    } catch (error) {
      logger.error('💥 [WEBHOOK] Erro ao buscar estatísticas de webhooks', {
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }
}

export const webhookService = new WebhookService(); 