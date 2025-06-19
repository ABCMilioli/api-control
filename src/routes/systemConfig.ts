import { Router, Request, Response } from 'express';
import { systemConfigService } from '../services/systemConfigService.js';
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

export { router as systemConfigRouter }; 