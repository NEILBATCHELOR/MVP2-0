# Token Test Utility Config Mode Fix

## Issue Summary
The TokenTestUtility component was experiencing a validation error when trying to create or update tokens:

```
[TokenTestUtility] Validation errors: config_mode - Invalid discriminator value. Expected 'min' | 'max'
```

The error occurred because of a mismatch between the UI configuration mode values (`basic` and `advanced`) and the database/schema expected values (`min` and `max`).

## Root Cause
1. The token templates were using `basic` and `advanced` as `config_mode` values
2. The validation schema (using Zod) expected `min` or `max` as defined in `baseSchema.ts`
3. The database stores tokens with `config_mode: "min"` as shown by the query results

## Solution
Two changes were made to fix this issue:

### 1. Updated Token Data Validation
Modified the `validateTokenData` function in `tokenDataValidation.ts` to properly map between UI and schema values:

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

### 2. Updated Token Templates
Changed all token template `config_mode` values to use the database-compatible values:
- `basic` → `min`
- `advanced` → `max`

This ensures that templates generated from the UI have values that will pass validation.

## Testing
The changes allow tokens to be created and updated successfully without validation errors. The system now properly handles the mapping between UI modes and database configuration values.

## Future Considerations
1. Consider standardizing on a single set of mode names across the UI, validation logic, and database to avoid this type of mismatch
2. Add documentation to explicitly clarify the relationship between `basic`/`advanced` UI modes and `min`/`max` database values
3. Add unit tests to ensure configuration mode validation works correctly with different input values 