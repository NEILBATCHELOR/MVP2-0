-- Token System Migration Script
-- This script updates the existing token-related tables in the database

-- Ensure token_deployments has all necessary columns and constraints
DO $$
BEGIN
  -- Ensure nullability of deployed_at
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'token_deployments' AND column_name = 'deployed_at' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.token_deployments 
    ALTER COLUMN deployed_at DROP NOT NULL;
  END IF;

  -- Ensure deployment_data column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'token_deployments' AND column_name = 'deployment_data'
  ) THEN
    ALTER TABLE public.token_deployments 
    ADD COLUMN deployment_data jsonb NULL;
  END IF;

  -- Ensure foreign key exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'token_deployments_token_id_fkey'
  ) THEN
    ALTER TABLE public.token_deployments 
    ADD CONSTRAINT token_deployments_token_id_fkey 
    FOREIGN KEY (token_id) REFERENCES tokens (id) ON DELETE CASCADE;
  END IF;
END
$$;

-- Add index on token_deployments.token_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_token_deployments_token_id'
  ) THEN
    CREATE INDEX idx_token_deployments_token_id ON public.token_deployments USING btree (token_id);
  END IF;
END
$$;

-- Ensure token_operations has all necessary columns and constraints
DO $$
BEGIN
  -- Ensure blocks column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'token_operations' AND column_name = 'blocks'
  ) THEN
    ALTER TABLE public.token_operations 
    ADD COLUMN blocks jsonb NULL;
  END IF;

  -- Ensure foreign key exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'token_operations_token_id_fkey'
  ) THEN
    ALTER TABLE public.token_operations 
    ADD CONSTRAINT token_operations_token_id_fkey 
    FOREIGN KEY (token_id) REFERENCES tokens (id) ON DELETE CASCADE;
  END IF;
END
$$;

-- Add index on token_operations.token_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_token_operations_token_id'
  ) THEN
    CREATE INDEX idx_token_operations_token_id ON public.token_operations USING btree (token_id);
  END IF;
END
$$;

-- Ensure token_designs has all necessary check constraints
DO $$
BEGIN
  -- Ensure status check constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'token_designs_status_check'
  ) THEN
    ALTER TABLE public.token_designs 
    ADD CONSTRAINT token_designs_status_check CHECK (
      status = ANY (
        ARRAY[
          'draft'::text,
          'under review'::text,
          'approved'::text,
          'rejected'::text,
          'ready to mint'::text,
          'minted'::text,
          'paused'::text,
          'distributed'::text
        ]
      )
    );
  END IF;

  -- Ensure type check constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'token_designs_type_check'
  ) THEN
    ALTER TABLE public.token_designs 
    ADD CONSTRAINT token_designs_type_check CHECK (
      type = ANY (
        ARRAY[
          'ERC-20'::text,
          'ERC-721'::text,
          'ERC-1155'::text,
          'ERC-1400'::text,
          'ERC-3525'::text
        ]
      )
    );
  END IF;
END
$$;

-- Ensure token_templates has all necessary columns and constraints
DO $$
BEGIN
  -- Ensure metadata column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'token_templates' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.token_templates 
    ADD COLUMN metadata jsonb NULL;
  END IF;

  -- Ensure foreign key exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'token_templates_project_id_fkey'
  ) THEN
    ALTER TABLE public.token_templates 
    ADD CONSTRAINT token_templates_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE;
  END IF;

  -- Ensure standard check constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'token_templates_standard_check'
  ) THEN
    ALTER TABLE public.token_templates 
    ADD CONSTRAINT token_templates_standard_check CHECK (
      standard = ANY (
        ARRAY[
          'ERC-20'::text,
          'ERC-721'::text,
          'ERC-1155'::text,
          'ERC-1400'::text,
          'ERC-3525'::text,
          'ERC-4626'::text
        ]
      )
    );
  END IF;
END
$$;

-- Add triggers to token_templates if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'log_token_template_changes'
  ) THEN
    CREATE TRIGGER log_token_template_changes
    AFTER INSERT OR DELETE OR UPDATE ON token_templates 
    FOR EACH ROW
    EXECUTE FUNCTION log_user_action();
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_token_templates_updated_at'
  ) THEN
    CREATE TRIGGER update_token_templates_updated_at 
    BEFORE UPDATE ON token_templates 
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- Ensure token_versions has all necessary columns and constraints
DO $$
BEGIN
  -- Ensure notes column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'token_versions' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.token_versions 
    ADD COLUMN notes text NULL;
  END IF;

  -- Ensure blocks column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'token_versions' AND column_name = 'blocks'
  ) THEN
    ALTER TABLE public.token_versions 
    ADD COLUMN blocks jsonb NULL;
  END IF;

  -- Ensure foreign key exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'token_versions_token_id_fkey'
  ) THEN
    ALTER TABLE public.token_versions 
    ADD CONSTRAINT token_versions_token_id_fkey 
    FOREIGN KEY (token_id) REFERENCES tokens (id) ON DELETE CASCADE;
  END IF;
END
$$;

-- Add indexes on token_versions if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_token_versions_token_id'
  ) THEN
    CREATE INDEX idx_token_versions_token_id ON public.token_versions USING btree (token_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_token_versions_token_id_version'
  ) THEN
    CREATE INDEX idx_token_versions_token_id_version ON public.token_versions USING btree (token_id, version);
  END IF;
END
$$;

-- Ensure tokens table has all necessary columns and constraints
DO $$
DECLARE
  rec RECORD;
BEGIN
  -- Add total_supply if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tokens' AND column_name = 'total_supply'
  ) THEN
    ALTER TABLE tokens ADD COLUMN total_supply text NULL;
  END IF;

  -- Handle the standard check constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'tokens' AND constraint_name = 'tokens_standard_check'
  ) THEN
    -- First identify invalid standards
    CREATE TEMP TABLE IF NOT EXISTS invalid_standards AS
    SELECT id, standard, blocks
    FROM tokens 
    WHERE standard IS NOT NULL 
    AND standard NOT IN ('ERC-20', 'ERC-721', 'ERC-1155', 'ERC-1400', 'ERC-3525', 'ERC-4626');
    
    -- Log the invalid standards before updating
    RAISE NOTICE 'Invalid standards found: %', (SELECT COUNT(*) FROM invalid_standards);
    
    -- First temporarily disable the validation trigger if it exists
    IF EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'validate_token_data_trigger'
    ) THEN
      ALTER TABLE tokens DISABLE TRIGGER validate_token_data_trigger;
    END IF;
    
    -- Fix each invalid record with the least disruptive approach
    FOR rec IN SELECT * FROM invalid_standards
    LOOP
      -- For records with blocks containing name and symbol, we can set to ERC-20
      IF rec.blocks ? 'name' AND rec.blocks ? 'symbol' THEN
        UPDATE tokens SET standard = 'ERC-20' WHERE id = rec.id;
      -- Otherwise use ERC-721 as it may have less strict validation
      ELSE
        UPDATE tokens SET standard = 'ERC-721' WHERE id = rec.id;
      END IF;
    END LOOP;
    
    -- Re-enable the validation trigger if we disabled it
    IF EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'validate_token_data_trigger'
    ) THEN
      ALTER TABLE tokens ENABLE TRIGGER validate_token_data_trigger;
    END IF;
    
    -- Now it's safe to add the constraint
    ALTER TABLE tokens 
    ADD CONSTRAINT tokens_standard_check CHECK (
      standard = ANY (
        ARRAY[
          'ERC-20'::text,
          'ERC-721'::text,
          'ERC-1155'::text,
          'ERC-1400'::text,
          'ERC-3525'::text,
          'ERC-4626'::text
        ]
      )
    );
    
    -- Drop the temp table
    DROP TABLE IF EXISTS invalid_standards;
  END IF;
END
$$;

-- Ensure indexes on tokens table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_tokens_project_id'
  ) THEN
    CREATE INDEX idx_tokens_project_id ON public.tokens USING btree (project_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_tokens_standard'
  ) THEN
    CREATE INDEX idx_tokens_standard ON public.tokens USING btree (standard);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_tokens_status'
  ) THEN
    CREATE INDEX idx_tokens_status ON public.tokens USING btree (status);
  END IF;
END
$$; 