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
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário', details: error });
  }
};

// Registrar a rota
router.post('/', createUser);

export { router as userRouter }; 