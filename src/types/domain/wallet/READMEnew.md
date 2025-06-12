# /src/types/wallet — READMEnew.md

This folder contains TypeScript types and mapping utilities for wallet-related domain models, primarily supporting blockchain token contracts and transaction management. These types are designed for strong type safety and seamless integration between database records, web3 logic, and UI presentation layers.

## Files

### tokenTypes.ts
- **ERC1155DetailedConfig**: Interface describing detailed configuration for ERC1155 token contracts.
  - Includes token metadata (name, description, token types, minting/burning/supply controls, nested tokens, etc).
  - Used for configuring and validating ERC1155 token deployments and management logic.

### transactionTypes.ts
- **BlockchainTransaction**: Type representing a blockchain transaction in snake_case, matching database schema.
- **TransactionNotification, TransactionNotificationUI, NotificationDisplay**: Types for transaction notification objects (DB and UI), with mapping functions for camelCase/snake_case conversion.
- **mapBlockchainTransactionToTransaction, mapTransactionToBlockchainTransaction**: Helpers to convert between DB and central model transaction types.
- **mapNotificationToUI, mapUIToNotification**: Helpers to convert between DB and UI notification types.
- **NotificationFilterType**: Enum for filtering notifications (all, unread, read, transactions).
- **Dependencies**: Imports core types from `@/types/supabase`, `@/types/database`, and `@/types/centralModels` for type consistency across the codebase.

## Usage
- Import these types and mapping functions in wallet services, transaction monitors, notification systems, and UI components to ensure type safety and data consistency.
- Always use these helpers for mapping data to/from the database to avoid mismatches between camelCase (frontend/models) and snake_case (database).

## Developer Notes
- Keep this folder in sync with changes to the wallet DB schema and central business models.
- When adding new wallet-related types or mapping utilities, place them here for discoverability and consistency.

---

### Download Link
- [Download /src/types/wallet/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/types/wallet/READMEnew.md)

---

### Memory-Bank Mirror
- [Download /memory-bank/types/wallet/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/memory-bank/types/wallet/READMEnew.md)
