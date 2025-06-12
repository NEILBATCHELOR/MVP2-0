import { GuardianApiClient } from '@/infrastructure/guardian/GuardianApiClient';
import { createUUID } from '@/utils/guardian/uuidUtils';
import type { 
  GuardianWalletRequest, 
  GuardianWalletResponse,
  GuardianWalletExtension 
} from '@/types/guardian/guardian';
import type { Wallet } from '@/types/core/centralModels';
import { WalletType } from '@/types/core/centralModels';

/**
 * GuardianWalletService - Integration layer between Guardian API and Chain Capital wallet system
 */
class GuardianWalletService {
  private apiClient: GuardianApiClient;

  constructor() {
    this.apiClient = new GuardianApiClient();
  }

  /**
   * Create a new Guardian-managed wallet
   */
  async createGuardianWallet(params: {
    name: string;
    type: 'EOA' | 'MULTISIG' | 'SMART';
    userId: string;
    blockchain?: 'polygon' | 'ethereum';
    metadata?: Record<string, any>;
  }): Promise<Wallet & GuardianWalletExtension> {
    // Generate unique ID for wallet creation
    const walletId = createUUID();
    
    // Guardian API only requires ID in request body (confirmed working format)
    const request = { id: walletId };

    // Create wallet operation (returns operationId) 
    const createResult = await this.apiClient.createWallet(request);
    
    // Return wallet object with operation details
    // Note: Actual wallet creation is asynchronous - check operation status for completion
    return {
      id: walletId,
      name: params.name,
      type: this.mapTypeToWalletType(params.type),
      address: '', // Will be populated when operation completes
      userId: params.userId,
      blockchain: params.blockchain || 'polygon',
      chainId: 80002, // Polygon Amoy Testnet
      isDefault: false,
      guardianWalletId: walletId,
      guardianMetadata: {
        operationId: createResult.operationId,
        status: 'pending',
        createdVia: 'chaincapital-platform',
        originalParams: params,
        ...params.metadata
      },
      isGuardianManaged: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Get Guardian wallet by ID
   */
  async getGuardianWallet(guardianWalletId: string): Promise<Wallet & GuardianWalletExtension> {
    const guardianWallet = await this.apiClient.getWallet(guardianWalletId);
    return this.guardianToInternalWallet(guardianWallet);
  }

  /**
   * List all Guardian wallets for a user
   */
  async listUserGuardianWallets(userId: string): Promise<(Wallet & GuardianWalletExtension)[]> {
    const guardianWallets = await this.apiClient.getWallets();
    // Note: Guardian API doesn't support filtering by userId in the API
    // This would need to be filtered on the client side or handled differently
    return guardianWallets.map(gw => this.guardianToInternalWallet(gw));
  }

  /**
   * Update Guardian wallet
   */
  async updateGuardianWallet(guardianWalletId: string, updates: {
    name?: string;
    metadata?: Record<string, any>;
  }): Promise<Wallet & GuardianWalletExtension> {
    // Note: Guardian API doesn't currently support wallet updates
    // This would need to be implemented when the API supports it
    throw new Error('Guardian wallet updates not yet supported by Guardian API');
  }

  /**
   * Delete Guardian wallet
   */
  async deleteGuardianWallet(guardianWalletId: string): Promise<void> {
    // Note: Guardian API doesn't currently support wallet deletion
    // This would need to be implemented when the API supports it
    throw new Error('Guardian wallet deletion not yet supported by Guardian API');
  }

  /**
   * Get operation status (for tracking async wallet creation)
   */
  async getOperationStatus(operationId: string): Promise<any> {
    return this.apiClient.getOperation(operationId);
  }

  /**
   * Convert Guardian API wallet to internal wallet format
   */
  private guardianToInternalWallet(guardianWallet: any): Wallet & GuardianWalletExtension {
    return {
      id: `guardian_${guardianWallet.id}`,
      name: guardianWallet.name || 'Guardian Wallet',
      type: this.mapGuardianWalletType(guardianWallet.type || 'EOA'),
      address: guardianWallet.address || '',
      userId: guardianWallet.userId || 'unknown',
      blockchain: guardianWallet.blockchain || 'polygon',
      chainId: guardianWallet.chainId || 80002,
      isDefault: false,
      guardianWalletId: guardianWallet.id,
      guardianMetadata: guardianWallet.metadata || {},
      isGuardianManaged: true,
      createdAt: guardianWallet.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Map Guardian wallet type to internal wallet type
   */
  private mapGuardianWalletType(guardianType: string): WalletType {
    switch (guardianType.toUpperCase()) {
      case 'EOA':
        return WalletType.EOA;
      case 'MULTISIG':
        return WalletType.MULTISIG;
      case 'SMART':
        return WalletType.SMART;
      default:
        return WalletType.INDIVIDUAL;
    }
  }

  /**
   * Map internal type to Guardian wallet type
   */
  private mapTypeToWalletType(type: 'EOA' | 'MULTISIG' | 'SMART'): WalletType {
    switch (type) {
      case 'EOA':
        return WalletType.EOA;
      case 'MULTISIG':
        return WalletType.MULTISIG;
      case 'SMART':
        return WalletType.SMART;
      default:
        return WalletType.INDIVIDUAL;
    }
  }

  /**
   * List all wallets (alias for listUserGuardianWallets for compatibility)
   */
  async listWallets(): Promise<(Wallet & GuardianWalletExtension)[]> {
    // For now, return all wallets since Guardian API doesn't filter by user
    const guardianWallets = await this.apiClient.getWallets();
    return guardianWallets.map(gw => this.guardianToInternalWallet(gw));
  }

  /**
   * Get wallet by ID (alias for getGuardianWallet for compatibility)
   */
  async getWalletById(walletId: string): Promise<Wallet & GuardianWalletExtension> {
    return this.getGuardianWallet(walletId);
  }

  /**
   * Create wallet (alias for createGuardianWallet for compatibility)
   */
  async createWallet(params: {
    name: string;
    type: 'EOA' | 'MULTISIG' | 'SMART';
    userId: string;
    blockchain?: 'polygon' | 'ethereum';
    metadata?: Record<string, any>;
  }): Promise<Wallet & GuardianWalletExtension> {
    return this.createGuardianWallet(params);
  }

  /**
   * Send transaction via Guardian API
   */
  async sendTransaction(transactionRequest: {
    walletId: string;
    to: string;
    value: string;
    data?: string;
    gasLimit?: string;
    gasPrice?: string;
    nonce?: number;
  }): Promise<any> {
    // This would need to be implemented when Guardian API supports transactions
    throw new Error('Transaction sending not yet implemented in Guardian API');
  }

  /**
   * Get wallet transactions
   */
  async getWalletTransactions(walletId: string): Promise<any[]> {
    // This would need to be implemented when Guardian API supports transaction history
    throw new Error('Transaction history not yet implemented in Guardian API');
  }

  /**
   * Get service status
   */
  async getStatus(): Promise<{ status: string; message: string }> {
    try {
      // Basic health check by attempting to list wallets
      await this.apiClient.getWallets();
      return { status: 'healthy', message: 'Guardian service is operational' };
    } catch (error: any) {
      return { status: 'error', message: `Guardian service error: ${error.message}` };
    }
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<{ healthy: boolean; details?: any }> {
    try {
      const status = await this.getStatus();
      return { healthy: status.status === 'healthy', details: status };
    } catch (error: any) {
      return { healthy: false, details: { error: error.message } };
    }
  }

  /**
   * Expose the API client for direct access when needed
   */
  getApiClient(): GuardianApiClient {
    return this.apiClient;
  }
}

export { GuardianWalletService };
export default GuardianWalletService;
