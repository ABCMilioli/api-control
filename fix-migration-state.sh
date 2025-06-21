#!/bin/bash

echo "🔧 Resolvendo estado das migrações..."

# 1. Marcar migração falhada como resolvida
echo "📝 Marcando migração falhada como resolvida..."
npx prisma migrate resolve --rolled-back 20240616190000_add_notification

# 2. Marcar nova migração como aplicada
echo "📝 Marcando nova migração como aplicada..."
npx prisma migrate resolve --applied 20250101000000_complete_schema

# 3. Verificar status
echo "✅ Verificando status das migrações..."
npx prisma migrate status

# 4. Gerar cliente
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

echo "🎉 Estado das migrações resolvido!" 