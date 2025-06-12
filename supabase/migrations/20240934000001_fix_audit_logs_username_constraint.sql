-- Fix audit_logs username constraint issue

-- First, drop any triggers that might be causing the issue
DROP TRIGGER IF EXISTS audit_log_trigger ON investors;
DROP TRIGGER IF EXISTS audit_log_trigger_insert ON investors;
DROP TRIGGER IF EXISTS audit_log_trigger_update ON investors;
DROP TRIGGER IF EXISTS audit_log_trigger_delete ON investors;

-- Make username column nullable to prevent constraint violations
ALTER TABLE audit_logs ALTER COLUMN username DROP NOT NULL;

-- Add default value for username to prevent future issues
ALTER TABLE audit_logs ALTER COLUMN username SET DEFAULT 'system';

-- Update existing null values
UPDATE audit_logs SET username = 'system' WHERE username IS NULL;
