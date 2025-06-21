import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'vite';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware para parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do diretório dist
const distPath = join(__dirname, 'dist');
app.use(express.static(distPath));

// Rota de health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Verificar se o index.html existe
const indexPath = join(distPath, 'index.html');
const indexExists = fs.existsSync(indexPath);

console.log('📁 Diretório dist:', distPath);
console.log('📄 index.html existe:', indexExists);
console.log('📋 Arquivos no diretório:', fs.readdirSync(distPath));

// Todas as outras rotas servem o index.html
app.get('*', (req, res) => {
  if (indexExists) {
    res.sendFile(indexPath);
  } else {
    // Fallback: criar um index.html básico
    const fallbackHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>API Control - Sistema de Gerenciamento de API Keys</title>
        </head>
        <body>
          <div id="root">
            <h1>API Control</h1>
            <p>Sistema de Gerenciamento de API Keys</p>
            <p>Status: Carregando...</p>
          </div>
          <script>
            // Redirecionar para a aplicação principal
            window.location.href = '/';
          </script>
        </body>
      </html>
    `;
    res.send(fallbackHtml);
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log(`📁 Diretório atual: ${__dirname}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL base: http://localhost:${port}`);
}); 