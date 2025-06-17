-- Migration para criar o tipo ENUM client_status se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_status') THEN
        CREATE TYPE "client_status" AS ENUM ('ACTIVE', 'SUSPENDED', 'BLOCKED');
    END IF;
END$$; 