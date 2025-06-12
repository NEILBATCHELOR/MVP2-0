-- Migration: Fix ERC20 Max Configuration Schema Issues
-- Date: 2025-06-07
-- Purpose: Add missing database fields for ERC20 max configuration forms

-- 1. Add missing description field to main tokens table (universal issue)
ALTER TABLE public.tokens 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Add missing governance-specific fields to ERC20 properties
ALTER TABLE public.token_erc20_properties 
ADD COLUMN IF NOT EXISTS governance_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS quorum_percentage TEXT,
ADD COLUMN IF NOT EXISTS proposal_threshold TEXT,
ADD COLUMN IF NOT EXISTS voting_delay INTEGER,
ADD COLUMN IF NOT EXISTS voting_period INTEGER,
ADD COLUMN IF NOT EXISTS timelock_delay INTEGER,
ADD COLUMN IF NOT EXISTS governance_token_address TEXT;

-- 3. Add missing advanced ERC20 fields identified in max config analysis
ALTER TABLE public.token_erc20_properties 
ADD COLUMN IF NOT EXISTS pausable_by TEXT, -- who can pause the token
ADD COLUMN IF NOT EXISTS mintable_by TEXT, -- who can mint new tokens
ADD COLUMN IF NOT EXISTS burnable_by TEXT, -- who can burn tokens
ADD COLUMN IF NOT EXISTS max_total_supply TEXT,
ADD COLUMN IF NOT EXISTS anti_whale_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_wallet_amount TEXT,
ADD COLUMN IF NOT EXISTS cooldown_period INTEGER,
ADD COLUMN IF NOT EXISTS blacklist_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deflation_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deflation_rate TEXT,
ADD COLUMN IF NOT EXISTS staking_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS staking_rewards_rate TEXT;

-- 4. Expand compliance_config enum values to match form options
ALTER TABLE public.token_erc20_properties 
DROP CONSTRAINT IF EXISTS compliance_config_check;

-- Add proper validation for compliance intervals including quarterly and annually
ALTER TABLE public.token_erc20_properties 
ADD CONSTRAINT compliance_config_reporting_interval_check 
CHECK (
  compliance_config IS NULL OR 
  (compliance_config->'reportingInterval')::text IN (
    '"daily"', '"weekly"', '"monthly"', '"quarterly"', '"annually"'
  )
);

-- 5. Add missing fee structure fields
ALTER TABLE public.token_erc20_properties 
ADD COLUMN IF NOT EXISTS buy_fee_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sell_fee_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS liquidity_fee_percentage TEXT,
ADD COLUMN IF NOT EXISTS marketing_fee_percentage TEXT,
ADD COLUMN IF NOT EXISTS charity_fee_percentage TEXT,
ADD COLUMN IF NOT EXISTS auto_liquidity_enabled BOOLEAN DEFAULT false;

-- 6. Update whitelist_config to support 'mixed' option identified in analysis
-- Note: JSONB field can store any structure, but we'll add validation

-- 7. Add missing tax and reflection features
ALTER TABLE public.token_erc20_properties 
ADD COLUMN IF NOT EXISTS reflection_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reflection_percentage TEXT,
ADD COLUMN IF NOT EXISTS burn_on_transfer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS burn_percentage TEXT,
ADD COLUMN IF NOT EXISTS lottery_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lottery_percentage TEXT;

-- 8. Add missing time-based features
ALTER TABLE public.token_erc20_properties 
ADD COLUMN IF NOT EXISTS trading_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS presale_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS presale_rate TEXT,
ADD COLUMN IF NOT EXISTS presale_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS presale_end_time TIMESTAMP WITH TIME ZONE;

-- 9. Add missing vesting features
ALTER TABLE public.token_erc20_properties 
ADD COLUMN IF NOT EXISTS vesting_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vesting_cliff_period INTEGER,
ADD COLUMN IF NOT EXISTS vesting_total_period INTEGER,
ADD COLUMN IF NOT EXISTS vesting_release_frequency TEXT DEFAULT 'monthly';

-- 10. Create indexes for performance on new fields
CREATE INDEX IF NOT EXISTS idx_erc20_governance_enabled ON token_erc20_properties(governance_enabled);
CREATE INDEX IF NOT EXISTS idx_erc20_trading_start ON token_erc20_properties(trading_start_time);
CREATE INDEX IF NOT EXISTS idx_erc20_presale_enabled ON token_erc20_properties(presale_enabled);

-- 11. Add comments to document new fields
COMMENT ON COLUMN public.token_erc20_properties.governance_enabled IS 'Whether DAO governance features are enabled';
COMMENT ON COLUMN public.token_erc20_properties.quorum_percentage IS 'Minimum percentage of tokens needed for governance proposals';
COMMENT ON COLUMN public.token_erc20_properties.anti_whale_enabled IS 'Whether anti-whale mechanisms are active';
COMMENT ON COLUMN public.token_erc20_properties.reflection_enabled IS 'Whether reflection rewards are enabled for holders';
COMMENT ON COLUMN public.token_erc20_properties.vesting_enabled IS 'Whether token vesting schedules are enforced';

-- 12. Update the ERC20 view to include new fields (recreate view)
DROP VIEW IF EXISTS public.token_erc20_view;
CREATE VIEW public.token_erc20_view AS
SELECT 
  t.id AS token_id,
  t.name,
  t.symbol,
  t.decimals,
  t.standard,
  t.total_supply,
  t.metadata,
  t.status,
  t.description, -- NEW FIELD
  t.created_at AS token_created_at,
  t.updated_at AS token_updated_at,
  p.id AS erc20_property_id,
  p.token_type,
  p.cap,
  p.initial_supply,
  p.access_control,
  p.allow_management,
  p.is_mintable,
  p.is_burnable,
  p.is_pausable,
  p.snapshot,
  p.permit,
  p.rebasing,
  p.fee_on_transfer,
  p.governance_features,
  p.compliance_config,
  p.transfer_config,
  p.gas_config,
  p.whitelist_config,
  -- NEW GOVERNANCE FIELDS
  p.governance_enabled,
  p.quorum_percentage,
  p.proposal_threshold,
  p.voting_delay,
  p.voting_period,
  -- NEW ADVANCED FIELDS
  p.anti_whale_enabled,
  p.max_wallet_amount,
  p.reflection_enabled,
  p.reflection_percentage,
  p.vesting_enabled,
  p.vesting_cliff_period,
  p.presale_enabled,
  p.presale_rate,
  p.trading_start_time,
  p.created_at AS property_created_at,
  p.updated_at AS property_updated_at
FROM public.tokens t
LEFT JOIN public.token_erc20_properties p ON t.id = p.token_id
WHERE t.standard = 'ERC-20'::public.token_standard_enum;

-- Success message
SELECT 'ERC20 max configuration schema migration completed successfully' AS result;
