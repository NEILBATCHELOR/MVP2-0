-- Add minting fields to token_allocations table
ALTER TABLE token_allocations ADD COLUMN IF NOT EXISTS minted BOOLEAN DEFAULT FALSE;
ALTER TABLE token_allocations ADD COLUMN IF NOT EXISTS minting_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE token_allocations ADD COLUMN IF NOT EXISTS minting_tx_hash TEXT;

-- Update the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE token_allocations;
