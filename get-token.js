#!/usr/bin/env node

/**
 * Script para recuperar o token de autorização do sistema
 * 
 * Como usar:
 * 1. Abra o console do navegador (F12)
 * 2. Cole e execute este script
 * 3. O token será exibido no console
 */

console.log('🔑 Recuperando token de autorização...\n');

try {
  // Recupera dados do localStorage
  const authData = localStorage.getItem('auth-storage');
  
  if (!authData) {
    console.log('❌ Nenhum dado de autenticação encontrado');
    console.log('💡 Faça login primeiro no sistema');
    return;
  }

  // Parse dos dados
  const parsedData = JSON.parse(authData);
  const token = parsedData.state?.token;
  const user = parsedData.state?.user;
  const isAuthenticated = parsedData.state?.isAuthenticated;

  console.log('📊 Status da Autenticação:');
  console.log(`   Autenticado: ${isAuthenticated ? '✅ Sim' : '❌ Não'}`);
  console.log(`   Token: ${token ? '✅ Presente' : '❌ Ausente'}`);
  console.log(`   Usuário: ${user ? user.nome : '❌ Não carregado'}`);
  
  if (user) {
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user.id}`);
  }

  console.log('\n🔑 Token JWT:');
  if (token) {
    console.log('='.repeat(80));
    console.log(token);
    console.log('='.repeat(80));
    
    // Decodifica o JWT para mostrar informações
    const parts = token.split('.');
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(atob(parts[1]));
        console.log('\n📋 Informações do Token:');
        console.log(`   Issued At: ${new Date(payload.iat * 1000).toLocaleString()}`);
        console.log(`   Expires At: ${payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'N/A'}`);
        console.log(`   User ID: ${payload.userId || 'N/A'}`);
        console.log(`   Role: ${payload.role || 'N/A'}`);
      } catch (e) {
        console.log('⚠️ Não foi possível decodificar o payload do token');
      }
    }
    
    console.log('\n📋 Como usar o token:');
    console.log('curl -X GET https://control.toolschat.top/api/keys \\');
    console.log(`  -H "Authorization: Bearer ${token}" \\`);
    console.log('  -H "Content-Type: application/json"');
    
  } else {
    console.log('❌ Token não encontrado');
    console.log('💡 Faça login no sistema para gerar um token');
  }

} catch (error) {
  console.error('❌ Erro ao recuperar token:', error);
  console.log('💡 Verifique se está logado no sistema');
}

console.log('\n🎯 Dica: Você também pode acessar Configurações → Status da Autenticação JWT para ver o token'); 