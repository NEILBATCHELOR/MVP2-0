import { signGuardianRequest } from './GuardianAuth';
import type { GuardianWallet, GuardianWalletResponse, GuardianTransactionResponse } from '@/types/guardian/guardian';

export class GuardianApiClient {
  /**
   * List all wallets (GET request - authentication now working!)
   */
  async getWallets(limit: number = 10, page: number = 1): Promise<GuardianWallet[]> {
    try {
      // Try without query parameters first to avoid validation issues
      const { url, headers } = await signGuardianRequest('GET', '/api/v1/wallets');
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Guardian API Error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get wallets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get specific wallet by ID (GET request - authentication now working!)
   */
  async getWallet(walletId: string): Promise<GuardianWalletResponse> {
    try {
      const { url, headers } = await signGuardianRequest('GET', `/api/v1/wallets/${walletId}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Guardian API Error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create wallet (POST request - CONFIRMED WORKING)
   * Returns operation ID for async operation tracking
   */
  async createWallet(request: { id: string }): Promise<{ operationId: string }> {
    try {
      const { url, headers } = await signGuardianRequest('POST', '/api/v1/wallets/create', request);
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Guardian API Error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to create wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get wallet details by ID (GET request - CONFIRMED WORKING)
   * Returns complete wallet information including accounts
   */
  async getWalletDetails(walletId: string): Promise<any> {
    try {
      const { url, headers } = await signGuardianRequest('GET', `/api/v1/wallets/${walletId}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Guardian API Error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get wallet details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get operation status (GET request - authentication now working!)
   */
  async getOperation(operationId: string): Promise<any> {
    try {
      const { url, headers } = await signGuardianRequest('GET', `/api/v1/operations/${operationId}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Guardian API Error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get operation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all operations (GET request - authentication now working!)
   */
  async listOperations(limit: number = 10, page: number = 1): Promise<any[]> {
    try {
      // Try without query parameters first to avoid validation issues
      const { url, headers } = await signGuardianRequest('GET', '/api/v1/operations');
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Guardian API Error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to list operations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get transaction (GET request - authentication now working!)
   */
  async getTransaction(transactionId: string): Promise<GuardianTransactionResponse> {
    try {
      const { url, headers } = await signGuardianRequest('GET', `/api/v1/transactions/${transactionId}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Guardian API Error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get wallet transactions (GET request - authentication now working!)
   */
  async getWalletTransactions(walletId: string): Promise<GuardianTransactionResponse[]> {
    try {
      const { url, headers } = await signGuardianRequest('GET', `/api/v1/wallets/${walletId}/transactions`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Guardian API Error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get wallet transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default GuardianApiClient;
