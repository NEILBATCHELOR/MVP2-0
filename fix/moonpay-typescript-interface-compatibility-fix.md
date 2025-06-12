# MoonPay TypeScript Interface Compatibility Fix

## Issue Summary
Fixed TypeScript compilation errors in MoonpayIntegration.tsx caused by incompatible type definitions between OnRamp and OffRamp services.

## Errors Fixed
1. `Property 'totalAmount' is missing in type 'OffRampQuote' but required in type 'OnRampQuote'` (lines 131, 133)
2. `Type 'OffRampTransaction' is missing properties from type 'OnRampTransaction': cryptoCurrency, fiatCurrency, fiatAmount` (line 189)

## Root Cause
The MoonpayIntegration component was designed to handle both buy (OnRamp) and sell (OffRamp) operations but used OnRamp-specific types throughout. The OnRamp and OffRamp services have different type structures:

### OnRamp Types
- `OnRampQuote`: Has `totalAmount` property
- `OnRampTransaction`: Uses `cryptoCurrency`, `fiatCurrency`, `fiatAmount` properties

### OffRamp Types  
- `OffRampQuote`: No `totalAmount`, has `estimatedProcessingTime` and `expiresAt`
- `OffRampTransaction`: Uses `baseCurrency`, `quoteCurrency`, `baseAmount`, `quoteAmount` properties

## Solution Implemented

### 1. Created Unified Types (`/src/services/wallet/moonpay/types/unified.ts`)
- **Union Types**: `MoonpayQuote = OnRampQuote | OffRampQuote`, `MoonpayTransaction = OnRampTransaction | OffRampTransaction`
- **Base Interfaces**: `BaseQuote` and `BaseTransaction` for consistent component logic
- **Type Guards**: Functions to distinguish between OnRamp and OffRamp types at runtime
- **Normalization Functions**: Convert different structures to common format

### 2. Key Functions Added
- `isOnRampQuote()` / `isOffRampQuote()`: Type guards for quotes
- `isOnRampTransaction()` / `isOffRampTransaction()`: Type guards for transactions
- `normalizeQuote()`: Maps any quote to BaseQuote format
- `normalizeTransaction()`: Maps any transaction to common format
- `getQuoteDisplayAmount()`: Handles display logic for both buy/sell operations
- `getTransactionDisplayInfo()`: Extracts common transaction data

### 3. Updated MoonpayIntegration Component
- Replaced OnRamp-specific imports with unified types
- Updated quote display logic to handle both scenarios with proper type checking
- Modified transaction handling to work with both OnRamp and OffRamp operations
- Added conditional rendering based on available properties (e.g., totalAmount)

### 4. Export Updates
- Added unified types to main moonpay service exports
- Created index file for types folder for easier imports

## Files Modified
1. `/src/services/wallet/moonpay/types/unified.ts` - **NEW**: Unified type definitions
2. `/src/services/wallet/moonpay/types/index.ts` - **NEW**: Types export index
3. `/src/components/wallet/components/moonpay/MoonpayIntegration.tsx` - **UPDATED**: Fixed type usage
4. `/src/services/wallet/moonpay/index.ts` - **UPDATED**: Added unified type exports

## Benefits
- **Type Safety**: Maintained strict TypeScript checking while supporting both operations
- **Code Reuse**: Single component handles both buy and sell flows
- **Maintainability**: Clear separation between service-specific and unified types
- **Flexibility**: Easy to add support for new MoonPay service types in the future

## Testing Recommendations
1. Test buy operations with OnRamp flow
2. Test sell operations with OffRamp flow  
3. Verify quote display shows correct amounts for both scenarios
4. Confirm transaction status displays work for both types
5. Check that redirect URLs work for both OnRamp and OffRamp transactions

## Migration Notes
- Existing OnRamp integrations continue to work unchanged
- OffRamp integrations now work seamlessly with the same UI
- Type imports should use unified types for new components
- Service-specific types still available for service-layer code
