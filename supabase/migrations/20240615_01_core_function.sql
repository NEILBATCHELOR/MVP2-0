-- File: 20240615_01_core_function.sql
-- Lightweight core function for activity tracking
-- This is the most basic version that should work regardless of environment

-- Drop the function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS log_table_change() CASCADE;

-- Create a simplified version of the function
CREATE FUNCTION log_table_change() RETURNS TRIGGER AS $$
DECLARE
  old_data jsonb;
  new_data jsonb;
  action_name text;
BEGIN
  -- Basic operation detection
  IF (TG_OP = 'INSERT') THEN
    action_name := 'create';
    old_data := null;
    new_data := to_jsonb(NEW);
  ELSIF (TG_OP = 'UPDATE') THEN
    action_name := 'update';
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
  ELSE
    action_name := 'delete';
    old_data := to_jsonb(OLD);
    new_data := null;
  END IF;
  
  -- Very simple audit log entry
  INSERT INTO audit_logs (
    action,
    entity_type,
    entity_id,
    old_data,
    new_data,
    source,
    timestamp
  ) VALUES (
    TG_TABLE_NAME || '_' || action_name,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN (old_data->>'id')::text
      ELSE (new_data->>'id')::text
    END,
    old_data,
    new_data,
    'trigger',
    NOW()
  );
  
  -- Return appropriate row
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;