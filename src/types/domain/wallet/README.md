# Wallet Transaction Type System

This directory contains type definitions for wallet transactions and related entities in our web3 integration framework.

## Core Types

### Transaction Types

- **BlockchainTransaction**: Database representation (snake_case) of blockchain transactions
- **Transaction**: Business model representation (camelCase) from centralModels.ts
- **TransactionNotification**: Database representation (snake_case) of transaction notifications
- **TransactionNotificationUI**: Application representation (camelCase) of transaction notifications

## Type Flow

The system follows a clear pattern for transaction data flow:

1. **Database Layer**: Uses snake_case types (`BlockchainTransaction`, `TransactionNotification`)
2. **Application Layer**: Uses camelCase types (`Transaction`, `TransactionNotificationUI`)
3. **UI Layer**: Uses extended types with additional UI properties (`NotificationDisplay`)

## Mapping Functions

The module provides mapper functions to convert between database and application representation:

- `mapBlockchainTransactionToTransaction`: Converts from snake_case DB to camelCase application model
- `mapTransactionToBlockchainTransaction`: Converts from camelCase application model to snake_case DB
- `mapNotificationToUI`: Converts notification from snake_case DB to camelCase UI model
- `mapUIToNotification`: Converts notification from camelCase UI model to snake_case DB

## Usage Examples

### Working with Transactions

```typescript
import { 
  BlockchainTransaction, 
  mapBlockchainTransactionToTransaction 
} from '@/types/wallet/transactionTypes';
import { Transaction } from '@/types/centralModels';

// When fetching from database
const dbTransaction: BlockchainTransaction = await fetchTransactionFromDb();
const transaction: Transaction = mapBlockchainTransactionToTransaction(dbTransaction);

// When saving to database
const updatedTransaction: Transaction = getUpdatedTransaction();
const dbTransaction: BlockchainTransaction = mapTransactionToBlockchainTransaction(updatedTransaction);
await saveTransactionToDb(dbTransaction);
```

### Working with Notifications

```typescript
import { 
  TransactionNotification, 
  TransactionNotificationUI,
  mapNotificationToUI,
  mapUIToNotification
} from '@/types/wallet/transactionTypes';

// When fetching notifications for UI
const dbNotifications: TransactionNotification[] = await fetchNotificationsFromDb();
const uiNotifications: TransactionNotificationUI[] = dbNotifications.map(mapNotificationToUI);

// When creating a new notification
const newNotification: TransactionNotificationUI = {
  id: generateId(),
  walletAddress: '0x123...',
  transactionHash: '0xabc...',
  notificationType: 'CONFIRMED',
  title: 'Transaction Confirmed',
  message: 'Your transaction has been confirmed',
  timestamp: new Date().toISOString()
};

const dbNotification: TransactionNotification = mapUIToNotification(newNotification);
await saveNotificationToDb(dbNotification);
```

## Best Practices

1. **Always use mappers**: Don't manually convert between snake_case and camelCase
2. **Respect the layer boundaries**: Don't use DB types (snake_case) in UI components
3. **Type safety**: Leverage TypeScript's type system to catch errors early
4. **Consistent naming**: Follow the established naming conventions:
   - DB types: snake_case names (e.g., `wallet_id`, `tx_hash`)
   - Application types: camelCase names (e.g., `walletId`, `txHash`) 