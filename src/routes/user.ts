import { Router, Request, Response, RequestHandler } from 'express';
import { prisma } from '../lib/database.js';
import bcrypt from 'bcryptjs';

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
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

// Registrar as rotas
router.post('/', createUser);
router.post('/login', loginUser);

export { router as userRouter }; 