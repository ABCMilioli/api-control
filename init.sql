
-- Script de inicialização do banco de dados
-- Este script será executado quando o container PostgreSQL for criado pela primeira vez

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Comentário informativo
COMMENT ON DATABASE api_control IS 'Database for API Control System';
