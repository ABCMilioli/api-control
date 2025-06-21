// Script para testar a API de verificação de administrador
const testAdminAPI = async () => {
  console.log('🔍 Testando API de verificação de administrador...');
  
  try {
    // Teste 1: Verificar se existe administrador
    console.log('\n📡 Teste 1: GET /api/users/admin-exists');
    const response = await fetch('https://control.toolschat.top/api/users/admin-exists');
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Resposta:', data);
    
    if (data.exists === false) {
      console.log('✅ Não existe administrador - deve redirecionar para /register');
    } else {
      console.log('✅ Existe administrador - deve redirecionar para /login');
    }
    
    // Teste 2: Tentar criar um administrador
    console.log('\n📡 Teste 2: POST /api/users (criar administrador)');
    const createResponse = await fetch('https://control.toolschat.top/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nome: 'Administrador Teste',
        email: 'admin@teste.com',
        password: '123456'
      })
    });
    
    const createData = await createResponse.json();
    console.log('Status:', createResponse.status);
    console.log('Resposta:', createData);
    
    if (createResponse.status === 201) {
      console.log('✅ Administrador criado com sucesso');
    } else if (createResponse.status === 403) {
      console.log('❌ Já existe um administrador');
    } else {
      console.log('❌ Erro ao criar administrador');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
  }
};

// Executar teste
testAdminAPI(); 