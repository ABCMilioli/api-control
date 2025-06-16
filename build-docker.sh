
#!/bin/bash

# Script para build da imagem Docker
set -e

# Configurações
IMAGE_NAME="automacaodebaixocusto/api-control"
TAG=${1:-latest}
FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"

echo "🐳 Construindo imagem Docker: $FULL_IMAGE_NAME"

# Build da imagem
docker build -t $FULL_IMAGE_NAME .

echo "✅ Imagem construída com sucesso!"
echo "📦 Imagem: $FULL_IMAGE_NAME"

# Perguntar se deseja fazer push
read -p "Deseja fazer push da imagem para o registry? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Fazendo push da imagem..."
    docker push $FULL_IMAGE_NAME
    echo "✅ Push concluído!"
else
    echo "ℹ️  Para fazer push manualmente: docker push $FULL_IMAGE_NAME"
fi

echo "🚀 Para fazer deploy: ./deploy-swarm.sh"
