#!/bin/bash

# Exemplo de uso das variáveis de ambiente para a API Control
# Copie este arquivo e configure suas variáveis

# =============================================================================
# CONFIGURAÇÃO DAS VARIÁVEIS DE AMBIENTE
# =============================================================================

# URL base da API (configurada em NEXT_PUBLIC_APP_URL)
export NEXT_PUBLIC_APP_URL="https://api-control.iacas.top"

# API Key de sistema para automações
export SYSTEM_API_KEY="sua_api_key_de_sistema_muito_segura_aqui"

# Configurações opcionais
export USE_TLS="true"
export API_HOST="api-control.iacas.top"

# =============================================================================
# FUNÇÕES DE EXEMPLO
# =============================================================================

# Função para obter a URL base
get_base_url() {
    echo "${NEXT_PUBLIC_APP_URL:-https://api-control.iacas.top}"
}

# Função para listar API Keys
list_api_keys() {
    local base_url=$(get_base_url)
    echo "Listando API Keys de: $base_url"
    
    curl -X GET "$base_url/api/keys" \
        -H "x-system-key: $SYSTEM_API_KEY" \
        -H "Content-Type: application/json" \
        -s | jq '.'
}

# Função para criar cliente
create_client() {
    local base_url=$(get_base_url)
    local name="$1"
    local email="$2"
    local company="$3"
    
    echo "Criando cliente em: $base_url"
    
    curl -X POST "$base_url/api/clients" \
        -H "x-system-key: $SYSTEM_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$name\",
            \"email\": \"$email\",
            \"company\": \"$company\",
            \"phone\": \"+55 11 99999-9999\"
        }" \
        -s | jq '.'
}

# Função para criar API Key
create_api_key() {
    local base_url=$(get_base_url)
    local client_id="$1"
    local max_installations="${2:-10}"
    
    echo "Criando API Key em: $base_url"
    
    curl -X POST "$base_url/api/keys" \
        -H "x-system-key: $SYSTEM_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"clientId\": \"$client_id\",
            \"maxInstallations\": $max_installations,
            \"expiresAt\": \"2024-12-31T23:59:59Z\"
        }" \
        -s | jq '.'
}

# Função para obter configurações do sistema
get_system_config() {
    local base_url=$(get_base_url)
    echo "Obtendo configurações de: $base_url"
    
    curl -X GET "$base_url/api/system-config" \
        -H "x-system-key: $SYSTEM_API_KEY" \
        -H "Content-Type: application/json" \
        -s | jq '.'
}

# =============================================================================
# EXEMPLOS DE USO
# =============================================================================

echo "🚀 API Control - Exemplos de Uso"
echo "=================================="
echo "URL Base: $(get_base_url)"
echo "API Key: ${SYSTEM_API_KEY:0:8}..."
echo ""

# Exemplo 1: Listar API Keys
echo "📋 Exemplo 1: Listando API Keys"
list_api_keys
echo ""

# Exemplo 2: Criar cliente
echo "👥 Exemplo 2: Criando cliente"
create_client "Empresa Teste" "contato@empresateste.com" "Empresa Teste Ltda"
echo ""

# Exemplo 3: Obter configurações
echo "⚙️ Exemplo 3: Configurações do sistema"
get_system_config
echo ""

echo "✅ Exemplos concluídos!"
echo ""
echo "💡 Dica: Use 'source env-example.sh' para carregar as variáveis"
echo "💡 Dica: Instale 'jq' para formatação JSON: sudo apt install jq" 