-- Add minting fields to token_allocations table
ALTER TABLE public.token_allocations
ADD COLUMN IF NOT EXISTS minted boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS minting_date timestamp with time zone NULL,
ADD COLUMN IF NOT EXISTS minting_tx_hash text NULL;
