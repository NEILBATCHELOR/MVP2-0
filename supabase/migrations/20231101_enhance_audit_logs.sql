-- Migration: Enhance audit_logs table for system activities
-- This migration adds new columns to the audit_logs table to better support
-- system-initiated activities and improve activity categorization.

-- Add new columns for system process tracking
ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS system_process_id UUID,
ADD COLUMN IF NOT EXISTS batch_operation_id UUID,
ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'info',
ADD COLUMN IF NOT EXISTS duration INTEGER,
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS is_automated BOOLEAN DEFAULT FALSE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_system_process ON audit_logs(system_process_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_batch_operation ON audit_logs(batch_operation_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_is_automated ON audit_logs(is_automated);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);

-- Create system_processes table to track automated processes
CREATE TABLE IF NOT EXISTS system_processes (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  process_name TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'running',
  error_details JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger function for automated logging of database changes
CREATE OR REPLACE FUNCTION log_database_changes() RETURNS TRIGGER AS $$
DECLARE
  action_name TEXT;
  entity_name TEXT;
BEGIN
  -- Set the entity name based on the table
  entity_name := TG_TABLE_NAME;
  
  -- Set action based on operation type
  CASE 
    WHEN TG_OP = 'INSERT' THEN action_name := 'create_' || entity_name;
    WHEN TG_OP = 'UPDATE' THEN action_name := 'update_' || entity_name;
    WHEN TG_OP = 'DELETE' THEN action_name := 'delete_' || entity_name;
  END CASE;

  -- Insert audit log entry
  INSERT INTO audit_logs (
    action,
    action_type,
    entity_type,
    entity_id,
    details,
    old_data,
    new_data,
    status,
    is_automated,
    source,
    timestamp
  ) VALUES (
    action_name,
    'system',
    entity_name,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id::text
      ELSE NEW.id::text
    END,
    'Automatic system record of data change',
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    'success',
    TRUE,
    'database_trigger',
    NOW()
  );
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Helper procedure to apply the logging trigger to tables
CREATE OR REPLACE PROCEDURE apply_audit_trigger_to_table(table_name TEXT) 
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('
    DROP TRIGGER IF EXISTS %I_audit_trigger ON %I;
    CREATE TRIGGER %I_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON %I
    FOR EACH ROW EXECUTE FUNCTION log_database_changes();
  ', table_name, table_name, table_name, table_name);
END;
$$;

-- Apply logging triggers to key tables
-- Note: In a real implementation, you might want to be selective about which tables to log
-- to avoid excessive logging. Below are examples for important tables.

CALL apply_audit_trigger_to_table('token_allocations');
CALL apply_audit_trigger_to_table('subscriptions');
CALL apply_audit_trigger_to_table('tokens');
CALL apply_audit_trigger_to_table('distributions');
CALL apply_audit_trigger_to_table('redemption_requests');
CALL apply_audit_trigger_to_table('investors');
CALL apply_audit_trigger_to_table('projects');