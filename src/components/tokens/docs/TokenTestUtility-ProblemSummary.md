# TokenTestUtility Component: Problem Summary and Solutions

## Overview
The TokenTestUtility component is a critical part of the token management system, allowing developers to test token CRUD operations against the Supabase database. Several issues were identified and fixed to improve its reliability and usability.

## Issue 1: Incorrect Function for Fetching Tokens

### Problem
The component was using `getToken(projectId)` which is designed to fetch a single token by ID, causing this error:
```
Failed to fetch token IDs: Error: Failed to get token: JSON object requested, multiple (or no) rows returned
```

### Solution
- Updated the code to use `getTokensByProject(projectId)` which is designed for fetching multiple tokens for a project
- Improved error handling with more detailed error messages
- Enhanced the UI to provide better feedback during loading and when no tokens are available

### Code Changes
```typescript
// Before (incorrect)
const tokens = await getToken(projectId);

// After (correct)
const tokens = await getTokensByProject(projectId);
```

## Issue 2: Missing Required Fields in Blocks Data

### Problem
The token templates were missing required fields in the `blocks` data structure:
```
Operation failed: Token creation failed: Failed to create main token record: ERC-20 tokens require name and symbol in blocks data
```

### Solution
Updated all token templates to include `name` and `symbol` in the `blocks` object:

```typescript
// Before
const erc20BasicTemplate = {
  name: "My ERC-20 Token",
  symbol: "MET",
  standard: TokenStandard.ERC20,
  decimals: 18,
  description: "A basic ERC-20 fungible token",
  initialSupply: "1000000",
  config_mode: "min"
};

// After
const erc20BasicTemplate = {
  name: "My ERC-20 Token",
  symbol: "MET",
  standard: TokenStandard.ERC20,
  decimals: 18,
  description: "A basic ERC-20 fungible token",
  initialSupply: "1000000",
  config_mode: "min",
  blocks: {
    name: "My ERC-20 Token",
    symbol: "MET"
  }
};
```

This change was applied to all templates for all supported token standards.

## Issue 3: Duplicate Key Conflicts When Creating Token Properties

### Problem
When creating or updating tokens, the following error would occur:
```
[TokenService] Failed to insert token_erc20_properties record: {code: '23505', details: 'Key (token_id)=(7ec69ea3-ce6b-447d-babe-ee7097fb0071) already exists.', hint: null, message: 'duplicate key value violates unique constraint "one_property_per_token"'}
```

### Solution
Updated the `createStandardSpecificRecords` function to check if a record already exists and update it instead of trying to insert a new one:

```typescript
// Check if a token property record already exists
const { data: existingRecord } = await supabase
  .from(standardTable as any)
  .select('*')
  .eq('token_id', tokenId)
  .maybeSingle();
  
const recordExists = existingRecord !== null;

// If the record exists, update it; otherwise, insert a new one
if (recordExists) {
  const result = await supabase
    .from(standardTable as any)
    .update(propertyRecord)
    .eq('token_id', tokenId)
    .select()
    .single();
  // ...
} else {
  const result = await supabase
    .from(standardTable as any)
    .insert(propertyRecord)
    .select()
    .single();
  // ...
}
```

This approach prevents conflicts when testing with the same token repeatedly.

## Issue 4: Config Mode Value Mismatch

### Problem
Validation errors were occurring due to a mismatch between UI config mode values and database expected values:
```
[TokenTestUtility] Validation errors: config_mode - Invalid discriminator value. Expected 'min' | 'max'
```

### Solution
1. Updated the `validateTokenData` function to map between UI and schema values:
```typescript
// Map config_mode values to schema-compatible ones
let configMode = 'max';
if (data.config_mode) {
  // Map UI values to database values
  if (data.config_mode === 'basic') {
    configMode = 'min';
  } else if (data.config_mode === 'advanced') {
    configMode = 'max';
  } else if (data.config_mode === 'min' || data.config_mode === 'max') {
    configMode = data.config_mode;
  }
}

// Add config_mode if not present to satisfy discriminated union
const processedData = {
  ...data,
  config_mode: configMode
};
```

2. Updated token templates to use database-compatible values for config_mode.

## Additional Improvements

1. Enhanced error logging with more context information
2. Added a "Clear Response" button for easier testing workflow
3. Improved loading states and UI feedback
4. Added documentation to explain the fixes and requirements

## Remaining Considerations

1. Add pagination for projects with many tokens
2. Show token name/symbol in the selection dropdown instead of just IDs
3. Implement sorting and filtering for token lists
4. Add transaction-based approach for token creation to ensure atomicity
5. Improve cleanup processes for deleted tokens
6. Add unit tests for validation logic