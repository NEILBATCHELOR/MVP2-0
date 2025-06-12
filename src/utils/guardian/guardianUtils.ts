import type { 
  GuardianWalletResponse, 
  GuardianTransactionResponse,
  GuardianWebhookPayload 
} from '@/types/guardian/guardian';
import type { Wallet } from '@/types/core/centralModels';
import { WalletType } from '@/types/core/centralModels';

/**
 * Guardian API Utility Functions
 * 
 * Provides helper functions for Guardian Medex API integration
 * including data transformation, validation, and utility operations
 */

/**
 * Convert Guardian API wallet response to Chain Capital wallet format
 */
export function mapGuardianWalletToChainCapital(
  guardianWallet: GuardianWalletResponse, 
  userId?: string
): Wallet {
  return {
    id: `guardian_${guardianWallet.id}`,
    name: guardianWallet.name,
    address: guardianWallet.address,
    type: mapGuardianWalletType(guardianWallet.type),
    blockchain: guardianWallet.blockchain,
    chainId: guardianWallet.chainId,
    userId: userId || guardianWallet.metadata?.userId,
    isDefault: false,
    createdAt: guardianWallet.createdAt,
    updatedAt: new Date().toISOString(),
    // Guardian-specific fields
    guardianWalletId: guardianWallet.id,
    guardianMetadata: guardianWallet.metadata,
    isGuardianManaged: true,
  } as Wallet;
}

/**
 * Map Guardian wallet type to Chain Capital wallet type
 */
export function mapGuardianWalletType(guardianType: string): WalletType {
  switch (guardianType.toUpperCase()) {
    case 'EOA':
      return WalletType.EOA;
    case 'MULTISIG':
      return WalletType.MULTISIG;
    case 'SMART':
      return WalletType.SMART;
    default:
      return WalletType.GUARDIAN;
  }
}

/**
 * Format Guardian transaction for display
 */
export function formatGuardianTransaction(transaction: GuardianTransactionResponse) {
  return {
    id: transaction.id,
    hash: transaction.hash,
    status: transaction.status,
    walletId: transaction.walletId,
    to: transaction.to,
    value: transaction.value,
    gasUsed: transaction.gasUsed,
    blockNumber: transaction.blockNumber,
    timestamp: transaction.timestamp,
    displayValue: formatWeiToEth(transaction.value),
    shortHash: shortenHash(transaction.hash),
    statusColor: getTransactionStatusColor(transaction.status),
  };
}

/**
 * Convert Wei to ETH for display
 */
export function formatWeiToEth(weiValue: string): string {
  try {
    const wei = BigInt(weiValue);
    const eth = Number(wei) / 1e18;
    return eth.toFixed(6);
  } catch (error) {
    return '0.000000';
  }
}

/**
 * Shorten transaction hash for display
 */
export function shortenHash(hash: string): string {
  if (!hash || hash.length < 10) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

/**
 * Get color for transaction status
 */
export function getTransactionStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return 'text-green-600';
    case 'pending':
      return 'text-yellow-600';
    case 'failed':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Validate Guardian webhook payload
 */
export function isValidGuardianWebhook(payload: any): payload is GuardianWebhookPayload {
  return (
    payload &&
    typeof payload.eventType === 'string' &&
    typeof payload.walletId === 'string' &&
    typeof payload.data === 'object' &&
    typeof payload.timestamp === 'string'
  );
}

/**
 * Format wallet address for display
 */
export function formatWalletAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Check if a wallet is Guardian-managed
 */
export function isGuardianWallet(wallet: Wallet): boolean {
  return Boolean(wallet.guardianWalletId || wallet.isGuardianManaged);
}

/**
 * Generate Guardian operation ID
 */
export function generateGuardianOperationId(): string {
  return `guardian_op_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Parse Guardian error message
 */
export function parseGuardianError(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.details?.message) return error.details.message;
  return 'Unknown Guardian API error';
}

/**
 * Validate Ethereum address format
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Convert Guardian blockchain identifier to Chain Capital format
 */
export function mapGuardianBlockchain(blockchain: string): string {
  const blockchainMap: Record<string, string> = {
    'polygon': 'polygon',
    'ethereum': 'ethereum',
    'amoy': 'polygon-amoy',
    'sepolia': 'ethereum-sepolia',
  };
  
  return blockchainMap[blockchain.toLowerCase()] || blockchain;
}

/**
 * Create polling function for Guardian operations
 * (For localhost development where webhooks aren't available)
 */
export function createGuardianPoller<T>(
  checkFunction: () => Promise<T>,
  condition: (result: T) => boolean,
  maxAttempts: number = 10,
  intervalMs: number = 2000
): Promise<T> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const poll = async () => {
      try {
        attempts++;
        const result = await checkFunction();
        
        if (condition(result)) {
          resolve(result);
        } else if (attempts >= maxAttempts) {
          reject(new Error(`Guardian operation polling timed out after ${maxAttempts} attempts`));
        } else {
          setTimeout(poll, intervalMs);
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          reject(error);
        } else {
          setTimeout(poll, intervalMs);
        }
      }
    };
    
    poll();
  });
}

/**
 * Create transaction poller for localhost development
 */
export function pollTransactionStatus(
  transactionId: string,
  getTransactionFunction: (id: string) => Promise<GuardianTransactionResponse>
): Promise<GuardianTransactionResponse> {
  return createGuardianPoller(
    () => getTransactionFunction(transactionId),
    (tx) => tx.status === 'confirmed' || tx.status === 'failed',
    20, // 20 attempts
    3000 // 3 seconds between attempts
  );
}

/**
 * Create wallet creation poller for localhost development
 */
export function pollWalletCreation(
  walletId: string,
  getWalletFunction: (id: string) => Promise<GuardianWalletResponse>
): Promise<GuardianWalletResponse> {
  return createGuardianPoller(
    () => getWalletFunction(walletId),
    (wallet) => Boolean(wallet.address), // Wallet is ready when it has an address
    15, // 15 attempts
    2000 // 2 seconds between attempts
  );
}

/**
 * Retry function with exponential backoff for Guardian API calls
 */
export async function retryGuardianOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Log Guardian operation for audit purposes
 */
export function logGuardianOperation(
  operation: string,
  walletId: string,
  data: any,
  success: boolean
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'Guardian',
    operation,
    walletId,
    data,
    success,
  };
  
  // In production, this would go to your audit logging system
  console.log('Guardian Operation:', logEntry);
}

export default {
  mapGuardianWalletToChainCapital,
  mapGuardianWalletType,
  formatGuardianTransaction,
  formatWeiToEth,
  shortenHash,
  getTransactionStatusColor,
  isValidGuardianWebhook,
  formatWalletAddress,
  isGuardianWallet,
  generateGuardianOperationId,
  parseGuardianError,
  isValidEthereumAddress,
  mapGuardianBlockchain,
  createGuardianPoller,
  pollTransactionStatus,
  pollWalletCreation,
  retryGuardianOperation,
  logGuardianOperation,
};
