# Comprehensive Token Testing Strategy

## Overview

This document outlines the best approach to fully test token creation and editing functionality across all supported token standards (ERC-20, ERC-721, ERC-1155, ERC-1400, ERC-3525, ERC-4626).

## Current State Analysis

### Token Creation (`CreateTokenPage.tsx`)
- ✅ Multi-step wizard interface (Select Standard → Configure → Review)
- ✅ Supports both basic and advanced configuration modes
- ✅ Template loading from ProductSelector
- ✅ Comprehensive validation with real-time feedback
- ✅ Integration with TokenMapperFactory for data transformation
- ✅ Creates main token record + standard-specific properties + array data

### Token Editing (`TokenEditForm.tsx` + Standard-specific forms)
- ⚠️ Basic TokenEditForm only handles: name, symbol, description
- ✅ Standard-specific forms exist for each token type
- ❓ Need to verify full field coverage across all forms

### Current Issues
1. Validation scripts exist but reportedly don't create tokens in database
2. Need systematic testing of all configuration options
3. Need end-to-end testing of complete workflows

## Recommended Testing Strategy

### Phase 1: Fix and Validate Scripts

#### 1.1 Debug Validation Scripts
```bash
# Check current validation script functionality
cd /Users/neilbatchelor/Cursor/Chain\ Capital\ Production
npm run validate:erc20-crud
```

**Expected Issues to Check:**
- Environment variable configuration (`import.meta.env` vs `process.env`)
- Database connection authentication
- Test project ID validation
- Cleanup settings preventing token persistence

#### 1.2 Create Persistent Test Tokens
Modify validation scripts to create tokens that persist for manual testing:

```typescript
// In test scripts, set cleanup to false
const TEST_CONFIG = {
  cleanup: false, // Keep test tokens for manual verification
  testProjectId: '0350bd24-1f6d-4cc7-840a-da8916610063'
};
```

### Phase 2: Comprehensive Creation Testing

#### 2.1 Test Matrix - All Standards × All Modes

| Standard | Basic Mode | Advanced Mode | Template Load | Manual Entry |
|----------|------------|---------------|---------------|--------------|
| ERC-20   | ✅         | ✅            | ✅            | ✅           |
| ERC-721  | ✅         | ✅            | ✅            | ✅           |
| ERC-1155 | ✅         | ✅            | ✅            | ✅           |
| ERC-1400 | ✅         | ✅            | ✅            | ✅           |
| ERC-3525 | ✅         | ✅            | ✅            | ✅           |
| ERC-4626 | ✅         | ✅            | ✅            | ✅           |

#### 2.2 Test Data Sets
Create comprehensive test data for each standard:

**ERC-20 Test Cases:**
- Basic: Simple utility token
- Advanced: Governance token with fees, rebasing, compliance
- Complex: Multi-feature token with all options enabled

**ERC-721 Test Cases:**
- Basic: Simple NFT collection
- Advanced: NFT with royalties, custom attributes, sales config
- Gaming: NFT with dynamic metadata and batch minting

**ERC-1155 Test Cases:**
- Basic: Multi-token contract
- Advanced: Gaming tokens with different fungibility levels
- Container: Advanced container support with batch operations

**ERC-1400 Test Cases:**
- Basic: Security token with KYC
- Advanced: Multi-partition security with complex compliance
- Regulatory: Full compliance automation with geographic restrictions

**ERC-3525 Test Cases:**
- Basic: Semi-fungible token with slots
- Advanced: Financial instrument with complex slot configurations
- Fractional: Fractional ownership with value transfers

**ERC-4626 Test Cases:**
- Basic: Simple yield vault
- Advanced: Multi-strategy vault with rebalancing
- DeFi: Complex yield optimization with asset allocations

#### 2.3 Testing Workflow Per Standard

1. **Navigate to Create Token Page**
   ```
   /tokens/create
   ```

2. **Test Basic Mode Creation**
   - Select standard
   - Fill basic fields (name, symbol, description)
   - Configure standard-specific basic options
   - Submit and verify database creation

3. **Test Advanced Mode Creation**
   - Enable advanced mode toggle
   - Fill all advanced configuration options
   - Test complex nested configurations
   - Submit and verify full database structure

4. **Test Template Loading**
   - Load template from ProductSelector
   - Verify all fields populate correctly
   - Modify loaded data
   - Submit and verify

5. **Test Validation**
   - Submit with missing required fields
   - Test field validation rules
   - Test cross-field dependencies
   - Verify error handling

### Phase 3: Comprehensive Editing Testing

#### 3.1 Edit Form Coverage Analysis

Need to verify each standard's edit form supports all properties:

**Current Edit Forms:**
- `ERC20EditForm.tsx`
- `ERC721EditForm.tsx` 
- `ERC1155EditForm.tsx`
- `ERC1400EditForm.tsx`
- `ERC3525EditForm.tsx`
- `ERC4626EditForm.tsx`

#### 3.2 Test Editing Workflow Per Standard

1. **Create Test Token** (using Phase 2 process)
2. **Navigate to Edit Form**
3. **Test Field Updates**
   - Basic fields (name, symbol, description)
   - Standard-specific properties
   - Complex nested configurations
   - Array data (attributes, partitions, slots, etc.)
4. **Test Validation on Edit**
5. **Verify Database Updates**
6. **Test Partial Updates**

#### 3.3 Array Data Editing

Special attention needed for:
- ERC-721: Token attributes
- ERC-1155: Token types and balances  
- ERC-1400: Partitions and controllers
- ERC-3525: Slots and allocations
- ERC-4626: Strategy parameters and asset allocations

### Phase 4: Integration Testing

#### 4.1 End-to-End Workflows
1. **Create → Edit → Deploy → Operate**
2. **Template Load → Modify → Save → Edit Later**
3. **Basic Create → Upgrade to Advanced → Full Configuration**

#### 4.2 Error Handling Testing
1. **Network Errors**
2. **Validation Failures**
3. **Database Constraint Violations**
4. **Authentication/Authorization Issues**

## Implementation Plan

### Step 1: Create Testing Scripts (Priority: High)

Create `scripts/test-token-creation-comprehensive.ts`:

```typescript
#!/usr/bin/env ts-node

/**
 * Comprehensive Token Creation and Editing Test Suite
 * Tests all token standards in both basic and advanced modes
 */

import { createToken, updateToken, getCompleteToken } from '../src/components/tokens/services/tokenService';

class ComprehensiveTokenTester {
  // Test data for all standards
  // Testing workflows
  // Validation and reporting
}
```

### Step 2: Fix Environment Issues (Priority: High)

Check and fix:
- Environment variable loading in validation scripts
- Database connection configuration
- Test project permissions

### Step 3: Create Manual Testing Checklist (Priority: Medium)

Detailed UI testing checklist for manual verification of:
- All form controls work correctly
- Validation messages display properly  
- Data persists correctly
- Navigation flows work

### Step 4: Create Automated Integration Tests (Priority: Medium)

Using Playwright or similar for:
- UI interaction testing
- Form submission workflows
- Data verification

## Success Criteria

### Creation Testing Success
- [ ] All 6 token standards create successfully in basic mode
- [ ] All 6 token standards create successfully in advanced mode
- [ ] Template loading works for all standards
- [ ] All validation rules work correctly
- [ ] Database records created correctly for main token + properties + arrays

### Editing Testing Success  
- [ ] All fields can be edited for each standard
- [ ] Array data can be added/modified/removed
- [ ] Validation works on edit forms
- [ ] Database updates persist correctly
- [ ] Complex nested data structures update properly

### Integration Testing Success
- [ ] Create → Edit → Update workflows work end-to-end
- [ ] Error conditions handled gracefully
- [ ] Performance acceptable under normal load
- [ ] UI responsive and intuitive

## Tools and Resources

### Testing Tools
- Jest for unit tests
- Playwright for UI automation
- Custom validation scripts for CRUD operations
- Database query tools for verification

### Documentation
- Token schema documentation
- API endpoint documentation
- Form validation rules
- Database relationship diagrams

### Monitoring
- Error logging and tracking
- Performance metrics
- Success/failure rates
- User feedback collection

## Next Steps

1. **Immediate (This Week):**
   - Fix validation scripts
   - Create comprehensive test data sets
   - Test basic creation workflow for all standards

2. **Short Term (Next 2 Weeks):**
   - Complete advanced mode testing
   - Verify all edit forms
   - Create automated test suite

3. **Medium Term (Next Month):**
   - Integration testing
   - Performance optimization
   - Documentation updates

## Conclusion

This comprehensive testing strategy ensures that both token creation and editing functionality works correctly across all supported standards. The phased approach allows for systematic validation while maintaining development velocity.

The key success factors are:
1. Fix any environment/configuration issues with existing scripts
2. Create comprehensive test data covering all use cases
3. Systematic testing of all standards × all modes
4. Thorough validation of editing capabilities
5. End-to-end integration testing

This approach will provide confidence that the token management system works reliably for all supported use cases.
