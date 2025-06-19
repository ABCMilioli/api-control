import { prisma } from '../lib/database.js';
import { systemConfigService } from './systemConfigService.js';
import { sendMail } from './emailService.js';
import { logger } from '../lib/logger.js';

export const reportService = {
  async generateWeeklyReport() {
    logger.info('Iniciando geração de relatório semanal');

    // Verificar se relatórios semanais estão habilitados
    const shouldNotifyWeeklyReport = await systemConfigService.shouldNotifyWeeklyReport();
    
    if (!shouldNotifyWeeklyReport) {
      logger.info('Relatórios semanais estão desabilitados nas configurações do sistema');
      return null;
    }

    try {
      // Buscar dados da semana passada
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Estatísticas de API Keys
      const totalApiKeys = await prisma.aPIKey.count();
      const newApiKeys = await prisma.aPIKey.count({
        where: {
          createdAt: {
            gte: oneWeekAgo
          }
        }
      });
      const activeApiKeys = await prisma.aPIKey.count({
        where: { isActive: true }
      });

      // Estatísticas de instalações
      const totalInstallations = await prisma.installation.count();
      const newInstallations = await prisma.installation.count({
        where: {
          timestamp: {
            gte: oneWeekAgo
          }
        }
      });
      const successfulInstallations = await prisma.installation.count({
        where: {
          timestamp: {
            gte: oneWeekAgo
          },
          success: true
        }
      });
      const failedInstallations = await prisma.installation.count({
        where: {
          timestamp: {
            gte: oneWeekAgo
          },
          success: false
        }
      });

      // Estatísticas de clientes
      const totalClients = await prisma.client.count();
      const newClients = await prisma.client.count({
        where: {
          createdAt: {
            gte: oneWeekAgo
          }
        }
      });

      // Top 5 clientes com mais instalações
      const topClients = await prisma.aPIKey.groupBy({
        by: ['clientName'],
        _sum: {
          currentInstallations: true
        },
        orderBy: {
          _sum: {
            currentInstallations: 'desc'
          }
        },
        take: 5
      });

      // API Keys próximas do limite
      const keysNearLimit = await prisma.aPIKey.findMany({
        where: {
          isActive: true,
          currentInstallations: {
            gte: 0 // Será filtrado manualmente
          }
        },
        select: {
          clientName: true,
          currentInstallations: true,
          maxInstallations: true
        }
      }).then(keys => keys.filter(key => 
        (key.currentInstallations / key.maxInstallations) >= 0.8
      ));

      const report = {
        period: {
          start: oneWeekAgo.toISOString(),
          end: new Date().toISOString()
        },
        apiKeys: {
          total: totalApiKeys,
          new: newApiKeys,
          active: activeApiKeys
        },
        installations: {
          total: totalInstallations,
          new: newInstallations,
          successful: successfulInstallations,
          failed: failedInstallations,
          successRate: newInstallations > 0 ? ((successfulInstallations / newInstallations) * 100).toFixed(1) : '0'
        },
        clients: {
          total: totalClients,
          new: newClients
        },
        topClients: topClients.map(client => ({
          name: client.clientName,
          installations: client._sum.currentInstallations || 0
        })),
        keysNearLimit: keysNearLimit.map(key => ({
          clientName: key.clientName,
          current: key.currentInstallations,
          max: key.maxInstallations,
          percentage: ((key.currentInstallations / key.maxInstallations) * 100).toFixed(1)
        }))
      };

      logger.info('Relatório semanal gerado com sucesso', { report });

      // Enviar relatório por email se o serviço de email estiver configurado
      try {
        await this.sendWeeklyReportEmail(report);
        logger.info('Relatório semanal enviado por email com sucesso');
      } catch (error) {
        logger.error('Erro ao enviar relatório semanal por email', { 
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }

      return report;
    } catch (error) {
      logger.error('Erro ao gerar relatório semanal', { 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  },

  async sendWeeklyReportEmail(report: any) {
    const htmlContent = `
      <h2>📊 Relatório Semanal - Sistema de API Keys</h2>
      <p><strong>Período:</strong> ${new Date(report.period.start).toLocaleDateString('pt-BR')} a ${new Date(report.period.end).toLocaleDateString('pt-BR')}</p>
      
      <h3>🔑 API Keys</h3>
      <ul>
        <li><strong>Total:</strong> ${report.apiKeys.total}</li>
        <li><strong>Novas esta semana:</strong> ${report.apiKeys.new}</li>
        <li><strong>Ativas:</strong> ${report.apiKeys.active}</li>
      </ul>
      
      <h3>📱 Instalações</h3>
      <ul>
        <li><strong>Total:</strong> ${report.installations.total}</li>
        <li><strong>Novas esta semana:</strong> ${report.installations.new}</li>
        <li><strong>Bem-sucedidas:</strong> ${report.installations.successful}</li>
        <li><strong>Falhadas:</strong> ${report.installations.failed}</li>
        <li><strong>Taxa de sucesso:</strong> ${report.installations.successRate}%</li>
      </ul>
      
      <h3>👥 Clientes</h3>
      <ul>
        <li><strong>Total:</strong> ${report.clients.total}</li>
        <li><strong>Novos esta semana:</strong> ${report.clients.new}</li>
      </ul>
      
      <h3>🏆 Top 5 Clientes</h3>
      <ol>
        ${report.topClients.map((client: any) => 
          `<li><strong>${client.name}</strong>: ${client.installations} instalações</li>`
        ).join('')}
      </ol>
      
      ${report.keysNearLimit.length > 0 ? `
        <h3>⚠️ API Keys Próximas do Limite</h3>
        <ul>
          ${report.keysNearLimit.map((key: any) => 
            `<li><strong>${key.clientName}</strong>: ${key.current}/${key.max} (${key.percentage}%)</li>`
          ).join('')}
        </ul>
      ` : ''}
      
      <hr>
      <p><em>Relatório gerado automaticamente pelo sistema.</em></p>
    `;

    await sendMail({
      to: 'admin@exemplo.com', // Pode ser configurável
      subject: '📊 Relatório Semanal - Sistema de API Keys',
      html: htmlContent
    });
  },

  // Método para agendar relatórios semanais (pode ser chamado por um cron job)
  async scheduleWeeklyReport() {
    logger.info('Agendando relatório semanal');
    
    try {
      const report = await this.generateWeeklyReport();
      if (report) {
        logger.info('Relatório semanal agendado e processado com sucesso');
      }
    } catch (error) {
      logger.error('Erro ao processar relatório semanal agendado', { 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
}; 