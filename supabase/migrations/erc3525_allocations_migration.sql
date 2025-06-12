-- SQL Migration for ERC3525 Allocations

-- 1. Add metadata column to token_erc3525_properties if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'token_erc3525_properties' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE token_erc3525_properties
    ADD COLUMN metadata JSONB;
    
    COMMENT ON COLUMN token_erc3525_properties.metadata IS 'JSON metadata for token properties';
  END IF;
END
$$;

-- 2. Add token_id_within_slot column to token_erc3525_allocations if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'token_erc3525_allocations' 
    AND column_name = 'token_id_within_slot'
  ) THEN
    ALTER TABLE token_erc3525_allocations
    ADD COLUMN token_id_within_slot TEXT;
    
    COMMENT ON COLUMN token_erc3525_allocations.token_id_within_slot IS 'Token ID within the slot (UI compatibility field)';
  END IF;
END
$$;

-- 3. Add recipient column to token_erc3525_allocations if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'token_erc3525_allocations' 
    AND column_name = 'recipient'
  ) THEN
    ALTER TABLE token_erc3525_allocations
    ADD COLUMN recipient TEXT;
    
    COMMENT ON COLUMN token_erc3525_allocations.recipient IS 'Recipient address for the allocation';
  END IF;
END
$$;

-- 4. Add linked_token_id column to token_erc3525_allocations if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'token_erc3525_allocations' 
    AND column_name = 'linked_token_id'
  ) THEN
    ALTER TABLE token_erc3525_allocations
    ADD COLUMN linked_token_id TEXT;
    
    COMMENT ON COLUMN token_erc3525_allocations.linked_token_id IS 'ID of a linked token (if applicable)';
  END IF;
END
$$; 