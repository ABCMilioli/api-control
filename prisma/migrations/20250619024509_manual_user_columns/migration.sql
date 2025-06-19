-- Migration manual para garantir todas as colunas do modelo User

-- Adiciona coluna password se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='password'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "password" TEXT NOT NULL DEFAULT '';
    END IF;
END$$;

-- Adiciona coluna resetToken se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='resetToken'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "resetToken" TEXT;
    END IF;
END$$;

-- Adiciona coluna resetTokenExpires se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='resetTokenExpires'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "resetTokenExpires" TIMESTAMP(3);
    END IF;
END$$;

-- Garante índice único no email
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email"); 