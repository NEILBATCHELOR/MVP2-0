import type { Json } from '@/types/core/supabase';
import type { Transaction } from '@/types/core/centralModels';

/**
 * Type representing a blockchain transaction with snake_case properties
 * This interface is designed to match database structure (snake_case)
 * and maps to the camelCase Transaction interface in centralModels.ts
 */
export interface BlockchainTransaction {
  id: string;
  wallet_id?: string;
  tx_hash: string;
  from_address: string;
  to_address: string;
  value: string;
  data?: Json;
  chain_id?: string;
  gas_limit?: number;
  gas_price?: string;
  gas_used?: number;
  nonce?: number;
  block_number?: number;
  block_hash?: string;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
  network_id?: string;
  transaction_type?: string;
  created_at?: string;
  updated_at?: string;
  confirmation_count?: number;
  token_address?: string;
  token_symbol?: string;
  description?: string;
  blockchain?: string;
}

/**
 * Helper functions to convert between BlockchainTransaction (snake_case) 
 * and Transaction (camelCase) types from centralModels.ts
 */
export function mapBlockchainTransactionToTransaction(tx: BlockchainTransaction): Transaction {
  return {
    id: tx.id,
    walletId: tx.wallet_id || '',
    to: tx.to_address,
    value: tx.value,
    data: typeof tx.data === 'string' ? tx.data : undefined,
    nonce: tx.nonce,
    description: tx.description,
    status: tx.status,
    txHash: tx.tx_hash,
    blockNumber: tx.block_number,
    blockHash: tx.block_hash,
    from: tx.from_address,
    gasLimit: tx.gas_limit?.toString(),
    gasPrice: tx.gas_price,
    chainId: tx.chain_id ? parseInt(tx.chain_id) : undefined,
    hash: tx.tx_hash,
    timestamp: tx.timestamp,
    createdAt: tx.created_at || new Date().toISOString(),
    updatedAt: tx.updated_at
  };
}

export function mapTransactionToBlockchainTransaction(tx: Transaction): BlockchainTransaction {
  return {
    id: tx.id,
    wallet_id: tx.walletId,
    to_address: tx.to,
    from_address: tx.from || '',
    value: tx.value,
    data: tx.data ? tx.data as Json : null,
    nonce: tx.nonce,
    description: tx.description,
    status: tx.status,
    tx_hash: tx.txHash || tx.hash || '',
    block_number: tx.blockNumber,
    block_hash: tx.blockHash,
    gas_limit: tx.gasLimit ? parseFloat(tx.gasLimit) : undefined,
    gas_price: tx.gasPrice,
    chain_id: tx.chainId?.toString(),
    timestamp: tx.timestamp || tx.createdAt,
    created_at: tx.createdAt,
    updated_at: tx.updatedAt || new Date().toISOString()
  };
}

/**
 * Type representing a transaction notification (database format with snake_case)
 */
export interface TransactionNotification {
  id: string;
  user_id?: string;
  wallet_address: string;
  title: string;
  message: string;
  type: string;
  tx_hash?: string;
  transaction_id?: string;
  created_at: string;
  read: boolean;
  action_url?: string;
  metadata?: Record<string, any>;
}

/**
 * Type representing a transaction notification (application format with camelCase)
 * This aligns with the interface in TransactionMonitor.ts
 */
export interface TransactionNotificationUI {
  id: string;
  userId?: string;
  walletAddress: string;
  transactionId?: string;
  transactionHash?: string;
  notificationType: 'CONFIRMED' | 'FAILED' | 'PENDING' | 'REPLACED';
  title: string;
  message: string;
  timestamp: string;
  read?: boolean;
  actionUrl?: string;
  data?: any;
}

/**
 * Mapping function to convert from snake_case to camelCase notification
 */
export function mapNotificationToUI(notification: TransactionNotification): TransactionNotificationUI {
  return {
    id: notification.id,
    userId: notification.user_id,
    walletAddress: notification.wallet_address,
    transactionId: notification.transaction_id,
    transactionHash: notification.tx_hash,
    notificationType: notification.type as 'CONFIRMED' | 'FAILED' | 'PENDING' | 'REPLACED',
    title: notification.title,
    message: notification.message,
    timestamp: notification.created_at,
    read: notification.read,
    actionUrl: notification.action_url,
    data: notification.metadata
  };
}

/**
 * Mapping function to convert from camelCase to snake_case notification
 */
export function mapUIToNotification(notification: TransactionNotificationUI): TransactionNotification {
  return {
    id: notification.id,
    user_id: notification.userId,
    wallet_address: notification.walletAddress,
    transaction_id: notification.transactionId,
    tx_hash: notification.transactionHash,
    type: notification.notificationType,
    title: notification.title,
    message: notification.message,
    created_at: notification.timestamp,
    read: notification.read || false,
    action_url: notification.actionUrl,
    metadata: notification.data
  };
}

/**
 * Type for the different notification filter types
 */
export type NotificationFilterType = 'all' | 'unread' | 'read' | 'transactions';

/**
 * Type representing notification presentation data
 */
export interface NotificationDisplay extends TransactionNotificationUI {
  icon: string;
  color: string;
}