-- Add fungibility_type column to token_erc1155_types table
ALTER TABLE "public"."token_erc1155_types" 
ADD COLUMN "fungibility_type" TEXT CHECK ("fungibility_type" IN ('fungible', 'non-fungible', 'semi-fungible')) DEFAULT 'non-fungible';

-- Update existing records to set fungibility_type based on metadata.fungible value
UPDATE "public"."token_erc1155_types" 
SET "fungibility_type" = 
  CASE 
    WHEN metadata->>'fungible' = 'true' THEN 'fungible'
    ELSE 'non-fungible'
  END
WHERE metadata IS NOT NULL AND metadata ? 'fungible';

-- Create index on fungibility_type for improved query performance
CREATE INDEX IF NOT EXISTS "idx_token_erc1155_types_fungibility_type" ON "public"."token_erc1155_types" ("fungibility_type");

-- Add comment to describe the column purpose
COMMENT ON COLUMN "public"."token_erc1155_types"."fungibility_type" IS 'Type of fungibility: fungible, non-fungible, or semi-fungible'; 