# 🗝️ Sistema de Controle de API Keys

Um sistema completo para gerenciamento e controle de acesso de API Keys com limite de instalações por dispositivo, webhooks, notificações e relatórios.

## 🚀 Funcionalidades

### 🔑 **Gestão de API Keys**
- ✅ Criação, edição e revogação de API Keys
- ✅ Limite configurável de instalações por chave
- ✅ Expiração automática
- ✅ Substituição automática de instalações quando atinge limite
- ✅ Rastreamento de uso por IP e User Agent

### 👥 **Gestão de Clientes**
- ✅ CRUD completo de clientes
- ✅ Status: Ativo, Suspenso, Bloqueado
- ✅ Associação com API Keys
- ✅ Histórico de atividades

### 📱 **Sistema de Instalações**
- ✅ Validação de API Keys em tempo real
- ✅ Rastreamento de instalações por dispositivo
- ✅ Substituição automática quando atinge limite
- ✅ Geolocalização por IP
- ✅ Histórico completo de tentativas

### 🔔 **Sistema de Notificações**
- ✅ Notificações em tempo real
- ✅ Configurações personalizáveis
- ✅ Alertas de segurança
- ✅ Notificações por email

### 🌐 **Webhooks**
- ✅ Disparo automático de eventos
- ✅ Retry com backoff exponencial
- ✅ Assinatura HMAC para segurança
- ✅ Interface de teste integrada
- ✅ Logs detalhados de entrega

### ⚙️ **Configurações do Sistema**
- ✅ Limites padrão configuráveis
- ✅ Expiração padrão configurável
- ✅ Notificações personalizáveis
- ✅ Relatórios semanais automáticos

### 📊 **Relatórios e Analytics**
- ✅ Dashboard com métricas em tempo real
- ✅ Relatórios semanais por email
- ✅ Estatísticas de uso
- ✅ Alertas de limite próximo

### 🔐 **Autenticação e Segurança**
- ✅ JWT tokens
- ✅ **Dupla autenticação (JWT + API Key de Sistema)**
- ✅ Middleware de autenticação
- ✅ Validação de permissões
- ✅ Logs de auditoria completos

### **API Key de Sistema**
O sistema suporta **dupla autenticação** para endpoints de manipulação:

#### **Métodos de Autenticação**
1. **JWT Token** - Para usuários logados via interface web
2. **API Key de Sistema** - Para automações, scripts e integrações externas

#### **Configuração**
```bash
# Adicione ao seu .env ou variáveis de ambiente
SYSTEM_API_KEY=sua_api_key_de_sistema_muito_segura_aqui
```

#### **Uso**
```bash
# Via JWT Token (usuários)
curl -H "Authorization: Bearer <jwt_token>" /api/api-keys

# Via API Key de Sistema (automações)
curl -H "x-system-key: <system_api_key>" /api/api-keys
```

#### **Configuração de URL**
A URL base é configurada através da variável de ambiente `NEXT_PUBLIC_APP_URL`:

```bash
# Exemplo de uso com variável de ambiente
BASE_URL="${NEXT_PUBLIC_APP_URL:-https://api-control.iacas.top}"
curl -H "x-system-key: $SYSTEM_API_KEY" "$BASE_URL/api/api-keys"
```

#### **Endpoints Suportados**
- `/api/api-keys/*` - Todas as operações de API Keys
- `/api/clients/*` - Todas as operações de clientes
- `/api/system-config/*` - Configurações do sistema
- `/api/webhooks/*` - Gerenciamento de webhooks

Consulte o [Guia da API Key de Sistema](SYSTEM_API_KEY_GUIDE.md) para detalhes completos.

### **Exemplos Práticos**
Consulte o arquivo [examples/env-example.sh](examples/env-example.sh) para exemplos completos de uso com variáveis de ambiente.

## 🛠️ Tecnologias

### **Frontend**
- **React 18** - Interface moderna e responsiva
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **shadcn/ui** - Componentes de interface
- **Vite** - Build tool rápido

### **Backend**
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Prisma** - ORM para banco de dados
- **PostgreSQL** - Banco de dados principal
- **JWT** - Autenticação

### **Infraestrutura**
- **Docker** - Containerização
- **Docker Compose** - Orquestração local
- **Nginx** - Proxy reverso
- **PM2** - Process manager

## 📦 Instalação

### **Pré-requisitos**
- Node.js 18+
- Docker e Docker Compose
- PostgreSQL

### **1. Clone o repositório**
```bash
git clone https://github.com/seu-usuario/keyguard-api-control.git
cd keyguard-api-control
```

### **2. Configure as variáveis de ambiente**
```bash
cp env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Banco de dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/api_control"

# JWT
JWT_SECRET="sua-chave-secreta-jwt"
JWT_EXPIRES_IN="7d"

# API Key de Sistema (para automações)
SYSTEM_API_KEY="sua_api_key_de_sistema_muito_segura_aqui"

# Servidor
PORT=3000
NODE_ENV=production

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
```

### **3. Instale as dependências**
```bash
npm install
```

### **4. Configure o banco de dados**
```bash
# Gerar cliente Prisma
npx prisma generate

# Executar migrações
npx prisma migrate deploy

# (Opcional) Popular dados iniciais
npx prisma db seed
```

### **5. Build da aplicação**
```bash
npm run build
```

### **6. Iniciar com Docker**
```bash
# Desenvolvimento
docker-compose up -d

# Produção
docker-compose -f docker-compose.swarm.yml up -d
```

### **7. Acessar a aplicação**
```
http://localhost:3000
```

## 🔧 Configuração Inicial

### **1. Criar usuário administrador**
Acesse a aplicação e use o formulário de registro para criar o primeiro usuário administrador.

### **2. Configurar SMTP (opcional)**
Vá em **Configurações > SMTP** e configure:
- Servidor SMTP
- Porta
- Usuário e senha
- Email remetente

### **3. Configurar Webhooks (opcional)**
Vá em **Configurações > Webhooks** e configure:
- URL do webhook
- Chave secreta
- Eventos para monitorar

### **4. Ajustar configurações do sistema**
Vá em **Configurações > Sistema** e configure:
- Limite padrão de instalações
- Expiração padrão
- Notificações

## 📡 API de Validação

### **Endpoint**
```
POST /api/validate
```

### **Payload**
```json
{
  "apiKey": "ak_FPV7EQlgL0thHnsv1Nz0IQzAvrdD",
  "ipAddress": "192.168.1.100",
  "userAgent": "MeuApp/1.0"
}
```

### **Resposta de Sucesso**
```json
{
  "success": true,
  "valid": true,
  "data": {
    "clientName": "Nome do Cliente",
    "installationId": "cmc3mnjj80003qn018cozx2uv",
    "replacedInstallationId": null
  }
}
```

### **Resposta de Erro**
```json
{
  "success": false,
  "error": "API_KEY_INACTIVE",
  "description": "A chave de API informada está desativada ou não existe.",
  "code": 401
}
```

## 🔗 Integração com Sistemas Externos

Consulte o arquivo `API_KEY_INTEGRATION_GUIDE.md` para instruções completas de integração em diferentes linguagens:

- **JavaScript/TypeScript** - Para aplicações web
- **Python** - Para aplicações desktop/servidor
- **PHP** - Para aplicações web
- **C# (.NET)** - Para aplicações Windows

O guia inclui:
- Código pronto para copiar e colar
- Tela de bloqueio completa
- Tratamento de erros
- Cache inteligente
- Exemplos práticos

## 📊 Eventos de Webhook

O sistema dispara webhooks para os seguintes eventos:

### **API Keys**
- `key.created` - Nova API Key criada
- `key.updated` - API Key atualizada
- `key.deleted` - API Key removida
- `key.activated` - API Key ativada
- `key.deactivated` - API Key desativada

### **Instalações**
- `installation.success` - Instalação bem-sucedida
- `installation.failed` - Instalação falhada
- `installation.limit_reached` - Limite de instalações atingido

### **Clientes**
- `client.created` - Cliente criado
- `client.updated` - Cliente atualizado
- `client.suspended` - Cliente suspenso
- `client.blocked` - Cliente bloqueado

### **Autenticação**
- `auth.login` - Login realizado
- `auth.logout` - Logout realizado

### **Sistema**
- `system.maintenance` - Manutenção programada

## 🚀 Deploy

### **Docker Swarm (Recomendado)**
```bash
# Deploy em produção
./deploy-swarm.sh
```

### **Docker Compose**
```bash
# Desenvolvimento
docker-compose up -d

# Produção
docker-compose -f docker-compose.prod.yml up -d
```

### **Manual**
```bash
# Build
npm run build

# Iniciar
npm start
```

## 📈 Monitoramento

### **Logs**
O sistema gera logs detalhados para:
- Validações de API Keys
- Tentativas de instalação
- Webhooks disparados
- Erros e exceções
- Atividades de usuários

### **Métricas**
- Número de API Keys ativas
- Instalações por período
- Taxa de sucesso de validações
- Uso de webhooks
- Performance do sistema

### **Alertas**
- API Keys próximas do limite
- Tentativas de acesso negadas
- Falhas de webhook
- Erros de sistema

## 🔒 Segurança

### **Autenticação**
- JWT tokens com expiração
- Refresh tokens
- Middleware de autenticação em todas as rotas protegidas

### **Validação**
- Verificação de API Keys em tempo real
- Rastreamento de IP e User Agent
- Proteção contra uso simultâneo excessivo

### **Webhooks**
- Assinatura HMAC para verificação
- Retry com backoff exponencial
- Timeout configurável
- Logs de auditoria

### **Dados**
- Senhas criptografadas
- Dados sensíveis mascarados
- Backup automático do banco

## 📞 Suporte

### **Documentação**
- [Guia de Integração](API_KEY_INTEGRATION_GUIDE.md)
- [Configuração de Webhooks](WEBHOOK_SETUP.md)
- [Configuração JWT](JWT_SETUP.md)

### **Contato**
- **Email**: suporte@seudominio.com
- **Documentação**: https://docs.seudominio.com
- **Status**: https://status.seudominio.com

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🎯 Roadmap

### **Próximas Funcionalidades**
- [ ] API REST completa para integração
- [ ] Dashboard avançado com gráficos
- [ ] Sistema de planos e cobrança
- [ ] Integração com gateways de pagamento
- [ ] App mobile para gestão
- [ ] API rate limiting
- [ ] Backup automático em nuvem
- [ ] Multi-tenancy

### **Melhorias Técnicas**
- [ ] Cache Redis para performance
- [ ] Microserviços
- [ ] Kubernetes deployment
- [ ] CI/CD pipeline
- [ ] Testes automatizados
- [ ] Documentação OpenAPI

---

**🎉 Sistema completo e pronto para produção!**

Para começar rapidamente, consulte o [Guia de Integração](API_KEY_INTEGRATION_GUIDE.md) para implementar a validação em seus sistemas.

# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/a8e7d769-6d15-40f0-8d2b-eaf76860daef

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/a8e7d769-6d15-40f0-8d2b-eaf76860daef) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a8e7d769-6d15-40f0-8d2b-eaf76860daef) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

#   a p i - c o n t r o l 
 
 #   a p i - c o n t r o l 
 
 