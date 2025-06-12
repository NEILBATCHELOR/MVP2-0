# ERC-20 Form Handling Improvements

## Overview

We've implemented comprehensive improvements to the ERC-20 token form handling to ensure consistency between:
1. Form data (what users see and input)
2. Database schema (how data is stored)
3. Business models (how data is used in the application)

These improvements address previous issues where data was inconsistently mapped between these different layers, causing validation errors and UI inconsistencies.

## Key Improvements

### 1. Enhanced Mappers

We've expanded the `erc20Mapper.ts` file to include:

- **Database to Model mapping**: Ensures consistent transformation from snake_case database fields to camelCase model properties
- **Model to Database mapping**: Properly converts camelCase model properties back to snake_case database fields
- **Form to Database mapping**: Handles transformation from form schema data directly to database format
- **Database to Form mapping**: Creates properly structured form data from database records
- **Client-side validation**: Added comprehensive validation for all ERC-20 fields

### 2. Improved ERC20 Service

The ERC20 service now includes:

- **Consistent error handling**: Better error messaging and structured error responses
- **Form-specific update method**: A dedicated method for handling form data submissions
- **Property existence check**: Helper to check if a token already has ERC-20 properties
- **Enhanced type safety**: More explicit typing for all operations

### 3. Updated Form Component

The ERC20EditForm component now uses:

- **Memoized default values**: More efficient form initialization with proper defaults
- **Comprehensive validation**: Client-side validation before submission
- **Better error display**: Structured error handling and display
- **Proper model state management**: Consistent handling of form state

### 4. Standardized Token Mapper Service

The token mapper service now properly handles:

- **Form data processing**: Consistent processing of form data for all token standards
- **Schema-based submissions**: Direct handling of zod schema validated form data
- **Token ID management**: Proper token ID tracking throughout the mapping process

## Files Updated

We made changes to the following files:

1. `src/components/tokens/utils/mappers/erc20Direct/erc20Mapper.ts` - Enhanced the mapper with comprehensive type conversion and validation functions
2. `src/components/tokens/services/erc20Service.ts` - Added specialized form update method with structured error handling
3. `src/components/tokens/forms/ERC20EditForm.tsx` - Updated the form to use the improved mappers and validation
4. `src/components/tokens/utils/mappers/tokenMapperService.ts` - Updated to use the enhanced ERC20 mappers and handle form schema data
5. `src/components/tokens/services/tokenUpdateService.ts` - Updated to handle specialized form data and use the improved mappers
6. Created comprehensive readme with documentation (`README-ERC20-IMPROVEMENTS.md`)

## Implementation Details

### New Functions Added

1. **mapERC20FormToDatabase**: Converts form schema data directly to database format
2. **mapDatabaseToERC20Form**: Converts database records to form data with proper defaults
3. **validateERC20TokenData**: Client-side validation function for ERC20 form data
4. **updateERC20FromForm**: Specialized service function for handling form submissions
5. **hasERC20Properties**: Helper to check if a token already has ERC20 properties
6. **processTokenFormDataForDB**: Generic processor for token form data
7. **processFormSchema**: Handler for schema-based form submissions

### Key Workflow Changes

1. **Form Submission Flow**:
   - Form data is validated with Zod schema
   - Client-side validation is performed with `validateERC20TokenData`
   - Form data is passed directly to `updateERC20FromForm` without manual mapping
   - The service handles all mapping and database operations with proper error handling

2. **Form Initialization Flow**:
   - Token data is fetched with `getERC20Token`
   - Form defaults are generated with `mapDatabaseToERC20Form`
   - Default values are memoized to prevent unnecessary re-renders

3. **Token Update Flow**:
   - `tokenUpdateService` now checks for specialized form data
   - If specialized form data is detected, it uses the specialized service method
   - Otherwise, it falls back to the standard update process with improved mapping

## Data Flow Architecture

The improved data flow follows this pattern:

1. **Database → Model**: Using `mapERC20PropertiesToModel`
2. **Model → UI Form**: Using `mapDatabaseToERC20Form`
3. **Form → Validation**: Using Zod schemas and `validateERC20TokenData`
4. **Validated Form → Database**: Using `mapERC20FormToDatabase`

## Benefits

- **Type Safety**: Stronger typing throughout the entire process
- **Consistency**: Consistent naming and structure across layers
- **Validation**: Comprehensive validation at multiple levels
- **Error Handling**: Structured error responses with actionable feedback
- **Default Values**: Better handling of optional fields and nested objects

## Usage Examples

### 1. Retrieving and Displaying a Token

```typescript
// Get token with properties
const token = await getERC20Token(tokenId);

// Map to form data for UI
const formData = mapDatabaseToERC20Form(
  token.erc20Properties,
  token.configMode === 'max' ? 'max' : 'min'
);

// Use in form component
<ERC20EditForm token={token} onSave={handleSave} />
```

### 2. Saving Form Data

```typescript
// In form submit handler
const handleSubmit = async (data: ERC20SchemaType) => {
  // Client-side validation
  const validation = validateERC20TokenData(data);
  if (!validation.valid) {
    // Handle validation errors
    return;
  }
  
  // Save using the specialized service
  const result = await updateERC20FromForm(tokenId, data);
  
  if (result.success) {
    // Success handling
  } else {
    // Error handling using result.errors
  }
};
```

## Field Mapping Reference

| Database Field (snake_case) | Model Property (camelCase) | Form Field |
|----------------------------|---------------------------|------------|
| `token_id`                 | `tokenId`                 | -          |
| `initial_supply`           | `initialSupply`           | `initialSupply` |
| `cap`                      | `cap`                     | `cap`      |
| `is_mintable`              | `isMintable`              | `isMintable` |
| `is_burnable`              | `isBurnable`              | `isBurnable` |
| `is_pausable`              | `isPausable`              | `isPausable` |
| `token_type`               | `tokenType`               | `tokenType` |
| `access_control`           | `accessControl`           | `accessControl` |
| `allow_management`         | `allowManagement`         | `allowanceManagement` |
| `permit`                   | `permit`                  | `permit`   |
| `snapshot`                 | `snapshot`                | `snapshot` |
| `fee_on_transfer`          | `feeOnTransfer`           | `feeOnTransfer` |
| `rebasing`                 | `rebasing`                | `rebasing` |
| `governance_features`      | `governanceFeatures`      | `governanceFeatures` |

## Handling Complex Objects

For nested objects like `feeOnTransfer`, the mappers handle:

1. **Enabling/disabling** the feature
2. **Default values** for all nested properties
3. **Type conversion** between JSON and typed objects
4. **Validation** of all nested fields

## Future Improvements

1. Apply similar improvements to other token standards (ERC-721, ERC-1155, etc.)
2. Create a more generic mapping system that can be extended for new token standards
3. Add more comprehensive unit tests for the mappers and validation

## Conclusion

These improvements provide a more robust, type-safe, and maintainable approach to handling ERC-20 token data throughout the application. By ensuring consistency between form data, business models, and database records, we eliminate a common source of bugs and improve the developer experience. 