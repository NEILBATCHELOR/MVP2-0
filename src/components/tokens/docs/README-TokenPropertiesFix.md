# Token Properties and Config Mode Fixes

## Issues Summary

Several issues were identified and fixed regarding token properties and configuration mode in the token service:

1. **Missing Token Properties**: The ERC-20 token properties `fee_on_transfer`, `rebasing`, and `governance_features` were not being properly populated in the database.

2. **Incorrect Configuration Mode**: The `config_mode` was set to 'basic'/'advanced' instead of 'min'/'max' which caused type mismatches.

3. **Total Supply and Cap Mismatch**: When a token had a cap value greater than 0, the total_supply was not being properly set to match the cap.

## Root Causes

1. **Missing Properties**: The token templates did not include the advanced features in the blocks object, which is used to populate the database.

2. **Config Mode Type Mismatch**: The token templates were using 'basic'/'advanced' as ConfigMode values, while the database expects 'min'/'max'.

3. **Total Supply and Cap Logic**: The createToken and updateToken functions did not have the logic to set total_supply equal to cap when cap > 0.

## Solutions

### 1. Fixed Token Templates

Updated the ERC-20 token templates to include all required properties in the blocks object:

```typescript
blocks: {
  // ... existing properties ...
  fee_on_transfer: {
    enabled: true,
    fee: "2.5",
    recipient: "0x0000000000000000000000000000000000000000",
    feeType: "percentage"
  },
  rebasing: {
    enabled: false,
    mode: "automatic",
    targetSupply: "2000000"
  },
  governance_features: {
    enabled: false,
    votingPeriod: 7,
    proposalThreshold: "1000",
    quorumPercentage: "4"
  }
}
```

### 2. Fixed Config Mode Types

Changed the ConfigMode type and updated the getTemplateForStandard function:

```typescript
// Configuration modes
type ConfigMode = 'min' | 'max';

export function getTemplateForStandard(standard: TokenStandard, mode: ConfigMode = 'min') {
  // Updated comparisons to use 'min' instead of 'basic'
  switch (standard) {
    case TokenStandard.ERC20:
      return mode === 'min' ? erc20BasicTemplate : erc20AdvancedTemplate;
    // ...other cases...
  }
}
```

### 3. Added Total Supply and Cap Logic

Modified the createToken and updateToken functions to set total_supply equal to cap when cap > 0:

```typescript
// In createToken
if (processedBlocks.cap && parseFloat(processedBlocks.cap) > 0) {
  tokenRecord.total_supply = processedBlocks.cap;
}

// In updateToken
if (tokenUpdate.blocks && 
    typeof tokenUpdate.blocks === 'object' && 
    'cap' in tokenUpdate.blocks && 
    tokenUpdate.blocks.cap && 
    typeof tokenUpdate.blocks.cap === 'string' && 
    parseFloat(tokenUpdate.blocks.cap) > 0) {
  tokenUpdate.total_supply = tokenUpdate.blocks.cap;
}
```

## Impact

These fixes ensure that:

1. All ERC-20 token properties are properly stored in the database.
2. The configuration mode correctly matches between the UI and database.
3. Token cap and total supply are consistent, following the rule that when cap > 0, total_supply = cap.

## Verification

The fixes were tested by creating and updating tokens with various configuration options, verifying that:

1. Advanced features (fee_on_transfer, rebasing, governance_features) are correctly saved to the database.
2. Configuration mode is correctly handled as 'min' or 'max'.
3. When setting a cap > 0, the total supply is automatically set to match the cap value.