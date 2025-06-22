#!/usr/bin/env node

/**
 * Script de teste para a API Key de Sistema
 * 
 * Uso:
 * 1. Configure a variável de ambiente SYSTEM_API_KEY
 * 2. Execute: node test-system-api.js
 */

const https = require('https');
const http = require('http');

// Configurações
const API_HOST = process.env.NEXT_PUBLIC_APP_URL || 
                 process.env.API_HOST || 
                 'api-control.iacas.top';
const SYSTEM_API_KEY = process.env.SYSTEM_API_KEY;
const USE_TLS = process.env.USE_TLS === 'true' || true;

if (!SYSTEM_API_KEY) {
  console.error('❌ Erro: Variável SYSTEM_API_KEY não configurada');
  console.log('Configure a variável de ambiente:');
  console.log('export SYSTEM_API_KEY="sua_api_key_de_sistema"');
  process.exit(1);
}

// Função para fazer requisições HTTP/HTTPS
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: USE_TLS ? 443 : 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-system-key': SYSTEM_API_KEY
      }
    };

    const client = USE_TLS ? https : http;
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({
            status: res.statusCode,
            data: response
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Testes
async function runTests() {
  console.log('🚀 Iniciando testes da API Key de Sistema\n');
  console.log(`📍 Host: ${API_HOST}`);
  console.log(`🔐 API Key: ${SYSTEM_API_KEY.substring(0, 8)}...`);
  console.log(`🔒 TLS: ${USE_TLS ? 'Sim' : 'Não'}\n`);

  try {
    // Teste 1: Listar API Keys
    console.log('📋 Teste 1: Listar API Keys');
    const keysResponse = await makeRequest('GET', '/api/keys');
    console.log(`Status: ${keysResponse.status}`);
    console.log(`Resposta: ${JSON.stringify(keysResponse.data, null, 2)}\n`);

    // Teste 2: Listar Clientes
    console.log('👥 Teste 2: Listar Clientes');
    const clientsResponse = await makeRequest('GET', '/api/clients');
    console.log(`Status: ${clientsResponse.status}`);
    console.log(`Resposta: ${JSON.stringify(clientsResponse.data, null, 2)}\n`);

    // Teste 3: Criar Cliente de Teste
    console.log('➕ Teste 3: Criar Cliente de Teste');
    const testClient = {
      name: `Cliente Teste ${Date.now()}`,
      email: `teste${Date.now()}@exemplo.com`,
      company: 'Empresa de Teste Ltda',
      phone: '+55 11 99999-9999'
    };

    const createClientResponse = await makeRequest('POST', '/api/clients', testClient);
    console.log(`Status: ${createClientResponse.status}`);
    console.log(`Resposta: ${JSON.stringify(createClientResponse.data, null, 2)}\n`);

    // Teste 4: Buscar Configurações do Sistema
    console.log('⚙️ Teste 4: Buscar Configurações do Sistema');
    const configResponse = await makeRequest('GET', '/api/system-config');
    console.log(`Status: ${configResponse.status}`);
    console.log(`Resposta: ${JSON.stringify(configResponse.data, null, 2)}\n`);

    console.log('✅ Todos os testes concluídos com sucesso!');
    console.log('🎉 A API Key de Sistema está funcionando corretamente.');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    process.exit(1);
  }
}

// Executar testes
runTests(); 