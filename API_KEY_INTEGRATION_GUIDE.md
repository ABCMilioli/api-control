# 🗝️ Guia de Integração - Sistema de API Keys

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Endpoint de Validação](#endpoint-de-validação)
3. [Implementação em Diferentes Linguagens](#implementação-em-diferentes-linguagens)
4. [Tratamento de Respostas](#tratamento-de-respostas)
5. [Tela de Bloqueio](#tela-de-bloqueio)
6. [Exemplos Completos](#exemplos-completos)
7. [Boas Práticas](#boas-práticas)

---

## 🎯 Visão Geral

Este documento descreve como integrar o sistema de validação de API Keys em aplicações externas. O sistema permite controlar o acesso baseado em chaves de API com limite de instalações por dispositivo.

### 🔑 Conceitos Importantes:
- **API Key**: Chave única para autenticação
- **Instalação**: Registro de uso em um dispositivo/IP
- **Limite**: Número máximo de instalações simultâneas
- **Revogação**: Desativação de uma API Key

---

## 🌐 Endpoint de Validação

### **URL Base:**
```
https://seu-dominio.com/api/validate
```

### **Método:**
```
POST
```

### **Headers:**
```
Content-Type: application/json
```

### **Payload:**
```json
{
  "apiKey": "ak_FPV7EQlgL0thHnsv1Nz0IQzAvrdD",
  "ipAddress": "192.168.1.100",
  "userAgent": "MeuApp/1.0"
}
```

---

## 📡 Respostas da API

### ✅ **Sucesso (200)**
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

### ❌ **Chave Inválida/Revogada (401)**
```json
{
  "success": false,
  "error": "API_KEY_INACTIVE",
  "description": "A chave de API informada está desativada ou não existe.",
  "code": 401
}
```

### ❌ **Chave Expirada (401)**
```json
{
  "success": false,
  "error": "API_KEY_EXPIRED",
  "description": "A chave de API informada está expirada.",
  "code": 401
}
```

### ❌ **Limite Atingido (403)**
```json
{
  "success": false,
  "error": "INSTALLATION_LIMIT_REACHED",
  "description": "Limite de 1 instalações atingido. Revogue uma instalação existente para continuar.",
  "code": 403
}
```

### ❌ **Erro Interno (500)**
```json
{
  "success": false,
  "error": "INTERNAL_ERROR",
  "description": "Erro interno ao validar API Key. Tente novamente mais tarde.",
  "code": 500
}
```

---

## 💻 Implementação em Diferentes Linguagens

### **JavaScript/TypeScript**

```javascript
class APIKeyValidator {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.installationId = null;
  }

  async validate() {
    try {
      const response = await fetch(`${this.baseUrl}/api/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: this.apiKey,
          ipAddress: await this.getIPAddress(),
          userAgent: navigator.userAgent
        })
      });

      const data = await response.json();

      if (data.success) {
        this.installationId = data.data.installationId;
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error, description: data.description };
      }
    } catch (error) {
      return { 
        success: false, 
        error: 'NETWORK_ERROR', 
        description: 'Erro de conexão com o servidor' 
      };
    }
  }

  async getIPAddress() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }
}

// Uso
const validator = new APIKeyValidator('https://seu-dominio.com', 'ak_FPV7EQlgL0thHnsv1Nz0IQzAvrdD');
const result = await validator.validate();

if (result.success) {
  console.log('API Key válida!', result.data);
} else {
  console.log('Erro:', result.description);
  showBlockScreen(result.error, result.description);
}
```

### **Python**

```python
import requests
import json
from typing import Dict, Optional

class APIKeyValidator:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.api_key = api_key
        self.installation_id = None

    def validate(self) -> Dict:
        try:
            payload = {
                "apiKey": self.api_key,
                "ipAddress": self._get_ip_address(),
                "userAgent": "PythonApp/1.0"
            }

            response = requests.post(
                f"{self.base_url}/api/validate",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )

            data = response.json()

            if data.get("success"):
                self.installation_id = data["data"]["installationId"]
                return {"success": True, "data": data["data"]}
            else:
                return {
                    "success": False,
                    "error": data.get("error"),
                    "description": data.get("description")
                }

        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": "NETWORK_ERROR",
                "description": f"Erro de conexão: {str(e)}"
            }

    def _get_ip_address(self) -> str:
        try:
            response = requests.get("https://api.ipify.org?format=json", timeout=5)
            return response.json()["ip"]
        except:
            return "unknown"

# Uso
validator = APIKeyValidator("https://seu-dominio.com", "ak_FPV7EQlgL0thHnsv1Nz0IQzAvrdD")
result = validator.validate()

if result["success"]:
    print("API Key válida!", result["data"])
else:
    print("Erro:", result["description"])
    show_block_screen(result["error"], result["description"])
```

### **PHP**

```php
<?php

class APIKeyValidator {
    private $baseUrl;
    private $apiKey;
    private $installationId;

    public function __construct($baseUrl, $apiKey) {
        $this->baseUrl = $baseUrl;
        $this->apiKey = $apiKey;
    }

    public function validate() {
        try {
            $payload = [
                'apiKey' => $this->apiKey,
                'ipAddress' => $this->getIPAddress(),
                'userAgent' => $_SERVER['HTTP_USER_AGENT'] ?? 'PHPApp/1.0'
            ];

            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $this->baseUrl . '/api/validate',
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode($payload),
                CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 30
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($response === false) {
                return [
                    'success' => false,
                    'error' => 'NETWORK_ERROR',
                    'description' => 'Erro de conexão com o servidor'
                ];
            }

            $data = json_decode($response, true);

            if ($data['success']) {
                $this->installationId = $data['data']['installationId'];
                return ['success' => true, 'data' => $data['data']];
            } else {
                return [
                    'success' => false,
                    'error' => $data['error'],
                    'description' => $data['description']
                ];
            }

        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => 'EXCEPTION',
                'description' => 'Erro interno: ' . $e->getMessage()
            ];
        }
    }

    private function getIPAddress() {
        $ipKeys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 'HTTP_X_CLUSTER_CLIENT_IP', 'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR'];
        
        foreach ($ipKeys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }
        
        return 'unknown';
    }
}

// Uso
$validator = new APIKeyValidator('https://seu-dominio.com', 'ak_FPV7EQlgL0thHnsv1Nz0IQzAvrdD');
$result = $validator->validate();

if ($result['success']) {
    echo "API Key válida! " . json_encode($result['data']);
} else {
    echo "Erro: " . $result['description'];
    showBlockScreen($result['error'], $result['description']);
}

?>
```

### **C# (.NET)**

```csharp
using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

public class APIKeyValidator
{
    private readonly string _baseUrl;
    private readonly string _apiKey;
    private string _installationId;

    public APIKeyValidator(string baseUrl, string apiKey)
    {
        _baseUrl = baseUrl;
        _apiKey = apiKey;
    }

    public async Task<ValidationResult> ValidateAsync()
    {
        try
        {
            using (var client = new HttpClient())
            {
                var payload = new
                {
                    apiKey = _apiKey,
                    ipAddress = await GetIPAddressAsync(),
                    userAgent = "DotNetApp/1.0"
                };

                var json = JsonConvert.SerializeObject(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await client.PostAsync($"{_baseUrl}/api/validate", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                var data = JsonConvert.DeserializeObject<dynamic>(responseContent);

                if (data.success == true)
                {
                    _installationId = data.data.installationId;
                    return new ValidationResult
                    {
                        Success = true,
                        Data = new ValidationData
                        {
                            ClientName = data.data.clientName,
                            InstallationId = data.data.installationId,
                            ReplacedInstallationId = data.data.replacedInstallationId
                        }
                    };
                }
                else
                {
                    return new ValidationResult
                    {
                        Success = false,
                        Error = data.error,
                        Description = data.description
                    };
                }
            }
        }
        catch (Exception ex)
        {
            return new ValidationResult
            {
                Success = false,
                Error = "NETWORK_ERROR",
                Description = $"Erro de conexão: {ex.Message}"
            };
        }
    }

    private async Task<string> GetIPAddressAsync()
    {
        try
        {
            using (var client = new HttpClient())
            {
                var response = await client.GetStringAsync("https://api.ipify.org?format=json");
                var data = JsonConvert.DeserializeObject<dynamic>(response);
                return data.ip;
            }
        }
        catch
        {
            return "unknown";
        }
    }
}

public class ValidationResult
{
    public bool Success { get; set; }
    public string Error { get; set; }
    public string Description { get; set; }
    public ValidationData Data { get; set; }
}

public class ValidationData
{
    public string ClientName { get; set; }
    public string InstallationId { get; set; }
    public string ReplacedInstallationId { get; set; }
}

// Uso
var validator = new APIKeyValidator("https://seu-dominio.com", "ak_FPV7EQlgL0thHnsv1Nz0IQzAvrdD");
var result = await validator.ValidateAsync();

if (result.Success)
{
    Console.WriteLine($"API Key válida! Cliente: {result.Data.ClientName}");
}
else
{
    Console.WriteLine($"Erro: {result.Description}");
    ShowBlockScreen(result.Error, result.Description);
}
```

---

## 🚫 Tela de Bloqueio

### **HTML/CSS/JavaScript**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acesso Bloqueado</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        .block-screen {
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            padding: 40px;
            text-align: center;
            max-width: 500px;
            width: 90%;
        }

        .icon {
            font-size: 64px;
            margin-bottom: 20px;
        }

        .error-icon { color: #e74c3c; }
        .warning-icon { color: #f39c12; }
        .info-icon { color: #3498db; }

        h1 {
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 28px;
        }

        .description {
            color: #7f8c8d;
            margin-bottom: 30px;
            line-height: 1.6;
        }

        .error-code {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
            color: #495057;
        }

        .contact-info {
            background: #e8f4fd;
            border: 1px solid #bee5eb;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
        }

        .retry-button {
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
            transition: background 0.3s;
        }

        .retry-button:hover {
            background: #0056b3;
        }

        .retry-button:disabled {
            background: #6c757d;
            cursor: not-allowed;
        }
    </style>
</head>
<body>
    <div class="block-screen">
        <div id="icon" class="icon error-icon">🔒</div>
        <h1 id="title">Acesso Bloqueado</h1>
        <p id="description" class="description">
            Sua chave de API foi revogada ou está inválida.
        </p>
        <div id="errorCode" class="error-code" style="display: none;">
            Código: <span id="errorCodeText"></span>
        </div>
        <div class="contact-info">
            <strong>Precisa de ajuda?</strong><br>
            Entre em contato com o suporte técnico.
        </div>
        <button id="retryButton" class="retry-button" onclick="retryValidation()">
            Tentar Novamente
        </button>
    </div>

    <script>
        // Função para mostrar tela de bloqueio
        function showBlockScreen(error, description) {
            const icon = document.getElementById('icon');
            const title = document.getElementById('title');
            const desc = document.getElementById('description');
            const errorCode = document.getElementById('errorCode');
            const errorCodeText = document.getElementById('errorCodeText');

            // Configurar baseado no tipo de erro
            switch(error) {
                case 'API_KEY_INACTIVE':
                    icon.textContent = '🔒';
                    icon.className = 'icon error-icon';
                    title.textContent = 'Chave de API Revogada';
                    desc.textContent = 'Sua chave de API foi desativada ou não existe.';
                    break;
                    
                case 'API_KEY_EXPIRED':
                    icon.textContent = '⏰';
                    icon.className = 'icon warning-icon';
                    title.textContent = 'Chave de API Expirada';
                    desc.textContent = 'Sua chave de API expirou. Entre em contato para renovar.';
                    break;
                    
                case 'INSTALLATION_LIMIT_REACHED':
                    icon.textContent = '📱';
                    icon.className = 'icon warning-icon';
                    title.textContent = 'Limite de Instalações Atingido';
                    desc.textContent = 'Você atingiu o limite de instalações permitidas.';
                    break;
                    
                case 'NETWORK_ERROR':
                    icon.textContent = '🌐';
                    icon.className = 'icon info-icon';
                    title.textContent = 'Erro de Conexão';
                    desc.textContent = 'Não foi possível conectar ao servidor de validação.';
                    break;
                    
                default:
                    icon.textContent = '❌';
                    icon.className = 'icon error-icon';
                    title.textContent = 'Erro de Validação';
                    desc.textContent = description || 'Ocorreu um erro durante a validação.';
            }

            // Mostrar código de erro se disponível
            if (error) {
                errorCodeText.textContent = error;
                errorCode.style.display = 'block';
            }

            // Salvar dados para retry
            window.lastValidationData = { error, description };
        }

        // Função para tentar novamente
        async function retryValidation() {
            const button = document.getElementById('retryButton');
            button.disabled = true;
            button.textContent = 'Verificando...';

            try {
                // Aqui você deve implementar a lógica de validação
                const result = await validateAPIKey();
                
                if (result.success) {
                    // Redirecionar para aplicação principal
                    window.location.href = '/app';
                } else {
                    showBlockScreen(result.error, result.description);
                }
            } catch (error) {
                showBlockScreen('NETWORK_ERROR', 'Erro ao tentar novamente');
            } finally {
                button.disabled = false;
                button.textContent = 'Tentar Novamente';
            }
        }

        // Função de validação (implementar conforme sua aplicação)
        async function validateAPIKey() {
            // Implementar chamada para sua API de validação
            throw new Error('Implementar validação');
        }

        // Mostrar tela de bloqueio se chamada diretamente
        if (window.location.search.includes('error=')) {
            const urlParams = new URLSearchParams(window.location.search);
            const error = urlParams.get('error');
            const description = urlParams.get('description');
            showBlockScreen(error, description);
        }
    </script>
</body>
</html>
```

### **React Component**

```jsx
import React, { useState } from 'react';
import './BlockScreen.css';

const BlockScreen = ({ error, description, onRetry }) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const getErrorConfig = (error) => {
    switch(error) {
      case 'API_KEY_INACTIVE':
        return {
          icon: '🔒',
          title: 'Chave de API Revogada',
          description: 'Sua chave de API foi desativada ou não existe.',
          type: 'error'
        };
      case 'API_KEY_EXPIRED':
        return {
          icon: '⏰',
          title: 'Chave de API Expirada',
          description: 'Sua chave de API expirou. Entre em contato para renovar.',
          type: 'warning'
        };
      case 'INSTALLATION_LIMIT_REACHED':
        return {
          icon: '📱',
          title: 'Limite de Instalações Atingido',
          description: 'Você atingiu o limite de instalações permitidas.',
          type: 'warning'
        };
      case 'NETWORK_ERROR':
        return {
          icon: '🌐',
          title: 'Erro de Conexão',
          description: 'Não foi possível conectar ao servidor de validação.',
          type: 'info'
        };
      default:
        return {
          icon: '❌',
          title: 'Erro de Validação',
          description: description || 'Ocorreu um erro durante a validação.',
          type: 'error'
        };
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const config = getErrorConfig(error);

  return (
    <div className="block-screen">
      <div className={`icon ${config.type}-icon`}>
        {config.icon}
      </div>
      <h1>{config.title}</h1>
      <p className="description">{config.description}</p>
      
      {error && (
        <div className="error-code">
          Código: {error}
        </div>
      )}
      
      <div className="contact-info">
        <strong>Precisa de ajuda?</strong><br />
        Entre em contato com o suporte técnico.
      </div>
      
      <button 
        className="retry-button"
        onClick={handleRetry}
        disabled={isRetrying}
      >
        {isRetrying ? 'Verificando...' : 'Tentar Novamente'}
      </button>
    </div>
  );
};

export default BlockScreen;
```

---

## 🔄 Tratamento de Respostas

### **Fluxo de Validação Recomendado:**

```javascript
async function validateAndHandleAccess() {
  // 1. Verificar se já tem dados salvos
  const savedData = localStorage.getItem('apiKeyData');
  if (savedData) {
    const data = JSON.parse(savedData);
    const now = Date.now();
    
    // Cache válido por 1 hora
    if (now - data.timestamp < 3600000) {
      return { success: true, data: data };
    }
  }

  // 2. Fazer validação
  const validator = new APIKeyValidator(API_BASE_URL, API_KEY);
  const result = await validator.validate();

  if (result.success) {
    // 3. Salvar dados para cache
    localStorage.setItem('apiKeyData', JSON.stringify({
      ...result.data,
      timestamp: Date.now()
    }));
    
    // 4. Permitir acesso
    return result;
  } else {
    // 5. Mostrar tela de bloqueio
    showBlockScreen(result.error, result.description);
    return result;
  }
}

// Uso na aplicação
document.addEventListener('DOMContentLoaded', async () => {
  const result = await validateAndHandleAccess();
  
  if (!result.success) {
    // Aplicação já foi bloqueada pela função showBlockScreen
    return;
  }
  
  // Continuar carregamento da aplicação
  initializeApp();
});
```

---

## 📱 Exemplos Completos

### **Aplicação Web Simples**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minha Aplicação</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .app-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .loading {
            text-align: center;
            padding: 50px;
            color: #666;
        }
        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    <div id="loading" class="loading">
        <h2>Verificando acesso...</h2>
        <p>Por favor, aguarde.</p>
    </div>

    <div id="app" class="app-container hidden">
        <h1>Minha Aplicação</h1>
        <p>Bem-vindo! Sua API Key está válida.</p>
        <div id="clientInfo"></div>
    </div>

    <script>
        const API_BASE_URL = 'https://seu-dominio.com';
        const API_KEY = 'ak_FPV7EQlgL0thHnsv1Nz0IQzAvrdD';

        class APIKeyValidator {
            constructor(baseUrl, apiKey) {
                this.baseUrl = baseUrl;
                this.apiKey = apiKey;
            }

            async validate() {
                try {
                    const response = await fetch(`${this.baseUrl}/api/validate`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            apiKey: this.apiKey,
                            ipAddress: await this.getIPAddress(),
                            userAgent: navigator.userAgent
                        })
                    });

                    const data = await response.json();

                    if (data.success) {
                        return { success: true, data: data.data };
                    } else {
                        return { success: false, error: data.error, description: data.description };
                    }
                } catch (error) {
                    return { 
                        success: false, 
                        error: 'NETWORK_ERROR', 
                        description: 'Erro de conexão com o servidor' 
                    };
                }
            }

            async getIPAddress() {
                try {
                    const response = await fetch('https://api.ipify.org?format=json');
                    const data = await response.json();
                    return data.ip;
                } catch {
                    return 'unknown';
                }
            }
        }

        function showBlockScreen(error, description) {
            // Redirecionar para tela de bloqueio
            window.location.href = `/block.html?error=${encodeURIComponent(error)}&description=${encodeURIComponent(description)}`;
        }

        async function initializeApp() {
            const loading = document.getElementById('loading');
            const app = document.getElementById('app');
            const clientInfo = document.getElementById('clientInfo');

            try {
                // Verificar cache
                const savedData = localStorage.getItem('apiKeyData');
                if (savedData) {
                    const data = JSON.parse(savedData);
                    const now = Date.now();
                    
                    if (now - data.timestamp < 3600000) { // 1 hora
                        loading.classList.add('hidden');
                        app.classList.remove('hidden');
                        clientInfo.innerHTML = `
                            <h3>Informações do Cliente:</h3>
                            <p><strong>Nome:</strong> ${data.clientName}</p>
                            <p><strong>Instalação ID:</strong> ${data.installationId}</p>
                        `;
                        return;
                    }
                }

                // Fazer validação
                const validator = new APIKeyValidator(API_BASE_URL, API_KEY);
                const result = await validator.validate();

                if (result.success) {
                    // Salvar cache
                    localStorage.setItem('apiKeyData', JSON.stringify({
                        ...result.data,
                        timestamp: Date.now()
                    }));

                    // Mostrar aplicação
                    loading.classList.add('hidden');
                    app.classList.remove('hidden');
                    clientInfo.innerHTML = `
                        <h3>Informações do Cliente:</h3>
                        <p><strong>Nome:</strong> ${result.data.clientName}</p>
                        <p><strong>Instalação ID:</strong> ${result.data.installationId}</p>
                    `;
                } else {
                    showBlockScreen(result.error, result.description);
                }
            } catch (error) {
                showBlockScreen('NETWORK_ERROR', 'Erro ao inicializar aplicação');
            }
        }

        // Inicializar quando página carregar
        document.addEventListener('DOMContentLoaded', initializeApp);
    </script>
</body>
</html>
```

---

## ✅ Boas Práticas

### **1. Cache Inteligente**
- Cache de validação por 1 hora
- Invalidar cache em caso de erro
- Permitir refresh manual

### **2. Tratamento de Erros**
- Sempre tratar erros de rede
- Mostrar mensagens amigáveis
- Permitir retry em erros temporários

### **3. Segurança**
- Nunca expor API Keys no frontend
- Usar HTTPS sempre
- Validar IP quando possível

### **4. UX/UI**
- Mostrar loading durante validação
- Tela de bloqueio clara e informativa
- Botão de retry sempre disponível

### **5. Monitoramento**
- Log de tentativas de validação
- Métricas de sucesso/falha
- Alertas para problemas

---

## 📞 Suporte

Para dúvidas ou problemas com a integração:

- **Email**: suporte@seudominio.com
- **Documentação**: https://docs.seudominio.com
- **Status**: https://status.seudominio.com

---

**🎯 Este documento contém tudo necessário para implementar a validação de API Keys em qualquer sistema!** 