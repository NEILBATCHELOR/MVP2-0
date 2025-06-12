-- Migration script to update token_erc3525_properties table with custom properties

-- Check if token_erc3525_properties table exists
CREATE TABLE IF NOT EXISTS public.token_erc3525_properties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  token_id uuid NOT NULL,
  value_decimals integer NULL DEFAULT 0,
  base_uri text NULL,
  metadata_storage text NULL,
  slot_type text NULL,
  is_burnable boolean NULL DEFAULT false,
  is_pausable boolean NULL DEFAULT false,
  has_royalty boolean NULL DEFAULT false,
  royalty_percentage text NULL,
  royalty_receiver text NULL,
  access_control text NULL,
  updatable_uris boolean NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL,
  CONSTRAINT token_erc3525_properties_pkey PRIMARY KEY (id),
  CONSTRAINT token_erc3525_properties_token_id_fkey FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE
);

-- Add index on token_id
CREATE INDEX IF NOT EXISTS idx_token_erc3525_properties_token_id ON public.token_erc3525_properties USING btree (token_id);

-- Add additional boolean properties if they don't exist
DO $$
BEGIN
  -- Add slot_approvals column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'token_erc3525_properties' AND column_name = 'slot_approvals') THEN
    ALTER TABLE public.token_erc3525_properties ADD COLUMN slot_approvals boolean NULL DEFAULT false;
  END IF;

  -- Add value_approvals column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'token_erc3525_properties' AND column_name = 'value_approvals') THEN
    ALTER TABLE public.token_erc3525_properties ADD COLUMN value_approvals boolean NULL DEFAULT false;
  END IF;

  -- Add updatable_slots column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'token_erc3525_properties' AND column_name = 'updatable_slots') THEN
    ALTER TABLE public.token_erc3525_properties ADD COLUMN updatable_slots boolean NULL DEFAULT false;
  END IF;

  -- Add value_transfers_enabled column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'token_erc3525_properties' AND column_name = 'value_transfers_enabled') THEN
    ALTER TABLE public.token_erc3525_properties ADD COLUMN value_transfers_enabled boolean NULL DEFAULT true;
  END IF;

  -- Add mergable column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'token_erc3525_properties' AND column_name = 'mergable') THEN
    ALTER TABLE public.token_erc3525_properties ADD COLUMN mergable boolean NULL DEFAULT false;
  END IF;

  -- Add splittable column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'token_erc3525_properties' AND column_name = 'splittable') THEN
    ALTER TABLE public.token_erc3525_properties ADD COLUMN splittable boolean NULL DEFAULT false;
  END IF;

  -- Add updatable_values column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'token_erc3525_properties' AND column_name = 'updatable_values') THEN
    ALTER TABLE public.token_erc3525_properties ADD COLUMN updatable_values boolean NULL DEFAULT false;
  END IF;
END $$;

-- Note: We deliberately do NOT add a 'metadata' column since the current architecture
-- doesn't support it. Financial instrument data and derivative terms would need 
-- dedicated columns if they need to be stored.