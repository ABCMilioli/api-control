# Guia da API Key de Sistema

## Visão Geral

O sistema API Control agora suporta **dupla autenticação** para endpoints de manipulação de clientes e APIs:

1. **JWT Token** - Para usuários logados via interface web
2. **API Key de Sistema** - Para automações, scripts e integrações externas

## Configuração

### 1. Variável de Ambiente

Adicione a seguinte variável ao seu arquivo `.env` ou configuração do Docker Swarm:

```bash
SYSTEM_API_KEY=sua_api_key_de_sistema_muito_segura_aqui
```

### 2. Geração de API Key Segura

Recomendamos gerar uma API Key segura usando:

```bash
# Gerar uma API Key de 64 caracteres
openssl rand -hex 32

# Ou usar um gerador online de chaves seguras
```

## Uso

### Header de Autenticação

Use o header `x-system-key` em suas requisições:

```bash
# Substitua pela sua URL base (configurada em NEXT_PUBLIC_APP_URL)
BASE_URL="https://api-control.iacas.top"

curl -X GET $BASE_URL/api/api-keys \
  -H "x-system-key: sua_api_key_de_sistema" \
  -H "Content-Type: application/json"
```

### Endpoints Suportados

A API Key de sistema funciona em todos os endpoints que usam `authMiddleware`:

#### API Keys
- `GET /api/api-keys` - Listar API Keys
- `POST /api/api-keys` - Criar API Key
- `PUT /api/api-keys/:id` - Atualizar API Key
- `PUT /api/api-keys/:id/revoke` - Revogar API Key
- `DELETE /api/api-keys/:id` - Deletar API Key

#### Clientes
- `GET /api/clients` - Listar clientes
- `GET /api/clients/:id` - Buscar cliente
- `POST /api/clients` - Criar cliente
- `PUT /api/clients/:id` - Atualizar cliente
- `DELETE /api/clients/:id` - Deletar cliente
- `GET /api/clients/status-counts` - Contagem de status

#### Configurações do Sistema
- `GET /api/system-config` - Buscar configurações
- `PUT /api/system-config` - Atualizar configurações
- `POST /api/system-config/test-weekly-report` - Testar relatório

#### Webhooks
- `GET /api/webhooks` - Listar webhooks
- `GET /api/webhooks/:id` - Buscar webhook
- `POST /api/webhooks` - Criar webhook
- `PUT /api/webhooks/:id` - Atualizar webhook
- `DELETE /api/webhooks/:id` - Deletar webhook

## Exemplos Práticos

### 1. Criar Cliente via Script

```bash
#!/bin/bash

# Configure estas variáveis de ambiente
API_KEY="sua_api_key_de_sistema"
BASE_URL="${NEXT_PUBLIC_APP_URL:-https://api-control.iacas.top}"

curl -X POST "$BASE_URL/api/clients" \
  -H "x-system-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nova Empresa",
    "email": "contato@novaempresa.com",
    "company": "Nova Empresa Ltda",
    "phone": "+55 11 88888-8888"
  }'
```

### 2. Criar API Key para Cliente

```bash
#!/bin/bash

# Configure estas variáveis de ambiente
API_KEY="sua_api_key_de_sistema"
BASE_URL="${NEXT_PUBLIC_APP_URL:-https://api-control.iacas.top}"
CLIENT_ID="cln_abc123def456"
CLIENT_NAME="Empresa Exemplo"
CLIENT_EMAIL="contato@exemplo.com"
NEW_API_KEY="ak_gerada_pelo_script_123"

curl -X POST "$BASE_URL/api/api-keys" \\
  -H "x-system-key: $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "key": "'"$NEW_API_KEY"'",
    "clientId": "'"$CLIENT_ID"'",
    "clientName": "'"$CLIENT_NAME"'",
    "clientEmail": "'"$CLIENT_EMAIL"'",
    "maxInstallations": 10,
    "expiresAt": "2025-12-31T23:59:59Z"
  }'
```

#### Parâmetros do Corpo (Body)

| Parâmetro        | Tipo    | Obrigatório | Descrição                                        |
|------------------|---------|-------------|----------------------------------------------------|
| `key`            | String  | **Sim**     | O valor único da chave de API.                     |
| `clientId`       | String  | **Sim**     | O ID do cliente associado.                         |
| `clientName`     | String  | **Sim**     | O nome do cliente.                                 |
| `clientEmail`    | String  | **Sim**     | O email do cliente.                                |
| `maxInstallations` | Integer | **Sim**     | O número máximo de instalações (deve ser número). |
| `isActive`       | Boolean | Não         | Define se a chave está ativa (padrão: `true`).     |
| `expiresAt`      | String  | Não         | Data de expiração no formato ISO 8601.             |

### 3. Listar Todas as API Keys

```bash
#!/bin/bash

# Configure estas variáveis de ambiente
API_KEY="sua_api_key_de_sistema"
BASE_URL="${NEXT_PUBLIC_APP_URL:-https://api-control.iacas.top}"

curl -X GET "$BASE_URL/api/api-keys" \
  -H "x-system-key: $API_KEY" \
  -H "Content-Type: application/json"
```

## Segurança

### Boas Práticas

1. **Gere uma API Key forte** - Use pelo menos 32 caracteres aleatórios
2. **Mantenha segura** - Nunca commite a API Key no código
3. **Rotacione periodicamente** - Troque a API Key regularmente
4. **Use HTTPS** - Sempre use conexões seguras
5. **Monitore o uso** - Verifique os logs de acesso

### Logs de Auditoria

O sistema registra todas as tentativas de acesso via API Key de sistema:

```json
{
  "level": "info",
  "message": "Acesso via API Key de sistema",
  "path": "/api/api-keys",
  "method": "GET",
  "ip": "192.168.1.100",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Migração

### Para Usuários Existentes

Se você já usa JWT tokens, **não precisa fazer nada**. O sistema continua funcionando normalmente.

### Para Novos Scripts

Para novos scripts de automação, use a API Key de sistema:

```bash
# Antes (JWT)
curl -H "Authorization: Bearer $JWT_TOKEN" /api/api-keys

# Agora (API Key de Sistema)
curl -H "x-system-key: $SYSTEM_API_KEY" /api/api-keys
```

## Troubleshooting

### Erro 401 - API Key inválida

```json
{
  "error": "API Key de sistema inválida"
}
```

**Solução:** Verifique se a variável `SYSTEM_API_KEY` está configurada corretamente.

### Erro 401 - Token não fornecido

```json
{
  "error": "Token não fornecido"
}
```

**Solução:** Certifique-se de incluir o header `x-system-key` na requisição.

### Prioridade de Autenticação

O sistema verifica a autenticação na seguinte ordem:

1. **API Key de Sistema** (`x-system-key`)
2. **JWT Token** (`Authorization: Bearer`)

Se ambos estiverem presentes, a API Key de sistema tem prioridade.

## Suporte

Para dúvidas ou problemas com a API Key de sistema, consulte:

1. Logs do sistema para detalhes de erro
2. Documentação da API
3. Configuração das variáveis de ambiente 