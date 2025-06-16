
#!/bin/bash

# Script para deploy no Docker Swarm
set -e

echo "🚀 Iniciando deploy no Docker Swarm..."

# Verificar se está no modo swarm
if ! docker info --format '{{.Swarm.LocalNodeState}}' | grep -q active; then
    echo "❌ Docker não está no modo Swarm. Execute: docker swarm init"
    exit 1
fi

# Verificar se a network existe
if ! docker network ls | grep -q network_public; then
    echo "⚠️  Criando network network_public..."
    docker network create --driver overlay --attachable network_public
fi

# Pull da imagem mais recente
echo "📥 Baixando imagem mais recente..."
docker pull automacaodebaixocusto/api-control:latest

# Deploy da stack
echo "📦 Fazendo deploy da stack api-control..."
docker stack deploy -c docker-compose.swarm.yml api-control

# Aguardar alguns segundos para inicialização
echo "⏳ Aguardando inicialização dos serviços..."
sleep 10

# Verificar status
echo "📊 Status dos serviços:"
docker stack ps api-control

echo ""
echo "✅ Deploy concluído!"
echo "📊 Para verificar o status: docker stack ps api-control"
echo "📋 Para ver os logs: docker service logs api-control_api-control -f"
echo "🔄 Para atualizar: docker service update --image automacaodebaixocusto/api-control:latest api-control_api-control"
echo "🌐 Aplicação disponível em: https://api-control.iacas.top"
echo "🏥 Health check: https://api-control.iacas.top/health"
