-- Migration: Fix rules and users tables

-- First, ensure all created_by values in rules table are valid UUIDs
UPDATE rules SET created_by = gen_random_uuid() WHERE created_by IS NULL OR created_by = 'admin-bypass';

-- Change created_by column type to UUID
ALTER TABLE rules ALTER COLUMN created_by TYPE uuid USING created_by::uuid;

-- Remove duplicate columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS name, DROP COLUMN IF EXISTS id, DROP COLUMN IF EXISTS email, DROP COLUMN IF EXISTS status, DROP COLUMN IF EXISTS created_at, DROP COLUMN IF EXISTS updated_at;
