-- Fix the issue with investor update trigger

-- First, check if there are any triggers on the investors table that might be causing the issue
DO $$
DECLARE
  trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
    JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
    WHERE pg_namespace.nspname = 'public'
    AND pg_class.relname = 'investors'
  ) INTO trigger_exists;

  IF trigger_exists THEN
    -- Drop all triggers on the investors table
    EXECUTE 'DROP TRIGGER IF EXISTS audit_trigger_row ON public.investors';
    EXECUTE 'DROP TRIGGER IF EXISTS audit_trigger_stm ON public.investors';
  END IF;

  -- Create a new audit trigger that uses investor_id instead of id
  IF EXISTS (
    SELECT 1 FROM pg_proc
    JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    WHERE pg_namespace.nspname = 'public'
    AND pg_proc.proname = 'audit_trigger_func'
  ) THEN
    -- Create a modified version of the audit trigger function for investors table
    CREATE OR REPLACE FUNCTION public.investor_audit_trigger_func()
    RETURNS trigger AS $$
    DECLARE
      audit_row public.audit_logs;
      include_values boolean;
      log_diffs boolean;
      h_old jsonb;
      h_new jsonb;
      excluded_cols text[] = ARRAY[]::text[];
    BEGIN
      IF TG_WHEN <> 'AFTER' THEN
        RAISE EXCEPTION 'audit_trigger_func() may only run as an AFTER trigger';
      END IF;

      audit_row = ROW(
        nextval('public.audit_logs_id_seq'),           -- id
        TG_TABLE_SCHEMA::text,                          -- schema_name
        TG_TABLE_NAME::text,                            -- table_name
        TG_RELID,                                       -- relation OID for faster searches
        session_user::text,                             -- session_user_name
        current_timestamp,                              -- action_tstamp_tx
        statement_timestamp(),                          -- action_tstamp_stm
        clock_timestamp(),                              -- action_tstamp_clk
        txid_current(),                                 -- transaction ID
        current_setting('application_name'),            -- client application
        inet_client_addr(),                             -- client_addr
        inet_client_port(),                             -- client_port
        current_query(),                                -- top-level query or queries
        substring(TG_OP,1,1),                          -- action
        NULL, NULL,                                     -- row_data, changed_fields
        'f',                                            -- statement_only
        NULL,                                           -- entity_id
        NULL,                                           -- entity_type
        NULL                                            -- user_id
        );

      IF NOT TG_ARGV[0]::boolean IS DISTINCT FROM 'f'::boolean THEN
        audit_row.statement_only = 't';
      END IF;

      IF TG_ARGV[1] IS NOT NULL THEN
        excluded_cols = TG_ARGV[1]::text[];
      END IF;

      IF (TG_OP = 'UPDATE' AND TG_LEVEL = 'ROW') THEN
        h_old = row_to_json(OLD)::jsonb;
        h_new = row_to_json(NEW)::jsonb;
        audit_row.row_data = h_old;
        
        -- Set entity_id from investor_id for the investors table
        IF TG_TABLE_NAME = 'investors' AND OLD.investor_id IS NOT NULL THEN
          audit_row.entity_id = OLD.investor_id::text;
          audit_row.entity_type = 'investor';
        END IF;
        
        SELECT jsonb_object_agg(key, value) INTO audit_row.changed_fields
        FROM jsonb_each(h_new)
        WHERE NOT (h_old @> jsonb_build_object(key, value));

      ELSIF (TG_OP = 'DELETE' AND TG_LEVEL = 'ROW') THEN
        audit_row.row_data = row_to_json(OLD)::jsonb;
        
        -- Set entity_id from investor_id for the investors table
        IF TG_TABLE_NAME = 'investors' AND OLD.investor_id IS NOT NULL THEN
          audit_row.entity_id = OLD.investor_id::text;
          audit_row.entity_type = 'investor';
        END IF;
        
      ELSIF (TG_OP = 'INSERT' AND TG_LEVEL = 'ROW') THEN
        audit_row.row_data = row_to_json(NEW)::jsonb;
        
        -- Set entity_id from investor_id for the investors table
        IF TG_TABLE_NAME = 'investors' AND NEW.investor_id IS NOT NULL THEN
          audit_row.entity_id = NEW.investor_id::text;
          audit_row.entity_type = 'investor';
        END IF;
        
      ELSIF (TG_LEVEL = 'STATEMENT' AND TG_OP IN ('INSERT','UPDATE','DELETE','TRUNCATE')) THEN
        audit_row.statement_only = 't';
      ELSE
        RAISE EXCEPTION '[audit_trigger_func] - Trigger func added as trigger for unhandled case: %, %',TG_OP, TG_LEVEL;
      END IF;
      INSERT INTO public.audit_logs VALUES (audit_row.*);
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Apply the new trigger to the investors table
    DROP TRIGGER IF EXISTS investors_audit_trigger_row ON public.investors;
    CREATE TRIGGER investors_audit_trigger_row
    AFTER INSERT OR UPDATE OR DELETE ON public.investors
    FOR EACH ROW EXECUTE FUNCTION public.investor_audit_trigger_func();
  END IF;
END $$;

-- Ensure the investors table has the correct structure
DO $$
BEGIN
  -- Make sure the primary key is investor_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    JOIN pg_class ON pg_constraint.conrelid = pg_class.oid
    JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
    WHERE pg_namespace.nspname = 'public'
    AND pg_class.relname = 'investors'
    AND pg_constraint.contype = 'p'
    AND pg_constraint.conname = 'investors_pkey'
  ) THEN
    ALTER TABLE public.investors ADD PRIMARY KEY (investor_id);
  END IF;
END $$;
