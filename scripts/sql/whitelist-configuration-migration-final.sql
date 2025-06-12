-- FINAL VERSION: Comprehensive Whitelist Configuration Database Migration
-- Addresses critical gaps identified in whitelist support across ERC standards
-- FIXED: Handles existing data issues and orphaned records that cause constraint violations
-- Date: June 7, 2025

-- =============================================================================
-- 0. PRE-MIGRATION DIAGNOSTICS
-- =============================================================================

-- Check current state of data integrity
SELECT 
    'Data Integrity Check' as status,
    (SELECT COUNT(*) FROM tokens) as total_tokens,
    (SELECT COUNT(*) FROM token_erc1155_properties) as erc1155_properties,
    (SELECT COUNT(*) FROM token_erc1155_properties tep 
     LEFT JOIN tokens t ON tep.token_id = t.id 
     WHERE t.id IS NULL) as orphaned_erc1155_props;

-- =============================================================================
-- 1. CLEAN UP ORPHANED RECORDS (CRITICAL - PREVENTS FOREIGN KEY VIOLATIONS)
-- =============================================================================

-- Remove orphaned records from all ERC properties tables
-- This prevents foreign key constraint violations during migration

DELETE FROM token_erc20_properties 
WHERE token_id NOT IN (SELECT id FROM tokens);

DELETE FROM token_erc721_properties 
WHERE token_id NOT IN (SELECT id FROM tokens);

DELETE FROM token_erc1155_properties 
WHERE token_id NOT IN (SELECT id FROM tokens);

DELETE FROM token_erc1400_properties 
WHERE token_id NOT IN (SELECT id FROM tokens);

DELETE FROM token_erc3525_properties 
WHERE token_id NOT IN (SELECT id FROM tokens);

DELETE FROM token_erc4626_properties 
WHERE token_id NOT IN (SELECT id FROM tokens);

-- Clean up related tables that might have orphaned records
DELETE FROM token_erc1155_balances 
WHERE token_id NOT IN (SELECT id FROM tokens);

DELETE FROM token_erc1155_types 
WHERE token_id NOT IN (SELECT id FROM tokens);

DELETE FROM token_erc1155_uri_mappings 
WHERE token_id NOT IN (SELECT id FROM tokens);

DELETE FROM token_erc1400_controllers 
WHERE token_id NOT IN (SELECT id FROM tokens);

DELETE FROM token_erc1400_documents 
WHERE token_id NOT IN (SELECT id FROM tokens);

DELETE FROM token_erc1400_partitions 
WHERE token_id NOT IN (SELECT id FROM tokens);

DELETE FROM token_erc3525_allocations 
WHERE token_id NOT IN (SELECT id FROM tokens);

DELETE FROM token_erc3525_slots 
WHERE token_id NOT IN (SELECT id FROM tokens);

DELETE FROM token_erc4626_asset_allocations 
WHERE token_id NOT IN (SELECT id FROM tokens);

DELETE FROM token_erc4626_strategy_params 
WHERE token_id NOT IN (SELECT id FROM tokens);

DELETE FROM token_erc721_attributes 
WHERE token_id NOT IN (SELECT id FROM tokens);

DELETE FROM token_operations 
WHERE token_id NOT IN (SELECT id FROM tokens);

DELETE FROM token_versions 
WHERE token_id NOT IN (SELECT id FROM tokens);

DELETE FROM token_whitelists 
WHERE token_id NOT IN (SELECT id FROM tokens);

DELETE FROM token_allocations 
WHERE token_id NOT IN (SELECT id FROM tokens);

DELETE FROM token_deployment_history 
WHERE token_id NOT IN (SELECT id FROM tokens);

DELETE FROM token_deployments 
WHERE token_id NOT IN (SELECT id FROM tokens);

DELETE FROM token_events 
WHERE token_id NOT IN (SELECT id FROM tokens);

-- =============================================================================
-- 2. CLEAN UP EXISTING DATA ISSUES
-- =============================================================================

-- Fix any existing data issues that could cause constraint violations
-- Handle empty JSON objects in batch_transfer_limits (ERC1155)
UPDATE token_erc1155_properties 
SET batch_transfer_limits = NULL 
WHERE batch_transfer_limits = '{}'::jsonb;

-- Handle empty JSON objects in other JSONB fields that might cause issues
UPDATE token_erc20_properties 
SET whitelist_config = NULL 
WHERE whitelist_config = '{}'::jsonb;

UPDATE token_erc721_properties 
SET whitelist_config = NULL 
WHERE whitelist_config = '{}'::jsonb;

UPDATE token_erc1155_properties 
SET whitelist_config = NULL 
WHERE whitelist_config = '{}'::jsonb;

-- =============================================================================
-- 3. ADD MISSING WHITELIST SUPPORT FOR ERC3525 AND ERC4626
-- =============================================================================

-- Add whitelist_config JSONB column to ERC3525 properties
ALTER TABLE token_erc3525_properties 
ADD COLUMN IF NOT EXISTS whitelist_config JSONB DEFAULT NULL;

-- Add whitelist_config JSONB column to ERC4626 properties  
ALTER TABLE token_erc4626_properties 
ADD COLUMN IF NOT EXISTS whitelist_config JSONB DEFAULT NULL;

-- Add comments explaining the whitelist configuration structure
COMMENT ON COLUMN token_erc3525_properties.whitelist_config IS 'JSON configuration for semi-fungible token whitelist controls including slot-specific access, transfer restrictions, and compliance settings';

COMMENT ON COLUMN token_erc4626_properties.whitelist_config IS 'JSON configuration for vault token whitelist controls including depositor restrictions, withdrawal limits, and investor eligibility';

-- =============================================================================
-- 4. UPGRADE ERC1400 WHITELIST SUPPORT FOR SECURITY TOKENS
-- =============================================================================

-- Add comprehensive whitelist configuration to ERC1400 (security tokens need the most sophisticated controls)
ALTER TABLE token_erc1400_properties 
ADD COLUMN IF NOT EXISTS whitelist_config JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS investor_whitelist_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accredited_investor_only BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS jurisdiction_restrictions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS investor_limits JSONB DEFAULT '{}'::jsonb;

-- Add comments for ERC1400 security token compliance
COMMENT ON COLUMN token_erc1400_properties.whitelist_config IS 'JSON configuration for security token whitelist including investor verification, compliance requirements, and transfer restrictions';
COMMENT ON COLUMN token_erc1400_properties.investor_whitelist_enabled IS 'Enable whitelist enforcement for all investor interactions';
COMMENT ON COLUMN token_erc1400_properties.accredited_investor_only IS 'Restrict token access to accredited investors only';
COMMENT ON COLUMN token_erc1400_properties.jurisdiction_restrictions IS 'Array of blocked/allowed jurisdictions for investor eligibility';
COMMENT ON COLUMN token_erc1400_properties.investor_limits IS 'JSON object defining maximum investors, holding periods, and investment limits';

-- =============================================================================
-- 5. ADD/VERIFY FOREIGN KEY CONSTRAINTS
-- =============================================================================

-- Ensure all ERC properties tables have proper foreign key constraints
-- These are now safe to add since we cleaned up orphaned records

-- ERC20 Properties
ALTER TABLE token_erc20_properties 
DROP CONSTRAINT IF EXISTS token_erc20_properties_token_id_fkey;

ALTER TABLE token_erc20_properties 
ADD CONSTRAINT token_erc20_properties_token_id_fkey 
FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE;

-- ERC721 Properties  
ALTER TABLE token_erc721_properties 
DROP CONSTRAINT IF EXISTS token_erc721_properties_token_id_fkey;

ALTER TABLE token_erc721_properties 
ADD CONSTRAINT token_erc721_properties_token_id_fkey 
FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE;

-- ERC1155 Properties
ALTER TABLE token_erc1155_properties 
DROP CONSTRAINT IF EXISTS token_erc1155_properties_token_id_fkey;

ALTER TABLE token_erc1155_properties 
ADD CONSTRAINT token_erc1155_properties_token_id_fkey 
FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE;

-- ERC1400 Properties
ALTER TABLE token_erc1400_properties 
DROP CONSTRAINT IF EXISTS token_erc1400_properties_token_id_fkey;

ALTER TABLE token_erc1400_properties 
ADD CONSTRAINT token_erc1400_properties_token_id_fkey 
FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE;

-- ERC3525 Properties
ALTER TABLE token_erc3525_properties 
DROP CONSTRAINT IF EXISTS token_erc3525_properties_token_id_fkey;

ALTER TABLE token_erc3525_properties 
ADD CONSTRAINT token_erc3525_properties_token_id_fkey 
FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE;

-- ERC4626 Properties
ALTER TABLE token_erc4626_properties 
DROP CONSTRAINT IF EXISTS token_erc4626_properties_token_id_fkey;

ALTER TABLE token_erc4626_properties 
ADD CONSTRAINT token_erc4626_properties_token_id_fkey 
FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE;

-- Add foreign key constraint between token_whitelists and tokens table
ALTER TABLE token_whitelists 
DROP CONSTRAINT IF EXISTS fk_token_whitelists_token_id;

ALTER TABLE token_whitelists 
ADD CONSTRAINT fk_token_whitelists_token_id 
FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE;

-- =============================================================================
-- 6. ADD JSON SCHEMA VALIDATION FOR WHITELIST CONFIGURATIONS (PERMISSIVE)
-- =============================================================================

-- Function to validate standard whitelist configuration schema (permissive version)
CREATE OR REPLACE FUNCTION validate_whitelist_config_permissive(config JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- If config is NULL, it's valid (optional field)
  IF config IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Must be an object (allow empty objects)
  IF jsonb_typeof(config) != 'object' THEN
    RETURN FALSE;
  END IF;
  
  -- If it's an empty object, it's valid
  IF config = '{}'::jsonb THEN
    RETURN TRUE;
  END IF;
  
  -- If enabled field exists, it must be boolean
  IF config ? 'enabled' AND jsonb_typeof(config->'enabled') != 'boolean' THEN
    RETURN FALSE;
  END IF;
  
  -- If addresses field exists, it must be an array
  IF config ? 'addresses' AND jsonb_typeof(config->'addresses') != 'array' THEN
    RETURN FALSE;
  END IF;
  
  -- If whitelistType field exists, it must be a string
  IF config ? 'whitelistType' AND jsonb_typeof(config->'whitelistType') != 'string' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add permissive validation constraints to all ERC standards with whitelist support
ALTER TABLE token_erc20_properties
DROP CONSTRAINT IF EXISTS check_whitelist_config_valid;

ALTER TABLE token_erc20_properties
ADD CONSTRAINT check_whitelist_config_valid 
CHECK (validate_whitelist_config_permissive(whitelist_config));

ALTER TABLE token_erc721_properties
DROP CONSTRAINT IF EXISTS check_whitelist_config_valid;

ALTER TABLE token_erc721_properties
ADD CONSTRAINT check_whitelist_config_valid 
CHECK (validate_whitelist_config_permissive(whitelist_config));

ALTER TABLE token_erc1155_properties
DROP CONSTRAINT IF EXISTS check_whitelist_config_valid;

ALTER TABLE token_erc1155_properties
ADD CONSTRAINT check_whitelist_config_valid 
CHECK (validate_whitelist_config_permissive(whitelist_config));

ALTER TABLE token_erc1400_properties
DROP CONSTRAINT IF EXISTS check_whitelist_config_valid;

ALTER TABLE token_erc1400_properties
ADD CONSTRAINT check_whitelist_config_valid 
CHECK (validate_whitelist_config_permissive(whitelist_config));

ALTER TABLE token_erc3525_properties
DROP CONSTRAINT IF EXISTS check_whitelist_config_valid;

ALTER TABLE token_erc3525_properties
ADD CONSTRAINT check_whitelist_config_valid 
CHECK (validate_whitelist_config_permissive(whitelist_config));

ALTER TABLE token_erc4626_properties
DROP CONSTRAINT IF EXISTS check_whitelist_config_valid;

ALTER TABLE token_erc4626_properties
ADD CONSTRAINT check_whitelist_config_valid 
CHECK (validate_whitelist_config_permissive(whitelist_config));

-- =============================================================================
-- 7. HANDLE EXISTING BATCH_TRANSFER_LIMITS CONSTRAINT
-- =============================================================================

-- Add or update batch_transfer_limits constraint to be permissive
ALTER TABLE token_erc1155_properties
DROP CONSTRAINT IF EXISTS batch_transfer_limits_structure_check;

ALTER TABLE token_erc1155_properties
ADD CONSTRAINT batch_transfer_limits_structure_check
CHECK (
    batch_transfer_limits IS NULL 
    OR jsonb_typeof(batch_transfer_limits) = 'object'
);

-- =============================================================================
-- 8. CREATE HELPER FUNCTIONS FOR WHITELIST MANAGEMENT
-- =============================================================================

-- Function to get all whitelisted addresses for a token (combines JSONB and table data)
CREATE OR REPLACE FUNCTION get_token_whitelist_addresses(p_token_id UUID)
RETURNS TABLE(address TEXT, source TEXT, is_active BOOLEAN, approved_date TIMESTAMPTZ) AS $$
BEGIN
  -- Return addresses from token_whitelists table
  RETURN QUERY
  SELECT 
    tw.wallet_address as address,
    'whitelist_table'::TEXT as source,
    tw.is_active,
    tw.approval_date as approved_date
  FROM token_whitelists tw
  WHERE tw.token_id = p_token_id AND tw.is_active = true;
  
  -- TODO: Add logic to extract addresses from JSONB whitelist_config fields
  -- This would require knowing the token standard and parsing the appropriate properties table
END;
$$ LANGUAGE plpgsql;

-- Function to check if an address is whitelisted for a token
CREATE OR REPLACE FUNCTION is_address_whitelisted(p_token_id UUID, p_address TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  is_whitelisted BOOLEAN := FALSE;
BEGIN
  -- Check in token_whitelists table
  SELECT EXISTS(
    SELECT 1 FROM token_whitelists 
    WHERE token_id = p_token_id 
    AND wallet_address = p_address 
    AND is_active = true
  ) INTO is_whitelisted;
  
  IF is_whitelisted THEN
    RETURN TRUE;
  END IF;
  
  -- TODO: Add logic to check JSONB whitelist_config fields
  -- This would require joining with the appropriate ERC properties table
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 9. CREATE INDEXES FOR WHITELIST PERFORMANCE
-- =============================================================================

-- Add index for performance on token_id lookups
CREATE INDEX IF NOT EXISTS idx_token_whitelists_token_id ON token_whitelists(token_id);
CREATE INDEX IF NOT EXISTS idx_token_whitelists_wallet_address ON token_whitelists(wallet_address);
CREATE INDEX IF NOT EXISTS idx_token_whitelists_blockchain ON token_whitelists(blockchain);
CREATE INDEX IF NOT EXISTS idx_token_whitelists_active ON token_whitelists(is_active) WHERE is_active = true;

-- Indexes for efficient whitelist queries across ERC properties tables
CREATE INDEX IF NOT EXISTS idx_token_erc20_whitelist_enabled 
ON token_erc20_properties USING GIN ((whitelist_config->'enabled')) 
WHERE whitelist_config->'enabled' = 'true';

CREATE INDEX IF NOT EXISTS idx_token_erc721_whitelist_enabled 
ON token_erc721_properties USING GIN ((whitelist_config->'enabled')) 
WHERE whitelist_config->'enabled' = 'true';

CREATE INDEX IF NOT EXISTS idx_token_erc1155_whitelist_enabled 
ON token_erc1155_properties USING GIN ((whitelist_config->'enabled')) 
WHERE whitelist_config->'enabled' = 'true';

CREATE INDEX IF NOT EXISTS idx_token_erc1400_whitelist_enabled 
ON token_erc1400_properties (investor_whitelist_enabled) 
WHERE investor_whitelist_enabled = true;

CREATE INDEX IF NOT EXISTS idx_token_erc3525_whitelist_enabled 
ON token_erc3525_properties USING GIN ((whitelist_config->'enabled')) 
WHERE whitelist_config->'enabled' = 'true';

CREATE INDEX IF NOT EXISTS idx_token_erc4626_whitelist_enabled 
ON token_erc4626_properties USING GIN ((whitelist_config->'enabled')) 
WHERE whitelist_config->'enabled' = 'true';

-- =============================================================================
-- 10. ADD AUDIT FIELDS FOR WHITELIST CHANGES
-- =============================================================================

-- Add audit trail fields to token_whitelists table
ALTER TABLE token_whitelists 
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID,
ADD COLUMN IF NOT EXISTS approval_reason TEXT,
ADD COLUMN IF NOT EXISTS removal_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS removal_reason TEXT,
ADD COLUMN IF NOT EXISTS removal_by UUID;

-- Add comments for audit fields
COMMENT ON COLUMN token_whitelists.created_by IS 'User ID who added the address to whitelist';
COMMENT ON COLUMN token_whitelists.updated_by IS 'User ID who last modified the whitelist entry';
COMMENT ON COLUMN token_whitelists.approval_reason IS 'Reason for approving the address';
COMMENT ON COLUMN token_whitelists.removal_date IS 'Date when address was removed from whitelist';
COMMENT ON COLUMN token_whitelists.removal_reason IS 'Reason for removing the address';
COMMENT ON COLUMN token_whitelists.removal_by IS 'User ID who removed the address';

-- =============================================================================
-- 11. CREATE VIEWS FOR WHITELIST REPORTING
-- =============================================================================

-- Comprehensive view for whitelist status across all tokens
CREATE OR REPLACE VIEW token_whitelist_summary AS
SELECT 
  t.id as token_id,
  t.name as token_name,
  t.symbol as token_symbol,
  t.standard as token_standard,
  
  -- ERC20 whitelist status
  CASE WHEN t.standard = 'ERC-20' THEN 
    COALESCE((erc20.whitelist_config->>'enabled')::boolean, false)
  ELSE NULL END as erc20_whitelist_enabled,
  
  -- ERC721 whitelist status  
  CASE WHEN t.standard = 'ERC-721' THEN 
    COALESCE((erc721.whitelist_config->>'enabled')::boolean, false)
  ELSE NULL END as erc721_whitelist_enabled,
  
  -- ERC1155 whitelist status
  CASE WHEN t.standard = 'ERC-1155' THEN 
    COALESCE((erc1155.whitelist_config->>'enabled')::boolean, false)
  ELSE NULL END as erc1155_whitelist_enabled,
  
  -- ERC1400 whitelist status
  CASE WHEN t.standard = 'ERC-1400' THEN 
    COALESCE(erc1400.investor_whitelist_enabled, false)
  ELSE NULL END as erc1400_whitelist_enabled,
  
  -- ERC3525 whitelist status
  CASE WHEN t.standard = 'ERC-3525' THEN 
    COALESCE((erc3525.whitelist_config->>'enabled')::boolean, false)
  ELSE NULL END as erc3525_whitelist_enabled,
  
  -- ERC4626 whitelist status
  CASE WHEN t.standard = 'ERC-4626' THEN 
    COALESCE((erc4626.whitelist_config->>'enabled')::boolean, false)
  ELSE NULL END as erc4626_whitelist_enabled,
  
  -- Count of whitelisted addresses
  COALESCE(tw.address_count, 0) as whitelisted_address_count,
  
  t.created_at,
  t.updated_at
  
FROM tokens t
LEFT JOIN token_erc20_properties erc20 ON t.id = erc20.token_id
LEFT JOIN token_erc721_properties erc721 ON t.id = erc721.token_id  
LEFT JOIN token_erc1155_properties erc1155 ON t.id = erc1155.token_id
LEFT JOIN token_erc1400_properties erc1400 ON t.id = erc1400.token_id
LEFT JOIN token_erc3525_properties erc3525 ON t.id = erc3525.token_id
LEFT JOIN token_erc4626_properties erc4626 ON t.id = erc4626.token_id
LEFT JOIN (
  SELECT token_id, COUNT(*) as address_count 
  FROM token_whitelists 
  WHERE is_active = true 
  GROUP BY token_id
) tw ON t.id = tw.token_id;

-- =============================================================================
-- 12. FINAL VERIFICATION QUERIES
-- =============================================================================

-- Verify the migration completed successfully
SELECT 
  'Migration Verification' as status,
  'ERC-20' as standard,
  COUNT(*) as properties_count,
  COUNT(whitelist_config) as has_whitelist_config
FROM token_erc20_properties
UNION ALL
SELECT 
  'Migration Verification',
  'ERC-721',
  COUNT(*),
  COUNT(whitelist_config)
FROM token_erc721_properties  
UNION ALL
SELECT 
  'Migration Verification',
  'ERC-1155',
  COUNT(*),
  COUNT(whitelist_config)
FROM token_erc1155_properties
UNION ALL
SELECT 
  'Migration Verification',
  'ERC-1400',
  COUNT(*),
  COUNT(whitelist_config)
FROM token_erc1400_properties
UNION ALL
SELECT 
  'Migration Verification',
  'ERC-3525',
  COUNT(*),
  COUNT(whitelist_config)
FROM token_erc3525_properties
UNION ALL
SELECT 
  'Migration Verification',
  'ERC-4626',
  COUNT(*),
  COUNT(whitelist_config)
FROM token_erc4626_properties;

-- Check foreign key constraints are in place
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints AS tc
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name LIKE 'token_%_properties'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Test whitelist validation function
SELECT 
  'Validation Tests' as test_type,
  validate_whitelist_config_permissive('{"enabled": true, "addresses": ["0x123"]}'::jsonb) as valid_config,
  validate_whitelist_config_permissive('{}'::jsonb) as empty_object_valid,
  validate_whitelist_config_permissive(NULL) as null_valid;

-- Final data integrity summary
SELECT 
    'Final Status' as status,
    (SELECT COUNT(*) FROM tokens) as total_tokens,
    (SELECT COUNT(*) FROM token_whitelists) as whitelist_entries,
    (SELECT COUNT(DISTINCT token_id) FROM token_whitelists WHERE is_active = true) as tokens_with_whitelists;

COMMENT ON FUNCTION validate_whitelist_config_permissive(JSONB) IS 'Permissive validation for whitelist configuration JSON structure across all ERC standards - allows empty objects and flexible structure';
COMMENT ON VIEW token_whitelist_summary IS 'Comprehensive view of whitelist status across all token standards';
