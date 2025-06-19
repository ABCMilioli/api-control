import { Router, Request, Response } from 'express';
import { systemConfigService } from '../services/systemConfigService.js';
import { reportService } from '../services/reportService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Buscar configurações globais
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const config = await systemConfigService.getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar configurações do sistema' });
  }
});

// Atualizar configurações globais
router.put('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const config = await systemConfigService.updateConfig(req.body);
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar configurações do sistema' });
  }
});

// Testar relatório semanal
router.post('/test-weekly-report', authMiddleware, async (req: Request, res: Response) => {
  try {
    const report = await reportService.generateWeeklyReport();
    if (report) {
      res.json({
        success: true,
        message: 'Relatório semanal gerado e enviado com sucesso',
        report
      });
    } else {
      res.json({
        success: false,
        message: 'Relatórios semanais estão desabilitados nas configurações do sistema'
      });
    }
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao gerar relatório semanal',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export { router as systemConfigRouter }; 