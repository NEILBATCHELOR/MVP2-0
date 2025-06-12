# Geographic Restrictions System Documentation

## 🌍 Comprehensive Geographic Restrictions Implementation

This document explains how geographic restrictions are handled across all token standards in the Chain Capital platform.

## ❌ Previous Issues Identified

### **Inconsistent Implementation:**
- **ERC-1400**: `geographic_restrictions JSONB` (basic array)
- **ERC-3525**: `geographic_restrictions TEXT[]` (inconsistent type)
- **Other ERCs**: No geographic restrictions support
- **No Standards**: Country codes, validation, sanctions compliance

### **Missing Critical Features:**
- No ISO 3166 country code standardization
- No sanctions screening integration
- No complex ownership percentage limits
- No regulatory equivalence mapping
- No temporal restrictions (effective/expiry dates)

## ✅ New Comprehensive Solution

### **1. Master Jurisdictions Reference Table**
```sql
public.geographic_jurisdictions
```
**Purpose**: Centralized country/jurisdiction database with compliance metadata

**Key Fields:**
- `country_code` (ISO 3166-1 alpha-2): US, GB, DE, etc.
- `country_code_3` (ISO 3166-1 alpha-3): USA, GBR, DEU, etc.
- `regulatory_regime`: SEC, FCA, MiFID, etc.
- `sanctions_risk_level`: low, medium, high, prohibited
- `is_ofac_sanctioned`, `is_eu_sanctioned`, `is_un_sanctioned`
- `fatf_compliance_status`: compliant, non_compliant, enhanced_due_diligence
- `offshore_financial_center`: boolean flag

### **2. Token-Specific Restriction Rules**
```sql
public.token_geographic_restrictions
```
**Purpose**: Define specific rules per token per country

**Restriction Types:**
- **`blocked`**: Complete prohibition from country
- **`allowed`**: Unrestricted access
- **`limited`**: Ownership percentage caps
- **`enhanced_dd`**: Requires enhanced due diligence
- **`conditional`**: Complex conditional rules

**Advanced Features:**
- `max_ownership_percentage`: Country-specific ownership caps
- `min_investment_amount`, `max_investment_amount`: Investment limits
- `requires_local_custodian`: Local custody requirements
- `requires_regulatory_approval`: Pre-approval needed
- `holding_period_restriction`: Minimum holding periods
- `effective_date`, `expiry_date`: Temporal restrictions

### **3. Sanctions Screening Integration**
```sql
public.token_sanctions_rules
```
**Purpose**: Configure automated sanctions screening per token

**Features:**
- Multiple sanctions regimes: OFAC, EU, UN, UK HMT
- Real-time vs batch screening options
- Auto-blocking vs manual review thresholds
- Enhanced due diligence triggers
- Whitelist override capabilities

### **4. Regulatory Equivalence Mapping**
```sql
public.regulatory_equivalence_mapping
```
**Purpose**: Handle cross-border regulatory recognition

**Features:**
- EU passport rights
- ASEAN equivalence
- Mutual recognition agreements
- Simplified procedures for equivalent jurisdictions

## 🔧 Implementation Across Token Standards

### **Standardized Approach:**
All ERC standards now use the same geographic restrictions system:

```sql
-- Each token properties table has:
use_geographic_restrictions BOOLEAN DEFAULT false
default_restriction_policy TEXT DEFAULT 'allowed'/'blocked'
```

### **Default Policies by Standard:**
- **ERC-20**: `allowed` (utility tokens generally unrestricted)
- **ERC-721**: `allowed` (NFTs generally unrestricted)
- **ERC-1155**: `allowed` (gaming/utility tokens generally unrestricted)
- **ERC-1400**: `blocked` (security tokens require explicit allowlisting)
- **ERC-3525**: `blocked` (financial instruments require explicit allowlisting)
- **ERC-4626**: `allowed` (DeFi vaults generally unrestricted)

## 🛡️ Validation Function

### **Real-time Compliance Checking:**
```sql
SELECT * FROM public.validate_geographic_restriction(
  token_id, 
  investor_country_code, 
  investment_amount
);
```

**Returns:**
- `is_allowed`: boolean - Can invest?
- `restriction_type`: text - Type of restriction
- `max_ownership_percentage`: numeric - Ownership limits
- `requires_enhanced_dd`: boolean - Enhanced due diligence needed?
- `blocking_reason`: text - Why blocked (if applicable)

### **Validation Logic:**
1. **Check if geographic restrictions enabled** for token
2. **Auto-block sanctioned countries** (OFAC, EU, UN lists)
3. **Apply specific country rules** if configured
4. **Fall back to default policy** (allowed/blocked)
5. **Return comprehensive compliance assessment**

## 📊 Usage Examples

### **Example 1: Security Token (ERC-1400)**
```sql
-- Allow US investors with 10% ownership cap
INSERT INTO token_geographic_restrictions VALUES (
  gen_random_uuid(),
  'token-uuid',
  'limited',
  'US',
  10.00, -- max 10% ownership
  '100000', -- min $100k investment
  '10000000', -- max $10M investment
  true, -- requires local custodian
  false, -- no tax clearance needed
  true, -- requires regulatory approval
  365, -- 1 year holding period
  '{"transfer_approval_required": true}',
  '{"quarterly_reporting": true}',
  CURRENT_DATE,
  NULL, -- no expiry
  'Accredited investors only',
  'system',
  now(),
  now()
);

-- Block Iranian investors completely
INSERT INTO token_geographic_restrictions VALUES (
  gen_random_uuid(),
  'token-uuid',
  'blocked',
  'IR',
  NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
  CURRENT_DATE, NULL,
  'OFAC sanctions compliance',
  'system', now(), now()
);
```

### **Example 2: Utility Token (ERC-20)**
```sql
-- Simple approach: Enable restrictions but keep default "allowed"
UPDATE token_erc20_properties 
SET use_geographic_restrictions = true,
    default_restriction_policy = 'allowed'
WHERE token_id = 'token-uuid';

-- Only block specifically problematic jurisdictions
INSERT INTO token_geographic_restrictions VALUES (
  gen_random_uuid(), 'token-uuid', 'blocked', 'KP', -- North Korea
  NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
  CURRENT_DATE, NULL, 'OFAC sanctions', 'system', now(), now()
);
```

### **Example 3: Vault Token (ERC-4626)**
```sql
-- Enhanced due diligence for high-risk jurisdictions
INSERT INTO token_geographic_restrictions VALUES (
  gen_random_uuid(),
  'vault-token-uuid',
  'enhanced_dd',
  'RU', -- Russia
  NULL, -- no ownership cap
  '50000', -- min $50k investment
  NULL, -- no max limit
  false, false, false, NULL,
  '{"enhanced_kyc_required": true, "source_of_funds_verification": true}',
  '{"monthly_reporting": true}',
  CURRENT_DATE, NULL,
  'Enhanced due diligence required',
  'system', now(), now()
);
```

## 🔍 Compliance Queries

### **Check Token's Geographic Restrictions:**
```sql
SELECT * FROM token_geographic_restrictions_view 
WHERE token_id = 'your-token-uuid'
ORDER BY country_name;
```

### **Find All Sanctioned Countries:**
```sql
SELECT country_code, country_name, 
       is_ofac_sanctioned, is_eu_sanctioned, is_un_sanctioned
FROM geographic_jurisdictions 
WHERE is_ofac_sanctioned = true 
   OR is_eu_sanctioned = true 
   OR is_un_sanctioned = true;
```

### **Validate Specific Investment:**
```sql
SELECT * FROM validate_geographic_restriction(
  'token-uuid'::uuid,
  'US'::char(2),
  1000000::numeric
);
```

### **Find Tokens Available to Specific Country:**
```sql
SELECT DISTINCT t.name, t.symbol, t.standard
FROM tokens t
LEFT JOIN token_geographic_restrictions tgr ON t.id = tgr.token_id AND tgr.country_code = 'DE'
LEFT JOIN token_erc20_properties erc20 ON t.id = erc20.token_id AND t.standard = 'ERC-20'
-- ... (similar for other standards)
WHERE (tgr.restriction_type IN ('allowed', 'limited', 'enhanced_dd') 
       OR (tgr.restriction_type IS NULL AND COALESCE(erc20.default_restriction_policy, 'allowed') = 'allowed'))
  AND 'DE' NOT IN (
    SELECT country_code FROM geographic_jurisdictions 
    WHERE country_code = 'DE' AND (is_ofac_sanctioned OR is_eu_sanctioned OR is_un_sanctioned)
  );
```

## 📋 Best Practices

### **For Security Tokens (ERC-1400/ERC-3525):**
1. **Default to blocked** - Explicitly allowlist countries
2. **Set ownership caps** - Prevent excessive concentration
3. **Require regulatory approval** - For institutional jurisdictions
4. **Implement holding periods** - For compliance with securities laws
5. **Enable enhanced due diligence** - For high-risk jurisdictions

### **For Utility Tokens (ERC-20/ERC-721/ERC-1155):**
1. **Default to allowed** - Block only problematic jurisdictions
2. **Focus on sanctions compliance** - OFAC, EU, UN lists
3. **Minimal restrictions** - Avoid over-compliance
4. **Regular sanctions updates** - Keep sanctioned countries current

### **For DeFi Vaults (ERC-4626):**
1. **Risk-based approach** - Enhanced DD for high-risk countries
2. **Investment minimums** - For regulatory compliance
3. **Source of funds verification** - For large investments
4. **Regular compliance monitoring** - Ongoing assessment

## 🔄 Migration Impact

### **Before Migration:**
- ❌ Inconsistent geographic restriction implementations
- ❌ No sanctions compliance automation
- ❌ No regulatory equivalence support
- ❌ No temporal restriction capabilities
- ❌ No centralized country/jurisdiction database

### **After Migration:**
- ✅ Standardized geographic restrictions across all token standards
- ✅ Automated sanctions screening with real-time validation
- ✅ Comprehensive regulatory equivalence mapping
- ✅ Temporal restrictions with effective/expiry dates
- ✅ ISO 3166 compliant country codes
- ✅ Real-time compliance validation function
- ✅ Comprehensive audit trail and reporting capabilities

## 🎯 Next Steps

1. **Populate Jurisdiction Database** - Add all relevant countries with compliance metadata
2. **Configure Sanctions Lists** - Regular updates from OFAC, EU, UN sources
3. **Set Token Policies** - Configure restriction policies per token
4. **Integrate with Forms** - Update token creation forms to use new system
5. **API Integration** - Expose validation function through REST API
6. **Monitoring Dashboard** - Create compliance monitoring interface

---

**Implementation Status**: ✅ Complete  
**Migration File**: `007_comprehensive_geographic_restrictions.sql`  
**Impact**: Standardized geographic restrictions with comprehensive compliance features
