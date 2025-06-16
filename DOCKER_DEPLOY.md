
# Deploy com Docker Swarm

## Pré-requisitos

1. Docker instalado e configurado
2. Docker Swarm inicializado (`docker swarm init`)
3. Traefik configurado para proxy reverso
4. Network `network_public` criada

## Passos para Deploy

### 1. Construir a Imagem

```bash
# Dar permissão de execução
chmod +x build-docker.sh

# Construir e fazer push da imagem
./build-docker.sh latest
```

### 2. Deploy no Swarm

```bash
# Dar permissão de execução
chmod +x deploy-swarm.sh

# Fazer deploy
./deploy-swarm.sh
```

### 3. Verificar Status

```bash
# Status da stack
docker stack ps api-control

# Logs do serviço
docker service logs api-control_api-control -f

# Health check
curl https://api-control.iacas.top/health
```

## Sistema de Logging

A aplicação possui um sistema de logging estruturado em JSON que captura:

### Tipos de Logs
- **System**: Eventos do sistema (inicialização, shutdown)
- **HTTP**: Requisições HTTP com método, URL, status code e tempo de resposta
- **Auth**: Eventos de autenticação (login, logout, register)
- **Database**: Operações e erros do banco de dados
- **Error**: Erros da aplicação com stack trace
- **Debug**: Logs de desenvolvimento (apenas em modo debug)

### Configuração de Logs
```bash
# Visualizar logs em tempo real (formato JSON estruturado)
docker service logs api-control_api-control -f

# Filtrar logs por nível
docker service logs api-control_api-control -f | grep '"level":"error"'

# Filtrar logs por tipo
docker service logs api-control_api-control -f | grep '"service":"api-control"'

# Logs de autenticação
docker service logs api-control_api-control -f | grep '"action":"login"'

# Logs de database
docker service logs api-control_api-control -f | grep '"operation":'
```

### Estrutura dos Logs JSON
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "info",
  "message": "HTTP GET /api/clients - 200",
  "service": "api-control",
  "environment": "production",
  "data": {
    "method": "GET",
    "url": "/api/clients",
    "statusCode": 200,
    "responseTime": "45ms"
  },
  "userId": "user123",
  "ip": "192.168.1.1"
}
```

### Configuração de Logging Docker
- **Driver**: json-file
- **Max Size**: 100MB por arquivo
- **Max Files**: 5 arquivos rotativos
- **Volume**: Logs persistentes em `/var/log/api-control`

## Comandos Úteis

### Atualização da Aplicação
```bash
# Atualizar com nova imagem
docker service update --image automacaodebaixocusto/api-control:latest api-control_api-control

# Forçar redeploy
docker service update --force api-control_api-control
```

### Scaling
```bash
# Aumentar réplicas
docker service scale api-control_api-control=3

# Diminuir réplicas
docker service scale api-control_api-control=1
```

### Logs e Debugging
```bash
# Logs em tempo real
docker service logs api-control_api-control -f

# Logs dos últimos 100 linhas
docker service logs api-control_api-control --tail 100

# Logs com timestamp
docker service logs api-control_api-control -f -t

# Inspecionar serviço
docker service inspect api-control_api-control

# Status detalhado
docker stack ps api-control --no-trunc

# Logs específicos por container
docker logs <container-id> -f
```

### Análise de Logs
```bash
# Contar erros nas últimas 1000 linhas
docker service logs api-control_api-control --tail 1000 | grep '"level":"error"' | wc -l

# Exportar logs para arquivo
docker service logs api-control_api-control > api-control-logs.json

# Ver logs de inicialização
docker service logs api-control_api-control | grep '"event":"application_start"'

# Monitorar performance de database
docker service logs api-control_api-control -f | grep '"operation":"query"'
```

### Rollback
```bash
# Rollback para versão anterior
docker service rollback api-control_api-control
```

### Remoção
```bash
# Remover stack completa
docker stack rm api-control
```

## Configurações de Produção

### Variáveis de Ambiente
- `NODE_ENV=production`
- `DATABASE_URL`: String de conexão PostgreSQL
- `API_HOST`: Domínio da aplicação
- `USE_TLS=true`: Habilita HTTPS
- `LOG_LEVEL=info`: Nível de logging (error, warn, info, debug)
- `DEBUG=false`: Desabilita logs de debug em produção

### Recursos
- **CPU**: 0.5-1.0 cores
- **Memória**: 512MB-1GB
- **Health Check**: Endpoint `/health`
- **Logs**: Rotativos, max 100MB x 5 arquivos

### Traefik Labels
- Roteamento por domínio
- SSL automático via Let's Encrypt
- Health check integrado
- Load balancing

## Monitoramento

A aplicação expõe um endpoint de health check em `/health` que retorna:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "memory": {
    "rss": 50331648,
    "heapTotal": 20971520,
    "heapUsed": 15728640
  },
  "version": "1.0.0"
}
```

## Troubleshooting

1. **Serviço não inicia**: Verificar logs com `docker service logs api-control_api-control -f`
2. **Health check falha**: Verificar se a porta 3000 está acessível
3. **Traefik não roteia**: Verificar labels e network configuration
4. **Banco de dados**: Verificar logs de database e string de conexão
5. **Performance**: Monitorar logs de tempo de resposta HTTP
6. **Autenticação**: Verificar logs de auth para falhas de login

### Comandos de Debug Específicos
```bash
# Verificar conectividade de rede
docker exec -it <container-id> wget -qO- http://localhost:3000/health

# Verificar conexão com banco
docker service logs api-control_api-control | grep "database_connection"

# Verificar erros de autenticação
docker service logs api-control_api-control | grep '"action":"login"' | grep '"success":false'
```
