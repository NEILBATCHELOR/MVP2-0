# GlobalRedemptionRequestList Export Fix

**Date:** June 10, 2025  
**Issue:** SyntaxError - The requested module does not provide an export named 'GlobalRedemptionRequestList'

## Problem Analysis

The error occurred at `/src/components/redemption/requests/index.ts:9:10` where the index file was trying to import `GlobalRedemptionRequestList` as a named export:

```typescript
export { GlobalRedemptionRequestList } from './GlobalRedemptionRequestList';
```

However, the `GlobalRedemptionRequestList.tsx` file was using a **default export**:

```typescript
function GlobalRedemptionRequestList(...) {
  // component code
}

export default GlobalRedemptionRequestList;
```

## Solution

Changed the component to use a **named export** to match the import pattern:

### Before:
```typescript
function GlobalRedemptionRequestList(...) {
  // component code
}

export default GlobalRedemptionRequestList;
```

### After:
```typescript
export function GlobalRedemptionRequestList(...) {
  // component code
}
```

## Changes Made

1. **Added `export` to function declaration**: Changed `function` to `export function`
2. **Removed default export statement**: Removed `export default GlobalRedemptionRequestList;`

## Result

- ✅ Export/import mismatch resolved
- ✅ Component now uses consistent named export pattern
- ✅ SyntaxError should no longer occur
- ✅ Component can be properly imported by index.ts

## Files Modified

- `/src/components/redemption/requests/GlobalRedemptionRequestList.tsx`

## Testing

The component should now load without the SyntaxError and be properly available for import throughout the application.
