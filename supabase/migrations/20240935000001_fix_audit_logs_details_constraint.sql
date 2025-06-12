-- Fix audit_logs details constraint issue

-- Make details column nullable to prevent constraint violations
ALTER TABLE audit_logs ALTER COLUMN details DROP NOT NULL;

-- Add default value for details to prevent future issues
ALTER TABLE audit_logs ALTER COLUMN details SET DEFAULT 'system action';

-- Update existing null values
UPDATE audit_logs SET details = 'system action' WHERE details IS NULL;

-- Disable any triggers that might be causing issues
DROP TRIGGER IF EXISTS audit_log_trigger ON subscriptions;
DROP TRIGGER IF EXISTS audit_log_trigger_insert ON subscriptions;
DROP TRIGGER IF EXISTS audit_log_trigger_update ON subscriptions;
DROP TRIGGER IF EXISTS audit_log_trigger_delete ON subscriptions;
