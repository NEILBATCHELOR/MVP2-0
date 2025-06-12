# ERC Token Forms - Improvements for Type System Compliance

Based on the review of the type system architecture, here are recommended improvements to the token edit forms to ensure better alignment with the application's type system hierarchy.

## Current Type System Architecture

The application follows a structured type system hierarchy:

1. **centralModels.ts** - Contains business-level interfaces (UI/UX focused)
2. **database.ts** - Re-exports types from supabase.ts and adds custom types
3. **supabase.ts** - Generated from the Supabase database schema

## Recommended Improvements

### 1. Consistent Type Imports

Update all forms to use the correct type import pattern:

```typescript
// Import database types for direct operations
import type { 
  TokenERC1155PropertiesTable, 
  TokenERC1155TypesTable 
} from '@/types/database';

// Import business model types for UI
import type { 
  TokenERC1155Properties, 
  TokenERC1155Type 
} from '@/types/centralModels';
```

### 2. Type Mapping Between UI and Database

Implement proper type mapping in the update process:

```typescript
// When saving form data
const handleSave = () => {
  // Convert UI-friendly camelCase to database snake_case
  const databaseProperties: TokenERC1155PropertiesTable = {
    token_id: token.id,
    base_uri: properties.baseUri,
    metadata_storage: properties.metadataStorage,
    // Add all mappings...
  };
  
  const updatedToken = {
    ...token,
    erc1155Properties: properties, // For UI consumption
    dbProperties: databaseProperties // For database update
  };
  
  onSave(updatedToken);
};
```

### 3. Field Name Consistency

Ensure all form fields match the centralModels.ts interfaces exactly:

- Use camelCase in UI forms (e.g., `baseUri`, `hasRoyalty`)
- Use TypeScript's type system to enforce correct property names
- Implement a robust mapping between UI fields and database fields

### 4. Form Validation Schema

Update the form validation schemas to align with the type definitions:

```typescript
const propertiesFormSchema = z.object({
  // Use the same fields defined in centralModels.ts
  baseUri: z.string().optional(),
  metadataStorage: z.string().optional(),
  // Continue with all fields from the interface...
});
```

### 5. Type Guards for Runtime Validation

Add type guards when processing form data:

```typescript
import { isTokenERC1155Properties } from '@/utils/typeGuards';

// In handleSave
if (isTokenERC1155Properties(properties)) {
  // Properties match the expected type
  onSave({...token, erc1155Properties: properties});
} else {
  // Handle type mismatch
  console.error('Type mismatch in properties');
}
```

### 6. Specific Field Improvements

#### ERC1155EditForm
- Add explicit type annotations for properties state
- Use the TokenERC1155Properties interface consistently
- Ensure the form includes all fields defined in the database schema

#### ERC3525EditForm
- Improve property mapping for database fields
- Align form fields with TokenERC3525Properties interface
- Handle nested objects properly

#### ERC4626EditForm
- Ensure yieldStrategy is properly typed as either string or Record<string, any>
- Add validation for assetTokenType values
- Correctly map all fee-related fields

## Implementation Strategy

1. Start by ensuring correct type imports
2. Update state initialization to match interface definitions
3. Fix form field mappings to align with the type system
4. Implement proper database field mapping in handleSave functions
5. Add type guards for runtime validation
6. Update validation schemas to match centralModels definitions

By following these recommendations, the forms will maintain better alignment with the application's type system, reducing type errors and improving maintainability.
