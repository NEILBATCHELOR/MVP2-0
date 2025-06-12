# Service Integration Report

After examining the ERC token services (`erc20Service.ts`, `erc721Service.ts`, `erc1155Service.ts`), I've identified the following integration points that need to be addressed to fully align with our mapper changes:

## 1. ERC-20 Service

**Current Status:**
- Already using `allowManagement` correctly in the model-to-database mapping
- Properly uses the direct mappers from `erc20Direct/erc20Mapper`
- Well-aligned with our mapper updates

**No changes needed**

## 2. ERC-721 Service

**Issues:**
- Missing consistent handling of the `enumerable` property in `mapERC721PropertiesToModel` function
- Not importing or using the direct mappers we created

**Required Updates:**
- Update the `mapERC721PropertiesToModel` function to correctly map the `enumerable` property and set `supportsEnumeration` to the same value for consistency
- Consider updating the implementation to use our direct mappers from `erc721Direct/erc721Mapper`

## 3. ERC-1155 Service

**Issues:**
- The token type mapping doesn't align with our expected format in the forms
- The `mapERC1155TypeToModel` function needs to include the necessary properties for compatibility with our UI interface

**Required Updates:**
- Update the `mapERC1155TypeToModel` function to include the additional properties needed by the UI:
  - Add `supply` property (mapped from `maxSupply`)
  - Add `fungible` boolean property (derived from `fungibilityType`)
  - Add `rarityLevel` property if available in metadata
- Consider importing and using our direct mappers from `erc1155Direct/erc1155Mapper`

## Implementation Approach

1. For ERC-721 Service:
   - Update the property mappers to correctly handle `enumerable` and `supportsEnumeration`
   - Ensure the mappers align with our updated interface

2. For ERC-1155 Service:
   - Update the token type mapper to return properties in the format expected by the UI
   - Make sure the conversion between different property formats is consistent

3. For Both Services:
   - Add imports for the direct mappers
   - Consider gradually migrating to use the direct mappers for consistency
   - Add additional mapping logic for any new properties introduced in our updates

## Next Steps

1. Update the ERC-721 service to handle the `enumerable` property correctly
2. Update the ERC-1155 service to correctly map token types
3. Update relevant service tests to ensure the changes work as expected
4. Document the changes in the readme to provide guidance for future development
