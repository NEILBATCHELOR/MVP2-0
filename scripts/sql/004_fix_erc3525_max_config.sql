-- Migration: Fix ERC3525 Max Configuration Schema Issues
-- Date: 2025-06-07
-- Purpose: Add missing database fields for ERC3525 max configuration forms
-- Analysis: MAJOR MISMATCHES - 20+ advanced semi-fungible token features missing

-- 1. Add missing core ERC3525 advanced features identified in analysis
ALTER TABLE public.token_erc3525_properties 
ADD COLUMN IF NOT EXISTS auto_unit_calculation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_slot_properties JSONB,
ADD COLUMN IF NOT EXISTS slot_enumeration_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS value_aggregation_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS permissioning_advanced BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS slot_transfer_restrictions JSONB,
ADD COLUMN IF NOT EXISTS value_transfer_restrictions JSONB;

-- 2. Add missing financial instrument features (core to ERC3525 use cases)
ALTER TABLE public.token_erc3525_properties 
ADD COLUMN IF NOT EXISTS financial_instrument_type TEXT, -- bond, loan, equity, derivative
ADD COLUMN IF NOT EXISTS principal_amount TEXT,
ADD COLUMN IF NOT EXISTS interest_rate TEXT,
ADD COLUMN IF NOT EXISTS maturity_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS coupon_frequency TEXT, -- monthly, quarterly, annually
ADD COLUMN IF NOT EXISTS payment_schedule JSONB,
ADD COLUMN IF NOT EXISTS early_redemption_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS redemption_penalty_rate TEXT;

-- 3. Add missing derivative and structured product features
ALTER TABLE public.token_erc3525_properties 
ADD COLUMN IF NOT EXISTS derivative_type TEXT, -- option, future, swap, forward
ADD COLUMN IF NOT EXISTS underlying_asset TEXT,
ADD COLUMN IF NOT EXISTS underlying_asset_address TEXT,
ADD COLUMN IF NOT EXISTS strike_price TEXT,
ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS settlement_type TEXT, -- cash, physical
ADD COLUMN IF NOT EXISTS margin_requirements JSONB,
ADD COLUMN IF NOT EXISTS leverage_ratio TEXT;

-- 4. Add missing slot management and configuration
ALTER TABLE public.token_erc3525_properties 
ADD COLUMN IF NOT EXISTS slot_creation_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS dynamic_slot_creation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS slot_admin_roles TEXT[],
ADD COLUMN IF NOT EXISTS slot_freeze_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS slot_merge_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS slot_split_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cross_slot_transfers BOOLEAN DEFAULT false;

-- 5. Add missing value computation and calculation features
ALTER TABLE public.token_erc3525_properties 
ADD COLUMN IF NOT EXISTS value_computation_method TEXT, -- fixed, calculated, oracle
ADD COLUMN IF NOT EXISTS value_oracle_address TEXT,
ADD COLUMN IF NOT EXISTS value_calculation_formula TEXT,
ADD COLUMN IF NOT EXISTS accrual_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accrual_rate TEXT,
ADD COLUMN IF NOT EXISTS accrual_frequency TEXT, -- daily, monthly, compound
ADD COLUMN IF NOT EXISTS value_adjustment_enabled BOOLEAN DEFAULT false;

-- 6. Add missing marketplace and trading features specific to ERC3525
ALTER TABLE public.token_erc3525_properties 
ADD COLUMN IF NOT EXISTS slot_marketplace_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS value_marketplace_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS partial_value_trading BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS minimum_trade_value TEXT,
ADD COLUMN IF NOT EXISTS trading_fees_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trading_fee_percentage TEXT,
ADD COLUMN IF NOT EXISTS market_maker_enabled BOOLEAN DEFAULT false;

-- 7. Add missing governance and voting features for semi-fungible tokens
ALTER TABLE public.token_erc3525_properties 
ADD COLUMN IF NOT EXISTS slot_voting_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS value_weighted_voting BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS voting_power_calculation TEXT, -- per_token, per_value, hybrid
ADD COLUMN IF NOT EXISTS quorum_calculation_method TEXT, -- slot_based, value_based
ADD COLUMN IF NOT EXISTS proposal_value_threshold TEXT,
ADD COLUMN IF NOT EXISTS delegate_enabled BOOLEAN DEFAULT false;

-- 8. Add missing utility and DeFi integration features
ALTER TABLE public.token_erc3525_properties 
ADD COLUMN IF NOT EXISTS yield_farming_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS liquidity_provision_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS staking_yield_rate TEXT,
ADD COLUMN IF NOT EXISTS compound_interest_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flash_loan_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS collateral_factor TEXT,
ADD COLUMN IF NOT EXISTS liquidation_threshold TEXT;

-- 9. Add missing compliance and regulatory features
ALTER TABLE public.token_erc3525_properties 
ADD COLUMN IF NOT EXISTS regulatory_compliance_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS kyc_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accredited_investor_only BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS geographic_restrictions TEXT[],
ADD COLUMN IF NOT EXISTS holding_period_restrictions INTEGER, -- days
ADD COLUMN IF NOT EXISTS transfer_limits JSONB,
ADD COLUMN IF NOT EXISTS reporting_requirements JSONB;

-- 10. Add missing enterprise and institutional features
ALTER TABLE public.token_erc3525_properties 
ADD COLUMN IF NOT EXISTS multi_signature_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approval_workflow_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS institutional_custody_support BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS audit_trail_enhanced BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS batch_operations_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS emergency_pause_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recovery_mechanisms JSONB;

-- 11. Enhance existing JSONB fields with proper validation

-- Update sales_config for ERC3525-specific structure
ALTER TABLE public.token_erc3525_properties 
ADD CONSTRAINT sales_config_erc3525_check 
CHECK (
  sales_config IS NULL OR (
    jsonb_typeof(sales_config) = 'object' AND
    (sales_config ? 'enabled') AND
    (sales_config->'enabled')::text IN ('true', 'false')
  )
);

-- Update slot_transfer_validation with enhanced structure
ALTER TABLE public.token_erc3525_properties 
ADD CONSTRAINT slot_transfer_validation_enhanced_check 
CHECK (
  slot_transfer_validation IS NULL OR (
    jsonb_typeof(slot_transfer_validation) = 'object' AND
    (slot_transfer_validation ? 'rules')
  )
);

-- 12. Create performance indexes on new fields
CREATE INDEX IF NOT EXISTS idx_erc3525_financial_instrument ON token_erc3525_properties(financial_instrument_type);
CREATE INDEX IF NOT EXISTS idx_erc3525_maturity_date ON token_erc3525_properties(maturity_date);
CREATE INDEX IF NOT EXISTS idx_erc3525_derivative_type ON token_erc3525_properties(derivative_type);
CREATE INDEX IF NOT EXISTS idx_erc3525_expiration_date ON token_erc3525_properties(expiration_date);
CREATE INDEX IF NOT EXISTS idx_erc3525_slot_marketplace ON token_erc3525_properties(slot_marketplace_enabled);
CREATE INDEX IF NOT EXISTS idx_erc3525_yield_farming ON token_erc3525_properties(yield_farming_enabled);
CREATE INDEX IF NOT EXISTS idx_erc3525_compliance ON token_erc3525_properties(regulatory_compliance_enabled);

-- 13. Add comprehensive comments for new fields
COMMENT ON COLUMN public.token_erc3525_properties.financial_instrument_type IS 'Type of financial instrument: bond, loan, equity, derivative';
COMMENT ON COLUMN public.token_erc3525_properties.auto_unit_calculation IS 'Whether token values are automatically calculated';
COMMENT ON COLUMN public.token_erc3525_properties.slot_creation_enabled IS 'Whether new slots can be dynamically created';
COMMENT ON COLUMN public.token_erc3525_properties.value_aggregation_enabled IS 'Whether token values can be aggregated across slots';
COMMENT ON COLUMN public.token_erc3525_properties.partial_value_trading IS 'Whether partial token values can be traded';
COMMENT ON COLUMN public.token_erc3525_properties.yield_farming_enabled IS 'Whether tokens can be used for yield farming';
COMMENT ON COLUMN public.token_erc3525_properties.regulatory_compliance_enabled IS 'Whether tokens are subject to regulatory compliance';

-- 14. Create supporting table for slot configurations (enhanced)
CREATE TABLE IF NOT EXISTS public.token_erc3525_slot_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  slot_id TEXT NOT NULL,
  slot_name TEXT,
  slot_description TEXT,
  value_units TEXT,
  slot_type TEXT, -- financial, utility, gaming, membership
  transferable BOOLEAN DEFAULT true,
  tradeable BOOLEAN DEFAULT true,
  divisible BOOLEAN DEFAULT true,
  min_value TEXT,
  max_value TEXT,
  value_precision INTEGER DEFAULT 18,
  slot_properties JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(token_id, slot_id)
);

-- 15. Create supporting table for payment schedules (financial instruments)
CREATE TABLE IF NOT EXISTS public.token_erc3525_payment_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  slot_id TEXT NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_amount TEXT NOT NULL,
  payment_type TEXT NOT NULL, -- interest, principal, coupon
  currency TEXT DEFAULT 'USD',
  is_completed BOOLEAN DEFAULT false,
  transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 16. Create supporting table for value adjustments and accruals
CREATE TABLE IF NOT EXISTS public.token_erc3525_value_adjustments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  slot_id TEXT NOT NULL,
  adjustment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  adjustment_type TEXT NOT NULL, -- accrual, markdown, writeoff, revaluation
  adjustment_amount TEXT NOT NULL,
  adjustment_reason TEXT,
  oracle_price TEXT,
  oracle_source TEXT,
  approved_by TEXT,
  transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 17. Update the ERC3525 view to include critical new fields
DROP VIEW IF EXISTS public.token_erc3525_view;
CREATE VIEW public.token_erc3525_view AS
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
  p.id AS erc3525_property_id,
  p.value_decimals,
  p.base_uri,
  p.metadata_storage,
  p.slot_type,
  p.is_burnable,
  p.is_pausable,
  p.has_royalty,
  p.royalty_percentage,
  p.royalty_receiver,
  p.slot_approvals,
  p.value_approvals,
  p.access_control,
  p.updatable_uris,
  p.updatable_slots,
  p.value_transfers_enabled,
  p.sales_config,
  p.mergable,
  p.splittable,
  p.slot_transfer_validation,
  p.dynamic_metadata,
  p.allows_slot_enumeration,
  p.value_aggregation,
  p.permissioning_enabled,
  p.supply_tracking,
  p.updatable_values,
  p.fractional_ownership_enabled,
  -- NEW FINANCIAL FIELDS
  p.financial_instrument_type,
  p.principal_amount,
  p.interest_rate,
  p.maturity_date,
  p.coupon_frequency,
  p.early_redemption_enabled,
  -- NEW DERIVATIVE FIELDS  
  p.derivative_type,
  p.underlying_asset,
  p.strike_price,
  p.expiration_date,
  p.settlement_type,
  -- NEW SLOT MANAGEMENT
  p.slot_creation_enabled,
  p.dynamic_slot_creation,
  p.cross_slot_transfers,
  -- NEW VALUE FEATURES
  p.value_computation_method,
  p.accrual_enabled,
  p.accrual_rate,
  p.partial_value_trading,
  p.minimum_trade_value,
  -- NEW DEFI FEATURES
  p.yield_farming_enabled,
  p.liquidity_provision_enabled,
  p.compound_interest_enabled,
  p.flash_loan_enabled,
  -- NEW COMPLIANCE
  p.regulatory_compliance_enabled,
  p.kyc_required,
  p.accredited_investor_only,
  p.created_at AS property_created_at,
  p.updated_at AS property_updated_at
FROM public.tokens t
LEFT JOIN public.token_erc3525_properties p ON t.id = p.token_id
WHERE t.standard = 'ERC-3525'::public.token_standard_enum;

-- Success message
SELECT 'ERC3525 max configuration schema migration completed successfully' AS result;
