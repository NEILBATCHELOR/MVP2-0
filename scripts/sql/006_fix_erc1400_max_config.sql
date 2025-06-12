-- Migration: ERC1400 Max Configuration Schema Enhancements
-- Date: 2025-06-07
-- Purpose: Add missing enterprise-grade fields for ERC1400 max configuration
-- Analysis: ERC1400 has best alignment but still missing advanced institutional features

-- Note: ERC1400 already has excellent coverage (45+ fields + 5 supporting tables)
-- This migration adds the remaining advanced enterprise/institutional features

-- 1. Add advanced institutional and enterprise features
ALTER TABLE public.token_erc1400_properties 
ADD COLUMN IF NOT EXISTS institutional_grade BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custody_integration_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prime_brokerage_support BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS settlement_integration TEXT, -- dvp, t_plus_1, t_plus_2, instant
ADD COLUMN IF NOT EXISTS clearing_house_integration BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS central_securities_depository_integration BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS third_party_custody_addresses TEXT[], -- array of approved custody addresses
ADD COLUMN IF NOT EXISTS institutional_wallet_support BOOLEAN DEFAULT false;

-- 2. Add advanced compliance automation and monitoring
ALTER TABLE public.token_erc1400_properties 
ADD COLUMN IF NOT EXISTS real_time_compliance_monitoring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS automated_sanctions_screening BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pep_screening_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS aml_monitoring_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS transaction_monitoring_rules JSONB,
ADD COLUMN IF NOT EXISTS suspicious_activity_reporting BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS compliance_officer_notifications BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS regulatory_reporting_automation BOOLEAN DEFAULT false;

-- 3. Add enhanced corporate actions and treasury management
ALTER TABLE public.token_erc1400_properties 
ADD COLUMN IF NOT EXISTS advanced_corporate_actions BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stock_splits_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stock_dividends_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rights_offerings_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS spin_offs_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mergers_acquisitions_support BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS treasury_management_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS buyback_programs_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS share_repurchase_automation BOOLEAN DEFAULT false;

-- 4. Add advanced governance and voting features
ALTER TABLE public.token_erc1400_properties 
ADD COLUMN IF NOT EXISTS advanced_governance_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS proxy_voting_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cumulative_voting_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS weighted_voting_by_class BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS quorum_requirements JSONB, -- different quorum by proposal type
ADD COLUMN IF NOT EXISTS voting_delegation_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS institutional_voting_services BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS board_election_support BOOLEAN DEFAULT false;

-- 5. Add cross-border and multi-jurisdiction features
ALTER TABLE public.token_erc1400_properties 
ADD COLUMN IF NOT EXISTS cross_border_trading_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS multi_jurisdiction_compliance BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS passport_regime_support BOOLEAN DEFAULT false, -- EU passport, etc.
ADD COLUMN IF NOT EXISTS treaty_benefits_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS withholding_tax_automation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS currency_hedging_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS foreign_ownership_restrictions JSONB,
ADD COLUMN IF NOT EXISTS regulatory_equivalence_mapping JSONB;

-- 6. Add advanced reporting and analytics features
ALTER TABLE public.token_erc1400_properties 
ADD COLUMN IF NOT EXISTS enhanced_reporting_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS real_time_shareholder_registry BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS beneficial_ownership_tracking BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS position_reconciliation_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS regulatory_filing_automation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS audit_trail_comprehensive BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS performance_analytics_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS esg_reporting_enabled BOOLEAN DEFAULT false;

-- 7. Add integration and interoperability features
ALTER TABLE public.token_erc1400_properties 
ADD COLUMN IF NOT EXISTS traditional_finance_integration BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS swift_integration_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS iso20022_messaging_support BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS financial_data_vendor_integration BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS market_data_feeds_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS price_discovery_mechanisms JSONB,
ADD COLUMN IF NOT EXISTS cross_chain_bridge_support BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS layer2_scaling_support BOOLEAN DEFAULT false;

-- 8. Add risk management and security features
ALTER TABLE public.token_erc1400_properties 
ADD COLUMN IF NOT EXISTS advanced_risk_management BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS position_limits_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS concentration_limits JSONB,
ADD COLUMN IF NOT EXISTS stress_testing_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS margin_requirements_dynamic BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS collateral_management_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS insurance_coverage_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS disaster_recovery_enabled BOOLEAN DEFAULT false;

-- 9. Enhanced JSONB validation for ERC1400-specific structures
ALTER TABLE public.token_erc1400_properties 
ADD CONSTRAINT transfer_restrictions_erc1400_check 
CHECK (
  transfer_restrictions IS NULL OR (
    jsonb_typeof(transfer_restrictions) = 'object' AND
    (transfer_restrictions ? 'enabled')
  )
);

ALTER TABLE public.token_erc1400_properties 
ADD CONSTRAINT kyc_settings_erc1400_check 
CHECK (
  kyc_settings IS NULL OR (
    jsonb_typeof(kyc_settings) = 'object' AND
    (kyc_settings ? 'required')
  )
);

ALTER TABLE public.token_erc1400_properties 
ADD CONSTRAINT compliance_settings_erc1400_check 
CHECK (
  compliance_settings IS NULL OR (
    jsonb_typeof(compliance_settings) = 'object' AND
    (compliance_settings ? 'automationLevel')
  )
);

-- 10. Create indexes for performance on new enterprise fields
CREATE INDEX IF NOT EXISTS idx_erc1400_institutional_grade ON token_erc1400_properties(institutional_grade);
CREATE INDEX IF NOT EXISTS idx_erc1400_custody_integration ON token_erc1400_properties(custody_integration_enabled);
CREATE INDEX IF NOT EXISTS idx_erc1400_compliance_monitoring ON token_erc1400_properties(real_time_compliance_monitoring);
CREATE INDEX IF NOT EXISTS idx_erc1400_cross_border ON token_erc1400_properties(cross_border_trading_enabled);
CREATE INDEX IF NOT EXISTS idx_erc1400_advanced_governance ON token_erc1400_properties(advanced_governance_enabled);
CREATE INDEX IF NOT EXISTS idx_erc1400_traditional_finance ON token_erc1400_properties(traditional_finance_integration);

-- 11. Add comments for new enterprise features
COMMENT ON COLUMN public.token_erc1400_properties.institutional_grade IS 'Whether token meets institutional investment standards';
COMMENT ON COLUMN public.token_erc1400_properties.custody_integration_enabled IS 'Whether token supports institutional custody integration';
COMMENT ON COLUMN public.token_erc1400_properties.real_time_compliance_monitoring IS 'Whether real-time compliance monitoring is active';
COMMENT ON COLUMN public.token_erc1400_properties.advanced_corporate_actions IS 'Whether advanced corporate actions are supported';
COMMENT ON COLUMN public.token_erc1400_properties.cross_border_trading_enabled IS 'Whether cross-border trading is enabled';
COMMENT ON COLUMN public.token_erc1400_properties.traditional_finance_integration IS 'Whether integration with traditional finance systems is enabled';

-- 12. Create supporting table for institutional custody providers
CREATE TABLE IF NOT EXISTS public.token_erc1400_custody_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL, -- prime_broker, custodian, clearing_house
  provider_address TEXT,
  provider_lei TEXT, -- Legal Entity Identifier
  custody_agreement_hash TEXT,
  is_active BOOLEAN DEFAULT true,
  certification_level TEXT, -- tier1, tier2, tier3
  jurisdiction TEXT,
  regulatory_approvals TEXT[],
  integration_status TEXT DEFAULT 'pending', -- pending, active, suspended
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 13. Create supporting table for regulatory filings and reporting
CREATE TABLE IF NOT EXISTS public.token_erc1400_regulatory_filings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  filing_type TEXT NOT NULL, -- form_d, form_10k, form_8k, prospectus
  filing_date DATE NOT NULL,
  filing_jurisdiction TEXT NOT NULL,
  filing_reference TEXT,
  document_hash TEXT,
  document_uri TEXT,
  regulatory_body TEXT, -- sec, finra, mifid, etc.
  compliance_status TEXT DEFAULT 'pending', -- pending, submitted, approved, rejected
  due_date DATE,
  auto_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 14. Create supporting table for corporate actions tracking
CREATE TABLE IF NOT EXISTS public.token_erc1400_corporate_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- dividend, split, merger, spin_off, rights_offering
  announcement_date DATE NOT NULL,
  record_date DATE,
  effective_date DATE,
  payment_date DATE,
  action_details JSONB NOT NULL,
  impact_on_supply TEXT,
  impact_on_price TEXT,
  shareholder_approval_required BOOLEAN DEFAULT false,
  voting_deadline DATE,
  regulatory_approval_required BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'announced', -- announced, approved, executed, cancelled
  execution_transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 15. Update the ERC1400 view to include new enterprise fields
DROP VIEW IF EXISTS public.token_erc1400_view;
CREATE VIEW public.token_erc1400_view AS
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
  p.id AS erc1400_property_id,
  p.initial_supply,
  p.cap,
  p.is_mintable,
  p.is_burnable,
  p.is_pausable,
  p.document_uri,
  p.document_hash,
  p.controller_address,
  p.require_kyc,
  p.security_type,
  p.issuing_jurisdiction,
  p.issuing_entity_name,
  p.issuing_entity_lei,
  p.transfer_restrictions,
  p.kyc_settings,
  p.compliance_settings,
  p.forced_transfers,
  p.issuance_modules,
  p.document_management,
  p.recovery_mechanism,
  p.regulation_type,
  p.is_multi_class,
  p.tranche_transferability,
  p.token_details,
  p.legal_terms,
  p.prospectus,
  p.enforce_kyc,
  p.forced_redemption_enabled,
  p.whitelist_enabled,
  p.holding_period,
  p.max_investor_count,
  p.investor_accreditation,
  p.auto_compliance,
  p.manual_approvals,
  p.compliance_module,
  p.is_issuable,
  p.granular_control,
  p.dividend_distribution,
  p.corporate_actions,
  p.custom_features,
  p.geographic_restrictions,
  p.compliance_automation_level,
  -- NEW ENTERPRISE FIELDS
  p.institutional_grade,
  p.custody_integration_enabled,
  p.prime_brokerage_support,
  p.settlement_integration,
  p.real_time_compliance_monitoring,
  p.automated_sanctions_screening,
  p.aml_monitoring_enabled,
  p.advanced_corporate_actions,
  p.stock_splits_enabled,
  p.treasury_management_enabled,
  p.advanced_governance_enabled,
  p.proxy_voting_enabled,
  p.cross_border_trading_enabled,
  p.multi_jurisdiction_compliance,
  p.enhanced_reporting_enabled,
  p.beneficial_ownership_tracking,
  p.traditional_finance_integration,
  p.swift_integration_enabled,
  p.iso20022_messaging_support,
  p.advanced_risk_management,
  p.insurance_coverage_enabled,
  p.created_at AS property_created_at,
  p.updated_at AS property_updated_at
FROM public.tokens t
LEFT JOIN public.token_erc1400_properties p ON t.id = p.token_id
WHERE t.standard = 'ERC-1400'::public.token_standard_enum;

-- Success message
SELECT 'ERC1400 max configuration schema enhancements completed successfully' AS result,
       'Added 40+ enterprise-grade fields + 3 supporting tables' AS summary;
