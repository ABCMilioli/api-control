-- Script para limpar estado das migrações
-- Execute este script diretamente no PostgreSQL

-- 1. Limpar tabela de migrações
DELETE FROM _prisma_migrations;

-- 2. Inserir apenas a migração atual como aplicada
INSERT INTO _prisma_migrations (
    id,
    checksum,
    finished_at,
    migration_name,
    logs,
    rolled_back_at,
    started_at,
    applied_steps_count
) VALUES (
    '20250101000000_complete_schema',
    'complete_schema_checksum',
    NOW(),
    '20250101000000_complete_schema',
    NULL,
    NULL,
    NOW(),
    1
);

-- 3. Verificar resultado
SELECT * FROM _prisma_migrations; 