# Token Templates Complex Field Handling

This document outlines the implementation of complex field handling for token templates across all supported token standards.

## Overview

We've implemented a comprehensive solution to ensure all complex fields (nested objects and arrays) are properly preserved when:
1. Loading token templates from the database
2. Using templates to create new tokens
3. Editing existing templates

## Token Standards and Complex Fields

Each token standard has specific complex fields that need special handling:

| Standard | Complex Fields |
|----------|----------------|
| ERC-20 | `feeOnTransfer`, `rebasing` |
| ERC-721 | `attributes` |
| ERC-1155 | `tokenTypes` |
| ERC-1400 | `partitions`, `controllers`, `documents`, `geographicRestrictions` |
| ERC-3525 | `slots` |
| ERC-4626 | `feeStructure`, `redemptionPeriods` |

## Implementation Details

### 1. Object Utilities (`objectUtils.ts`)

We've enhanced the object manipulation utilities to properly handle deep copying of complex data structures:

- **`deepMerge`**: Improved to properly handle arrays and nested objects with deep cloning
- **`preserveComplexFields`**: Enhanced to ensure all complex fields are preserved with proper deep cloning

### 2. Token Standard Fields Registry (`tokenStandardFields.ts`)

A centralized registry of all token standards and their complex fields:

- **`TOKEN_STANDARD_FIELDS`**: Maps each standard to its simple and complex fields
- **`getComplexFieldPaths`**: Gets complex field paths for a specific standard
- **`getAllComplexFieldPaths`**: Gets all complex field paths across multiple standards

### 3. Token Template Service (`tokenTemplateService.ts`)

The service has been updated to properly handle complex fields during template retrieval:

- **`rawToTokenTemplate`**: Completely reimplemented to ensure proper complex field preservation
- Special handling for each token standard's specific fields
- Comprehensive logging to track field presence and preservation

### 4. Template Display Component (`TokenTemplateDisplay.tsx`)

The UI component has been enhanced to ensure full data preservation:

- **`handleUseTemplate`**: Improved to properly preserve all complex fields from all standards
- Standard-specific handling for each token type's complex fields
- Deep cloning to prevent reference issues

## Key Improvements

1. **Deep Copying**: All complex fields are now properly deep-copied using `JSON.parse(JSON.stringify())` to prevent reference issues
2. **Comprehensive Coverage**: All token standards and their complex fields are now properly handled
3. **Logging**: Added detailed logging for troubleshooting and verification
4. **Special Case Handling**: Added dedicated handling for each token standard's specific fields

## How it Works

1. When retrieving a template, we identify all configured standards
2. For each standard, we extract and preserve all complex fields from both:
   - The standard-specific config in the metadata
   - Any direct fields at the root level
3. When using a template, we ensure all complex fields are preserved and properly deep-copied
4. Special handling is applied for each token standard's unique fields

## Testing Considerations

When testing these changes, verify the following:

1. **Template Display**: All complex fields should be visible in the template display
2. **Template Usage**: Using a template should preserve all complex fields
3. **Template Editing**: Editing a template should maintain all complex fields
4. **Complex Arrays**: Arrays like `partitions`, `controllers`, and `tokenTypes` should be properly preserved
5. **Complex Objects**: Nested objects like `feeStructure` should be properly preserved

## Future Enhancements

1. Implement unit tests specifically for complex field preservation
2. Add schema validation for each token standard's complex fields
3. Improve UI to better visualize complex fields in templates 