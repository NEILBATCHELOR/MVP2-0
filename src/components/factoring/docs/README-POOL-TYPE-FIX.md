# Pool Type Display Fix

This document outlines the fixes made to address the issue where Pool (pool name) and Type were not displaying correctly in the tokenization factoring interface.

## Issue Description

In the TokenizationManager component, the Pool name and Pool Type columns were not showing the correct values for some tokens. This was due to:

1. The PoolType enum in types.ts was not matching the actual values stored in the database
2. Inconsistent string/number type handling when looking up pools by ID

## Changes Made

### 1. Updated PoolType Enum

The PoolType enum in `src/components/factoring/types.ts` was updated to match the database values:

```typescript
export enum PoolType {
  TOTAL_POOL = "Total Pool",
  TRANCHE = "Tranche"  // Changed from PARTIAL_POOL = "Partial Pool"
}
```

### 2. Added Pool Type Column to Table

Added a dedicated column for Pool Type in the tokens table in TokenizationManager.tsx:

```tsx
<TableHead>Pool Type</TableHead>
...
<TableCell>{pool?.poolType || "Unknown Type"}</TableCell>
```

### 3. Consistent String Conversion for IDs

Updated pool lookup logic to ensure consistent string comparison of IDs:

```typescript
const pool = pools.find(p => String(p.id) === String(token.poolId));
```

### 4. Updated UI References

Updated all UI references to PARTIAL_POOL to use TRANCHE instead, and updated the display text from "Partial Pool" to "Tranche" in PoolManager.tsx.

## Verification

After making these changes, both Pool name and Pool Type should display correctly in the tokenization factoring interface. 