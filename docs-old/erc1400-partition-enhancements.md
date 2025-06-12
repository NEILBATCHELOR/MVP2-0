# ERC1400 Partition Enhancements

This document outlines the enhancements made to our ERC1400 partition implementation, which includes support for partition balances, partition transfers, and partition operators.

## New Database Tables

### 1. Partition Balances

The `token_erc1400_partition_balances` table tracks how many tokens a holder has in a specific partition:

```sql
CREATE TABLE token_erc1400_partition_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partition_id UUID NOT NULL REFERENCES token_erc1400_partitions(id) ON DELETE CASCADE,
    holder_address TEXT NOT NULL,
    balance TEXT NOT NULL DEFAULT '0',
    last_updated TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb,
    
    UNIQUE(partition_id, holder_address)
);
```

### 2. Partition Transfers

The `token_erc1400_partition_transfers` table records all token transfers within partitions:

```sql
CREATE TABLE token_erc1400_partition_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partition_id UUID NOT NULL REFERENCES token_erc1400_partitions(id) ON DELETE CASCADE,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    amount TEXT NOT NULL,
    operator_address TEXT,
    timestamp TIMESTAMPTZ DEFAULT now(),
    transaction_hash TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);
```

### 3. Partition Operators

The `token_erc1400_partition_operators` table tracks authorized operators for each partition:

```sql
CREATE TABLE token_erc1400_partition_operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partition_id UUID NOT NULL REFERENCES token_erc1400_partitions(id) ON DELETE CASCADE,
    holder_address TEXT NOT NULL,
    operator_address TEXT NOT NULL,
    authorized BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb,
    
    UNIQUE(partition_id, holder_address, operator_address)
);
```

### 4. Enhanced Partition Metadata

The `token_erc1400_partitions` table has been enhanced with:

- A consistent `partitionType` field in the metadata
- A new `total_supply` column for tracking total supply per partition
- Additional metadata properties including:
  - `lockupPeriodDays`
  - `transferRestrictions`
  - `votingRights`
  - `dividendRights`

## New TypeScript Interfaces

### 1. Enhanced TokenERC1400Partition Interface

```typescript
export interface TokenERC1400Partition extends BaseModel {
  tokenId: string;
  name: string;
  partitionId: string;
  amount?: string;
  isLockable?: boolean;
  totalSupply?: string;  // New field
  partitionType?: 'equity' | 'debt' | 'preferred' | 'common'; // New field
  metadata?: Record<string, any>;
}
```

### 2. TokenERC1400PartitionBalance Interface

```typescript
export interface TokenERC1400PartitionBalance extends BaseModel {
  partitionId: string;
  holderAddress: string;
  balance: string;
  lastUpdated: string;
  metadata?: Record<string, any>;
}
```

### 3. TokenERC1400PartitionTransfer Interface

```typescript
export interface TokenERC1400PartitionTransfer extends BaseModel {
  partitionId: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  operatorAddress?: string;
  timestamp: string;
  transactionHash?: string;
  metadata?: Record<string, any>;
}
```

### 4. TokenERC1400PartitionOperator Interface

```typescript
export interface TokenERC1400PartitionOperator extends BaseModel {
  partitionId: string;
  holderAddress: string;
  operatorAddress: string;
  authorized: boolean;
  lastUpdated: string;
  metadata?: Record<string, any>;
}
```

## New Service Functions

The following functions have been added to `erc1400Service.ts`:

### 1. Partition Balances

- `getPartitionBalances(partitionId: string): Promise<any[]>`
- `updatePartitionBalance(partitionId: string, holderAddress: string, balance: string): Promise<any>`

### 2. Partition Transfers

- `recordPartitionTransfer(partitionId: string, fromAddress: string, toAddress: string, amount: string, operatorAddress?: string, transactionHash?: string): Promise<any>`
- `getPartitionTransfers(partitionId: string, address?: string): Promise<any[]>`

### 3. Partition Operators

- `getPartitionOperators(partitionId: string, holderAddress?: string): Promise<any[]>`
- `updatePartitionOperator(partitionId: string, holderAddress: string, operatorAddress: string, authorized: boolean): Promise<any>`

## Form Updates

The `PartitionsForm.tsx` component has been updated to handle:

- Consistent `partitionType` field in the metadata
- Additional metadata properties for each partition
- Backward compatibility with existing code via the `type` field

## Migration Path

1. Run the SQL migration script to create new tables and update existing ones
2. Use the updated service functions for managing partition balances, transfers, and operators
3. All existing code should continue working due to backward compatibility

## ERC1400 Partition Features

The enhanced partitions now support these ERC1400 operations:

1. **Token Balances per Partition**: Track how many tokens a holder has in a specific partition
2. **Total Supply per Partition**: Track the total number of tokens in a given partition
3. **Transfer Functions**: Support for transferByPartition function
4. **Operator Functions**: Support for operatorTransferByPartition function
5. **Events**: Record and query TokenERC1400PartitionTransfer events
6. **Metadata**: Enhanced metadata for each partition including lockup periods, voting rights, etc.

## Usage Examples

### Checking Balance in a Partition

```typescript
// Get a user's balance in a specific partition
const balances = await erc1400Service.getPartitionBalances(partitionId);
const userBalance = balances.find(b => b.holder_address === userAddress);
console.log(`User balance in partition: ${userBalance?.balance || '0'}`);
```

### Transferring Tokens Between Partitions

```typescript
// 1. Record the transfer
await erc1400Service.recordPartitionTransfer(
  partitionId,
  fromAddress,
  toAddress,
  amount,
  operatorAddress, // optional
  transactionHash // optional
);

// 2. Update balances
const fromBalance = await erc1400Service.updatePartitionBalance(
  partitionId,
  fromAddress,
  newFromBalance
);

const toBalance = await erc1400Service.updatePartitionBalance(
  partitionId,
  toAddress,
  newToBalance
);
```

### Managing Partition Operators

```typescript
// Authorize an operator for a specific partition
await erc1400Service.updatePartitionOperator(
  partitionId,
  holderAddress,
  operatorAddress,
  true // authorized
);

// Get all operators for a holder's partitions
const operators = await erc1400Service.getPartitionOperators(
  partitionId,
  holderAddress
);
``` 