import { Router, Request, Response, RequestHandler } from 'express';
import { prisma } from '../lib/database.js';
import bcrypt from 'bcryptjs';
import { AuthService } from '../services/authService.js';
import { logger } from '../lib/logger.js';
import { authMiddleware } from '../middleware/auth.js';
import { sendMail } from '../services/emailService.js';
import crypto from 'crypto';

const router = Router();

// Handler da rota de criação de usuário
const createUser: RequestHandler = async (req, res) => {
  try {
    const adminExists = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (adminExists) {
      res.status(403).json({ error: 'Já existe um administrador cadastrado.' });
      return;
    }
    const { nome, email, password } = req.body;
    if (!nome || !email || !password) {
      res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        nome,
        email,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    res.status(201).json({ id: user.id, nome: user.nome, email: user.email, role: user.role });
    return;
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Email já cadastrado.' });
      return;
    }
    res.status(500).json({ error: 'Erro ao criar usuário.' });
    return;
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

// Rota para verificar se existe ADMIN
router.get('/admin-exists', async (req: Request, res: Response) => {
  try {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    res.json({ exists: !!admin });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar admin' });
  }
});

// Criar configuração SMTP (apenas se não existir ativa)
router.post('/smtp-config', authMiddleware, async (req: Request, res: Response) => {
  try {
    const exists = await prisma.sMTPConfig.findFirst({ where: { ativo: true } });
    if (exists) {
      res.status(409).json({ error: 'Já existe uma configuração SMTP ativa.' });
      return;
    }
    const { host, port, username, password, encryption, fromEmail, fromName } = req.body;
    if (!host || !port || !username || !password || !encryption || !fromEmail || !fromName) {
      res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
      return;
    }
    const smtpConfig = await prisma.sMTPConfig.create({
      data: {
        host,
        port: Number(port),
        username,
        password,
        encryption,
        fromEmail,
        fromName,
        ativo: true
      }
    });
    res.status(201).json(smtpConfig);
    return;
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar configuração SMTP.' });
    return;
  }
});

// Atualizar configuração SMTP (por id)
router.put('/smtp-config/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { host, port, username, password, encryption, fromEmail, fromName, ativo } = req.body;
    const smtpConfig = await prisma.sMTPConfig.update({
      where: { id },
      data: {
        host,
        port: Number(port),
        username,
        password,
        encryption,
        fromEmail,
        fromName,
        ativo: ativo !== undefined ? ativo : true
      }
    });
    res.json(smtpConfig);
    return;
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar configuração SMTP.' });
    return;
  }
});

// Buscar configuração SMTP ativa
router.get('/smtp-config', authMiddleware, async (req: Request, res: Response) => {
  try {
    const config = await prisma.sMTPConfig.findFirst({ where: { ativo: true } });
    if (!config) {
      res.status(404).json({ error: 'Nenhuma configuração SMTP encontrada.' });
      return;
    }
    // Nunca retornar a senha
    const { password, ...configWithoutPassword } = config;
    res.json(configWithoutPassword);
    return;
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar configuração SMTP.' });
    return;
  }
});

// Rota de recuperação de senha
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email é obrigatório.' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Por segurança, sempre retorna sucesso
      res.json({ success: true });
      return;
    }
    // Gerar token de recuperação (válido por 1h)
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    // Salvar token e expiração no usuário (ou em tabela separada se preferir)
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpires: expires }
    });
    // Montar link de recuperação
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'}/recuperar-senha?token=${token}`;
    // Enviar email
    await sendMail({
      to: email,
      subject: 'Recuperação de Senha',
      html: `<p>Olá,</p><p>Para redefinir sua senha, clique no link abaixo:</p><p><a href="${resetLink}">${resetLink}</a></p><p>Se não solicitou, ignore este email.</p>`
    });
    res.json({ success: true });
    return;
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar email de recuperação.' });
    return;
  }
});

// Rota de redefinição de senha
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }
    
    // Buscar usuário pelo token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() }
      }
    });
    
    if (!user) {
      res.status(400).json({ error: 'Token inválido ou expirado.' });
      return;
    }
    
    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Atualizar senha e limpar token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null
      }
    });
    
    logger.info('Senha redefinida com sucesso', { userId: user.id });
    res.json({ success: true, message: 'Senha redefinida com sucesso' });
    return;
  } catch (error) {
    logger.error('Erro ao redefinir senha', { error: error instanceof Error ? error.message : 'Erro desconhecido' });
    res.status(500).json({ error: 'Erro ao redefinir senha.' });
    return;
  }
});

// Registrar as rotas
router.post('/', createUser);
router.post('/login', loginUser);

export { router as userRouter }; 