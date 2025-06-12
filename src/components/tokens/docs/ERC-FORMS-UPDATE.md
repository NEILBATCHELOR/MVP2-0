# ERC Token Edit Forms Update

This document outlines the changes made to the token edit forms to ensure they correctly handle all fields from their respective database tables, improving data integrity between the frontend and backend.

## Overview

The token edit forms have been updated to properly map UI field names to database column names, ensuring that when tokens are edited and saved, all necessary fields are included in the update operations. This addresses issues where some database fields were missing from the forms, which could lead to lost data or inconsistent state.

## Changes Made

### 1. ERC1155EditForm Updates
- Added missing fields `dynamicMetadata`, `enable_minting`, `enable_enumeration`, and `contract_uri_setting`
- Updated the form to properly initialize these fields with default values
- Added UI controls to allow editing of these fields
- Ensured that the form handles both camelCase (UI) and snake_case (database) field naming conventions

### 2. ERC3525EditForm Updates
- Added missing fields including database-specific fields like `slot_enumeration_enabled`, `enable_slot_transferability`, and others
- Updated property mapping to handle both UI and database field names
- Added logic to sync corresponding fields (e.g., when `allowsSlotEnumeration` is updated, also update `slot_enumeration_enabled`)
- Improved the save function to ensure all database fields are properly included

### 3. ERC4626EditForm Updates
- Added proper initialization with default values for all fields
- Improved the save function to map UI field names to database column names
- Added specific mapping for fields like `fee_structure`, `oracle_integration_setting`, etc.
- Ensured the form captures all needed fields from the database tables

## Testing

These changes have been implemented to match the database schema and ensure all fields are properly saved. To fully test these changes:

1. Create new tokens of each type
2. Edit the tokens and modify various fields
3. Verify in the database that all fields are updated correctly
4. Check that no errors occur during the save operation

## Next Steps

To complete the integration:

1. Verify that all other ERC token edit forms (like ERC20EditForm and ERC721EditForm) are also properly updated
2. Ensure the token card views display the metadata correctly
3. Add any missing validations for new fields
4. Consider adding tooltips or help text for complex fields to improve user experience

## Conclusion

These updates ensure that the token editing functionality in the application properly handles all fields required by the database schema, improving data integrity and reducing potential for errors.
