-- Update token_allocations table to support multiple token types per subscription

DROP TABLE IF EXISTS public.token_allocations CASCADE;

CREATE TABLE public.token_allocations (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),  -- Unique identifier for each allocation
  investor_id UUID NOT NULL,  -- Links to investor by ID
  subscription_id UUID NOT NULL,  -- A subscription can have multiple allocations
  project_id UUID NULL,  -- Optional project association
  token_type TEXT NOT NULL,
  token_amount NUMERIC NOT NULL CHECK (token_amount > 0),
  distributed BOOLEAN NOT NULL DEFAULT FALSE,
  distribution_date TIMESTAMP WITH TIME ZONE NULL,
  distribution_tx_hash TEXT NULL,
  notes TEXT NULL,
  allocation_date TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),

  -- Primary Key
  CONSTRAINT token_allocations_pkey PRIMARY KEY (id),

  -- Foreign Keys
  CONSTRAINT token_allocations_investor_fkey 
  FOREIGN KEY (investor_id) REFERENCES public.investors(investor_id) ON DELETE CASCADE,
  
  CONSTRAINT token_allocations_subscription_fkey 
  FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  
  CONSTRAINT token_allocations_project_fkey 
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL,

  -- Token Type Validation
  CONSTRAINT token_allocations_token_type_check CHECK (
    token_type = ANY (
      ARRAY[
        'ERC-20'::TEXT,
        'ERC-721'::TEXT,
        'ERC-1155'::TEXT,
        'ERC-1400'::TEXT,
        'ERC-3525'::TEXT,
        'ERC-4626'::TEXT
      ]
    )
  )
) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.token_allocations ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Allow full access to token_allocations" ON public.token_allocations;
CREATE POLICY "Allow full access to token_allocations"
  ON public.token_allocations
  USING (true)
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.token_allocations;
