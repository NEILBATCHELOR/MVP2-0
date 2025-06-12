-- Migration: Fix ERC721 Max Configuration Schema Issues  
-- Date: 2025-06-07
-- Purpose: Add missing database fields for ERC721 max configuration forms
-- Analysis: 11+ form fields with NO database storage identified

-- 1. Add missing critical ERC721 fields identified in max config analysis
ALTER TABLE public.token_erc721_properties 
ADD COLUMN IF NOT EXISTS contract_uri TEXT,
ADD COLUMN IF NOT EXISTS custom_base_uri TEXT,
ADD COLUMN IF NOT EXISTS revealable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pre_reveal_uri TEXT,
ADD COLUMN IF NOT EXISTS reserved_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS minting_price TEXT,
ADD COLUMN IF NOT EXISTS max_mints_per_tx INTEGER,
ADD COLUMN IF NOT EXISTS max_mints_per_wallet INTEGER,
ADD COLUMN IF NOT EXISTS enable_fractional_ownership BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_dynamic_metadata BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS use_safe_transfer BOOLEAN DEFAULT true;

-- 2. Add missing minting and pricing configuration
ALTER TABLE public.token_erc721_properties 
ADD COLUMN IF NOT EXISTS public_sale_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS public_sale_price TEXT,
ADD COLUMN IF NOT EXISTS public_sale_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS public_sale_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS whitelist_sale_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whitelist_sale_price TEXT,
ADD COLUMN IF NOT EXISTS whitelist_sale_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS whitelist_sale_end_time TIMESTAMP WITH TIME ZONE;

-- 3. Add missing reveal and metadata configuration
ALTER TABLE public.token_erc721_properties 
ADD COLUMN IF NOT EXISTS reveal_batch_size INTEGER,
ADD COLUMN IF NOT EXISTS auto_reveal BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reveal_delay INTEGER, -- hours
ADD COLUMN IF NOT EXISTS placeholder_image_uri TEXT,
ADD COLUMN IF NOT EXISTS metadata_frozen BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS metadata_provenance_hash TEXT;

-- 4. Add missing mint roles and permissions
ALTER TABLE public.token_erc721_properties 
ADD COLUMN IF NOT EXISTS mint_roles TEXT[], -- array of addresses with mint permissions
ADD COLUMN IF NOT EXISTS admin_mint_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS public_mint_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS burn_roles TEXT[], -- array of addresses with burn permissions
ADD COLUMN IF NOT EXISTS transfer_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS soulbound BOOLEAN DEFAULT false;

-- 5. Add missing marketplace and creator features  
ALTER TABLE public.token_erc721_properties 
ADD COLUMN IF NOT EXISTS creator_earnings_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS creator_earnings_percentage TEXT,
ADD COLUMN IF NOT EXISTS creator_earnings_address TEXT,
ADD COLUMN IF NOT EXISTS marketplace_approved TEXT[], -- approved marketplace addresses
ADD COLUMN IF NOT EXISTS operator_filter_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_operator_filter_address TEXT;

-- 6. Add missing utility and gaming features
ALTER TABLE public.token_erc721_properties 
ADD COLUMN IF NOT EXISTS utility_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS utility_type TEXT, -- gaming, membership, access, etc.
ADD COLUMN IF NOT EXISTS staking_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS staking_rewards_token_address TEXT,
ADD COLUMN IF NOT EXISTS staking_rewards_rate TEXT,
ADD COLUMN IF NOT EXISTS breeding_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS evolution_enabled BOOLEAN DEFAULT false;

-- 7. Add missing supply and economics features
ALTER TABLE public.token_erc721_properties 
ADD COLUMN IF NOT EXISTS supply_cap_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS total_supply_cap TEXT,
ADD COLUMN IF NOT EXISTS mint_phases_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS dutch_auction_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS dutch_auction_start_price TEXT,
ADD COLUMN IF NOT EXISTS dutch_auction_end_price TEXT,
ADD COLUMN IF NOT EXISTS dutch_auction_duration INTEGER; -- hours

-- 8. Add missing cross-chain and interoperability features
ALTER TABLE public.token_erc721_properties 
ADD COLUMN IF NOT EXISTS cross_chain_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bridge_contracts JSONB, -- array of bridge contract addresses
ADD COLUMN IF NOT EXISTS layer2_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS layer2_networks TEXT[]; -- supported L2 networks

-- 9. Update sales_config JSONB validation with proper structure
ALTER TABLE public.token_erc721_properties 
ADD CONSTRAINT sales_config_structure_check 
CHECK (
  sales_config IS NULL OR (
    jsonb_typeof(sales_config) = 'object' AND
    (sales_config ? 'enabled') AND
    (sales_config->'enabled')::text IN ('true', 'false')
  )
);

-- 10. Update whitelist_config JSONB validation with proper structure  
ALTER TABLE public.token_erc721_properties 
ADD CONSTRAINT whitelist_config_structure_check 
CHECK (
  whitelist_config IS NULL OR (
    jsonb_typeof(whitelist_config) = 'object' AND
    (whitelist_config ? 'enabled') AND
    (whitelist_config->'enabled')::text IN ('true', 'false')
  )
);

-- 11. Create performance indexes on new fields
CREATE INDEX IF NOT EXISTS idx_erc721_revealable ON token_erc721_properties(revealable);
CREATE INDEX IF NOT EXISTS idx_erc721_public_sale ON token_erc721_properties(public_sale_enabled, public_sale_start_time);
CREATE INDEX IF NOT EXISTS idx_erc721_whitelist_sale ON token_erc721_properties(whitelist_sale_enabled, whitelist_sale_start_time);
CREATE INDEX IF NOT EXISTS idx_erc721_staking ON token_erc721_properties(staking_enabled);
CREATE INDEX IF NOT EXISTS idx_erc721_utility ON token_erc721_properties(utility_enabled, utility_type);

-- 12. Add comprehensive comments for new fields
COMMENT ON COLUMN public.token_erc721_properties.contract_uri IS 'Contract-level metadata URI';
COMMENT ON COLUMN public.token_erc721_properties.revealable IS 'Whether NFTs are revealed in batches';
COMMENT ON COLUMN public.token_erc721_properties.reserved_tokens IS 'Number of tokens reserved for team/partnerships';
COMMENT ON COLUMN public.token_erc721_properties.enable_fractional_ownership IS 'Whether NFTs can be fractionalized';
COMMENT ON COLUMN public.token_erc721_properties.soulbound IS 'Whether tokens are non-transferable after mint';
COMMENT ON COLUMN public.token_erc721_properties.utility_enabled IS 'Whether NFTs have utility beyond collectibility';
COMMENT ON COLUMN public.token_erc721_properties.staking_enabled IS 'Whether NFTs can be staked for rewards';
COMMENT ON COLUMN public.token_erc721_properties.cross_chain_enabled IS 'Whether NFTs support cross-chain transfers';

-- 13. Create supporting table for NFT traits/attributes (referenced in analysis)
CREATE TABLE IF NOT EXISTS public.token_erc721_trait_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  trait_name TEXT NOT NULL,
  trait_type TEXT NOT NULL, -- string, number, date, boolean
  possible_values JSONB, -- array of possible values for this trait
  rarity_weights JSONB, -- rarity weights for each value
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(token_id, trait_name)
);

-- 14. Create supporting table for mint phases (complex configuration)
CREATE TABLE IF NOT EXISTS public.token_erc721_mint_phases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  phase_name TEXT NOT NULL,
  phase_order INTEGER NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  max_supply INTEGER,
  price TEXT,
  max_per_wallet INTEGER,
  whitelist_required BOOLEAN DEFAULT false,
  merkle_root TEXT, -- for whitelist verification
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(token_id, phase_order)
);

-- 15. Update the ERC721 view to include critical new fields
DROP VIEW IF EXISTS public.token_erc721_view;
CREATE VIEW public.token_erc721_view AS
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
  p.id AS erc721_property_id,
  p.base_uri,
  p.metadata_storage,
  p.max_supply,
  p.has_royalty,
  p.royalty_percentage,
  p.royalty_receiver,
  p.is_burnable,
  p.is_pausable,
  p.asset_type,
  p.minting_method,
  p.auto_increment_ids,
  p.enumerable,
  p.uri_storage,
  p.access_control,
  p.updatable_uris,
  p.sales_config,
  p.whitelist_config,
  p.permission_config,
  -- NEW CRITICAL FIELDS
  p.contract_uri,
  p.revealable,
  p.pre_reveal_uri,
  p.reserved_tokens,
  p.minting_price,
  p.max_mints_per_tx,
  p.max_mints_per_wallet,
  p.enable_fractional_ownership,
  p.enable_dynamic_metadata,
  p.public_sale_enabled,
  p.public_sale_price,
  p.public_sale_start_time,
  p.whitelist_sale_enabled,
  p.whitelist_sale_price,
  p.whitelist_sale_start_time,
  p.utility_enabled,
  p.utility_type,
  p.staking_enabled,
  p.soulbound,
  p.cross_chain_enabled,
  p.created_at AS property_created_at,
  p.updated_at AS property_updated_at
FROM public.tokens t
LEFT JOIN public.token_erc721_properties p ON t.id = p.token_id
WHERE t.standard = 'ERC-721'::public.token_standard_enum;

-- Success message
SELECT 'ERC721 max configuration schema migration completed successfully' AS result;
