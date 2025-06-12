-- Ensure token_allocations table exists
CREATE TABLE IF NOT EXISTS token_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL,
  investor_id UUID,
  subscription_id UUID,
  token_type TEXT,
  token_amount NUMERIC DEFAULT 0,
  distributed BOOLEAN DEFAULT FALSE,
  distribution_date TIMESTAMP WITH TIME ZONE,
  distribution_tx_hash TEXT,
  allocation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  minted BOOLEAN DEFAULT FALSE,
  minting_date TIMESTAMP WITH TIME ZONE,
  minting_tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add realtime support
ALTER PUBLICATION supabase_realtime ADD TABLE token_allocations;

-- Ensure foreign key relationships
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'token_allocations_project_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE token_allocations ADD CONSTRAINT token_allocations_project_id_fkey 
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      -- If the constraint can't be added (e.g., projects table doesn't exist), just continue
      RAISE NOTICE 'Could not add foreign key constraint to projects: %', SQLERRM;
    END;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'token_allocations_investor_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE token_allocations ADD CONSTRAINT token_allocations_investor_id_fkey 
      FOREIGN KEY (investor_id) REFERENCES investors(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not add foreign key constraint to investors: %', SQLERRM;
    END;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'token_allocations_subscription_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE token_allocations ADD CONSTRAINT token_allocations_subscription_id_fkey 
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not add foreign key constraint to subscriptions: %', SQLERRM;
    END;
  END IF;
END $$;
