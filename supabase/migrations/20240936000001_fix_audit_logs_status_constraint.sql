-- Fix audit_logs status constraint issue

-- Make status column have a default value to prevent constraint violations
ALTER TABLE audit_logs ALTER COLUMN status SET DEFAULT 'Success';

-- Update existing null values
UPDATE audit_logs SET status = 'Success' WHERE status IS NULL;
