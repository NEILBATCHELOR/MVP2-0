# Governance Features Type Fix

## Issue Summary
The TokenTestUtility component was encountering a validation error when trying to create or update ERC-20 tokens with governance features enabled:

```
[TokenTestUtility] Validation errors: governanceFeatures.votingPeriod - Expected number, received string
```

This validation error occurred because there was a type mismatch between how the governance features were defined in the token template and what the validation schema expected.

## Root Cause
1. In the ERC-20 advanced template (`erc20AdvancedTemplate`), the `votingPeriod` property was defined as a string:
```javascript
governanceFeatures: {
  enabled: false,
  votingPeriod: "7", // String value
  proposalThreshold: "1000",
  quorumPercentage: "4"
},
```

2. However, in the validation schema (`erc20Schema.ts`), `votingPeriod` was defined as a number:
```javascript
governanceFeatures: z.object({
  enabled: z.boolean(),
  votingPeriod: z.number().optional(), // Expecting a number
  votingThreshold: z.string().optional(),
}).optional(),
```

This type mismatch caused the validation to fail when the user tried to create an ERC-20 token using the advanced template.

## Solution
Updated the `erc20AdvancedTemplate` to use a number for `votingPeriod` instead of a string:

```javascript
governanceFeatures: {
  enabled: false,
  votingPeriod: 7, // Now a number
  proposalThreshold: "1000",
  quorumPercentage: "4"
},
```

This change ensures that the template data matches the expected type in the validation schema.

## Testing
The change allows tokens to be created with governance features without validation errors. The TokenTestUtility can now properly validate and process tokens with governance features enabled.

## Future Considerations
1. Consider using consistent types across all numeric values in templates and validation schemas
2. Add more comprehensive template validation to catch these issues before they reach the user
3. Consider updating the validation schema to be more flexible with numeric inputs (e.g., accepting both strings and numbers for numeric values)
4. Keep template data types aligned with schema expectations when adding new features