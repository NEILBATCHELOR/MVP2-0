import { rpcManager } from '@/infrastructure/web3/rpc/RPCConnectionManager';
import { getExplorerBaseUrl } from '@/utils/shared/explorerUtils';

/**
 * Utility service for blockchain explorer functionality
 */
export class ExplorerService {
  /**
   * Get the explorer URL for a specific blockchain
   * @param blockchain The blockchain name (ethereum, polygon, etc.)
   * @returns The explorer base URL
   */
  static getExplorerUrl(blockchain?: string): string {
    if (!blockchain) {
      blockchain = 'ethereum'; // Default to ethereum
    }
    
    try {
      const explorerUrl = getExplorerBaseUrl(blockchain);
      return explorerUrl || 'https://etherscan.io'; // Fallback to etherscan
    } catch (error) {
      console.warn(`Could not get explorer URL for ${blockchain}, falling back to etherscan`);
      return 'https://etherscan.io';
    }
  }

  /**
   * Get the full transaction URL for a given transaction hash
   * @param txHash The transaction hash
   * @param blockchain The blockchain name (optional, defaults to ethereum)
   * @returns Full URL to view the transaction
   */
  static getTransactionUrl(txHash: string, blockchain?: string): string {
    const baseUrl = this.getExplorerUrl(blockchain);
    
    // Different blockchains use different URL patterns
    switch (blockchain?.toLowerCase()) {
      case 'solana':
        return `${baseUrl}/tx/${txHash}`;
      case 'bitcoin':
        return `${baseUrl}/tx/${txHash}`;
      case 'near':
        return `${baseUrl}/transactions/${txHash}`;
      case 'stellar':
        return `${baseUrl}/tx/${txHash}`;
      case 'aptos':
        return `${baseUrl}/txn/${txHash}`;
      default:
        // EVM-compatible chains (ethereum, polygon, arbitrum, etc.)
        return `${baseUrl}/tx/${txHash}`;
    }
  }

  /**
   * Get the full address URL for a given address
   * @param address The wallet/contract address
   * @param blockchain The blockchain name (optional, defaults to ethereum)
   * @returns Full URL to view the address
   */
  static getAddressUrl(address: string, blockchain?: string): string {
    const baseUrl = this.getExplorerUrl(blockchain);
    
    // Different blockchains use different URL patterns
    switch (blockchain?.toLowerCase()) {
      case 'solana':
        return `${baseUrl}/account/${address}`;
      case 'bitcoin':
        return `${baseUrl}/address/${address}`;
      case 'near':
        return `${baseUrl}/accounts/${address}`;
      case 'stellar':
        return `${baseUrl}/account/${address}`;
      case 'aptos':
        return `${baseUrl}/account/${address}`;
      default:
        // EVM-compatible chains
        return `${baseUrl}/address/${address}`;
    }
  }

  /**
   * Get the full token URL for a given token contract
   * @param tokenAddress The token contract address
   * @param blockchain The blockchain name (optional, defaults to ethereum)
   * @returns Full URL to view the token
   */
  static getTokenUrl(tokenAddress: string, blockchain?: string): string {
    const baseUrl = this.getExplorerUrl(blockchain);
    
    switch (blockchain?.toLowerCase()) {
      case 'solana':
        return `${baseUrl}/account/${tokenAddress}`;
      case 'near':
        return `${baseUrl}/accounts/${tokenAddress}`;
      case 'stellar':
        return `${baseUrl}/account/${tokenAddress}`;
      case 'aptos':
        return `${baseUrl}/account/${tokenAddress}`;
      default:
        // EVM-compatible chains
        return `${baseUrl}/token/${tokenAddress}`;
    }
  }

  /**
   * Get the full block URL for a given block number/hash
   * @param blockIdentifier The block number or hash
   * @param blockchain The blockchain name (optional, defaults to ethereum)
   * @returns Full URL to view the block
   */
  static getBlockUrl(blockIdentifier: string | number, blockchain?: string): string {
    const baseUrl = this.getExplorerUrl(blockchain);
    
    switch (blockchain?.toLowerCase()) {
      case 'solana':
        return `${baseUrl}/block/${blockIdentifier}`;
      case 'bitcoin':
        return `${baseUrl}/block/${blockIdentifier}`;
      case 'near':
        return `${baseUrl}/blocks/${blockIdentifier}`;
      case 'stellar':
        return `${baseUrl}/ledger/${blockIdentifier}`;
      case 'aptos':
        return `${baseUrl}/block/${blockIdentifier}`;
      default:
        // EVM-compatible chains
        return `${baseUrl}/block/${blockIdentifier}`;
    }
  }

  /**
   * Detect blockchain from transaction hash pattern
   * @param txHash The transaction hash
   * @returns Likely blockchain name or null if unable to detect
   */
  static detectBlockchainFromTxHash(txHash: string): string | null {
    // Remove 0x prefix if present
    const cleanHash = txHash.replace(/^0x/, '');
    
    // EVM chains: 64 hex characters
    if (/^[a-fA-F0-9]{64}$/.test(cleanHash)) {
      return 'ethereum'; // Default to ethereum for EVM chains
    }
    
    // Solana: base58 string, typically 87-88 characters
    if (/^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(txHash)) {
      return 'solana';
    }
    
    // Bitcoin: 64 hex characters (same as EVM, but context matters)
    if (/^[a-fA-F0-9]{64}$/.test(cleanHash)) {
      return 'bitcoin';
    }
    
    // NEAR: base58 string, usually shorter than Solana
    if (/^[A-Za-z0-9]{43,44}$/.test(txHash)) {
      return 'near';
    }
    
    return null; // Unable to detect
  }

  /**
   * Check if an explorer URL is valid/reachable
   * @param explorerUrl The explorer URL to check
   * @returns Promise<boolean> indicating if the URL is reachable
   */
  static async isExplorerReachable(explorerUrl: string): Promise<boolean> {
    try {
      const response = await fetch(explorerUrl, { 
        method: 'HEAD',
        mode: 'no-cors' // Avoid CORS issues
      });
      return true; // If we get here, the URL is reachable
    } catch (error) {
      console.warn(`Explorer URL ${explorerUrl} is not reachable:`, error);
      return false;
    }
  }
}
