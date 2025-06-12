-- File: 20240615_03_trigger_function.sql
-- Function to create audit triggers
-- Run this after helper functions are in place

-- Function to create audit triggers (simplified)
DROP FUNCTION IF EXISTS create_audit_trigger(text, boolean);
CREATE FUNCTION create_audit_trigger(p_table text, p_high_volume boolean DEFAULT false) RETURNS void AS $$
DECLARE
  v_trigger_name text;
  v_condition text := '';
BEGIN
  -- Create simple trigger name
  v_trigger_name := 'audit_' || p_table || '_trigger';
  
  -- Handle high volume tables (simply return without doing anything to avoid timeouts)
  IF p_high_volume THEN
    RAISE NOTICE 'Skipping high volume table % - run this manually later', p_table;
    RETURN;
  END IF;
  
  -- Drop trigger if exists
  EXECUTE 'DROP TRIGGER IF EXISTS ' || v_trigger_name || ' ON ' || p_table;
  
  -- Create trigger with no conditions
  EXECUTE 'CREATE TRIGGER ' || v_trigger_name || 
          ' AFTER INSERT OR UPDATE OR DELETE ON ' || p_table || 
          ' FOR EACH ROW EXECUTE FUNCTION log_table_change()';
          
  RAISE NOTICE 'Created trigger on table %', p_table;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating trigger for %: %', p_table, SQLERRM;
END;
$$ LANGUAGE plpgsql;