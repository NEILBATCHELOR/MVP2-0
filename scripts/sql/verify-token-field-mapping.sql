-- Comprehensive Token Field Mapping Verification Script
-- Run this script to verify that all field mappings are working correctly
-- Date: June 4, 2025

-- =====================================
-- VERIFICATION QUERIES FOR ALL STANDARDS
-- =====================================

-- 1. ERC-20 Field Coverage Verification
SELECT 
  'ERC-20' as token_standard,
  COUNT(*) as total_tokens,
  COUNT(erc20.fee_on_transfer) as fee_on_transfer_count,
  COUNT(erc20.transfer_config) as transfer_config_count,
  COUNT(erc20.gas_config) as gas_config_count,
  COUNT(erc20.compliance_config) as compliance_config_count,
  COUNT(erc20.whitelist_config) as whitelist_config_count
FROM tokens t
LEFT JOIN token_erc20_properties erc20 ON t.id = erc20.token_id  
WHERE t.standard = 'ERC-20';

-- 2. ERC-721 Field Coverage Verification  
SELECT 
  'ERC-721' as token_standard,
  COUNT(*) as total_tokens,
  COUNT(CASE WHEN erc721.is_mintable = true THEN 1 END) as mintable_tokens,
  COUNT(erc721.sales_config) as sales_config_count,
  COUNT(erc721.whitelist_config) as whitelist_config_count,
  COUNT(erc721.permission_config) as permission_config_count,
  COUNT(erc721.dynamic_uri_config) as dynamic_uri_config_count,
  COUNT(erc721.batch_minting_config) as batch_minting_config_count,
  COUNT(erc721.transfer_restrictions) as transfer_restrictions_count
FROM tokens t
LEFT JOIN token_erc721_properties erc721 ON t.id = erc721.token_id
WHERE t.standard = 'ERC-721';

-- 3. ERC-1155 Critical Field Mapping Verification
SELECT 
  'ERC-1155' as token_standard,
  COUNT(*) as total_tokens,
  -- Verify critical fixes
  COUNT(CASE WHEN erc1155.batch_minting_enabled = true THEN 1 END) as batch_minting_enabled_count,
  COUNT(CASE WHEN erc1155.container_enabled = true THEN 1 END) as container_enabled_count,
  COUNT(CASE WHEN erc1155.supply_tracking = true THEN 1 END) as supply_tracking_count,
  COUNT(CASE WHEN erc1155.is_burnable = true THEN 1 END) as burnable_count,
  COUNT(CASE WHEN erc1155.is_pausable = true THEN 1 END) as pausable_count,
  -- JSONB field coverage
  COUNT(erc1155.sales_config) as sales_config_count,
  COUNT(erc1155.batch_minting_config) as batch_minting_config_count,
  COUNT(erc1155.container_config) as container_config_count,
  COUNT(erc1155.dynamic_uri_config) as dynamic_uri_config_count
FROM tokens t
LEFT JOIN token_erc1155_properties erc1155 ON t.id = erc1155.token_id
WHERE t.standard = 'ERC-1155';

-- 4. ERC-1155 Token Types Fungibility Verification  
SELECT 
  'ERC-1155 Token Types' as data_type,
  COUNT(*) as total_types,
  COUNT(CASE WHEN tt.fungibility_type = 'fungible' THEN 1 END) as fungible_count,
  COUNT(CASE WHEN tt.fungibility_type = 'non-fungible' THEN 1 END) as non_fungible_count,
  COUNT(CASE WHEN tt.fungibility_type = 'semi-fungible' THEN 1 END) as semi_fungible_count,
  COUNT(CASE WHEN tt.fungibility_type IS NULL THEN 1 END) as null_fungibility_count
FROM token_erc1155_types tt
JOIN tokens t ON t.id = tt.token_id
WHERE t.standard = 'ERC-1155';

-- 5. ERC-1400 Advanced Field Mapping Verification
SELECT 
  'ERC-1400' as token_standard,
  COUNT(*) as total_tokens,
  -- Critical field mappings
  COUNT(CASE WHEN erc1400.forced_transfers = true THEN 1 END) as forced_transfers_count,
  COUNT(CASE WHEN erc1400.enforce_kyc = true THEN 1 END) as enforce_kyc_count,
  COUNT(CASE WHEN erc1400.forced_redemption_enabled = true THEN 1 END) as forced_redemption_count,
  -- Integer conversions
  COUNT(CASE WHEN erc1400.holding_period IS NOT NULL THEN 1 END) as holding_period_set_count,
  COUNT(CASE WHEN erc1400.max_investor_count IS NOT NULL THEN 1 END) as max_investor_count_set_count,
  -- Advanced features
  COUNT(erc1400.geographic_restrictions) as geographic_restrictions_count,
  COUNT(erc1400.transfer_restrictions) as transfer_restrictions_count,
  COUNT(erc1400.kyc_settings) as kyc_settings_count,
  COUNT(erc1400.compliance_settings) as compliance_settings_count
FROM tokens t
LEFT JOIN token_erc1400_properties erc1400 ON t.id = erc1400.token_id
WHERE t.standard = 'ERC-1400';

-- 6. ERC-1400 Partitions Transferable Field Verification
SELECT 
  'ERC-1400 Partitions' as data_type,
  COUNT(*) as total_partitions,
  COUNT(CASE WHEN p.transferable = true THEN 1 END) as transferable_count,
  COUNT(CASE WHEN p.transferable = false THEN 1 END) as non_transferable_count,
  COUNT(CASE WHEN p.transferable IS NULL THEN 1 END) as null_transferable_count
FROM token_erc1400_partitions p
JOIN tokens t ON t.id = p.token_id
WHERE t.standard = 'ERC-1400';

-- 7. ERC-3525 Advanced Features Verification
SELECT 
  'ERC-3525' as token_standard,
  COUNT(*) as total_tokens,
  -- Advanced features added in Phase 1
  COUNT(CASE WHEN erc3525.fractional_ownership_enabled = true THEN 1 END) as fractional_ownership_count,
  COUNT(CASE WHEN erc3525.mergable = true THEN 1 END) as mergable_count,
  COUNT(CASE WHEN erc3525.splittable = true THEN 1 END) as splittable_count,
  COUNT(CASE WHEN erc3525.dynamic_metadata = true THEN 1 END) as dynamic_metadata_count,
  COUNT(CASE WHEN erc3525.allows_slot_enumeration = true THEN 1 END) as slot_enumeration_count,
  COUNT(CASE WHEN erc3525.value_aggregation = true THEN 1 END) as value_aggregation_count,
  COUNT(CASE WHEN erc3525.permissioning_enabled = true THEN 1 END) as permissioning_count,
  COUNT(CASE WHEN erc3525.supply_tracking = true THEN 1 END) as supply_tracking_count,
  COUNT(CASE WHEN erc3525.updatable_values = true THEN 1 END) as updatable_values_count
FROM tokens t
LEFT JOIN token_erc3525_properties erc3525 ON t.id = erc3525.token_id
WHERE t.standard = 'ERC-3525';

-- 8. ERC-3525 Slots Transferable Field Verification
SELECT 
  'ERC-3525 Slots' as data_type,
  COUNT(*) as total_slots,
  COUNT(CASE WHEN s.slot_transferable = true THEN 1 END) as transferable_slots_count,
  COUNT(CASE WHEN s.slot_transferable = false THEN 1 END) as non_transferable_slots_count,
  COUNT(CASE WHEN s.slot_transferable IS NULL THEN 1 END) as null_transferable_count
FROM token_erc3525_slots s
JOIN tokens t ON t.id = s.token_id
WHERE t.standard = 'ERC-3525';

-- 9. ERC-4626 Advanced Features Verification
SELECT 
  'ERC-4626' as token_standard,
  COUNT(*) as total_tokens,
  -- Advanced features added in Phase 1
  COUNT(CASE WHEN erc4626.yield_optimization_enabled = true THEN 1 END) as yield_optimization_count,
  COUNT(CASE WHEN erc4626.automated_rebalancing = true THEN 1 END) as automated_rebalancing_count,
  COUNT(CASE WHEN erc4626.performance_tracking = true THEN 1 END) as performance_tracking_count,
  -- Fee structure fields
  COUNT(CASE WHEN erc4626.deposit_fee IS NOT NULL THEN 1 END) as deposit_fee_count,
  COUNT(CASE WHEN erc4626.withdrawal_fee IS NOT NULL THEN 1 END) as withdrawal_fee_count,
  COUNT(CASE WHEN erc4626.management_fee IS NOT NULL THEN 1 END) as management_fee_count,
  COUNT(CASE WHEN erc4626.performance_fee IS NOT NULL THEN 1 END) as performance_fee_count,
  -- Limit fields
  COUNT(CASE WHEN erc4626.min_deposit IS NOT NULL THEN 1 END) as min_deposit_count,
  COUNT(CASE WHEN erc4626.max_deposit IS NOT NULL THEN 1 END) as max_deposit_count,
  COUNT(CASE WHEN erc4626.min_withdrawal IS NOT NULL THEN 1 END) as min_withdrawal_count,
  COUNT(CASE WHEN erc4626.max_withdrawal IS NOT NULL THEN 1 END) as max_withdrawal_count
FROM tokens t
LEFT JOIN token_erc4626_properties erc4626 ON t.id = erc4626.token_id
WHERE t.standard = 'ERC-4626';

-- =====================================
-- FIELD MAPPING SUCCESS METRICS
-- =====================================

-- Overall Token Standard Distribution
SELECT 
  'Overall Distribution' as metric,
  standard,
  COUNT(*) as token_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM tokens
GROUP BY standard
ORDER BY token_count DESC;

-- Field Coverage Summary for All Standards
WITH field_coverage AS (
  SELECT 
    'ERC-20' as standard,
    COUNT(*) as total_tokens,
    COUNT(erc20.fee_on_transfer) + COUNT(erc20.transfer_config) + COUNT(erc20.gas_config) + 
    COUNT(erc20.compliance_config) + COUNT(erc20.whitelist_config) as mapped_fields
  FROM tokens t
  LEFT JOIN token_erc20_properties erc20 ON t.id = erc20.token_id  
  WHERE t.standard = 'ERC-20'
  
  UNION ALL
  
  SELECT 
    'ERC-721' as standard,
    COUNT(*) as total_tokens,
    COUNT(erc721.is_mintable) + COUNT(erc721.sales_config) + COUNT(erc721.whitelist_config) + 
    COUNT(erc721.permission_config) + COUNT(erc721.dynamic_uri_config) as mapped_fields
  FROM tokens t
  LEFT JOIN token_erc721_properties erc721 ON t.id = erc721.token_id
  WHERE t.standard = 'ERC-721'
  
  UNION ALL
  
  SELECT 
    'ERC-1155' as standard,
    COUNT(*) as total_tokens,
    COUNT(erc1155.batch_minting_enabled) + COUNT(erc1155.container_enabled) + COUNT(erc1155.supply_tracking) + 
    COUNT(erc1155.sales_config) + COUNT(erc1155.batch_minting_config) as mapped_fields
  FROM tokens t
  LEFT JOIN token_erc1155_properties erc1155 ON t.id = erc1155.token_id
  WHERE t.standard = 'ERC-1155'
  
  UNION ALL
  
  SELECT 
    'ERC-1400' as standard,
    COUNT(*) as total_tokens,
    COUNT(erc1400.forced_transfers) + COUNT(erc1400.enforce_kyc) + COUNT(erc1400.holding_period) + 
    COUNT(erc1400.geographic_restrictions) + COUNT(erc1400.transfer_restrictions) as mapped_fields
  FROM tokens t
  LEFT JOIN token_erc1400_properties erc1400 ON t.id = erc1400.token_id
  WHERE t.standard = 'ERC-1400'
  
  UNION ALL
  
  SELECT 
    'ERC-3525' as standard,
    COUNT(*) as total_tokens,
    COUNT(erc3525.fractional_ownership_enabled) + COUNT(erc3525.mergable) + COUNT(erc3525.dynamic_metadata) + 
    COUNT(erc3525.value_aggregation) + COUNT(erc3525.permissioning_enabled) as mapped_fields
  FROM tokens t
  LEFT JOIN token_erc3525_properties erc3525 ON t.id = erc3525.token_id
  WHERE t.standard = 'ERC-3525'
  
  UNION ALL
  
  SELECT 
    'ERC-4626' as standard,
    COUNT(*) as total_tokens,
    COUNT(erc4626.yield_optimization_enabled) + COUNT(erc4626.automated_rebalancing) + COUNT(erc4626.deposit_fee) + 
    COUNT(erc4626.min_deposit) + COUNT(erc4626.performance_tracking) as mapped_fields
  FROM tokens t
  LEFT JOIN token_erc4626_properties erc4626 ON t.id = erc4626.token_id
  WHERE t.standard = 'ERC-4626'
)
SELECT 
  standard,
  total_tokens,
  mapped_fields,
  CASE 
    WHEN total_tokens > 0 THEN ROUND(mapped_fields * 100.0 / (total_tokens * 5), 2)
    ELSE 0
  END as field_coverage_percentage
FROM field_coverage
ORDER BY field_coverage_percentage DESC;

-- =====================================
-- DATA INTEGRITY VERIFICATION  
-- =====================================

-- Check for orphaned standard properties (properties without main token)
SELECT 'Orphaned ERC-20 Properties' as check_type, COUNT(*) as count
FROM token_erc20_properties erc20
LEFT JOIN tokens t ON t.id = erc20.token_id
WHERE t.id IS NULL

UNION ALL

SELECT 'Orphaned ERC-721 Properties' as check_type, COUNT(*) as count
FROM token_erc721_properties erc721
LEFT JOIN tokens t ON t.id = erc721.token_id
WHERE t.id IS NULL

UNION ALL

SELECT 'Orphaned ERC-1155 Properties' as check_type, COUNT(*) as count
FROM token_erc1155_properties erc1155
LEFT JOIN tokens t ON t.id = erc1155.token_id
WHERE t.id IS NULL

UNION ALL

SELECT 'Orphaned ERC-1400 Properties' as check_type, COUNT(*) as count
FROM token_erc1400_properties erc1400
LEFT JOIN tokens t ON t.id = erc1400.token_id
WHERE t.id IS NULL

UNION ALL

SELECT 'Orphaned ERC-3525 Properties' as check_type, COUNT(*) as count
FROM token_erc3525_properties erc3525
LEFT JOIN tokens t ON t.id = erc3525.token_id
WHERE t.id IS NULL

UNION ALL

SELECT 'Orphaned ERC-4626 Properties' as check_type, COUNT(*) as count
FROM token_erc4626_properties erc4626
LEFT JOIN tokens t ON t.id = erc4626.token_id
WHERE t.id IS NULL;

-- =====================================
-- SUCCESS CRITERIA VALIDATION
-- =====================================

-- This should return "PASS" for all checks if implementation is successful
WITH validation_checks AS (
  -- Check 1: All ERC-1155 tokens should have batch_minting_enabled column accessible
  SELECT 
    'ERC-1155 Batch Minting Field' as check_name,
    CASE 
      WHEN COUNT(*) > 0 AND COUNT(erc1155.batch_minting_enabled) = COUNT(*) THEN 'PASS'
      ELSE 'FAIL' 
    END as result
  FROM tokens t
  LEFT JOIN token_erc1155_properties erc1155 ON t.id = erc1155.token_id
  WHERE t.standard = 'ERC-1155'
  
  UNION ALL
  
  -- Check 2: All ERC-721 tokens should have is_mintable field accessible
  SELECT 
    'ERC-721 Is Mintable Field' as check_name,
    CASE 
      WHEN COUNT(*) > 0 AND COUNT(erc721.is_mintable) = COUNT(*) THEN 'PASS'
      ELSE 'FAIL' 
    END as result
  FROM tokens t
  LEFT JOIN token_erc721_properties erc721 ON t.id = erc721.token_id
  WHERE t.standard = 'ERC-721'
  
  UNION ALL
  
  -- Check 3: All ERC-1400 tokens should have forced_transfers field accessible
  SELECT 
    'ERC-1400 Forced Transfers Field' as check_name,
    CASE 
      WHEN COUNT(*) > 0 AND COUNT(erc1400.forced_transfers) = COUNT(*) THEN 'PASS'
      ELSE 'FAIL' 
    END as result
  FROM tokens t
  LEFT JOIN token_erc1400_properties erc1400 ON t.id = erc1400.token_id
  WHERE t.standard = 'ERC-1400'
  
  UNION ALL
  
  -- Check 4: ERC-1155 token types should have proper fungibility_type values
  SELECT 
    'ERC-1155 Fungibility Types' as check_name,
    CASE 
      WHEN COUNT(*) > 0 AND COUNT(CASE WHEN tt.fungibility_type IN ('fungible', 'non-fungible', 'semi-fungible') THEN 1 END) = COUNT(*) THEN 'PASS'
      ELSE 'FAIL' 
    END as result
  FROM token_erc1155_types tt
  JOIN tokens t ON t.id = tt.token_id
  WHERE t.standard = 'ERC-1155'
  
  UNION ALL
  
  -- Check 5: ERC-1400 partitions should have transferable field accessible
  SELECT 
    'ERC-1400 Partition Transferable' as check_name,
    CASE 
      WHEN COUNT(*) > 0 AND COUNT(p.transferable) = COUNT(*) THEN 'PASS'
      ELSE 'FAIL' 
    END as result
  FROM token_erc1400_partitions p
  JOIN tokens t ON t.id = p.token_id
  WHERE t.standard = 'ERC-1400'
)
SELECT * FROM validation_checks
ORDER BY 
  CASE result WHEN 'PASS' THEN 1 ELSE 2 END,
  check_name;

-- =====================================
-- IMPLEMENTATION COMPLETION SUMMARY
-- =====================================

SELECT 
  'FIELD MAPPING VERIFICATION COMPLETE' as status,
  COUNT(DISTINCT t.standard) as standards_implemented,
  COUNT(*) as total_tokens_tested,
  NOW() as verification_timestamp
FROM tokens t
WHERE t.standard IN ('ERC-20', 'ERC-721', 'ERC-1155', 'ERC-1400', 'ERC-3525', 'ERC-4626');
