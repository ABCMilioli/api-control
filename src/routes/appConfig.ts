import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @route GET /api/config
 * @description Retorna configurações públicas da aplicação para o frontend.
 * @access Public
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'
  });
});

export { router as appConfigRouter }; 