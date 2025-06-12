/**
 * DFNS Wallet Adapter - Wallet management operations
 * 
 * Provides wallet lifecycle management including creation, updates,
 * transfers, and balance tracking for the DFNS platform.
 */

import type {
  DfnsResponse,
  DfnsPaginatedResponse,
  Wallet,
  WalletBalance,
  TransferRequest,
  TransferResponse,
  WalletCreationRequest,
  TransactionHistory,
  DfnsNetwork
} from '@/types/dfns';

import type { DfnsApiClient } from '../client';

// ===== Wallet Adapter =====

export class DfnsWalletAdapter {
  constructor(private client: DfnsApiClient) {}

  // ===== Wallet Management =====

  /**
   * Create a new wallet
   */
  async createWallet(request: WalletCreationRequest): Promise<DfnsResponse<Wallet>> {
    try {
      const response = await this.client.post('/wallets', {
        body: {
          name: request.name,
          network: request.network,
          externalId: request.externalId,
          tags: request.tags
          // custodial property removed - not in WalletCreationRequest interface
        }
      });

      return response as DfnsResponse<Wallet>;
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'WALLET_CREATION_FAILED',
          message: `Failed to create wallet: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * Get wallet by ID
   */
  async getWallet(walletId: string): Promise<DfnsResponse<Wallet>> {
    try {
      const response = await this.client.get(`/wallets/${walletId}`);
      return response as DfnsResponse<Wallet>;
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'WALLET_FETCH_FAILED',
          message: `Failed to fetch wallet: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * List wallets with pagination
   */
  async listWallets(params?: {
    limit?: number;
    paginationToken?: string;
    network?: DfnsNetwork;
    status?: string;
  }): Promise<DfnsPaginatedResponse<Wallet>> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.paginationToken) searchParams.set('paginationToken', params.paginationToken);
      if (params?.network) searchParams.set('network', params.network);
      if (params?.status) searchParams.set('status', params.status);

      const queryString = searchParams.toString();
      const url = `/wallets${queryString ? `?${queryString}` : ''}`;
      
      const response = await this.client.get(url);
      return response as DfnsPaginatedResponse<Wallet>;
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'WALLETS_LIST_FAILED',
          message: `Failed to list wallets: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * Update wallet metadata
   */
  async updateWallet(
    walletId: string,
    updates: {
      name?: string;
      tags?: string[];
      externalId?: string;
    }
  ): Promise<DfnsResponse<Wallet>> {
    try {
      const response = await this.client.patch(`/wallets/${walletId}`, {
        body: updates
      });

      return response as DfnsResponse<Wallet>;
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'WALLET_UPDATE_FAILED',
          message: `Failed to update wallet: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * Archive a wallet
   */
  async archiveWallet(walletId: string): Promise<DfnsResponse<Wallet>> {
    try {
      const response = await this.client.patch(`/wallets/${walletId}`, {
        body: { status: 'Inactive' }
      });

      return response as DfnsResponse<Wallet>;
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'WALLET_ARCHIVE_FAILED',
          message: `Failed to archive wallet: ${(error as Error).message}`
        }
      };
    }
  }

  // ===== Balance Management =====

  /**
   * Get wallet balances
   */
  async getWalletBalances(walletId: string): Promise<DfnsResponse<WalletBalance[]>> {
    try {
      const response = await this.client.get(`/wallets/${walletId}/balances`);
      return response as DfnsResponse<WalletBalance[]>;
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'BALANCE_FETCH_FAILED',
          message: `Failed to fetch wallet balances: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * Get specific asset balance
   */
  async getAssetBalance(
    walletId: string,
    assetSymbol: string
  ): Promise<DfnsResponse<WalletBalance>> {
    try {
      const response = await this.client.get(`/wallets/${walletId}/balances/${assetSymbol}`);
      return response as DfnsResponse<WalletBalance>;
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'ASSET_BALANCE_FETCH_FAILED',
          message: `Failed to fetch asset balance: ${(error as Error).message}`
        }
      };
    }
  }

  // ===== Transfer Operations =====

  /**
   * Transfer assets from wallet
   */
  async transferAsset(
    walletId: string,
    transfer: TransferRequest
  ): Promise<DfnsResponse<TransferResponse>> {
    try {
      const response = await this.client.post(`/wallets/${walletId}/transfers`, {
        body: {
          to: transfer.to,
          amount: transfer.amount,
          asset: transfer.asset,
          memo: transfer.memo,
          externalId: transfer.externalId,
          nonce: transfer.nonce,
          gasLimit: transfer.gasLimit,
          gasPrice: transfer.gasPrice,
          maxFeePerGas: transfer.maxFeePerGas,
          maxPriorityFeePerGas: transfer.maxPriorityFeePerGas
        }
      });

      return response as DfnsResponse<TransferResponse>;
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'TRANSFER_FAILED',
          message: `Failed to transfer asset: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * Get transfer by ID
   */
  async getTransfer(transferId: string): Promise<DfnsResponse<TransferResponse>> {
    try {
      const response = await this.client.get(`/transfers/${transferId}`);
      return response as DfnsResponse<TransferResponse>;
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'TRANSFER_FETCH_FAILED',
          message: `Failed to fetch transfer: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * List transfers for a wallet
   */
  async listTransfers(params?: {
    walletId?: string;
    limit?: number;
    paginationToken?: string;
    status?: string;
  }): Promise<DfnsPaginatedResponse<TransferResponse>> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.walletId) searchParams.set('walletId', params.walletId);
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.paginationToken) searchParams.set('paginationToken', params.paginationToken);
      if (params?.status) searchParams.set('status', params.status);

      const queryString = searchParams.toString();
      const url = `/transfers${queryString ? `?${queryString}` : ''}`;
      
      const response = await this.client.get(url);
      return response as DfnsPaginatedResponse<TransferResponse>;
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'TRANSFERS_LIST_FAILED',
          message: `Failed to list transfers: ${(error as Error).message}`
        }
      };
    }
  }

  // ===== Transaction History =====

  /**
   * Get transaction history for wallet
   */
  async getTransactionHistory(
    walletId: string,
    params?: {
      limit?: number;
      direction?: 'Incoming' | 'Outgoing';
      status?: string;
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<DfnsPaginatedResponse<TransactionHistory>> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.direction) searchParams.set('direction', params.direction);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.fromDate) searchParams.set('fromDate', params.fromDate);
      if (params?.toDate) searchParams.set('toDate', params.toDate);

      const queryString = searchParams.toString();
      const url = `/wallets/${walletId}/transactions${queryString ? `?${queryString}` : ''}`;
      
      const response = await this.client.get(url);
      return response as DfnsPaginatedResponse<TransactionHistory>;
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'TRANSACTION_HISTORY_FAILED',
          message: `Failed to fetch transaction history: ${(error as Error).message}`
        }
      };
    }
  }

  // ===== Fee Estimation =====

  /**
   * Estimate transfer fees
   */
  async estimateTransferFee(
    walletId: string,
    transfer: Pick<TransferRequest, 'to' | 'amount' | 'asset'>
  ): Promise<DfnsResponse<{
    gasLimit: string;
    gasPrice: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    estimatedFee: string;
    estimatedFeeUsd: string;
  }>> {
    try {
      const response = await this.client.post(`/wallets/${walletId}/transfers/estimate`, {
        body: transfer
      });

      return response as DfnsResponse<{
        gasLimit: string;
        gasPrice: string;
        maxFeePerGas: string;
        maxPriorityFeePerGas: string;
        estimatedFee: string;
        estimatedFeeUsd: string;
      }>;
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'FEE_ESTIMATION_FAILED',
          message: `Failed to estimate transfer fee: ${(error as Error).message}`
        }
      };
    }
  }

  // ===== Delegation =====

  /**
   * Delegate wallet to another user
   */
  async delegateWallet(
    walletId: string,
    delegateTo: string
  ): Promise<DfnsResponse<Wallet>> {
    try {
      const response = await this.client.post(`/wallets/${walletId}/delegate`, {
        body: { delegateTo }
      });

      return response as DfnsResponse<Wallet>;
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'WALLET_DELEGATION_FAILED',
          message: `Failed to delegate wallet: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * Remove delegation from wallet
   */
  async removeDelegation(walletId: string): Promise<DfnsResponse<Wallet>> {
    try {
      const response = await this.client.delete(`/wallets/${walletId}/delegate`);
      return response as DfnsResponse<Wallet>;
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'WALLET_DELEGATION_REMOVAL_FAILED',
          message: `Failed to remove wallet delegation: ${(error as Error).message}`
        }
      };
    }
  }

  // ===== Export/Import =====

  /**
   * Export wallet (if supported)
   */
  async exportWallet(
    walletId: string,
    exportFormat: 'keystore' | 'mnemonic' | 'privateKey'
  ): Promise<DfnsResponse<{
    format: string;
    data: string;
    encrypted: boolean;
  }>> {
    try {
      const response = await this.client.post(`/wallets/${walletId}/export`, {
        body: { format: exportFormat }
      });

      return response as DfnsResponse<{
        format: string;
        data: string;
        encrypted: boolean;
      }>;
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'WALLET_EXPORT_FAILED',
          message: `Failed to export wallet: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * Import wallet
   */
  async importWallet(request: {
    name: string;
    network: DfnsNetwork;
    format: 'keystore' | 'mnemonic' | 'privateKey';
    data: string;
    password?: string;
    externalId?: string;
    tags?: string[];
  }): Promise<DfnsResponse<Wallet>> {
    try {
      const response = await this.client.post('/wallets/import', {
        body: request
      });

      return response as DfnsResponse<Wallet>;
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'WALLET_IMPORT_FAILED',
          message: `Failed to import wallet: ${(error as Error).message}`
        }
      };
    }
  }
}

export default DfnsWalletAdapter;
