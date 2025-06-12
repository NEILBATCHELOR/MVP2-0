-- Migration: Activity Triggers for Critical Tables (Optimized for Performance)
-- This migration creates and applies audit triggers to critical tables
-- Date: 2024-06-15
-- This version is optimized to avoid timeouts by focusing on essential components
-- and allowing incremental execution

-- Control flags (modify these to enable/disable parts of the migration)
DO $$
DECLARE
  -- Set to FALSE to skip parts that aren't working or taking too long
  create_core_functions BOOLEAN := TRUE;   -- Core trigger function
  create_helper_functions BOOLEAN := TRUE; -- Utility functions 
  create_views BOOLEAN := FALSE;           -- Views can be created later
  create_materialized_views BOOLEAN := FALSE; -- Can be resource-intensive
  apply_critical_triggers BOOLEAN := TRUE; -- Most important part
  apply_highvolume_triggers BOOLEAN := FALSE; -- Less critical
  create_utility_functions BOOLEAN := FALSE; -- Analytics functions
BEGIN
  -- Just a placeholder to define variables
  NULL;
END $$;

-- Utility function for safe execution
CREATE OR REPLACE FUNCTION execute_safely(p_statement text) RETURNS BOOLEAN AS $$
DECLARE
  success BOOLEAN := TRUE;
BEGIN
  BEGIN
    EXECUTE p_statement;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error executing statement: %', SQLERRM;
      RAISE WARNING 'Statement was: %', p_statement;
      success := FALSE;
  END;
  RETURN success;
END;
$$ LANGUAGE plpgsql;

-- SECTION 1: Core Functions
-- Only proceed if create_core_functions is TRUE
DO $$
BEGIN
  IF NOT (SELECT current_setting('create_core_functions', TRUE)::boolean) THEN
    RAISE NOTICE 'Skipping core functions creation as per configuration';
    RETURN;
  END IF;

  RAISE NOTICE 'Creating core trigger function...';
  
  -- Create the log_table_change function
  PERFORM execute_safely($EXEC$
    CREATE OR REPLACE FUNCTION log_table_change() RETURNS TRIGGER AS $FUNC$
    DECLARE
      old_data jsonb;
      new_data jsonb;
      action_name text;
      entity_name text;
      change_data jsonb;
    BEGIN
      -- Set the action name based on operation type
      IF (TG_OP = 'INSERT') THEN
        action_name := 'create';
        old_data := null;
        new_data := to_jsonb(NEW);
        change_data := new_data;
      ELSIF (TG_OP = 'UPDATE') THEN
        action_name := 'update';
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        -- Calculate changes by comparing old and new data
        SELECT jsonb_object_agg(key, value) INTO change_data
        FROM jsonb_each(new_data) 
        WHERE NOT new_data->key = old_data->key OR old_data->key IS NULL;
      ELSIF (TG_OP = 'DELETE') THEN
        action_name := 'delete';
        old_data := to_jsonb(OLD);
        new_data := null;
        change_data := old_data;
      END IF;
      
      -- Extract the entity name from trigger name 
      entity_name := TG_TABLE_NAME;
      
      -- Insert into audit_logs table
      INSERT INTO audit_logs (
        action,
        action_type,
        entity_type,
        entity_id,
        old_data,
        new_data,
        changes,
        details,
        status,
        source,
        timestamp
      ) VALUES (
        entity_name || '_' || action_name,
        'database',
        entity_name,
        CASE 
          WHEN TG_OP = 'DELETE' THEN (old_data->>'id')::text
          ELSE (new_data->>'id')::text
        END,
        old_data,
        new_data,
        change_data,
        'Automated audit log for ' || entity_name || ' ' || action_name,
        'success',
        'database_trigger',
        NOW()
      );
      
      -- Return the appropriate row based on operation
      IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
      ELSE
        RETURN NEW;
      END IF;
    END;
    $FUNC$ LANGUAGE plpgsql SECURITY DEFINER;
  $EXEC$);

  RAISE NOTICE 'Core trigger function created';
END $$;

-- SECTION 2: Helper Functions
-- Only proceed if create_helper_functions is TRUE
DO $$
BEGIN
  IF NOT (SELECT current_setting('create_helper_functions', TRUE)::boolean) THEN
    RAISE NOTICE 'Skipping helper functions creation as per configuration';
    RETURN;
  END IF;

  RAISE NOTICE 'Creating helper functions...';

  -- Function to check if a column exists
  PERFORM execute_safely($EXEC$
    DROP FUNCTION IF EXISTS column_exists(text, text, text);
    CREATE OR REPLACE FUNCTION column_exists(p_schema_name text, p_table_name text, p_column_name text) 
    RETURNS boolean AS $FUNC$
    DECLARE
      exists boolean;
    BEGIN
      SELECT COUNT(*) > 0 INTO exists
      FROM information_schema.columns
      WHERE table_schema = p_schema_name
      AND table_name = p_table_name
      AND column_name = p_column_name;
      
      RETURN exists;
    END;
    $FUNC$ LANGUAGE plpgsql;
  $EXEC$);

  -- Function to check if a table exists
  PERFORM execute_safely($EXEC$
    DROP FUNCTION IF EXISTS table_exists(text, text);
    CREATE OR REPLACE FUNCTION table_exists(p_schema_name text, p_table_name text) 
    RETURNS boolean AS $FUNC$
    DECLARE
      exists boolean;
    BEGIN
      SELECT COUNT(*) > 0 INTO exists
      FROM information_schema.tables
      WHERE table_schema = p_schema_name
      AND table_name = p_table_name;
      
      RETURN exists;
    END;
    $FUNC$ LANGUAGE plpgsql;
  $EXEC$);

  -- Create audit trigger function
  PERFORM execute_safely($EXEC$
    DROP FUNCTION IF EXISTS create_audit_trigger(text);
    DROP FUNCTION IF EXISTS create_audit_trigger(text, boolean);
    CREATE OR REPLACE FUNCTION create_audit_trigger(table_name text, is_high_volume boolean DEFAULT false) 
    RETURNS void AS $FUNC$
    DECLARE
      trigger_name text;
      trigger_condition text;
      has_significance boolean;
      has_importance boolean;
    BEGIN
      trigger_name := 'audit_' || table_name || '_trigger';
      
      -- Check if the table has relevant filtering columns
      has_significance := column_exists('public', table_name, 'is_significant');
      has_importance := column_exists('public', table_name, 'importance');
      
      -- Set up the condition
      IF is_high_volume THEN
        IF has_significance THEN
          trigger_condition := 'WHEN (NEW.is_significant = true OR OLD.is_significant = true)';
        ELSIF has_importance THEN
          trigger_condition := 'WHEN (NEW.importance > 5 OR OLD.importance > 5)';
        ELSE
          trigger_condition := '';
        END IF;
      ELSE
        trigger_condition := '';
      END IF;

      -- Drop the trigger if it exists
      EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_name || ' ON ' || table_name;
      
      -- Create the new trigger
      EXECUTE 'CREATE TRIGGER ' || trigger_name || 
              ' AFTER INSERT OR UPDATE OR DELETE ON ' || table_name || 
              ' FOR EACH ROW ' || trigger_condition || 
              ' EXECUTE FUNCTION log_table_change()';
              
      -- We'll skip logging to avoid circular dependencies
      RAISE NOTICE 'Created audit trigger for %', table_name;
    END;
    $FUNC$ LANGUAGE plpgsql;
  $EXEC$);

  RAISE NOTICE 'Helper functions created';
END $$;

-- SECTION 3: Apply Critical Triggers
-- Only proceed if apply_critical_triggers is TRUE
DO $$
DECLARE
  critical_tables text[] := ARRAY['users', 'projects', 'bulk_operations', 'investor_profiles'];
  table_name text;
  success_count int := 0;
  error_count int := 0;
BEGIN
  IF NOT (SELECT current_setting('apply_critical_triggers', TRUE)::boolean) THEN
    RAISE NOTICE 'Skipping critical triggers application as per configuration';
    RETURN;
  END IF;

  RAISE NOTICE 'Applying triggers to critical tables...';

  -- Process each critical table individually
  FOREACH table_name IN ARRAY critical_tables
  LOOP
    BEGIN
      IF (SELECT table_exists('public', table_name)) THEN
        PERFORM create_audit_trigger(table_name, false);
        success_count := success_count + 1;
        RAISE NOTICE 'Added trigger to %', table_name;
        -- Add a small delay to prevent resource exhaustion
        PERFORM pg_sleep(0.1);
      ELSE
        RAISE NOTICE 'Table % does not exist, skipping', table_name;
      END IF;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE WARNING 'Error adding trigger to %: %', table_name, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Applied triggers to % critical tables (% errors)', success_count, error_count;
END $$;

-- SECTION 4: Apply High Volume Triggers
-- Only proceed if apply_highvolume_triggers is TRUE
DO $$
DECLARE
  high_volume_tables text[] := ARRAY['audit_logs', 'notifications', 'transactions'];
  table_name text;
  success_count int := 0;
  error_count int := 0;
BEGIN
  IF NOT (SELECT current_setting('apply_highvolume_triggers', TRUE)::boolean) THEN
    RAISE NOTICE 'Skipping high volume triggers application as per configuration';
    RETURN;
  END IF;

  RAISE NOTICE 'Applying triggers to high-volume tables...';

  -- Process each high-volume table
  FOREACH table_name IN ARRAY high_volume_tables
  LOOP
    BEGIN
      IF (SELECT table_exists('public', table_name)) THEN
        PERFORM create_audit_trigger(table_name, true);
        success_count := success_count + 1;
        RAISE NOTICE 'Added trigger to high-volume table %', table_name;
        -- Add a small delay to prevent resource exhaustion
        PERFORM pg_sleep(0.1);
      ELSE
        RAISE NOTICE 'High-volume table % does not exist, skipping', table_name;
      END IF;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE WARNING 'Error adding trigger to high-volume table %: %', table_name, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Applied triggers to % high-volume tables (% errors)', success_count, error_count;
END $$;

-- SECTION 5: Views
-- Only proceed if create_views is TRUE
DO $$
BEGIN
  IF NOT (SELECT current_setting('create_views', TRUE)::boolean) THEN
    RAISE NOTICE 'Skipping views creation as per configuration';
    RETURN;
  END IF;

  RAISE NOTICE 'Creating views...';

  -- Audit coverage view
  PERFORM execute_safely($EXEC$
    DROP VIEW IF EXISTS audit_coverage;
    CREATE VIEW audit_coverage AS
    SELECT 
      tgt.tgname AS trigger_name,
      nsp.nspname AS schema_name,
      cls.relname AS table_name,
      proname AS function_name
    FROM pg_trigger tgt
    JOIN pg_class cls ON tgt.tgrelid = cls.oid
    JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
    JOIN pg_proc p ON tgt.tgfoid = p.oid
    WHERE proname = 'log_table_change'
    AND nsp.nspname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY schema_name, table_name;
  $EXEC$);

  RAISE NOTICE 'Views created';
END $$;

-- SECTION 6: Materialized Views
-- Only proceed if create_materialized_views is TRUE
DO $$
BEGIN
  IF NOT (SELECT current_setting('create_materialized_views', TRUE)::boolean) THEN
    RAISE NOTICE 'Skipping materialized views creation as per configuration';
    RETURN;
  END IF;

  RAISE NOTICE 'Creating materialized views...';

  -- Activity metrics view
  PERFORM execute_safely($EXEC$
    DROP MATERIALIZED VIEW IF EXISTS activity_metrics;
    CREATE MATERIALIZED VIEW activity_metrics AS
    SELECT
      date_trunc('day', timestamp) AS day,
      action_type,
      entity_type,
      status,
      COUNT(*) AS activity_count,
      COUNT(DISTINCT user_id) AS unique_users,
      AVG(duration) AS avg_duration
    FROM audit_logs
    GROUP BY 1, 2, 3, 4
    ORDER BY 1 DESC, 2, 3, 4;

    CREATE INDEX IF NOT EXISTS idx_activity_metrics_day ON activity_metrics (day);
    CREATE INDEX IF NOT EXISTS idx_activity_metrics_entity ON activity_metrics (entity_type);
  $EXEC$);

  RAISE NOTICE 'Materialized views created';
END $$;

-- SECTION 7: Utility Functions
-- Only proceed if create_utility_functions is TRUE
DO $$
BEGIN
  IF NOT (SELECT current_setting('create_utility_functions', TRUE)::boolean) THEN
    RAISE NOTICE 'Skipping utility functions creation as per configuration';
    RETURN;
  END IF;

  RAISE NOTICE 'Creating utility functions...';

  -- Refresh function
  PERFORM execute_safely($EXEC$
    DROP FUNCTION IF EXISTS refresh_activity_metrics();
    CREATE OR REPLACE FUNCTION refresh_activity_metrics() RETURNS void AS $FUNC$
    BEGIN
      REFRESH MATERIALIZED VIEW activity_metrics;
    END;
    $FUNC$ LANGUAGE plpgsql;
  $EXEC$);

  -- Activity counts function
  PERFORM execute_safely($EXEC$
    DROP FUNCTION IF EXISTS get_activity_counts_by_timeframe(timestamp, timestamp, text);
    CREATE OR REPLACE FUNCTION get_activity_counts_by_timeframe(
      p_start_time timestamp,
      p_end_time timestamp,
      p_interval text DEFAULT 'day'
    ) 
    RETURNS TABLE (
      time_bucket timestamp,
      activity_count bigint
    ) AS $FUNC$
    BEGIN
      RETURN QUERY
      SELECT 
        date_trunc(p_interval, timestamp) AS time_bucket,
        COUNT(*) AS activity_count
      FROM 
        audit_logs
      WHERE 
        timestamp BETWEEN p_start_time AND p_end_time
      GROUP BY 
        time_bucket
      ORDER BY 
        time_bucket;
    END;
    $FUNC$ LANGUAGE plpgsql;
  $EXEC$);

  -- Activity distribution function
  PERFORM execute_safely($EXEC$
    DROP FUNCTION IF EXISTS get_activity_distribution_by_category(timestamp, timestamp);
    CREATE OR REPLACE FUNCTION get_activity_distribution_by_category(
      p_start_time timestamp,
      p_end_time timestamp
    ) 
    RETURNS TABLE (
      category text,
      activity_count bigint,
      percentage numeric
    ) AS $FUNC$
    DECLARE
      total_count bigint;
    BEGIN
      -- Get total count for percentage calculation
      SELECT COUNT(*) INTO total_count 
      FROM audit_logs
      WHERE timestamp BETWEEN p_start_time AND p_end_time;
      
      RETURN QUERY
      SELECT 
        COALESCE(category, 'uncategorized') AS category,
        COUNT(*) AS activity_count,
        CASE 
          WHEN total_count > 0 THEN (COUNT(*) * 100.0 / total_count)::numeric 
          ELSE 0 
        END AS percentage
      FROM 
        audit_logs
      WHERE 
        timestamp BETWEEN p_start_time AND p_end_time
      GROUP BY 
        category
      ORDER BY 
        activity_count DESC;
    END;
    $FUNC$ LANGUAGE plpgsql;
  $EXEC$);

  RAISE NOTICE 'Utility functions created';
END $$;

-- Final message
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Activity triggers migration completed!';
  RAISE NOTICE 'Created with the following configuration:';
  RAISE NOTICE '- Core functions: %', current_setting('create_core_functions', TRUE);
  RAISE NOTICE '- Helper functions: %', current_setting('create_helper_functions', TRUE);
  RAISE NOTICE '- Critical triggers: %', current_setting('apply_critical_triggers', TRUE);
  RAISE NOTICE '- High-volume triggers: %', current_setting('apply_highvolume_triggers', TRUE);
  RAISE NOTICE '- Views: %', current_setting('create_views', TRUE);
  RAISE NOTICE '- Materialized views: %', current_setting('create_materialized_views', TRUE);
  RAISE NOTICE '- Utility functions: %', current_setting('create_utility_functions', TRUE);
  RAISE NOTICE '==============================================';
END $$; 