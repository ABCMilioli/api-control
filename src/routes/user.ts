import { Router, Request, Response, RequestHandler } from 'express';
import { prisma } from '../lib/database.js';
import bcrypt from 'bcryptjs';
import { AuthService } from '../services/authService.js';
import { logger } from '../lib/logger.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Handler da rota de criação de usuário
const createUser: RequestHandler = async (req, res) => {
  try {
    const { nome, email, password } = req.body;

    if (!nome || !email || !password) {
      res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
      return;
    }

    // Verifica se o email já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'Email já cadastrado.' });
      return;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria o usuário
    const user = await prisma.user.create({
      data: { nome, email, password: hashedPassword }
    });

    // Retorna o usuário criado (sem a senha)
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
};

// Handler da rota de login
const loginUser: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email e senha são obrigatórios.' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Credenciais inválidas.' });
      return;
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Credenciais inválidas.' });
      return;
    }
    
    // Gera o token JWT
    const token = AuthService.generateToken({
      id: user.id,
      email: user.email,
      nome: user.nome,
      role: user.role || 'user'
    });

    // Log para verificar se o token foi gerado
    logger.info('Token JWT gerado com sucesso', {
      userId: user.id,
      email: user.email,
      tokenLength: token.length
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    logger.error('Erro ao fazer login', { error: error instanceof Error ? error.message : 'Erro desconhecido' });
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

// Rota para atualizar perfil do usuário autenticado
router.put('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { nome, email } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }
    if (!nome || !email) {
      res.status(400).json({ error: 'Nome e email são obrigatórios' });
      return;
    }

    // Verifica se o novo email já está em uso por outro usuário
    const emailExists = await prisma.user.findFirst({
      where: {
        email,
        id: { not: userId }
      }
    });
    if (emailExists) {
      res.status(409).json({ error: 'Email já cadastrado para outro usuário' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { nome, email }
    });

    logger.info('Perfil do usuário atualizado', { userId, nome, email });
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
    return;
  } catch (error) {
    logger.error('Erro ao atualizar perfil do usuário', { error: error instanceof Error ? error.message : 'Erro desconhecido' });
    res.status(500).json({ error: 'Erro ao atualizar perfil do usuário' });
    return;
  }
});

// Rota para alterar senha do usuário autenticado
router.put('/me/password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Senha atual incorreta' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    logger.info('Senha do usuário alterada com sucesso', { userId });
    res.json({ success: true, message: 'Senha alterada com sucesso' });
    return;
  } catch (error) {
    logger.error('Erro ao alterar senha do usuário', { error: error instanceof Error ? error.message : 'Erro desconhecido' });
    res.status(500).json({ error: 'Erro ao alterar senha do usuário' });
    return;
  }
});

// Registrar as rotas
router.post('/', createUser);
router.post('/login', loginUser);

export { router as userRouter }; 