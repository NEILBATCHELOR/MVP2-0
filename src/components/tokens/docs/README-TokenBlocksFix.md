# Token Test Utility Blocks Fix

## Issue Summary
The TokenTestUtility component was encountering an error when trying to create tokens:

```
Operation failed: Token creation failed: Failed to create main token record: ERC-20 tokens require name and symbol in blocks data
```

This error occurs because the token database requires that token name and symbol be included in the `blocks` data structure, not just as top-level fields.

## Root Cause
1. The token templates were defining `name` and `symbol` only as top-level properties
2. The database requires these fields to also be present in the `blocks` data structure
3. The database validation specifically checks for `name` and `symbol` in the blocks data

## Solution
Updated all token templates to include a `blocks` property that explicitly contains the token's name and symbol, along with other standard-specific properties:

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

This change was applied to all token templates for all supported token standards:
- ERC-20 (basic and advanced)
- ERC-721 (basic and advanced)
- ERC-1155 (basic and advanced)
- ERC-1400 (basic and advanced)
- ERC-3525 (basic and advanced)
- ERC-4626 (basic and advanced)

## Testing
The changes allow tokens to be created successfully without the validation error. The token creation process now properly stores the name and symbol in the blocks data structure as required by the database.

## Future Considerations
1. Consider updating the `createToken` function to automatically populate the blocks data with the name and symbol from the top-level properties to avoid this error in the future
2. Add validation to check that all templates and user-submitted token data include name and symbol in blocks
3. Document this requirement clearly in the token creation API documentation 