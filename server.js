import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Servir arquivos estáticos do diretório dist
app.use(express.static(join(__dirname, 'dist')));

// Rota de health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Todas as outras rotas servem o index.html
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 