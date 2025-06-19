-- CreateEnum
CREATE TYPE "smtp_encryption" AS ENUM ('NONE', 'SSL', 'TLS');

-- CreateTable
CREATE TABLE "smtp_config" (
    "id" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 587,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "encryption" "smtp_encryption" NOT NULL DEFAULT 'TLS',
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "smtp_config_pkey" PRIMARY KEY ("id")
); 