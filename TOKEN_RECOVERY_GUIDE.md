# 🔑 Guia para Recuperar o Token de Autorização

## 🎯 **Onde Encontrar o Token**

### **1. Página de Configurações (Recomendado)**
1. Faça login no sistema
2. Vá para **Configurações** no menu lateral
3. Role até a seção **"Status da Autenticação JWT"**
4. Clique no botão **"Mostrar Token"**
5. O token completo será exibido

### **2. Console do Navegador**
```javascript
// Abra o console do navegador (F12)
// Execute o comando:
localStorage.getItem('auth-storage')
```

### **3. DevTools - Application**
1. Abra as DevTools (F12)
2. Vá para a aba **Application**
3. No painel esquerdo, clique em **Local Storage**
4. Selecione o domínio do site
5. Procure pela chave `auth-storage`
6. O valor contém o token

## 🔧 **Como o Token é Gerado**

### **1. Login no Sistema**
```typescript
// Quando você faz login, o sistema:
const response = await fetch('/api/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await response.json();
// data.token contém o JWT
```

### **2. Armazenamento Automático**
```typescript
// O token é automaticamente armazenado no Zustand store
set({ 
  user: data.user, 
  token: data.token,  // ← Aqui está o token
  isAuthenticated: true 
});
```

### **3. Persistência**
- O token é salvo no `localStorage` automaticamente
- Persiste entre sessões do navegador
- É usado automaticamente em todas as requisições

## 📋 **Como Usar o Token**

### **1. Header de Autorização**
```bash
# Formato correto para usar o token
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **2. Exemplo de Requisição**
```bash
curl -X GET https://control.toolschat.top/api/keys \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

### **3. JavaScript/Fetch**
```javascript
const response = await fetch('/api/keys', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## 🛠️ **Componente AuthTest**

### **Funcionalidades:**
- ✅ Mostra status da autenticação
- ✅ Exibe informações do usuário
- ✅ Permite visualizar o token completo
- ✅ Botão para logout
- ✅ Informações técnicas do token

### **Como Acessar:**
1. Login no sistema
2. Menu lateral → **Configurações**
3. Seção **"Status da Autenticação JWT"**

## 🔍 **Verificações Importantes**

### **1. Token Válido**
- Verifique se o token não está expirado
- O token tem formato JWT padrão (3 partes separadas por pontos)
- Exemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`

### **2. Permissões**
- Verifique se o usuário tem role `ADMIN`
- Apenas administradores podem acessar todas as APIs

### **3. Expiração**
- Tokens JWT têm tempo de expiração
- Se o token expirar, faça login novamente

## 🚨 **Segurança**

### **⚠️ Importante:**
- **NUNCA** compartilhe seu token
- **NUNCA** comite tokens no código
- **SEMPRE** use HTTPS em produção
- **MONITORE** o uso do token

### **Boas Práticas:**
- Use variáveis de ambiente para tokens
- Implemente refresh tokens
- Monitore tentativas de acesso
- Faça logout quando não estiver usando

## 📝 **Exemplo Completo**

### **1. Recuperar Token**
```javascript
// No console do navegador
const authData = JSON.parse(localStorage.getItem('auth-storage'));
const token = authData.state.token;
console.log('Token:', token);
```

### **2. Usar Token**
```bash
# Exemplo de requisição com token
curl -X GET https://control.toolschat.top/api/clients \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

### **3. Verificar Resposta**
```json
{
  "success": true,
  "data": [
    {
      "id": "client-123",
      "name": "Empresa ABC",
      "email": "contato@empresa.com"
    }
  ]
}
```

## 🆘 **Problemas Comuns**

### **Token Expirado (401)**
```json
{
  "error": "Token expirado ou inválido"
}
```
**Solução:** Faça login novamente

### **Token Ausente (401)**
```json
{
  "error": "Token de autorização necessário"
}
```
**Solução:** Verifique se está logado

### **Permissão Negada (403)**
```json
{
  "error": "Acesso negado"
}
```
**Solução:** Verifique se tem role ADMIN

---

**🎉 Agora você sabe como recuperar e usar o token de autorização!** 