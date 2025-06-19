-- Migration manual para criar tabela webhook_config

-- CreateTable
CREATE TABLE "webhook_config" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "events" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "retryCount" INTEGER NOT NULL DEFAULT 3,
    "timeout" INTEGER NOT NULL DEFAULT 30000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_config_pkey" PRIMARY KEY ("id")
);

-- Criar índice para busca por status ativo
CREATE INDEX "webhook_config_isActive_idx" ON "webhook_config"("isActive");

-- Criar índice para busca por URL (para evitar duplicatas)
CREATE UNIQUE INDEX "webhook_config_url_key" ON "webhook_config"("url"); 