# Token System Database Integration

This document explains how the token system integrates with the database, particularly focusing on how complex nested JSON structures are properly saved to specialized token tables.

## Database Table Structure

The token system uses a collection of specialized tables to store different token standards and their properties:

1. **`tokens`** - Main tokens table storing basic information common to all token standards:
   - `id` - Token unique identifier
   - `project_id` - Project this token belongs to
   - `name` - Token name
   - `symbol` - Token symbol
   - `decimals` - Token decimals
   - `standard` - Token standard (ERC-20, ERC-721, etc.)
   - `blocks` - JSONB field for backward compatibility
   - `metadata` - Additional token metadata
   - `status` - Token status (DRAFT, DEPLOYED, etc.)

2. **Token Standard Specific Tables**:
   - `token_erc20_properties` - Properties specific to ERC-20 tokens
   - `token_erc721_properties` - Properties specific to ERC-721 tokens
   - `token_erc1155_properties` - Properties specific to ERC-1155 tokens
   - `token_erc1400_properties` - Properties specific to ERC-1400 tokens
   - `token_erc3525_properties` - Properties specific to ERC-3525 tokens
   - `token_erc4626_properties` - Properties specific to ERC-4626 tokens

3. **Token Standard Array Tables**:
   - `token_erc721_attributes` - Attributes for ERC-721 tokens
   - `token_erc1155_types` - Token types for ERC-1155 tokens
   - `token_erc1155_balances` - Initial balances for ERC-1155 tokens
   - `token_erc1400_partitions` - Partitions for ERC-1400 tokens
   - `token_erc1400_controllers` - Controllers for ERC-1400 tokens
   - `token_erc3525_slots` - Slots for ERC-3525 tokens
   - `token_erc4626_strategy_params` - Strategy parameters for ERC-4626 tokens

## Mapper System

The token system uses a sophisticated mapper architecture to convert between application data format (camelCase) and database format (snake_case):

### Token Mapper Factory

The `TokenMapperFactory` is a central class that provides appropriate mappers based on:
- Token standard (ERC-20, ERC-721, etc.)
- Configuration mode (MIN, MAX, BASIC, ADVANCED)

```typescript
// Example usage of TokenMapperFactory
const mappedData = TokenMapperFactory.toDatabaseRecord(
  TokenStandard.ERC20,
  ConfigMode.MAX,
  tokenFormData,
  projectId
);
```

### Standard-Specific Mappers

Each token standard has dedicated mappers:
- `ERC20Mapper`, `ERC721Mapper`, etc. - Base interfaces for token standard mappers
- `ERC20MinMapper`, `ERC20MaxMapper` - Implementation variants for different configuration modes

### General Token Database Mapper

The `tokenDatabaseMapper.ts` provides a more general approach to mapping between application and database formats:

```typescript
import { mapTokenAppToDb } from '../utils/mappers/tokenDatabaseMapper';

// Convert from application to database format
const { mainToken, standardProperties, standardArrays } = mapTokenAppToDb(tokenForm);
```

## Token Creation Flow

When creating a new token, the system:

1. **Prepares token data** using either:
   - `TokenMapperFactory` (specialized by standard and mode)
   - `tokenDatabaseMapper` (general fallback)

2. **Creates main token record** in the `tokens` table

3. **Creates standard-specific record** in the corresponding table:
   - Inserts into `token_erc20_properties` for ERC-20 tokens
   - Inserts into `token_erc721_properties` for ERC-721 tokens, etc.

4. **Creates array records** in the corresponding tables:
   - For ERC-721: inserts attributes into `token_erc721_attributes`
   - For ERC-1155: inserts token types into `token_erc1155_types`
   - For ERC-1400: inserts partitions into `token_erc1400_partitions`, etc.

## Complex Data Handling

The system handles complex nested JSON data structures by:

1. **Case conversion** - Converts between camelCase (application) and snake_case (database)
2. **Deep property extraction** - Extracts nested properties from complex objects
3. **Array normalization** - Converts array data into appropriate database records
4. **Standardized field naming** - Uses consistent field naming across the application

## Usage in Components

In React components that handle token forms:

```typescript
// In useTokenForm hook
const saveToken = useCallback(async () => {
  try {
    // Use the appropriate mapper based on token standard and config mode
    const mapperResult = TokenMapperFactory.toDatabaseRecord(
      tokenForm.standard,
      configMode,
      tokenForm,
      projectId
    );
    
    // Create the token with the mapped data
    const result = await createToken(projectId, tokenDataForInsert);
    
    // Handle success...
  } catch (err) {
    // Handle error...
  }
}, [tokenForm, projectId, configMode]);
```

## Troubleshooting

If token creation fails, check:

1. **Mapper compatibility** - Ensure the correct mapper is used for the token standard
2. **Field naming** - Verify field names match between application and database
3. **Type conversions** - Check that data types are properly converted
4. **Array handling** - Confirm array data is properly structured before insertion
5. **Database constraints** - Validate data against database constraints

## Best Practices

1. **Use specialized mappers** when possible for better type safety and validation
2. **Fall back to general mapper** when specialized mappers are unavailable
3. **Log mapping operations** to diagnose conversion issues
4. **Validate data** before sending to the database
5. **Use consistent naming conventions** throughout the application