-- Add linked_token_id column to token_erc3525_allocations table
ALTER TABLE token_erc3525_allocations 
ADD COLUMN IF NOT EXISTS linked_token_id UUID REFERENCES tokens(id);

-- Add comment explaining the purpose of the column
COMMENT ON COLUMN token_erc3525_allocations.linked_token_id IS 
'Foreign key reference to another token that this allocation is linked to'; 