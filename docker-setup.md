
# Docker Setup Instructions

## Passos para configurar e executar o sistema com Docker

### 1. Configurar variáveis de ambiente
Copie o arquivo `.env.example` para `.env` e configure as credenciais:
```bash
cp .env.example .env
```

### 2. Construir e executar os containers
```bash
# Construir e executar em background
docker-compose up -d --build

# Para ver os logs
docker-compose logs -f api-control

# Para parar os containers
docker-compose down
```

### 3. Verificar se está funcionando
- Aplicação: http://localhost:3000
- PostgreSQL: localhost:5432

### 4. Executar comandos do Prisma (se necessário)
```bash
# Entrar no container da aplicação
docker-compose exec api-control sh

# Dentro do container, executar comandos Prisma
npx prisma studio
npx prisma db seed
```

### 5. Variáveis de ambiente padrão
Se não configurar o `.env`, será usado:
- POSTGRES_USER: api_control
- POSTGRES_PASSWORD: your_password_here
- POSTGRES_DB: api_control
- POSTGRES_PORT: 5432

### Troubleshooting
- Se der erro de conexão com DB, aguarde alguns segundos para o PostgreSQL inicializar
- Para resetar o banco: `docker-compose down -v` (remove volumes)
- Para reconstruir: `docker-compose up --build`
