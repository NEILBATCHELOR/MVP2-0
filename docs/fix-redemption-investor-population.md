# Fix: Redemption Request Investor Data Population

## Problem
When creating redemption requests, the `investor_name` and `investor_id` fields in the `redemption_requests` table were not being properly populated. This resulted in:
- `investor_name` showing as `null`
- `investor_id` showing as `"current-user"` placeholder

## Root Cause
1. The redemption form was not passing investor details from the selected distribution
2. The redemption service was not automatically fetching investor information from the related distribution and investor tables
3. The `CreateRedemptionRequestInput` type didn't include `distributionId` to enable automatic lookup

## Solution

### 1. Enhanced Redemption Service (`redemptionService.ts`)
**Changes Made:**
- Added logic to automatically fetch investor details when `distributionId` is provided
- If `distributionId` is available, the service now:
  1. Queries the `distributions` table to get the `investor_id`
  2. Queries the `investors` table to get the investor `name`
  3. Auto-populates both fields in the redemption request

**Code Added:**
```typescript
// Auto-populate investor details if distributionId is provided
let investorName = input.investorName;
let investorId = input.investorId;

if (input.distributionId && !investorName) {
  // Fetch distribution to get investor_id
  const { data: distribution, error: distError } = await supabase
    .from('distributions')
    .select('investor_id')
    .eq('id', input.distributionId)
    .single();
    
  if (distribution && !distError) {
    investorId = distribution.investor_id;
    
    // Fetch investor details using the investor_id from distribution
    const { data: investor, error: invError } = await supabase
      .from('investors')
      .select('name')
      .eq('investor_id', distribution.investor_id)
      .single();
      
    if (investor && !invError) {
      investorName = investor.name;
    }
  }
}
```

### 2. Updated Type Definition (`redemption.ts`)
**Changes Made:**
- Added `distributionId?: string` to `CreateRedemptionRequestInput`
- Updated comments to clarify auto-population behavior

**Before:**
```typescript
export interface CreateRedemptionRequestInput {
  tokenAmount: number;
  // ... other fields
  investorName?: string;
  investorId?: string;
}
```

**After:**
```typescript
export interface CreateRedemptionRequestInput {
  distributionId?: string; // Distribution ID to auto-populate investor details
  tokenAmount: number;
  // ... other fields
  investorName?: string; // Auto-populated from distribution if not provided
  investorId?: string; // Auto-populated from distribution if not provided
}
```

### 3. Updated Redemption Forms
**RedemptionRequestForm.tsx:**
- Now passes `distributionId` and `investorName` when creating requests
- Extracts investor name from `selectedDistribution.investor?.name` or `investorData?.name`

**OperationsRedemptionForm.tsx:**
- Added `distributionId` to the request input for proper linking

## Data Flow

### Before Fix
```
User selects distribution → Form creates request with placeholder values → Database stores null/placeholder
```

### After Fix
```
User selects distribution → Form passes distributionId + investor details → Service auto-populates missing data → Database stores actual investor information
```

## Database Impact

### Current State (Before Fix)
```sql
SELECT investor_name, investor_id FROM redemption_requests;
-- Result: investor_name = null, investor_id = "current-user"
```

### Expected State (After Fix)
```sql
SELECT investor_name, investor_id FROM redemption_requests;
-- Result: investor_name = "Neil Batchelor", investor_id = "0d11e3dd-cf11-401e-94e1-854c1cdd4077"
```

## Files Modified

1. **`/src/components/redemption/services/redemptionService.ts`**
   - Enhanced `createRedemptionRequest()` method with auto-population logic

2. **`/src/components/redemption/types/redemption.ts`**
   - Added `distributionId` field to `CreateRedemptionRequestInput`
   - Updated comments for clarity

3. **`/src/components/redemption/requests/RedemptionRequestForm.tsx`**
   - Modified `onSubmit()` to pass `distributionId` and `investorName`

4. **`/src/components/redemption/requests/OperationsRedemptionForm.tsx`**
   - Added `distributionId` to the request input

## Validation Scripts Created

### Test Script: `scripts/test-redemption-investor-population.ts`
- Creates a test redemption request using the enhanced service
- Verifies that investor data is properly populated
- Cleans up test data automatically

### Migration Script: `scripts/backfill-redemption-investor-data.ts`
- Backfills existing redemption requests with proper investor data
- Uses `distribution_redemptions` table to find the correct investor information
- Handles cases where investor data is missing or incomplete

## Testing

### Manual Testing
1. Run the test script: `npx ts-node scripts/test-redemption-investor-population.ts`
2. Create a new redemption request via the form
3. Check database to confirm investor data is properly populated

### Expected Results
- ✅ `investor_name` should contain the actual investor name (e.g., "Neil Batchelor")
- ✅ `investor_id` should contain the UUID from the investors table
- ✅ No more null values or "current-user" placeholders

## Benefits

1. **Data Integrity**: Redemption requests now have complete investor information
2. **Traceability**: Better audit trail linking redemptions to specific investors
3. **Automation**: Reduces manual data entry and potential errors
4. **Consistency**: Ensures all redemption requests follow the same data population pattern

## Backwards Compatibility

- The changes are backwards compatible
- Existing code will continue to work
- The `distributionId` field is optional, so old form submissions won't break
- The service falls back to manual `investorName`/`investorId` if `distributionId` is not provided

## Next Steps

1. Deploy the changes to staging environment
2. Run validation scripts to test functionality
3. Consider running the backfill script to fix existing data
4. Monitor redemption request creation to ensure proper data population

---

**Status**: ✅ COMPLETED  
**Impact**: HIGH - Fixes critical data integrity issue  
**Risk**: LOW - Backwards compatible changes  
**Testing**: Automated test script provided
