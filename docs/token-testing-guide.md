# Token Testing Guide

## Overview

This guide provides comprehensive instructions for testing token creation and editing functionality across all supported token standards (ERC-20, ERC-721, ERC-1155, ERC-1400, ERC-3525, ERC-4626).

## Quick Start

### 1. Run Diagnostic Test
First, verify your environment and database connection:

```bash
npm run test:diagnose
```

This will check:
- ✅ Environment variables configuration
- ✅ Database connection
- ✅ Test project access
- ✅ Basic token creation/deletion functionality

### 2. Create Test Tokens
Create comprehensive test tokens for all standards:

```bash
npm run test:tokens:create
```

This creates test tokens for:
- ERC-20 (basic + advanced)
- ERC-721 (basic + advanced)
- ERC-1155 (basic + advanced)
- ERC-1400 (basic + advanced)  
- ERC-3525 (basic + advanced)
- ERC-4626 (basic + advanced)

### 3. Run Full Test Suite
To run diagnostics and create test tokens in one command:

```bash
npm run test:tokens:comprehensive
```

## Manual UI Testing

### Token Creation Testing

#### Access the Create Token Page
```
Navigate to: /tokens/create
```

#### Test Matrix
For each token standard, test both configuration modes:

| Standard | Basic Mode | Advanced Mode | Template Load | Custom Config |
|----------|------------|---------------|---------------|---------------|
| ERC-20   | ✅         | ✅            | ✅            | ✅           |
| ERC-721  | ✅         | ✅            | ✅            | ✅           |
| ERC-1155 | ✅         | ✅            | ✅            | ✅           |
| ERC-1400 | ✅         | ✅            | ✅            | ✅           |
| ERC-3525 | ✅         | ✅            | ✅            | ✅           |
| ERC-4626 | ✅         | ✅            | ✅            | ✅           |

#### Testing Steps

1. **Standard Selection**
   - Select each token standard
   - Verify form updates correctly
   - Check validation messages

2. **Basic Configuration**
   - Fill required fields (name, symbol, description)
   - Test decimals field (should auto-disable for NFTs)
   - Configure standard-specific basic options
   - Submit and verify success

3. **Advanced Configuration**
   - Toggle advanced mode
   - Test all advanced configuration options
   - Verify complex nested configurations work
   - Test array data entry (attributes, slots, etc.)
   - Submit and verify all data persists

4. **Template Loading**
   - Click "Load Template" button
   - Select different template types
   - Verify fields populate correctly
   - Modify loaded data
   - Submit and verify custom changes persist

5. **Validation Testing**
   - Submit forms with missing required fields
   - Test field validation rules
   - Verify error messages display correctly
   - Test cross-field dependencies

### Token Editing Testing

#### Access Token Edit Forms
```
Navigate to: /tokens/{token-id}/edit
```

#### Test Each Standard's Edit Form

Use the test tokens created by the script:

**ERC-20 Test Tokens:**
- `Test Basic ERC20` (TBE20) - Basic configuration
- `Test Advanced ERC20` (TAE20) - All advanced features

**ERC-721 Test Tokens:**
- `Test Basic NFT` (TBNFT) - Basic NFT collection
- `Test Advanced NFT` (TANFT) - Gaming/advanced features

**ERC-1155 Test Tokens:**
- `Test Multi-Token` (TMT) - Basic multi-token

**ERC-1400 Test Tokens:**
- `Test Security Token` (TST) - Security token with compliance

**ERC-3525 Test Tokens:**
- `Test Semi-Fungible` (TSF) - Semi-fungible with slots

**ERC-4626 Test Tokens:**
- `Test Yield Vault` (TYV) - Yield vault

#### Testing Steps

1. **Basic Field Editing**
   - Edit name, symbol, description
   - Verify changes save correctly
   - Test validation on invalid inputs

2. **Standard-Specific Properties**
   - Edit all standard-specific fields
   - Test toggle buttons and checkboxes
   - Verify complex configurations (fees, royalties, etc.)

3. **Array Data Management**
   - **ERC-721**: Edit token attributes
   - **ERC-1155**: Manage token types
   - **ERC-1400**: Edit partitions and controllers
   - **ERC-3525**: Manage slots
   - **ERC-4626**: Edit strategy parameters and allocations

4. **Validation on Edit**
   - Test field validation rules
   - Verify required field checking
   - Test data type validation

5. **Save Functionality**
   - Test save button
   - Verify success/error messages
   - Confirm changes persist after page refresh

## Detailed Testing Scenarios

### ERC-20 Specific Tests

**Basic Mode:**
- Simple utility token creation
- Basic mintable/burnable flags
- Supply cap configuration

**Advanced Mode:**
- Governance features (voting periods, thresholds)
- Fee-on-transfer configuration
- Rebasing mechanisms
- Permit functionality
- Snapshot capabilities
- Access control (roles vs ownable)

### ERC-721 Specific Tests

**Basic Mode:**
- NFT collection with metadata URI
- Royalty configuration
- Basic minting controls

**Advanced Mode:**
- Gaming asset configuration
- Dynamic metadata
- Batch minting configuration
- Sales configuration
- Complex attribute systems
- Whitelist management

### ERC-1155 Specific Tests

**Basic Mode:**
- Multi-token with fungible/non-fungible types
- Basic batch operations

**Advanced Mode:**
- Container functionality
- Complex token type configurations
- Dynamic URI management
- Advanced batch transfer limits

### ERC-1400 Specific Tests

**Basic Mode:**
- Security token with KYC requirements
- Basic compliance settings
- Partition management

**Advanced Mode:**
- Complex compliance automation
- Geographic restrictions
- Multi-class securities
- Advanced controller permissions
- Corporate actions

### ERC-3525 Specific Tests

**Basic Mode:**
- Semi-fungible tokens with slots
- Value transfer capabilities

**Advanced Mode:**
- Financial instruments
- Fractional ownership
- Complex slot configurations
- Value aggregation

### ERC-4626 Specific Tests

**Basic Mode:**
- Simple yield vault
- Basic asset management

**Advanced Mode:**
- Multi-strategy vaults
- Automated rebalancing
- Complex fee structures
- Asset allocation management

## Validation Testing

### Form Validation Tests

1. **Required Fields**
   - Submit empty forms
   - Verify error messages
   - Test field highlighting

2. **Data Type Validation**
   - Enter invalid numbers in numeric fields
   - Test address format validation
   - Verify percentage ranges

3. **Business Logic Validation**
   - Test supply cap vs initial supply
   - Verify royalty percentage limits
   - Test address format requirements

### Database Validation Tests

1. **Data Persistence**
   - Create token and verify in database
   - Edit token and confirm changes saved
   - Test complex nested data structures

2. **Relationship Integrity**
   - Verify standard-specific properties link correctly
   - Test array data relationships
   - Confirm cascade deletion works

## Performance Testing

### Load Testing
- Create multiple tokens rapidly
- Test form responsiveness with large datasets
- Verify UI remains responsive during saves

### Data Volume Testing
- Test tokens with maximum configuration complexity
- Large arrays (many attributes, slots, etc.)
- Verify performance with extensive metadata

## Error Handling Testing

### Network Errors
- Test behavior with network disconnection
- Verify error messages for API failures
- Test retry mechanisms

### Validation Errors
- Comprehensive invalid data testing
- Error message clarity and usefulness
- Recovery from error states

### Database Errors
- Test constraint violations
- Verify graceful handling of DB errors
- Test transaction rollback scenarios

## Browser Compatibility Testing

### Supported Browsers
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Mobile Testing
- Responsive design verification
- Touch interface testing
- Mobile form validation

## Accessibility Testing

### Screen Reader Compatibility
- Test with NVDA/JAWS
- Verify form label associations
- Test keyboard navigation

### Keyboard Navigation
- Tab order verification
- Enter key functionality
- Escape key handling

## Reporting Issues

### Bug Report Template
When reporting issues, include:

1. **Environment Information**
   - Browser and version
   - Operating system
   - Screen resolution

2. **Steps to Reproduce**
   - Exact sequence of actions
   - Data entered
   - Expected vs actual behavior

3. **Evidence**
   - Screenshots/screen recordings
   - Console errors
   - Network requests (if applicable)

4. **Impact Assessment**
   - Severity (critical, high, medium, low)
   - Affected functionality
   - Workaround availability

## Cleanup

### Remove Test Tokens
After testing, clean up test tokens by:

1. Using the UI to delete tokens individually
2. Running a cleanup script (if available)
3. Direct database deletion (development only)

### Database Reset
For development environments:
```sql
-- CAUTION: This deletes all tokens and related data
DELETE FROM token_erc20_properties WHERE token_id IN (
  SELECT id FROM tokens WHERE metadata->>'testToken' = 'true'
);
-- Repeat for other standards...
DELETE FROM tokens WHERE metadata->>'testToken' = 'true';
```

## Success Criteria

### Creation Testing ✅
- [ ] All 6 standards create successfully in basic mode
- [ ] All 6 standards create successfully in advanced mode  
- [ ] Template loading works for all standards
- [ ] All validation rules work correctly
- [ ] Database records created correctly for main token + properties + arrays

### Editing Testing ✅
- [ ] All fields editable for each standard
- [ ] Array data can be added/modified/removed
- [ ] Validation works on edit forms
- [ ] Database updates persist correctly
- [ ] Complex nested data structures update properly

### Integration Testing ✅
- [ ] Create → Edit → Update workflows work end-to-end
- [ ] Error conditions handled gracefully
- [ ] Performance acceptable under normal load
- [ ] UI responsive and intuitive

## Support

For testing support or questions:
1. Check the comprehensive testing strategy document
2. Review the diagnostic script output
3. Examine console logs for detailed error information
4. Contact the development team with specific error details

---

**Note**: This testing guide is designed to be comprehensive. Not every test case may apply to your specific use case, but following this guide will ensure robust validation of the token management system.
