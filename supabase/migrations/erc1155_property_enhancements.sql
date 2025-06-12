-- ERC1155 Token Properties Enhancements
-- Add missing columns to support additional features

-- Add dynamic_uri_config for dynamic metadata URI generation
ALTER TABLE IF EXISTS "public"."token_erc1155_properties"
ADD COLUMN IF NOT EXISTS "dynamic_uri_config" JSONB;

-- Add transfer_restrictions for limiting token transfers
ALTER TABLE IF EXISTS "public"."token_erc1155_properties"
ADD COLUMN IF NOT EXISTS "transfer_restrictions" JSONB;

-- Add container_config for token containers functionality
ALTER TABLE IF EXISTS "public"."token_erc1155_properties"
ADD COLUMN IF NOT EXISTS "container_config" JSONB;

-- Add dynamic_uris boolean flag to explicitly track if dynamic URIs are enabled
ALTER TABLE IF EXISTS "public"."token_erc1155_properties"
ADD COLUMN IF NOT EXISTS "dynamic_uris" BOOLEAN DEFAULT FALSE;

-- Add batch_minting_config for batch minting operations
ALTER TABLE IF EXISTS "public"."token_erc1155_properties"
ADD COLUMN IF NOT EXISTS "batch_minting_config" JSONB;

-- Update the view to include the new columns
CREATE OR REPLACE VIEW "public"."token_erc1155_view" AS
SELECT 
    t.*,
    p.id AS property_id,
    p.base_uri,
    p.metadata_storage,
    p.has_royalty,
    p.royalty_percentage,
    p.royalty_receiver,
    p.is_burnable,
    p.is_pausable,
    p.access_control,
    p.updatable_uris,
    p.dynamic_uris,
    p.supply_tracking,
    p.enable_approval_for_all,
    p.sales_config,
    p.whitelist_config,
    p.batch_transfer_limits,
    p.dynamic_uri_config,
    p.transfer_restrictions,
    p.container_config,
    p.batch_minting_config,
    p.created_at AS property_created_at,
    p.updated_at AS property_updated_at,
    t.metadata->'configMode' as config_mode_from_metadata
FROM 
    "public"."tokens" t
LEFT JOIN 
    "public"."token_erc1155_properties" p ON t.id = p.token_id
WHERE 
    t.standard = 'ERC-1155';

-- Update database.ts to include these new columns in TokenErc1155PropertiesTable type
-- This comment is just a reminder - you'll need to regenerate the types from the database schema 