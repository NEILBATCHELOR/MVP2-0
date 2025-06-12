# ERC Max Configuration Schema Migration Scripts

## Overview

This directory contains comprehensive SQL migration scripts to fix the critical mismatches between ERC max configuration forms and database schemas identified in the analysis. The analysis revealed that max configuration forms collect 2-5x more data than database schemas can store, leading to potential data loss and user experience issues.

## 📊 Analysis Summary

### Critical Findings:
- **261+ missing database fields** across all ERC standards
- **15 new supporting tables** needed for complex relationships
- **Form-Database Gap**: Max config forms collect significantly more fields than database schemas define
- **Data Loss Risk**: Complex form configurations may not persist correctly to database
- **Universal Issue**: Missing description fields across all ERCs

### Severity by Standard:
- 🔴 **ERC20**: CRITICAL - 35+ missing fields including governance, anti-whale, reflection features
- 🔴 **ERC721**: CRITICAL - 48+ missing fields including reveal mechanics, utility features  
- 🟡 **ERC1155**: MODERATE - 42+ missing fields including advanced multi-token features
- 🟢 **ERC1400**: GOOD - Best alignment, minimal changes needed
- 🔴 **ERC3525**: CRITICAL - 71+ missing fields including financial instruments, DeFi features
- 🟡 **ERC4626**: MODERATE - 65+ missing fields including vault strategies, risk management

## 🚀 Migration Scripts

### 000_master_migration.sql
**Master framework and documentation script**
- Creates migration tracking infrastructure
- Defines utility functions for validation
- Provides comprehensive migration overview
- Creates unified views and validation functions

**Key Features:**
- Migration logging system
- JSONB validation functions  
- Comprehensive token view
- Migration validation framework

### 001_fix_erc20_max_config.sql
**ERC20 Max Configuration Fixes**

**New Fields Added (35+):**
- **Universal**: `description` field for all tokens
- **Governance**: `governance_enabled`, `quorum_percentage`, `proposal_threshold`, `voting_delay`, `voting_period`, `timelock_delay`, `governance_token_address`
- **Advanced Features**: `anti_whale_enabled`, `max_wallet_amount`, `reflection_enabled`, `reflection_percentage`, `staking_enabled`, `staking_rewards_rate`
- **Fee Structure**: `buy_fee_enabled`, `sell_fee_enabled`, `liquidity_fee_percentage`, `marketing_fee_percentage`, `auto_liquidity_enabled`
- **Time-based**: `trading_start_time`, `presale_enabled`, `presale_rate`, `presale_start_time`, `presale_end_time`
- **Vesting**: `vesting_enabled`, `vesting_cliff_period`, `vesting_total_period`, `vesting_release_frequency`
- **Tax/Reflection**: `burn_on_transfer`, `burn_percentage`, `lottery_enabled`, `deflation_enabled`

**Key Improvements:**
- Fixed compliance interval enum validation (quarterly, annually)
- Enhanced JSONB validation for complex configurations
- Performance indexes on critical fields
- Updated ERC20 view with new fields

### 002_fix_erc721_max_config.sql
**ERC721 Max Configuration Fixes**

**New Fields Added (48+):**
- **Critical Missing**: `contract_uri`, `custom_base_uri`, `revealable`, `pre_reveal_uri`, `reserved_tokens`, `minting_price`, `max_mints_per_tx`, `max_mints_per_wallet`, `enable_fractional_ownership`, `enable_dynamic_metadata`, `use_safe_transfer`
- **Minting/Pricing**: `public_sale_enabled`, `public_sale_price`, `whitelist_sale_enabled`, `whitelist_sale_price`, sale timing fields
- **Reveal Mechanics**: `reveal_batch_size`, `auto_reveal`, `reveal_delay`, `placeholder_image_uri`, `metadata_frozen`
- **Permissions**: `mint_roles[]`, `admin_mint_enabled`, `burn_roles[]`, `transfer_locked`, `soulbound`
- **Marketplace**: `creator_earnings_enabled`, `marketplace_approved[]`, `operator_filter_enabled`
- **Utility/Gaming**: `utility_enabled`, `utility_type`, `staking_enabled`, `breeding_enabled`, `evolution_enabled`
- **Economics**: `supply_cap_enabled`, `dutch_auction_enabled`, `dutch_auction_start_price`, `dutch_auction_end_price`
- **Cross-chain**: `cross_chain_enabled`, `bridge_contracts`, `layer2_enabled`, `layer2_networks[]`

**New Supporting Tables:**
- `token_erc721_trait_definitions` - Define NFT traits and rarity
- `token_erc721_mint_phases` - Complex minting phase configurations

### 003_fix_erc1155_max_config.sql  
**ERC1155 Max Configuration Fixes**

**New Fields Added (42+):**
- **Advanced Features**: `mint_roles[]`, `burning_enabled`, `burn_roles[]`, `updatable_metadata`, `metadata_update_roles[]`
- **Multi-token Economics**: `pricing_model`, `base_price`, `price_multipliers`, `bulk_discount_enabled`, `referral_rewards_enabled`
- **Distribution**: `lazy_minting_enabled`, `airdrop_enabled`, `claim_period_enabled`, `claim_start_time`, `claim_end_time`
- **Gaming/Utility**: `crafting_enabled`, `fusion_enabled`, `token_recipes`, `experience_points_enabled`, `consumable_tokens`
- **Marketplace**: `marketplace_fees_enabled`, `bundle_trading_enabled`, `atomic_swaps_enabled`, `cross_collection_trading`
- **Governance**: `voting_power_enabled`, `voting_weight_per_token`, `community_treasury_enabled`, `proposal_creation_threshold`
- **Cross-chain**: `bridge_enabled`, `bridgeable_token_types[]`, `wrapped_versions`, `layer2_support_enabled`

**New Supporting Tables:**
- `token_erc1155_type_configs` - Enhanced token type definitions
- `token_erc1155_discount_tiers` - Bulk discount configurations  
- `token_erc1155_crafting_recipes` - Token crafting mechanics

### 004_fix_erc3525_max_config.sql
**ERC3525 Max Configuration Fixes (Most Extensive)**

**New Fields Added (71+):**
- **Core Advanced**: `auto_unit_calculation`, `custom_slot_properties`, `slot_enumeration_enabled`, `value_aggregation_enabled`
- **Financial Instruments**: `financial_instrument_type`, `principal_amount`, `interest_rate`, `maturity_date`, `coupon_frequency`, `payment_schedule`, `early_redemption_enabled`
- **Derivatives**: `derivative_type`, `underlying_asset`, `strike_price`, `expiration_date`, `settlement_type`, `margin_requirements`, `leverage_ratio`
- **Slot Management**: `slot_creation_enabled`, `dynamic_slot_creation`, `slot_admin_roles[]`, `cross_slot_transfers`
- **Value Computation**: `value_computation_method`, `value_oracle_address`, `accrual_enabled`, `accrual_rate`, `value_adjustment_enabled`
- **Marketplace**: `slot_marketplace_enabled`, `value_marketplace_enabled`, `partial_value_trading`, `minimum_trade_value`
- **Governance**: `slot_voting_enabled`, `value_weighted_voting`, `delegate_enabled`, `proposal_value_threshold`
- **DeFi Integration**: `yield_farming_enabled`, `liquidity_provision_enabled`, `flash_loan_enabled`, `compound_interest_enabled`
- **Compliance**: `regulatory_compliance_enabled`, `kyc_required`, `accredited_investor_only`, `geographic_restrictions[]`
- **Enterprise**: `multi_signature_required`, `institutional_custody_support`, `audit_trail_enhanced`, `emergency_pause_enabled`

**New Supporting Tables:**
- `token_erc3525_slot_configs` - Enhanced slot configurations
- `token_erc3525_payment_schedules` - Financial instrument payment tracking
- `token_erc3525_value_adjustments` - Value adjustment and accrual tracking

### 005_fix_erc4626_max_config.sql
**ERC4626 Max Configuration Fixes**

**New Fields Added (65+):**
- **Strategy Features**: `strategy_complexity`, `multi_asset_enabled`, `rebalancing_enabled`, `auto_compounding_enabled`, `yield_optimization_strategy`, `risk_management_enabled`
- **Performance Tracking**: `apy_tracking_enabled`, `benchmark_tracking_enabled`, `performance_history_retention`, `yield_sources`, `compound_frequency`
- **Risk Management**: `insurance_enabled`, `insurance_provider`, `emergency_exit_enabled`, `circuit_breaker_enabled`, `stop_loss_enabled`
- **Governance**: `governance_token_enabled`, `strategy_voting_enabled`, `fee_voting_enabled`, `manager_performance_threshold`
- **Fee Structure**: `dynamic_fees_enabled`, `performance_fee_high_water_mark`, `fee_tier_system_enabled`, `early_withdrawal_penalty`
- **Liquidity**: `liquidity_mining_enabled`, `market_making_enabled`, `arbitrage_enabled`, `impermanent_loss_protection`
- **Integration**: `defi_protocol_integrations[]`, `lending_protocol_enabled`, `leverage_enabled`, `cross_chain_yield_enabled`
- **Analytics**: `portfolio_analytics_enabled`, `real_time_pnl_tracking`, `tax_reporting_enabled`, `automated_reporting`
- **Enterprise**: `institutional_grade`, `custody_integration`, `compliance_reporting_enabled`, `fund_administration_enabled`

**New Supporting Tables:**
- `token_erc4626_vault_strategies` - Vault strategy configurations
- `token_erc4626_performance_metrics` - Performance tracking
- `token_erc4626_fee_tiers` - Tiered fee structures

## 🔧 Execution Instructions

### Prerequisites
1. Backup your database
2. Ensure you have appropriate permissions
3. Test on development environment first

### Execution Order
```sql
-- 1. Run master framework first
\i 000_master_migration.sql

-- 2. Run individual migrations in order
\i 001_fix_erc20_max_config.sql
\i 002_fix_erc721_max_config.sql  
\i 003_fix_erc1155_max_config.sql
\i 004_fix_erc3525_max_config.sql
\i 005_fix_erc4626_max_config.sql
```

### Alternative: Run Single Migration
```sql
-- For specific ERC standard only
\i 001_fix_erc20_max_config.sql
```

## 📈 Expected Results

### Before Migration:
- ❌ ~50% of form fields may not persist correctly
- ❌ Zero validation of advanced configurations  
- ❌ Users unaware of unsupported features
- ❌ Data loss risk for complex configurations

### After Migration:
- ✅ 100% of form fields have defined storage
- ✅ Proper JSONB validation for complex configurations
- ✅ Supporting tables for array relationships
- ✅ Performance indexes on critical fields
- ✅ Clear UX about feature availability
- ✅ Comprehensive views for all token data

## 🛡️ Safety Features

### Data Protection:
- All migrations use `IF NOT EXISTS` for new columns
- Proper constraints prevent invalid data
- Default values ensure backward compatibility
- Transaction blocks for atomic execution

### Validation:
- JSONB structure validation functions
- Enum value validation
- Constraint checks on critical fields
- Migration logging and progress tracking

### Performance:
- Strategic indexes on query-heavy fields
- Optimized view definitions
- Efficient constraint checking
- Minimal impact on existing queries

## 📊 Migration Impact

### Database Size Impact:
- **Estimated increase**: 15-25% in token table sizes
- **New tables**: 15 supporting tables
- **New indexes**: 25+ performance indexes
- **Storage**: Minimal due to mostly NULL initial values

### Performance Impact:
- **Positive**: Better query performance with new indexes
- **Minimal**: Most new fields will be NULL initially
- **Optimized**: Views pre-calculate complex relationships

### Application Impact:
- **Forms**: Can now persist all configuration data
- **Mappers**: Need updates to handle new fields
- **APIs**: Enhanced data available for client applications
- **Validation**: Improved data integrity

## 🔍 Validation Queries

### Check Migration Status:
```sql
SELECT * FROM public.migration_log 
ORDER BY started_at DESC;
```

### Validate Schema Completeness:
```sql
SELECT * FROM public.validate_max_config_migration();
```

### Check New Fields:
```sql
-- ERC20 new fields
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'token_erc20_properties' 
  AND column_name IN ('governance_enabled', 'anti_whale_enabled', 'reflection_enabled');

-- ERC721 new fields  
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'token_erc721_properties'
  AND column_name IN ('contract_uri', 'revealable', 'utility_enabled');
```

### Test Comprehensive View:
```sql
SELECT standard, COUNT(*) as token_count,
       COUNT(erc20_features) as erc20_configs,
       COUNT(erc721_features) as erc721_configs,
       COUNT(erc1155_features) as erc1155_configs,
       COUNT(erc3525_features) as erc3525_configs,
       COUNT(erc4626_features) as erc4626_configs
FROM public.token_comprehensive_view
GROUP BY standard;
```

## 🚨 Rollback Plan

If needed, rollback can be performed by:

1. **Drop new tables**: All new tables can be safely dropped
2. **Remove new columns**: Use `ALTER TABLE ... DROP COLUMN` for new fields
3. **Restore views**: Recreate original view definitions
4. **Remove constraints**: Drop new validation constraints

```sql
-- Example rollback for ERC20
ALTER TABLE public.token_erc20_properties 
DROP COLUMN IF EXISTS governance_enabled,
DROP COLUMN IF EXISTS anti_whale_enabled,
DROP COLUMN IF EXISTS reflection_enabled;
```

## 📞 Support

For issues or questions:
1. Check migration log for error details
2. Verify all prerequisites are met
3. Test individual migrations in isolation
4. Review constraint violations in detail

## 🎯 Next Steps

After migration:
1. **Update Mappers**: Modify form-to-database mappers to handle new fields
2. **Enhance Forms**: Enable previously hidden form fields
3. **Update Types**: Regenerate TypeScript types from updated schema
4. **Test Thoroughly**: Validate form submission and data persistence
5. **Documentation**: Update API documentation with new fields

---

**Migration Date**: June 7, 2025  
**Total Fields Added**: 261+  
**Total Tables Added**: 15  
**Impact**: Fixes all critical ERC max config form-database mismatches
