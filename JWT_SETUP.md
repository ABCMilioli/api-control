# Configuração da Autenticação JWT

## Configuração Inicial

1. **Copie o arquivo de exemplo**:
   ```bash
   cp env.example .env
   ```

2. **Configure as variáveis de ambiente**:
   Edite o arquivo `.env` e configure:
   ```env
   JWT_SECRET=sua_chave_secreta_muito_segura_aqui_2024
   JWT_EXPIRES_IN=7d
   ```

## Gerando uma Chave JWT Segura

Para gerar uma chave JWT segura, você pode usar:

```bash
# Usando Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Ou usar um gerador online seguro
```

## Como Funciona

### 1. Login
- O usuário faz login com email e senha
- O servidor valida as credenciais
- Se válidas, gera um token JWT com os dados do usuário
- Retorna o token junto com os dados do usuário

### 2. Autenticação
- O frontend armazena o token no localStorage
- Todas as requisições incluem o token no header `Authorization: Bearer <token>`
- O middleware de autenticação valida o token em cada requisição

### 3. Estrutura do Token
O token JWT contém:
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "nome": "Nome do Usuário",
  "role": "user"
}
```

## Arquivos Principais

- `src/config/auth.ts` - Configuração centralizada do JWT
- `src/services/authService.ts` - Serviço para gerar e verificar tokens
- `src/middleware/auth.ts` - Middleware de autenticação
- `src/stores/authStore.ts` - Store do frontend para gerenciar autenticação
- `src/lib/api.ts` - Utilitário para requisições autenticadas

## Segurança

- ✅ Token JWT com expiração
- ✅ Chave secreta configurável via variável de ambiente
- ✅ Validação de token em todas as rotas protegidas
- ✅ Logout automático em caso de token inválido
- ✅ Headers de autorização em todas as requisições

## Uso

### Frontend
```typescript
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';

// Login
const { login } = useAuthStore();
const success = await login(email, password);

// Requisições autenticadas
const response = await api.get('/users/profile');
```

### Backend
```typescript
import { authMiddleware } from '../middleware/auth';

// Rota protegida
router.get('/profile', authMiddleware, (req, res) => {
  // req.user contém os dados do usuário autenticado
  res.json(req.user);
});
``` 