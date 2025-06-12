-- Migration: Fix ERC4626 Max Configuration Schema Issues
-- Date: 2025-06-07
-- Purpose: Add missing database fields for ERC4626 max configuration forms
-- Analysis: Moderate mismatches - vault strategy configurations and asset allocations missing

-- 1. Add missing advanced vault strategy features identified in analysis
ALTER TABLE public.token_erc4626_properties 
ADD COLUMN IF NOT EXISTS strategy_complexity TEXT DEFAULT 'simple', -- simple, moderate, advanced
ADD COLUMN IF NOT EXISTS multi_asset_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rebalancing_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_compounding_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS yield_optimization_strategy TEXT,
ADD COLUMN IF NOT EXISTS risk_management_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS risk_tolerance TEXT, -- conservative, moderate, aggressive
ADD COLUMN IF NOT EXISTS diversification_enabled BOOLEAN DEFAULT false;

-- 2. Add missing yield and performance tracking features
ALTER TABLE public.token_erc4626_properties 
ADD COLUMN IF NOT EXISTS apy_tracking_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS benchmark_tracking_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS benchmark_index TEXT,
ADD COLUMN IF NOT EXISTS performance_history_retention INTEGER DEFAULT 365, -- days
ADD COLUMN IF NOT EXISTS yield_sources JSONB, -- array of yield source protocols
ADD COLUMN IF NOT EXISTS yield_distribution_schedule TEXT, -- daily, weekly, monthly
ADD COLUMN IF NOT EXISTS compound_frequency TEXT DEFAULT 'continuous';

-- 3. Add missing risk management and safety features
ALTER TABLE public.token_erc4626_properties 
ADD COLUMN IF NOT EXISTS insurance_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS insurance_provider TEXT,
ADD COLUMN IF NOT EXISTS insurance_coverage_amount TEXT,
ADD COLUMN IF NOT EXISTS emergency_exit_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS circuit_breaker_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_drawdown_threshold TEXT,
ADD COLUMN IF NOT EXISTS stop_loss_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stop_loss_threshold TEXT;

-- 4. Add missing governance and management features
ALTER TABLE public.token_erc4626_properties 
ADD COLUMN IF NOT EXISTS governance_token_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS governance_token_address TEXT,
ADD COLUMN IF NOT EXISTS voting_power_per_share TEXT DEFAULT '1',
ADD COLUMN IF NOT EXISTS strategy_voting_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fee_voting_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS manager_performance_threshold TEXT,
ADD COLUMN IF NOT EXISTS manager_replacement_enabled BOOLEAN DEFAULT false;

-- 5. Add missing fee structure enhancements
ALTER TABLE public.token_erc4626_properties 
ADD COLUMN IF NOT EXISTS dynamic_fees_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS performance_fee_high_water_mark BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fee_tier_system_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS early_withdrawal_penalty TEXT,
ADD COLUMN IF NOT EXISTS late_withdrawal_penalty TEXT,
ADD COLUMN IF NOT EXISTS gas_fee_optimization BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fee_rebate_enabled BOOLEAN DEFAULT false;

-- 6. Add missing liquidity and market making features
ALTER TABLE public.token_erc4626_properties 
ADD COLUMN IF NOT EXISTS liquidity_mining_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS liquidity_incentives_rate TEXT,
ADD COLUMN IF NOT EXISTS market_making_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS arbitrage_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cross_dex_optimization BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS liquidity_provider_rewards JSONB,
ADD COLUMN IF NOT EXISTS impermanent_loss_protection BOOLEAN DEFAULT false;

-- 7. Add missing integration and composability features  
ALTER TABLE public.token_erc4626_properties 
ADD COLUMN IF NOT EXISTS defi_protocol_integrations TEXT[], -- compound, aave, yearn, etc.
ADD COLUMN IF NOT EXISTS lending_protocol_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS borrowing_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS leverage_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_leverage_ratio TEXT,
ADD COLUMN IF NOT EXISTS cross_chain_yield_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bridge_protocols TEXT[];

-- 8. Add missing user experience and analytics features
ALTER TABLE public.token_erc4626_properties 
ADD COLUMN IF NOT EXISTS portfolio_analytics_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS real_time_pnl_tracking BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tax_reporting_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS automated_reporting BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_system_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mobile_app_integration BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS social_trading_enabled BOOLEAN DEFAULT false;

-- 9. Add missing enterprise and institutional features
ALTER TABLE public.token_erc4626_properties 
ADD COLUMN IF NOT EXISTS institutional_grade BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custody_integration BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS audit_trail_comprehensive BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS compliance_reporting_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS regulatory_framework TEXT,
ADD COLUMN IF NOT EXISTS fund_administration_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS third_party_audits_enabled BOOLEAN DEFAULT false;

-- 10. Enhanced fee structure validation
ALTER TABLE public.token_erc4626_properties 
ADD CONSTRAINT fee_structure_validation_check 
CHECK (
  fee_structure IS NULL OR (
    jsonb_typeof(fee_structure) = 'object' AND
    (fee_structure ? 'managementFee' OR fee_structure ? 'performanceFee')
  )
);

-- 11. Enhanced rebalancing rules validation
ALTER TABLE public.token_erc4626_properties 
ADD CONSTRAINT rebalancing_rules_validation_check 
CHECK (
  rebalancing_rules IS NULL OR (
    jsonb_typeof(rebalancing_rules) = 'object' AND
    (rebalancing_rules ? 'frequency')
  )
);

-- 12. Create performance indexes on new fields
CREATE INDEX IF NOT EXISTS idx_erc4626_strategy_complexity ON token_erc4626_properties(strategy_complexity);
CREATE INDEX IF NOT EXISTS idx_erc4626_multi_asset ON token_erc4626_properties(multi_asset_enabled);
CREATE INDEX IF NOT EXISTS idx_erc4626_rebalancing ON token_erc4626_properties(rebalancing_enabled);
CREATE INDEX IF NOT EXISTS idx_erc4626_yield_optimization ON token_erc4626_properties(yield_optimization_enabled);
CREATE INDEX IF NOT EXISTS idx_erc4626_governance ON token_erc4626_properties(governance_token_enabled);
CREATE INDEX IF NOT EXISTS idx_erc4626_institutional ON token_erc4626_properties(institutional_grade);
CREATE INDEX IF NOT EXISTS idx_erc4626_compound_frequency ON token_erc4626_properties(compound_frequency);

-- 13. Add comprehensive comments for new fields
COMMENT ON COLUMN public.token_erc4626_properties.strategy_complexity IS 'Complexity level of the vault strategy: simple, moderate, advanced';
COMMENT ON COLUMN public.token_erc4626_properties.multi_asset_enabled IS 'Whether the vault manages multiple underlying assets';
COMMENT ON COLUMN public.token_erc4626_properties.auto_compounding_enabled IS 'Whether yields are automatically reinvested';
COMMENT ON COLUMN public.token_erc4626_properties.risk_management_enabled IS 'Whether risk management features are active';
COMMENT ON COLUMN public.token_erc4626_properties.yield_optimization_strategy IS 'Strategy used to optimize yield generation';
COMMENT ON COLUMN public.token_erc4626_properties.governance_token_enabled IS 'Whether vault shares have governance rights';
COMMENT ON COLUMN public.token_erc4626_properties.insurance_enabled IS 'Whether vault deposits are insured';
COMMENT ON COLUMN public.token_erc4626_properties.institutional_grade IS 'Whether vault meets institutional investment standards';

-- 14. Create supporting table for vault strategy parameters
CREATE TABLE IF NOT EXISTS public.token_erc4626_vault_strategies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  strategy_name TEXT NOT NULL,
  strategy_type TEXT NOT NULL, -- yield_farming, lending, arbitrage, market_making
  protocol_address TEXT,
  protocol_name TEXT,
  allocation_percentage TEXT NOT NULL,
  min_allocation_percentage TEXT,
  max_allocation_percentage TEXT,
  risk_score INTEGER, -- 1-10 scale
  expected_apy TEXT,
  actual_apy TEXT,
  is_active BOOLEAN DEFAULT true,
  last_rebalance TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 15. Create supporting table for performance metrics tracking
CREATE TABLE IF NOT EXISTS public.token_erc4626_performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  total_assets TEXT NOT NULL,
  share_price TEXT NOT NULL,
  apy TEXT,
  daily_yield TEXT,
  benchmark_performance TEXT,
  total_fees_collected TEXT,
  new_deposits TEXT,
  withdrawals TEXT,
  net_flow TEXT,
  sharpe_ratio TEXT,
  volatility TEXT,
  max_drawdown TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(token_id, metric_date)
);

-- 16. Create supporting table for fee tier configurations
CREATE TABLE IF NOT EXISTS public.token_erc4626_fee_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  tier_name TEXT NOT NULL,
  min_balance TEXT NOT NULL,
  max_balance TEXT,
  management_fee_rate TEXT NOT NULL,
  performance_fee_rate TEXT NOT NULL,
  deposit_fee_rate TEXT DEFAULT '0',
  withdrawal_fee_rate TEXT DEFAULT '0',
  tier_benefits JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 17. Update the ERC4626 view to include new critical fields
DROP VIEW IF EXISTS public.token_erc4626_view;
CREATE VIEW public.token_erc4626_view AS
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
  p.id AS erc4626_property_id,
  p.asset_address,
  p.asset_name,
  p.asset_symbol,
  p.asset_decimals,
  p.vault_type,
  p.is_mintable,
  p.is_burnable,
  p.is_pausable,
  p.vault_strategy,
  p.custom_strategy,
  p.strategy_controller,
  p.access_control,
  p.permit,
  p.flash_loans,
  p.emergency_shutdown,
  p.fee_structure,
  p.rebalancing_rules,
  p.performance_metrics,
  p.yield_source,
  p.automated_rebalancing,
  -- NEW STRATEGY FIELDS
  p.strategy_complexity,
  p.multi_asset_enabled,
  p.rebalancing_enabled,
  p.auto_compounding_enabled,
  p.yield_optimization_enabled,
  p.risk_management_enabled,
  p.risk_tolerance,
  -- NEW PERFORMANCE FIELDS
  p.apy_tracking_enabled,
  p.benchmark_tracking_enabled,
  p.benchmark_index,
  p.compound_frequency,
  -- NEW GOVERNANCE FIELDS
  p.governance_token_enabled,
  p.strategy_voting_enabled,
  p.fee_voting_enabled,
  -- NEW SAFETY FIELDS
  p.insurance_enabled,
  p.emergency_exit_enabled,
  p.circuit_breaker_enabled,
  -- NEW DEFI INTEGRATION
  p.liquidity_mining_enabled,
  p.market_making_enabled,
  p.cross_chain_yield_enabled,
  -- NEW ENTERPRISE FEATURES
  p.institutional_grade,
  p.compliance_reporting_enabled,
  p.third_party_audits_enabled,
  p.created_at AS property_created_at,
  p.updated_at AS property_updated_at
FROM public.tokens t
LEFT JOIN public.token_erc4626_properties p ON t.id = p.token_id
WHERE t.standard = 'ERC-4626'::public.token_standard_enum;

-- Success message
SELECT 'ERC4626 max configuration schema migration completed successfully' AS result;
