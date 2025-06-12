# ERC-1155 Token Type Mapping Improvements

## Overview

We've implemented fixes to address inconsistencies in property naming between the database schema and UI models for ERC-1155 token types. These changes ensure that token types are properly mapped between snake_case database properties (`max_supply`, `fungibility_type`) and their UI counterparts (`supply`, `fungible`).

## Key Improvements

### 1. Added Extended Interface for UI Model

- Created a new `ERC1155UITokenType` interface that extends `TokenERC1155Type` to include UI-specific properties
- This interface properly types the UI model with properties like `supply`, `fungible`, and `rarityLevel`
- Provides a clean separation between database model and UI model

### 2. Fixed Property Access in Mappers

- Updated the property access in `maxMapper.ts` and `minMapper.ts` to correctly use snake_case when accessing database properties
- Implemented proper conversion from database format to UI format to ensure `tokenTypes` arrays have the expected structure

### 3. Enhanced Type Mapping in ERC1155Service

- Improved the mapper function in `erc1155Service.ts` to correctly handle both `supply` and `maxSupply` properties, prioritizing `supply` for UI-sourced data
- Enhanced the fungibility type conversion to properly handle both boolean `fungible` property and string `fungibilityType` property
- Added explicit mapped properties in the `mapERC1155TypeToModel` function to ensure UI compatibility

### 4. Standardized Token Type Structure

- Ensured that `tokenTypes` arrays in both mappers and service functions generate objects with the expected properties:
  - `id`: Token type identifier
  - `name`: Display name for the token type
  - `supply`: Maximum supply value (UI property)
  - `fungible`: Boolean indicating if the token is fungible (UI property)
  - `rarityLevel`: Optional rarity level for the token type

## Files Updated

1. `/components/tokens/services/erc1155Service.ts`
   - Added new `ERC1155UITokenType` interface for UI models
   - Updated `mapERC1155TypeToModel` to create properly typed objects
   - Added proper type assertions for type safety

2. `/components/tokens/utils/mappers/erc1155/maxMapper.ts`
   - Fixed property access for `max_supply` and `fungibility_type`
   - Added explicit mapping for `tokenTypes` property 

3. `/components/tokens/utils/mappers/erc1155/minMapper.ts`
   - Fixed property access for `max_supply` and `fungibility_type`
   - Added explicit mapping for `tokenTypes` property 

4. `/components/tokens/services/erc1155Service.ts`
   - Enhanced property handling in the `updateERC1155Types` function to prioritize UI properties
   - Improved the `mapERC1155TypeToModel` function to ensure proper property mapping

## Benefits

1. **Type Safety**: Ensures type compatibility between database and UI models with proper interface extensions
2. **Consistent Naming**: Properly converts between snake_case and camelCase properties
3. **Bidirectional Mapping**: Correctly handles both directions of mapping (database to UI and UI to database)
4. **Error Prevention**: Eliminates runtime errors when accessing properties

## Next Steps

1. Consider extending the central model `TokenERC1155Type` interface to include UI properties or create dedicated UI model interfaces
2. Add comprehensive unit tests for the mapper functions to prevent regression
3. Update related form components to leverage these improved mappers
4. Apply similar improvements to remaining token standards (ERC-1400, ERC-3525, ERC-4626)
