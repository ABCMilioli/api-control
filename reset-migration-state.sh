#!/bin/bash

echo "🔄 Resetando estado das migrações..."

# 1. Verificar se estamos em produção
if [ "$NODE_ENV" = "production" ]; then
    echo "⚠️  ATENÇÃO: Executando em produção!"
    read -p "Tem certeza que deseja continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Operação cancelada"
        exit 1
    fi
fi

# 2. Limpar tabela de migrações (se existir)
echo "🗑️  Limpando tabela de migrações..."
npx prisma db execute --stdin <<< "
-- Verificar se a tabela existe e limpar
DO \$\$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = '_prisma_migrations') THEN
        DELETE FROM _prisma_migrations;
        RAISE NOTICE 'Tabela _prisma_migrations limpa';
    ELSE
        RAISE NOTICE 'Tabela _prisma_migrations não existe';
    END IF;
END \$\$;
"

# 3. Marcar migração como aplicada
echo "📝 Marcando migração como aplicada..."
npx prisma migrate resolve --applied 20250101000000_complete_schema

# 4. Verificar status
echo "✅ Verificando status das migrações..."
npx prisma migrate status

# 5. Gerar cliente
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

echo "🎉 Estado das migrações resetado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Reinicie a aplicação"
echo "2. Teste as funcionalidades"
echo "3. Verifique os logs" 