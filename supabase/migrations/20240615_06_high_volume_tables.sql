-- File: 20240615_06_high_volume_tables.sql
-- Specialized handling for high-volume tables
-- Run this after basic triggers are working

-- Function to create advanced triggers for high-volume tables
DROP FUNCTION IF EXISTS create_selective_audit_trigger(text, text);
CREATE FUNCTION create_selective_audit_trigger(
  p_table text, 
  p_condition text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_trigger_name text;
  v_condition text;
BEGIN
  -- Create simple trigger name
  v_trigger_name := 'audit_' || p_table || '_trigger';
  
  -- Set condition
  IF p_condition IS NULL THEN
    v_condition := '';
  ELSE
    v_condition := ' WHEN ' || p_condition;
  END IF;
  
  -- Drop trigger if exists
  EXECUTE 'DROP TRIGGER IF EXISTS ' || v_trigger_name || ' ON ' || p_table;
  
  -- Create trigger with condition
  EXECUTE 'CREATE TRIGGER ' || v_trigger_name || 
          ' AFTER INSERT OR UPDATE OR DELETE ON ' || p_table || 
          ' FOR EACH ROW' || v_condition || 
          ' EXECUTE FUNCTION log_table_change()';
          
  RAISE NOTICE 'Created selective trigger on high-volume table %', p_table;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating selective trigger for %: %', p_table, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Add importance field to audit_logs table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'audit_logs' AND column_name = 'importance'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN importance INTEGER DEFAULT 1;
    RAISE NOTICE 'Added importance column to audit_logs table';
  END IF;
END $$;

-- Apply selective triggers to high-volume tables
-- Run each statement separately

-- Audit logs - only log changes to logs marked as important
-- SELECT create_selective_audit_trigger('audit_logs', '(NEW.importance > 5 OR OLD.importance > 5)');

-- Notifications - only log important notifications
-- SELECT create_selective_audit_trigger('notifications', '(NEW.is_read = false)');

-- Transactions - only log significant transactions
-- SELECT create_selective_audit_trigger('transactions', '(NEW.amount > 1000 OR OLD.amount > 1000)');