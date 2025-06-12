# Token Services Updates

This directory contains service files for different token standards (ERC-20, ERC-721, ERC-1155). These services have been updated to ensure they work correctly with the updated mapper implementations.

## Recent Changes

### 1. ERC-721 Service Updates

- Added imports for direct mapper functions from `erc721Direct/erc721Mapper`
- Updated `mapERC721PropertiesToModel` to properly handle both `enumerable` and `supportsEnumeration` properties for consistency
- Enhanced `mapERC721PropertiesToDB` to try using the direct mapper first, with a fallback to local implementation
- Fixed property type handling for better TypeScript compatibility

### 2. ERC-1155 Service Updates

- Added imports for direct mapper functions from `erc1155Direct/erc1155Mapper`
- Updated `mapERC1155TypeToModel` to include additional properties needed by the UI:
  - Added `supply` property (mapped from `maxSupply`)
  - Added `fungible` boolean property (derived from `fungibilityType`)
  - Added `rarityLevel` property with proper fallback value
- Enhanced `mapERC1155PropertiesToDB` to try using the direct mapper first, with a fallback to local implementation
- Updated `updateERC1155Types` function to accept both `maxSupply` and `supply` properties
- Improved handling of token type mapping for better compatibility with the UI

### 3. ERC-20 Service

- Already properly integrated with the direct mappers
- No changes needed

## Usage

These services provide a layer of abstraction over the database operations for token data. They ensure that data is properly formatted and validated before being saved to the database or returned to the UI.

Example usage:

```typescript
// Get a token with all its related data
const token = await erc721Service.getERC721Token(tokenId);

// Update token properties
await erc721Service.updateERC721Properties(tokenId, {
  baseUri: 'https://example.com/metadata/',
  enumerable: true,
  // other properties...
});

// Update token attributes
await erc721Service.updateERC721Attributes(tokenId, [
  { traitType: 'Color', values: ['Red', 'Blue', 'Green'] },
  { traitType: 'Size', values: ['Small', 'Medium', 'Large'] }
]);
```

## Future Considerations

1. Complete migration to direct mappers for all services
2. Add more comprehensive validation and error handling
3. Improve performance by optimizing database queries
4. Add more utility functions for common token operations