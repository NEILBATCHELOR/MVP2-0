-- Migration: Comprehensive Geographic Restrictions System
-- Date: 2025-06-07
-- Purpose: Standardize and enhance geographic restrictions across all token standards
-- Analysis: Current implementation is inconsistent and lacks critical compliance features

-- 1. Create master countries/jurisdictions reference table
CREATE TABLE IF NOT EXISTS public.geographic_jurisdictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code CHAR(2) NOT NULL UNIQUE, -- ISO 3166-1 alpha-2
  country_code_3 CHAR(3) NOT NULL UNIQUE, -- ISO 3166-1 alpha-3
  country_name TEXT NOT NULL,
  region TEXT NOT NULL, -- europe, north_america, asia_pacific, etc.
  regulatory_regime TEXT, -- mifid, sec, cftc, etc.
  sanctions_risk_level TEXT DEFAULT 'low', -- low, medium, high, prohibited
  fatf_compliance_status TEXT DEFAULT 'compliant', -- compliant, non_compliant, enhanced_due_diligence
  tax_treaty_status TEXT, -- comprehensive, limited, none
  kyc_requirements_level TEXT DEFAULT 'standard', -- minimal, standard, enhanced
  aml_risk_rating TEXT DEFAULT 'low', -- low, medium, high
  is_ofac_sanctioned BOOLEAN DEFAULT false,
  is_eu_sanctioned BOOLEAN DEFAULT false,
  is_un_sanctioned BOOLEAN DEFAULT false,
  offshore_financial_center BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create geographic restriction rules table (applies to all token standards)
CREATE TABLE IF NOT EXISTS public.token_geographic_restrictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  restriction_type TEXT NOT NULL, -- blocked, allowed, limited, enhanced_dd
  country_code CHAR(2) NOT NULL REFERENCES public.geographic_jurisdictions(country_code),
  max_ownership_percentage NUMERIC(5,2), -- for limited restrictions
  min_investment_amount TEXT, -- minimum investment for this jurisdiction
  max_investment_amount TEXT, -- maximum investment for this jurisdiction
  requires_local_custodian BOOLEAN DEFAULT false,
  requires_tax_clearance BOOLEAN DEFAULT false,
  requires_regulatory_approval BOOLEAN DEFAULT false,
  holding_period_restriction INTEGER, -- days
  transfer_restrictions JSONB, -- complex transfer rules
  reporting_requirements JSONB, -- jurisdiction-specific reporting
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE, -- NULL = permanent
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_ownership_percentage CHECK (max_ownership_percentage >= 0 AND max_ownership_percentage <= 100),
  CONSTRAINT valid_restriction_type CHECK (restriction_type IN ('blocked', 'allowed', 'limited', 'enhanced_dd', 'conditional')),
  UNIQUE(token_id, country_code) -- One rule per country per token
);

-- 3. Create sanctions screening rules table
CREATE TABLE IF NOT EXISTS public.token_sanctions_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  sanctions_regime TEXT NOT NULL, -- ofac, eu, un, uk_hmt, etc.
  screening_enabled BOOLEAN DEFAULT true,
  auto_block_sanctioned_entities BOOLEAN DEFAULT true,
  enhanced_due_diligence_required BOOLEAN DEFAULT false,
  manual_review_threshold TEXT, -- transaction amount requiring manual review
  screening_frequency TEXT DEFAULT 'real_time', -- real_time, daily, weekly
  whitelist_override_allowed BOOLEAN DEFAULT false,
  last_screening_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Create regulatory equivalence mapping table
CREATE TABLE IF NOT EXISTS public.regulatory_equivalence_mapping (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_jurisdiction CHAR(2) NOT NULL REFERENCES public.geographic_jurisdictions(country_code),
  equivalent_jurisdiction CHAR(2) NOT NULL REFERENCES public.geographic_jurisdictions(country_code),
  equivalence_type TEXT NOT NULL, -- full, conditional, limited, none
  regulatory_framework TEXT NOT NULL, -- securities, banking, aml, tax
  recognition_date DATE NOT NULL,
  expiry_date DATE,
  mutual_recognition BOOLEAN DEFAULT false,
  passport_rights BOOLEAN DEFAULT false, -- EU passport, ASEAN passport, etc.
  simplified_procedures BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(home_jurisdiction, equivalent_jurisdiction, regulatory_framework)
);

-- 5. Update all token properties tables to use standardized geographic restrictions

-- Remove inconsistent geographic fields and add foreign key reference
ALTER TABLE public.token_erc1400_properties 
DROP COLUMN IF EXISTS foreign_ownership_restrictions, -- Remove duplicate from enhancement
ADD COLUMN IF NOT EXISTS use_geographic_restrictions BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS default_restriction_policy TEXT DEFAULT 'blocked'; -- blocked, allowed

-- Add geographic restrictions support to other ERC standards
ALTER TABLE public.token_erc20_properties 
ADD COLUMN IF NOT EXISTS use_geographic_restrictions BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS default_restriction_policy TEXT DEFAULT 'allowed';

ALTER TABLE public.token_erc721_properties 
ADD COLUMN IF NOT EXISTS use_geographic_restrictions BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS default_restriction_policy TEXT DEFAULT 'allowed';

ALTER TABLE public.token_erc1155_properties 
ADD COLUMN IF NOT EXISTS use_geographic_restrictions BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS default_restriction_policy TEXT DEFAULT 'allowed';

ALTER TABLE public.token_erc3525_properties 
DROP COLUMN IF EXISTS geographic_restrictions, -- Remove inconsistent TEXT[] field
ADD COLUMN IF NOT EXISTS use_geographic_restrictions BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS default_restriction_policy TEXT DEFAULT 'blocked';

ALTER TABLE public.token_erc4626_properties 
ADD COLUMN IF NOT EXISTS use_geographic_restrictions BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS default_restriction_policy TEXT DEFAULT 'allowed';

-- 6. Create geographic restriction validation function
CREATE OR REPLACE FUNCTION public.validate_geographic_restriction(
  p_token_id UUID,
  p_investor_country_code CHAR(2),
  p_investment_amount NUMERIC DEFAULT NULL
) RETURNS TABLE(
  is_allowed BOOLEAN,
  restriction_type TEXT,
  max_ownership_percentage NUMERIC,
  requires_enhanced_dd BOOLEAN,
  blocking_reason TEXT
) AS $$
DECLARE
  restriction_record RECORD;
  token_record RECORD;
  jurisdiction_record RECORD;
BEGIN
  -- Get token settings
  SELECT use_geographic_restrictions, default_restriction_policy 
  INTO token_record
  FROM public.tokens t
  LEFT JOIN public.token_erc20_properties erc20 ON t.id = erc20.token_id AND t.standard = 'ERC-20'
  LEFT JOIN public.token_erc721_properties erc721 ON t.id = erc721.token_id AND t.standard = 'ERC-721'
  LEFT JOIN public.token_erc1155_properties erc1155 ON t.id = erc1155.token_id AND t.standard = 'ERC-1155'
  LEFT JOIN public.token_erc1400_properties erc1400 ON t.id = erc1400.token_id AND t.standard = 'ERC-1400'
  LEFT JOIN public.token_erc3525_properties erc3525 ON t.id = erc3525.token_id AND t.standard = 'ERC-3525'
  LEFT JOIN public.token_erc4626_properties erc4626 ON t.id = erc4626.token_id AND t.standard = 'ERC-4626'
  WHERE t.id = p_token_id;

  -- If geographic restrictions not enabled, use default policy
  IF NOT COALESCE(token_record.use_geographic_restrictions, false) THEN
    RETURN QUERY SELECT 
      CASE WHEN COALESCE(token_record.default_restriction_policy, 'allowed') = 'allowed' THEN true ELSE false END,
      'none'::TEXT,
      NULL::NUMERIC,
      false,
      CASE WHEN COALESCE(token_record.default_restriction_policy, 'allowed') = 'blocked' 
           THEN 'Geographic restrictions not configured' 
           ELSE NULL END;
    RETURN;
  END IF;

  -- Get jurisdiction info
  SELECT sanctions_risk_level, is_ofac_sanctioned, is_eu_sanctioned, is_un_sanctioned
  INTO jurisdiction_record
  FROM public.geographic_jurisdictions
  WHERE country_code = p_investor_country_code;

  -- Check for auto-sanctions blocking
  IF COALESCE(jurisdiction_record.is_ofac_sanctioned, false) OR 
     COALESCE(jurisdiction_record.is_eu_sanctioned, false) OR 
     COALESCE(jurisdiction_record.is_un_sanctioned, false) THEN
    RETURN QUERY SELECT 
      false,
      'blocked'::TEXT,
      NULL::NUMERIC,
      false,
      'Country is subject to international sanctions';
    RETURN;
  END IF;

  -- Check specific restriction rules
  SELECT * INTO restriction_record
  FROM public.token_geographic_restrictions
  WHERE token_id = p_token_id 
    AND country_code = p_investor_country_code
    AND (effective_date IS NULL OR effective_date <= CURRENT_DATE)
    AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE);

  -- If specific rule exists, apply it
  IF FOUND THEN
    CASE restriction_record.restriction_type
      WHEN 'blocked' THEN
        RETURN QUERY SELECT 
          false,
          'blocked'::TEXT,
          restriction_record.max_ownership_percentage,
          false,
          'Country is blocked for this token';
      WHEN 'allowed' THEN
        RETURN QUERY SELECT 
          true,
          'allowed'::TEXT,
          restriction_record.max_ownership_percentage,
          false,
          NULL::TEXT;
      WHEN 'limited' THEN
        RETURN QUERY SELECT 
          true,
          'limited'::TEXT,
          restriction_record.max_ownership_percentage,
          false,
          NULL::TEXT;
      WHEN 'enhanced_dd' THEN
        RETURN QUERY SELECT 
          true,
          'enhanced_dd'::TEXT,
          restriction_record.max_ownership_percentage,
          true,
          NULL::TEXT;
      ELSE
        RETURN QUERY SELECT 
          false,
          'unknown'::TEXT,
          NULL::NUMERIC,
          false,
          'Unknown restriction type';
    END CASE;
  ELSE
    -- No specific rule, use default policy
    RETURN QUERY SELECT 
      CASE WHEN COALESCE(token_record.default_restriction_policy, 'allowed') = 'allowed' THEN true ELSE false END,
      'default'::TEXT,
      NULL::NUMERIC,
      false,
      CASE WHEN COALESCE(token_record.default_restriction_policy, 'allowed') = 'blocked' 
           THEN 'Country not in allowed list' 
           ELSE NULL END;
  END IF;

END;
$$ LANGUAGE plpgsql;

-- 7. Insert common countries and jurisdictions
INSERT INTO public.geographic_jurisdictions (country_code, country_code_3, country_name, region, regulatory_regime, sanctions_risk_level) VALUES
('US', 'USA', 'United States', 'north_america', 'sec', 'low'),
('GB', 'GBR', 'United Kingdom', 'europe', 'fca', 'low'),
('DE', 'DEU', 'Germany', 'europe', 'mifid', 'low'),
('FR', 'FRA', 'France', 'europe', 'mifid', 'low'),
('JP', 'JPN', 'Japan', 'asia_pacific', 'jfsa', 'low'),
('SG', 'SGP', 'Singapore', 'asia_pacific', 'mas', 'low'),
('CH', 'CHE', 'Switzerland', 'europe', 'finma', 'low'),
('CA', 'CAN', 'Canada', 'north_america', 'csa', 'low'),
('AU', 'AUS', 'Australia', 'asia_pacific', 'asic', 'low'),
('HK', 'HKG', 'Hong Kong', 'asia_pacific', 'sfc', 'low'),
('CN', 'CHN', 'China', 'asia_pacific', 'csrc', 'medium'),
('RU', 'RUS', 'Russia', 'europe', 'cbr', 'high'),
('IR', 'IRN', 'Iran', 'middle_east', 'cbi', 'prohibited'),
('KP', 'PRK', 'North Korea', 'asia_pacific', 'none', 'prohibited')
ON CONFLICT (country_code) DO NOTHING;

-- 8. Update sanctioned countries
UPDATE public.geographic_jurisdictions 
SET is_ofac_sanctioned = true, is_eu_sanctioned = true, is_un_sanctioned = true
WHERE country_code IN ('IR', 'KP', 'SY', 'CU'); -- Iran, North Korea, Syria, Cuba

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_geographic_restrictions_token_country ON token_geographic_restrictions(token_id, country_code);
CREATE INDEX IF NOT EXISTS idx_geographic_restrictions_type ON token_geographic_restrictions(restriction_type);
CREATE INDEX IF NOT EXISTS idx_geographic_restrictions_effective ON token_geographic_restrictions(effective_date, expiry_date);
CREATE INDEX IF NOT EXISTS idx_jurisdictions_sanctions ON geographic_jurisdictions(is_ofac_sanctioned, is_eu_sanctioned, is_un_sanctioned);
CREATE INDEX IF NOT EXISTS idx_jurisdictions_region ON geographic_jurisdictions(region, regulatory_regime);

-- 10. Create view for easy geographic restrictions querying
CREATE OR REPLACE VIEW public.token_geographic_restrictions_view AS
SELECT 
  tgr.token_id,
  t.name AS token_name,
  t.symbol AS token_symbol,
  t.standard,
  tgr.restriction_type,
  gj.country_code,
  gj.country_name,
  gj.region,
  gj.regulatory_regime,
  tgr.max_ownership_percentage,
  tgr.requires_local_custodian,
  tgr.requires_regulatory_approval,
  gj.sanctions_risk_level,
  gj.is_ofac_sanctioned,
  gj.is_eu_sanctioned,
  gj.is_un_sanctioned,
  tgr.effective_date,
  tgr.expiry_date,
  tgr.notes
FROM public.token_geographic_restrictions tgr
JOIN public.tokens t ON tgr.token_id = t.id
JOIN public.geographic_jurisdictions gj ON tgr.country_code = gj.country_code
WHERE (tgr.effective_date IS NULL OR tgr.effective_date <= CURRENT_DATE)
  AND (tgr.expiry_date IS NULL OR tgr.expiry_date > CURRENT_DATE);

-- 11. Add comments for documentation
COMMENT ON TABLE public.geographic_jurisdictions IS 'Master reference table for countries and their regulatory/compliance characteristics';
COMMENT ON TABLE public.token_geographic_restrictions IS 'Token-specific geographic restrictions and compliance rules';
COMMENT ON TABLE public.token_sanctions_rules IS 'Sanctions screening configuration per token';
COMMENT ON FUNCTION public.validate_geographic_restriction IS 'Validates if an investor from a specific country can invest in a token';

-- Success message
SELECT 'Comprehensive geographic restrictions system created successfully' AS result,
       'Standardized across all ERC standards with sanctions compliance' AS summary;
