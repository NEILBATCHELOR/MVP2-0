# Config Mode Fix

## Issue Summary

The token creation system had two configuration mode issues:

1. **Type Mismatch**: The token templates module (`tokenTemplates.ts`) was using 'min' and 'max' for configuration modes while the token creation page (`CreateTokenPage.tsx`) was using 'basic' and 'advanced'

2. **Database Enum Constraint**: The database has a `token_config_mode_enum` type constraint that requires the `config_mode` field to be set to 'min' or 'max', but the configuration mode wasn't being explicitly set during token creation.

## Affected Files

- `src/components/tokens/testing/tokenTemplates.ts` - Updated to use 'min'/'max' instead of 'basic'/'advanced'
- `src/components/tokens/pages/CreateTokenPage.tsx` - Updated to handle the configuration mode correctly

## Root Cause

1. The `ConfigMode` type in tokenTemplates.ts was updated to use 'min'/'max' values, but CreateTokenPage.tsx was still using the old 'basic'/'advanced' values.

2. When creating tokens and loading templates, the `config_mode` field in the database needed to be explicitly set to match the configuration mode type constraint in Supabase (`token_config_mode_enum`).

## Solution

### 1. Fixed Type Mismatches

Updated all occurrences in `CreateTokenPage.tsx` where config_mode values were used:

```typescript
// Changed from
const mode = advancedMode ? 'advanced' : 'basic';
// To
const mode = advancedMode ? 'max' : 'min';
```

### 2. Ensured Proper Database Values

1. **Token Creation**: Updated `handleCreateToken` to explicitly set the `config_mode` field:
```typescript
tokenCreateData = {
  ...mappedData.tokenRecord,
  blocks: mappedData.blocks,
  config_mode: advancedMode ? 'max' : 'min', // Explicitly set config_mode
  metadata: {
    ...metadata,
    ...mappedData.metadata
  },
  status: TokenStatus.DRAFT
};
```

2. **Template Loading**: Updated `handleFileUpload` to ensure the loaded template has the correct `config_mode`:
```typescript
// Ensure config_mode is set correctly before updating token data
const dataWithCorrectConfigMode = {
  ...uploadedData,
  config_mode: isAdvancedTemplate ? 'max' : 'min'
};
            
// Update token data with uploaded values
setTokenData(prevData => ({
  ...prevData,
  ...dataWithCorrectConfigMode
}));
```

## Impact

1. **TypeScript Errors Resolved**: The type mismatches between components are now fixed.

2. **Database Compatibility**: Tokens are now created with a valid `config_mode` value that matches the database enum constraint.

3. **Consistent Configuration**: Configuration modes are now consistent throughout the application, with 'min'/'max' used internally and 'basic'/'advanced' used in the UI for better user understanding.

The UI still refers to the modes as "basic" and "advanced" for user-friendliness, but the database and internal systems now consistently use "min" and "max" values.