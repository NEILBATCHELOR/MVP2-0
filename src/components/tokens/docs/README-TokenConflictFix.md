# Token Test Utility Conflict Fix

## Issue Summary
After fixing the `blocks` data in the token templates, a new error occurred:

```
[TokenService] Failed to insert token_erc20_properties record: {code: '23505', details: 'Key (token_id)=(7ec69ea3-ce6b-447d-babe-ee7097fb0071) already exists.', hint: null, message: 'duplicate key value violates unique constraint "one_property_per_token"'}
```

This error occurs when trying to create token properties, but a record with the same token ID already exists in the database. This can happen if:
1. A previous token creation attempt partially succeeded
2. The token was created but not all associated records were properly cleaned up
3. Multiple rapid token creation attempts are made with the same token ID

## Root Cause
The `createStandardSpecificRecords` function was using an `insert` operation without first checking if a record already existed for the token ID. Since the `token_erc20_properties` table has a unique constraint on the `token_id` column, this causes a conflict error.

## Solution
Updated the `createStandardSpecificRecords` function to:

1. First check if a record already exists for the token ID
```typescript
const { data: existingRecord } = await supabase
  .from(standardTable as any)
  .select('*')
  .eq('token_id', tokenId)
  .maybeSingle(); // Use maybeSingle to avoid error if no record
  
const recordExists = existingRecord !== null;
```

2. Use the appropriate operation based on whether the record exists
```typescript
// If the record exists, update it; otherwise, insert a new one
if (recordExists) {
  const result = await supabase
    .from(standardTable as any)
    .update(propertyRecord)
    .eq('token_id', tokenId)
    .select()
    .single();
  
  propertiesData = result.data;
  propertiesError = result.error;
} else {
  const result = await supabase
    .from(standardTable as any)
    .insert(propertyRecord)
    .select()
    .single();
  
  propertiesData = result.data;
  propertiesError = result.error;
}
```

This approach ensures that:
- If the token properties record doesn't exist, it will be created
- If it already exists, it will be updated instead of causing a conflict error
- The function continues to work the same way for new tokens

## Testing
The changes allow tokens to be created successfully even if there's a pre-existing record for the token ID, preventing the conflict error. This makes the TokenTestUtility more robust when testing with the same token repeatedly.

## Future Considerations
1. Apply similar checks in the array-related functions to prevent conflicts with array data
2. Add better error handling and recovery mechanisms for partial token creation failures
3. Consider implementing a transaction-based approach to ensure that token creation is atomic
4. Improve cleanup processes to ensure that deleted tokens don't leave orphaned records 