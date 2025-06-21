#!/bin/bash

echo "🔨 Iniciando build de produção..."

# 1. Limpar diretório dist
echo "🧹 Limpando diretório dist..."
rm -rf dist

# 2. Instalar dependências
echo "📦 Instalando dependências..."
npm install

# 3. Gerar cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

# 4. Build do frontend
echo "🏗️  Build do frontend..."
npm run build

# 5. Verificar se os arquivos foram criados
echo "✅ Verificando arquivos gerados..."
if [ -f "dist/index.html" ]; then
    echo "✅ index.html criado com sucesso"
else
    echo "❌ index.html não foi criado"
    exit 1
fi

if [ -d "dist/assets" ]; then
    echo "✅ Assets criados com sucesso"
    ls -la dist/assets/
else
    echo "❌ Assets não foram criados"
    exit 1
fi

# 6. Compilar servidor
echo "🔧 Compilando servidor..."
npx tsc -p tsconfig.server.json

# 7. Verificar arquivo do servidor
if [ -f "dist/server.js" ]; then
    echo "✅ server.js criado com sucesso"
else
    echo "❌ server.js não foi criado"
    exit 1
fi

echo "🎉 Build de produção concluído com sucesso!"
echo ""
echo "📋 Arquivos gerados:"
ls -la dist/

echo ""
echo "🚀 Para iniciar o servidor:"
echo "npm start" 