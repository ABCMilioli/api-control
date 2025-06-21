#!/bin/bash

echo "🚀 Aplicando migração na VPS de produção..."

# Configurar variáveis de ambiente para produção
export DATABASE_URL="postgresql://username:password@your-vps-ip:5432/api_control"

# Marcar a migração como aplicada sem executá-la (já que o schema já existe)
echo "📝 Marcando migração como aplicada..."
npx prisma migrate resolve --applied 20250101000000_complete_schema

# Verificar status das migrações
echo "✅ Verificando status das migrações..."
npx prisma migrate status

# Gerar cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

echo "🎉 Migração aplicada com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Verifique se a aplicação está funcionando"
echo "2. Teste a funcionalidade de paginação"
echo "3. Monitore os logs por possíveis erros" 