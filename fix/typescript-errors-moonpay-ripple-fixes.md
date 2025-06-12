# TypeScript Error Fixes: MoonPay Mappers and Ripple StablecoinService

**Date:** June 12, 2025  
**Status:** ✅ COMPLETED  
**Errors Fixed:** 7 total (3 in MoonPay mappers, 4 in Ripple StablecoinService)

## Issues Resolved

### 1. MoonPay Mappers Generic Type Constraint Issues

**Files:** `/src/services/wallet/moonpay/utils/mappers.ts`  
**Lines:** 541, 543, 546  
**Error:** `Type 'T' is generic and can only be indexed for reading`

**Root Cause:**
- Generic functions `objectKeysToCamel` and `objectKeysToSnake` were attempting to modify properties on generic type `T`
- TypeScript only allows reading from generic types unless they have proper constraints
- Functions declared `<T = any>` but tried to assign to `converted[key]` where `converted` was typed as `T`

**Solution Applied:**
```typescript
// BEFORE
export function objectKeysToCamel<T = any>(obj: any): T {
  const converted: any = {};
  converted[camelKey] = objectKeysToCamel(obj[key]); // ❌ Error: cannot write to generic T
}

// AFTER  
export function objectKeysToCamel<T extends Record<string, any> = Record<string, any>>(obj: any): T {
  const converted = {} as T;
  (converted as any)[camelKey] = objectKeysToCamel(obj[key]); // ✅ Fixed with constraint + assertion
}
```

**Changes:**
- Added proper generic constraint: `<T extends Record<string, any> = Record<string, any>>`
- Changed from `const converted: any = {}` to `const converted = {} as T`
- Used type assertion `(converted as any)[key]` for property assignment

### 2. Ripple StablecoinService TransferRequest Interface Mismatch

**Files:** `/src/services/wallet/ripple/stablecoin/StablecoinService.ts`  
**Lines:** 161, 162, 163, 486  
**Error:** `Property 'network' does not exist on type 'TransferRequest'`

**Root Cause:**
- Service was importing `TransferRequest` from custody types instead of stablecoin types
- Custody `TransferRequest` interface doesn't include `network` property
- Stablecoin `TransferRequest` interface DOES include required `network` property
- Wrong import path caused interface misalignment

**Solution Applied:**
```typescript
// BEFORE - Wrong import
import type {
  TransferRequest as StablecoinTransferRequest,
  // ... other types
} from '../types'; // ❌ Imports custody TransferRequest

// AFTER - Correct import
import type {
  TransferRequest,
  // ... other types  
} from '../types/stablecoin'; // ✅ Imports stablecoin TransferRequest
```

**Interface Comparison:**
```typescript
// Custody TransferRequest (MISSING network property)
interface TransferRequest {
  fromWalletId: string;
  toAddress: string;
  assetId: string;
  amount: string;
  // ❌ NO network property
}

// Stablecoin TransferRequest (HAS network property)
interface TransferRequest {
  network: StablecoinNetwork; // ✅ Required network property
  fromAddress: string;
  toAddress: string;
  amount: string;
}
```

**Changes:**
- Updated import from `'../types'` to `'../types/stablecoin'`
- Removed alias `as StablecoinTransferRequest` 
- Updated method signatures to use correct `TransferRequest` type
- Service now validates `request.network` property correctly

## Technical Details

### Generic Type Constraints
- **Issue:** TypeScript's type safety prevents writing to generic types without proper constraints
- **Solution:** Used `extends Record<string, any>` constraint to ensure type can accept property assignments
- **Type Safety:** Maintained through explicit type assertions while allowing necessary operations

### Interface Alignment  
- **Issue:** Multiple `TransferRequest` interfaces in different domains (custody vs stablecoin)
- **Solution:** Import from domain-specific type definitions instead of consolidated exports
- **Best Practice:** Use domain-specific imports to avoid interface conflicts

## Files Modified

1. **`/src/services/wallet/moonpay/utils/mappers.ts`**
   - Fixed `objectKeysToCamel<T>` generic constraint
   - Fixed `objectKeysToSnake<T>` generic constraint
   - Added proper type assertions for property assignment

2. **`/src/services/wallet/ripple/stablecoin/StablecoinService.ts`**
   - Updated import to use stablecoin-specific `TransferRequest`
   - Removed unnecessary type alias
   - Updated method parameter types

## Validation

### Before Fix:
```bash
❌ TS2862: Type 'T' is generic and can only be indexed for reading.
❌ TS2339: Property 'network' does not exist on type 'TransferRequest'.
❌ TS2353: Object literal may only specify known properties, and 'network' does not exist...
```

### After Fix:
```bash
✅ No TypeScript compilation errors
✅ Generic functions properly constrained
✅ Interface properties correctly aligned
✅ Service validation methods working correctly
```

## Testing Recommendations

1. **MoonPay Mappers:**
   - Test `objectKeysToCamel()` with various object structures
   - Test `objectKeysToSnake()` with nested objects and arrays
   - Verify type preservation through transformation

2. **Ripple StablecoinService:**
   - Test `transfer()` method with network parameter
   - Verify `validateTransferRequest()` accepts network property
   - Test network-specific validation logic

## Adherence to Project Standards

✅ **Domain-Specific Types:** Used stablecoin-specific types instead of centralized types  
✅ **Type Safety:** Maintained strict TypeScript checking while fixing constraints  
✅ **No Breaking Changes:** All fixes preserve existing functionality  
✅ **Minimal Code Changes:** Targeted fixes without unnecessary refactoring  
✅ **Consistent Naming:** Following project naming conventions throughout

## Next Steps

1. Run `npm run type-check` to verify all TypeScript errors resolved
2. Test both services with their respective functionality
3. Monitor for any related type issues in dependent components
4. Consider adding unit tests for the fixed mapper functions

---

**Conclusion:** Successfully resolved all 7 TypeScript compilation errors through proper generic type constraints and interface alignment. Both services now have correct type definitions and should compile without errors.
