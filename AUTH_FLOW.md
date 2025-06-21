# 🔐 Fluxo de Autenticação e Verificação de Administrador

## 🎯 **Como Funciona**

### **1. Primeiro Acesso (Sem Administrador)**
```
Usuário acessa / → Index.tsx verifica se existe admin → Não existe → Redireciona para /register
```

### **2. Acesso Normal (Com Administrador)**
```
Usuário acessa / → Index.tsx verifica se existe admin → Existe → Redireciona para /login
```

### **3. Usuário Autenticado**
```
Usuário acessa / → Index.tsx verifica se está autenticado → Está → Redireciona para /dashboard
```

## 📋 **Componentes Envolvidos**

### **Index.tsx (Página Principal)**
- ✅ Verifica se usuário está autenticado
- ✅ Se não autenticado, verifica se existe administrador
- ✅ Redireciona para registro ou login conforme necessário
- ✅ Mostra loading durante verificação

### **Register.tsx (Página de Registro)**
- ✅ Verifica se já existe administrador
- ✅ Se existe, redireciona para login
- ✅ Se não existe, permite criar primeiro administrador
- ✅ Cria usuário com role 'ADMIN'

### **Login.tsx (Página de Login)**
- ✅ Formulário de login simples
- ✅ Usa credenciais padrão para teste
- ✅ Redireciona para dashboard após login

## 🔧 **API Endpoints**

### **GET /api/users/admin-exists**
```json
// Resposta
{
  "exists": true/false
}
```

### **POST /api/users (Criar Administrador)**
```json
// Request
{
  "nome": "Nome do Admin",
  "email": "admin@exemplo.com",
  "password": "senha123"
}

// Resposta
{
  "id": "user_id",
  "nome": "Nome do Admin",
  "email": "admin@exemplo.com",
  "role": "ADMIN"
}
```

### **POST /api/users/login**
```json
// Request
{
  "email": "admin@exemplo.com",
  "password": "senha123"
}

// Resposta
{
  "user": {
    "id": "user_id",
    "nome": "Nome do Admin",
    "email": "admin@exemplo.com",
    "role": "ADMIN"
  },
  "token": "jwt_token"
}
```

## 🚀 **Fluxo Completo**

### **Cenário 1: Primeira Instalação**
1. Usuário acessa `http://localhost:3000`
2. `Index.tsx` verifica se existe administrador
3. Como não existe, redireciona para `/register`
4. `Register.tsx` mostra formulário de criação
5. Usuário cria primeiro administrador
6. Sistema redireciona para `/login`
7. Usuário faz login
8. Sistema redireciona para `/dashboard`

### **Cenário 2: Acesso Normal**
1. Usuário acessa `http://localhost:3000`
2. `Index.tsx` verifica se existe administrador
3. Como existe, redireciona para `/login`
4. Usuário faz login
5. Sistema redireciona para `/dashboard`

### **Cenário 3: Usuário Já Logado**
1. Usuário acessa `http://localhost:3000`
2. `Index.tsx` verifica se está autenticado
3. Como está autenticado, redireciona para `/dashboard`

## 🛠️ **Configurações**

### **Credenciais Padrão (Login.tsx)**
```typescript
const [formData, setFormData] = useState({
  email: 'admin@apicontrol.com',
  password: '123456'
});
```

### **Validações**
- ✅ Senha mínima: 6 caracteres
- ✅ Email obrigatório
- ✅ Nome obrigatório
- ✅ Confirmação de senha

### **Segurança**
- ✅ Apenas um administrador pode ser criado
- ✅ Senhas são criptografadas com bcrypt
- ✅ Tokens JWT para autenticação
- ✅ Rotas protegidas com middleware

## 🔍 **Debug e Troubleshooting**

### **Verificar se Existe Administrador**
```bash
curl -X GET http://localhost:3000/api/users/admin-exists
```

### **Verificar Logs**
```bash
docker logs -f container-name
```

### **Problemas Comuns**

1. **Página sempre mostra registro**
   - Verificar se a API `/api/users/admin-exists` está funcionando
   - Verificar logs do servidor

2. **Não consegue criar administrador**
   - Verificar se já existe um administrador
   - Verificar logs de erro

3. **Login não funciona**
   - Verificar se o usuário foi criado corretamente
   - Verificar se a senha está correta

## 📝 **Notas Importantes**

- ✅ O sistema permite apenas **um administrador**
- ✅ O primeiro usuário criado será sempre administrador
- ✅ Após criar o administrador, só é possível fazer login
- ✅ Todas as rotas do dashboard são protegidas
- ✅ O token JWT é persistido no localStorage

---

**🎉 Sistema de autenticação funcionando corretamente!** 