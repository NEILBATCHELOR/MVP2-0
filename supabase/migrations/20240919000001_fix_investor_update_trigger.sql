-- First, check if there are any triggers on the investors table that might be causing the issue
DO $$ 
DECLARE
  trigger_exists BOOLEAN;
BEGIN
  -- Attempt to find any existing triggers on the investors table
  PERFORM 1 FROM pg_trigger
    JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
    JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
    WHERE pg_namespace.nspname = 'public'
    AND pg_class.relname = 'investors'
    LIMIT 1;

  -- Set trigger_exists based on whether any row was found
  trigger_exists := FOUND;  -- ✅ Corrected assignment

  IF trigger_exists THEN
    -- Drop all triggers on the investors table
    EXECUTE 'DROP TRIGGER IF EXISTS audit_trigger_row ON public.investors';
    EXECUTE 'DROP TRIGGER IF EXISTS audit_trigger_stm ON public.investors';
  END IF;
END $$;

-- Ensure the investors table has the correct structure
DO $$ 
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  -- Attempt to find if the primary key constraint exists
  PERFORM 1 FROM pg_constraint
    JOIN pg_class ON pg_constraint.conrelid = pg_class.oid
    JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
    WHERE pg_namespace.nspname = 'public'
    AND pg_class.relname = 'investors'
    AND pg_constraint.contype = 'p'
    AND pg_constraint.conname = 'investors_pkey'
    LIMIT 1;

  -- Set constraint_exists based on whether any row was found
  constraint_exists := FOUND;  -- ✅ Corrected assignment

  IF NOT constraint_exists THEN
    ALTER TABLE public.investors ADD PRIMARY KEY (investor_id);
  END IF;
END $$;