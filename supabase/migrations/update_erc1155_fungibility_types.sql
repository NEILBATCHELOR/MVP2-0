-- Clean up metadata for ERC1155 token types
-- This migration removes the 'fungible' field from metadata and ensures all records use the fungibility_type field

-- First, update any remaining records that haven't had their fungibility_type set
-- based on the metadata.fungible value
UPDATE "public"."token_erc1155_types" 
SET "fungibility_type" = 
  CASE 
    WHEN metadata->>'fungible' = 'true' THEN 'fungible'
    ELSE 'non-fungible'
  END
WHERE "fungibility_type" IS NULL AND metadata IS NOT NULL AND metadata ? 'fungible';

-- Next, remove the 'fungible' property from the metadata JSONB column
UPDATE "public"."token_erc1155_types"
SET "metadata" = "metadata" - 'fungible'
WHERE metadata IS NOT NULL AND metadata ? 'fungible';

-- Also remove the 'rarityLevel' property from the metadata JSONB column
UPDATE "public"."token_erc1155_types"
SET "metadata" = "metadata" - 'rarityLevel'
WHERE metadata IS NOT NULL AND metadata ? 'rarityLevel';

-- Set metadata to NULL if it's empty after removing properties
UPDATE "public"."token_erc1155_types"
SET "metadata" = NULL
WHERE metadata IS NOT NULL AND metadata::text = '{}';

-- Ensure all records have a fungibility_type value set
UPDATE "public"."token_erc1155_types"
SET "fungibility_type" = 'non-fungible'
WHERE "fungibility_type" IS NULL;

-- Add additional logging to track changes
DO $$
DECLARE
  updated_count INT;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % records to ensure fungibility_type is set', updated_count;
END $$; 