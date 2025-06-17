import express, { Request, Response, NextFunction, ErrorRequestHandler, RequestHandler } from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { userRouter } from './routes/user.js';
import { clientRouter } from './routes/client.js';
import { apiKeyRouter } from './routes/apiKey.js';
import { validateRouter } from './routes/validate.js';
import { installationRouter } from './routes/installation.js';
import notificationRouter from './routes/notificationRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Log de requisições
const requestLogger: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
};

app.use(requestLogger);

// Servir arquivos estáticos do diretório dist
const staticPath = __dirname;
console.log('Servindo arquivos estáticos de:', staticPath);

// Listar arquivos no diretório
try {
  const files = fs.readdirSync(staticPath);
  console.log('Arquivos no diretório:', files);
} catch (err) {
  console.error('Erro ao listar arquivos:', err);
}

// Servir arquivos estáticos
app.use(express.static(staticPath, {
  index: false, // Desabilita o index automático
  extensions: ['html', 'js', 'css', 'json', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico']
}));

// Middleware para parsing de JSON
app.use(express.json());

// Middleware de CORS
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Rotas da API
app.use('/api/users', userRouter);
app.use('/api/clients', clientRouter);
app.use('/api/api-keys', apiKeyRouter);
app.use('/api/validate', validateRouter);
app.use('/api/installations', installationRouter);
app.use('/api/notifications', notificationRouter);

// Rota de health check
const healthCheck: RequestHandler = (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
};

app.get('/health', healthCheck);

// Todas as outras rotas servem o index.html
const serveIndex: RequestHandler = (req: Request, res: Response): void => {
  const indexPath = join(staticPath, 'index.html');
  console.log('Servindo index.html de:', indexPath);
  
  // Verificar se o arquivo existe
  if (!fs.existsSync(indexPath)) {
    console.error('index.html não encontrado em:', indexPath);
    res.status(404).send('Arquivo não encontrado');
    return;
  }

  res.sendFile(indexPath, (err: Error | null) => {
    if (err) {
      console.error('Erro ao servir index.html:', err);
      res.status(500).send('Erro ao carregar a aplicação');
    } else {
      console.log('index.html servido com sucesso');
    }
  });
};

app.get('*', serveIndex);

// Tratamento de erros
const errorHandler: ErrorRequestHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Erro na aplicação:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: err.message,
    path: req.path
  });
};

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
  console.log(`Diretório atual: ${__dirname}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`URL base: http://localhost:${port}`);
}); 