-- Add the missing new_data column to audit_logs table
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS new_data JSONB;
