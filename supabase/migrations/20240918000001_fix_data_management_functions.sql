-- Fix database schema to ensure all data management functions work correctly

-- Ensure users table has correct columns
ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS public_key TEXT,
  ADD COLUMN IF NOT EXISTS encrypted_private_key TEXT;

-- Ensure user_roles table exists and has correct structure
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  role VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure investors table has all required fields
ALTER TABLE IF EXISTS public.investors
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS verification_details JSONB;

-- Ensure cap_table_investors has unique constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cap_table_investors_unique_constraint'
  ) THEN
    ALTER TABLE public.cap_table_investors 
    ADD CONSTRAINT cap_table_investors_unique_constraint UNIQUE (cap_table_id, investor_id);
  END IF;
EXCEPTION WHEN others THEN
  -- Constraint might already exist or table might not exist
  RAISE NOTICE 'Error adding unique constraint to cap_table_investors: %', SQLERRM;
END $$;

-- Ensure token_allocations table has all required fields
ALTER TABLE IF EXISTS public.token_allocations
  ADD COLUMN IF NOT EXISTS distribution_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS distribution_tx_hash TEXT;

-- Ensure redemption_requests table exists with correct structure
CREATE TABLE IF NOT EXISTS public.redemption_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID,
  investor_name TEXT,
  token_amount NUMERIC NOT NULL,
  token_type VARCHAR NOT NULL,
  redemption_type VARCHAR NOT NULL,
  source_wallet_address TEXT NOT NULL,
  destination_wallet_address TEXT NOT NULL,
  conversion_rate NUMERIC NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending',
  required_approvals INTEGER NOT NULL DEFAULT 1,
  is_bulk_redemption BOOLEAN DEFAULT FALSE,
  investor_count INTEGER,
  rejected_by TEXT,
  rejection_reason TEXT,
  rejection_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure redemption_approvers table exists with correct structure
CREATE TABLE IF NOT EXISTS public.redemption_approvers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  redemption_id UUID NOT NULL REFERENCES public.redemption_requests(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  role VARCHAR NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMP WITH TIME ZONE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add realtime publication for all tables
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Error creating publication: %', SQLERRM;
END $$;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.investors;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.token_allocations;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.cap_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.cap_table_investors;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.redemption_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.redemption_approvers;
