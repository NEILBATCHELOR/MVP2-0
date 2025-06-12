-- Migration: Fix ERC1155 Max Configuration Schema Issues
-- Date: 2025-06-07
-- Purpose: Add missing database fields for ERC1155 max configuration forms
-- Analysis: Moderate mismatches - missing advanced features and JSONB validation

-- 1. Add missing advanced ERC1155 fields identified in max config analysis
ALTER TABLE public.token_erc1155_properties 
ADD COLUMN IF NOT EXISTS mint_roles TEXT[], -- array of addresses with mint permissions
ADD COLUMN IF NOT EXISTS burning_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS burn_roles TEXT[], -- array of addresses with burn permissions
ADD COLUMN IF NOT EXISTS updatable_metadata BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS metadata_update_roles TEXT[],
ADD COLUMN IF NOT EXISTS supply_tracking_advanced BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_supply_per_type TEXT;

-- 2. Add missing multi-token economics features
ALTER TABLE public.token_erc1155_properties 
ADD COLUMN IF NOT EXISTS pricing_model TEXT DEFAULT 'fixed', -- fixed, dynamic, auction
ADD COLUMN IF NOT EXISTS base_price TEXT,
ADD COLUMN IF NOT EXISTS price_multipliers JSONB, -- price multipliers per token type
ADD COLUMN IF NOT EXISTS bulk_discount_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bulk_discount_tiers JSONB, -- discount tiers for bulk purchases
ADD COLUMN IF NOT EXISTS referral_rewards_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS referral_percentage TEXT;

-- 3. Add missing minting and distribution features  
ALTER TABLE public.token_erc1155_properties 
ADD COLUMN IF NOT EXISTS lazy_minting_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS airdrop_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS airdrop_snapshot_block INTEGER,
ADD COLUMN IF NOT EXISTS claim_period_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS claim_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS claim_end_time TIMESTAMP WITH TIME ZONE;

-- 4. Add missing utility and gaming features for multi-tokens
ALTER TABLE public.token_erc1155_properties 
ADD COLUMN IF NOT EXISTS crafting_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fusion_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS token_recipes JSONB, -- crafting recipes between token types
ADD COLUMN IF NOT EXISTS experience_points_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS leveling_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consumable_tokens BOOLEAN DEFAULT false;

-- 5. Add missing marketplace and trading features
ALTER TABLE public.token_erc1155_properties 
ADD COLUMN IF NOT EXISTS marketplace_fees_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS marketplace_fee_percentage TEXT,
ADD COLUMN IF NOT EXISTS marketplace_fee_recipient TEXT,
ADD COLUMN IF NOT EXISTS bundle_trading_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS atomic_swaps_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cross_collection_trading BOOLEAN DEFAULT false;

-- 6. Add missing governance and community features
ALTER TABLE public.token_erc1155_properties 
ADD COLUMN IF NOT EXISTS voting_power_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS voting_weight_per_token JSONB, -- different weights per token type
ADD COLUMN IF NOT EXISTS community_treasury_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS treasury_percentage TEXT,
ADD COLUMN IF NOT EXISTS proposal_creation_threshold TEXT;

-- 7. Add missing cross-chain and interoperability
ALTER TABLE public.token_erc1155_properties 
ADD COLUMN IF NOT EXISTS bridge_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bridgeable_token_types TEXT[], -- which token types can be bridged
ADD COLUMN IF NOT EXISTS wrapped_versions JSONB, -- mapping of wrapped token addresses
ADD COLUMN IF NOT EXISTS layer2_support_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS supported_layer2_networks TEXT[];

-- 8. Enhance existing JSONB fields with better validation and structure

-- Update sales_config validation
ALTER TABLE public.token_erc1155_properties 
ADD CONSTRAINT sales_config_structure_check 
CHECK (
  sales_config IS NULL OR (
    jsonb_typeof(sales_config) = 'object' AND
    (sales_config ? 'enabled') AND
    (sales_config->'enabled')::text IN ('true', 'false')
  )
);

-- Update whitelist_config validation  
ALTER TABLE public.token_erc1155_properties 
ADD CONSTRAINT whitelist_config_structure_check 
CHECK (
  whitelist_config IS NULL OR (
    jsonb_typeof(whitelist_config) = 'object' AND
    (whitelist_config ? 'enabled') AND
    (whitelist_config->'enabled')::text IN ('true', 'false')
  )
);

-- Update batch_transfer_limits validation
ALTER TABLE public.token_erc1155_properties 
ADD CONSTRAINT batch_transfer_limits_structure_check 
CHECK (
  batch_transfer_limits IS NULL OR (
    jsonb_typeof(batch_transfer_limits) = 'object' AND
    (batch_transfer_limits ? 'maxItemsPerBatch')
  )
);

-- 9. Create performance indexes on new fields
CREATE INDEX IF NOT EXISTS idx_erc1155_lazy_minting ON token_erc1155_properties(lazy_minting_enabled);
CREATE INDEX IF NOT EXISTS idx_erc1155_crafting ON token_erc1155_properties(crafting_enabled);
CREATE INDEX IF NOT EXISTS idx_erc1155_voting_power ON token_erc1155_properties(voting_power_enabled);
CREATE INDEX IF NOT EXISTS idx_erc1155_bridge ON token_erc1155_properties(bridge_enabled);
CREATE INDEX IF NOT EXISTS idx_erc1155_pricing_model ON token_erc1155_properties(pricing_model);

-- 10. Add comprehensive comments for new fields
COMMENT ON COLUMN public.token_erc1155_properties.lazy_minting_enabled IS 'Whether tokens are minted on-demand rather than pre-minted';
COMMENT ON COLUMN public.token_erc1155_properties.crafting_enabled IS 'Whether token types can be combined to create new tokens';
COMMENT ON COLUMN public.token_erc1155_properties.voting_power_enabled IS 'Whether different token types have governance voting power';
COMMENT ON COLUMN public.token_erc1155_properties.bridge_enabled IS 'Whether tokens can be bridged to other chains';
COMMENT ON COLUMN public.token_erc1155_properties.pricing_model IS 'Pricing strategy: fixed, dynamic, or auction-based';
COMMENT ON COLUMN public.token_erc1155_properties.consumable_tokens IS 'Whether some token types are consumed on use';

-- 11. Create supporting table for token type definitions (enhanced from existing)
CREATE TABLE IF NOT EXISTS public.token_erc1155_type_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  token_type_id TEXT NOT NULL,
  supply_cap TEXT,
  mint_price TEXT,
  is_tradeable BOOLEAN DEFAULT true,
  is_transferable BOOLEAN DEFAULT true,
  utility_type TEXT, -- consumable, equipment, currency, collectible
  rarity_tier TEXT, -- common, uncommon, rare, epic, legendary
  experience_value INTEGER DEFAULT 0,
  crafting_materials JSONB, -- materials needed to craft this token
  burn_rewards JSONB, -- rewards given when this token is burned
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(token_id, token_type_id)
);

-- 12. Create supporting table for bulk discount configurations
CREATE TABLE IF NOT EXISTS public.token_erc1155_discount_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  min_quantity INTEGER NOT NULL,
  max_quantity INTEGER,
  discount_percentage TEXT NOT NULL,
  tier_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 13. Create supporting table for crafting recipes
CREATE TABLE IF NOT EXISTS public.token_erc1155_crafting_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  recipe_name TEXT NOT NULL,
  input_tokens JSONB NOT NULL, -- array of {tokenTypeId, quantity} required
  output_token_type_id TEXT NOT NULL,
  output_quantity INTEGER DEFAULT 1,
  success_rate INTEGER DEFAULT 100, -- percentage
  cooldown_period INTEGER DEFAULT 0, -- seconds
  required_level INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 14. Update the ERC1155 view to include new critical fields
DROP VIEW IF EXISTS public.token_erc1155_view;
CREATE VIEW public.token_erc1155_view AS
SELECT 
  t.id AS token_id,
  t.name,
  t.symbol,
  t.decimals,
  t.standard,
  t.total_supply,
  t.metadata,
  t.status,
  t.description, -- from universal migration
  t.created_at AS token_created_at,
  t.updated_at AS token_updated_at,
  p.id AS erc1155_property_id,
  p.base_uri,
  p.metadata_storage,
  p.has_royalty,
  p.royalty_percentage,
  p.royalty_receiver,
  p.is_burnable,
  p.is_pausable,
  p.access_control,
  p.updatable_uris,
  p.supply_tracking,
  p.enable_approval_for_all,
  p.sales_config,
  p.whitelist_config,
  p.batch_transfer_limits,
  p.dynamic_uri_config,
  p.batch_minting_config,
  p.transfer_restrictions,
  p.container_config,
  -- NEW ADVANCED FIELDS
  p.lazy_minting_enabled,
  p.burning_enabled,
  p.updatable_metadata,
  p.crafting_enabled,
  p.fusion_enabled,
  p.experience_points_enabled,
  p.voting_power_enabled,
  p.marketplace_fees_enabled,
  p.bridge_enabled,
  p.pricing_model,
  p.base_price,
  p.bulk_discount_enabled,
  p.airdrop_enabled,
  p.claim_period_enabled,
  p.claim_start_time,
  p.claim_end_time,
  p.created_at AS property_created_at,
  p.updated_at AS property_updated_at
FROM public.tokens t
LEFT JOIN public.token_erc1155_properties p ON t.id = p.token_id
WHERE t.standard = 'ERC-1155'::public.token_standard_enum;

-- Success message
SELECT 'ERC1155 max configuration schema migration completed successfully' AS result;
