/**
 * DFNS Manager - Main orchestrator for DFNS functionality
 * 
 * This manager provides a unified interface to all DFNS capabilities including:
 * - Wallet management
 * - Key management  
 * - Policy engine
 * - Authentication
 * - Webhooks
 * - Integrations
 */

import type {
  DfnsClientConfig,
  DfnsResponse,
  Wallet,
  SigningKey,
  Policy,
  Webhook,
  WalletCreationRequest,
  KeyCreationRequest,
  TransferRequest,
  TransferResponse,
  SignatureRequest,
  SignatureResponse,
  DfnsDashboardMetrics,
  TransactionHistory
} from '@/types/dfns';
import { DfnsPolicyStatus, DfnsPolicyApprovalStatus, DfnsTransactionStatus } from '@/types/dfns';

import { DfnsApiClient } from './client';
import { DfnsAuthenticator } from './auth';
import { DfnsWalletAdapter } from './adapters/WalletAdapter';
import { DfnsKeysAdapter } from './adapters/KeysAdapter';
import { DfnsPolicyAdapter } from './adapters/PolicyAdapter';
import { DfnsWebhookManager } from './webhook-manager';
import { DfnsPolicyManager } from './policy-manager';
import { DfnsExchangeManager } from './exchange-manager';
import { DfnsStakingManager } from './staking-manager';
import { DfnsAmlKytManager } from './aml-kyt-manager';
import { DfnsAccountAbstractionManager } from './account-abstraction-manager';
import { DFNS_CONFIG, DEFAULT_CLIENT_CONFIG } from './config';

// ===== DFNS Manager =====

class DfnsManager {
  // Core components
  private client: DfnsApiClient;
  private authenticator: DfnsAuthenticator;

  // Service adapters
  public wallets: DfnsWalletAdapter;
  public keys: DfnsKeysAdapter;
  public policies: DfnsPolicyAdapter;

  // Advanced service managers
  public webhooks: DfnsWebhookManager;
  public policyManager: DfnsPolicyManager;
  public exchanges: DfnsExchangeManager;
  public staking: DfnsStakingManager;
  public amlKyt: DfnsAmlKytManager;
  public accountAbstraction: DfnsAccountAbstractionManager;

  // State
  private isInitialized: boolean = false;
  private currentUser?: any;

  constructor(config?: Partial<DfnsClientConfig>) {
    const finalConfig = { ...DEFAULT_CLIENT_CONFIG, ...config };
    
    // Initialize core components
    this.client = new DfnsApiClient(finalConfig);
    this.authenticator = new DfnsAuthenticator(finalConfig);

    // Initialize service adapters
    this.wallets = new DfnsWalletAdapter(this.client);
    this.keys = new DfnsKeysAdapter(this.client);
    this.policies = new DfnsPolicyAdapter(this.client);

    // Initialize advanced service managers
    this.webhooks = new DfnsWebhookManager(finalConfig, this.authenticator);
    this.policyManager = new DfnsPolicyManager(finalConfig, this.authenticator);
    this.exchanges = new DfnsExchangeManager(finalConfig, this.authenticator);
    this.staking = new DfnsStakingManager(finalConfig, this.authenticator);
    this.amlKyt = new DfnsAmlKytManager(finalConfig, this.authenticator);
    this.accountAbstraction = new DfnsAccountAbstractionManager(finalConfig, this.authenticator);
  }

  // ===== Initialization & Authentication =====

  /**
   * Initialize DFNS manager with authentication
   */
  async initialize(authMethod: 'serviceAccount' | 'delegated' | 'pat' = 'serviceAccount'): Promise<void> {
    try {
      switch (authMethod) {
        case 'serviceAccount':
          if (DFNS_CONFIG.serviceAccountId && DFNS_CONFIG.serviceAccountPrivateKey) {
            await this.authenticator.authenticateServiceAccount(
              DFNS_CONFIG.serviceAccountId,
              DFNS_CONFIG.serviceAccountPrivateKey
            );
          }
          break;
        
        case 'delegated':
          if (DFNS_CONFIG.credentialId && DFNS_CONFIG.privateKey) {
            await this.authenticator.authenticateDelegated(
              'default_user',
              DFNS_CONFIG.credentialId
            );
          }
          break;
        
        case 'pat':
          // Personal Access Token would be provided during runtime
          break;
      }

      this.isInitialized = true;
    } catch (error) {
      throw new Error(`DFNS initialization failed: ${(error as Error).message}`);
    }
  }

  /**
   * Authenticate with service account
   */
  async authenticateServiceAccount(serviceAccountId: string, privateKey: string): Promise<void> {
    await this.authenticator.authenticateServiceAccount(serviceAccountId, privateKey);
    this.isInitialized = true;
  }

  /**
   * Authenticate with delegated credentials
   */
  async authenticateDelegated(username: string, credentialId: string): Promise<void> {
    await this.authenticator.authenticateDelegated(username, credentialId);
    this.isInitialized = true;
  }

  /**
   * Authenticate with Personal Access Token
   */
  async authenticateWithPAT(token: string): Promise<void> {
    await this.authenticator.authenticateWithPAT(token);
    this.isInitialized = true;
  }

  /**
   * Check if manager is authenticated and ready
   */
  isReady(): boolean {
    return this.isInitialized && this.authenticator.isAuthenticated();
  }

  /**
   * Logout and clear authentication
   */
  logout(): void {
    this.authenticator.logout();
    this.isInitialized = false;
    this.currentUser = undefined;
  }

  // ===== Quick Access Methods =====

  /**
   * Quick wallet creation
   */
  async createWallet(request: WalletCreationRequest): Promise<DfnsResponse<Wallet>> {
    this.ensureInitialized();
    return this.wallets.createWallet(request);
  }

  /**
   * Quick key creation
   */
  async createKey(request: KeyCreationRequest): Promise<DfnsResponse<SigningKey>> {
    this.ensureInitialized();
    return this.keys.createKey(request);
  }

  /**
   * Quick asset transfer
   */
  async transferAsset(
    walletId: string, 
    transfer: TransferRequest
  ): Promise<DfnsResponse<TransferResponse>> {
    this.ensureInitialized();
    return this.wallets.transferAsset(walletId, transfer);
  }

  /**
   * Quick signature generation
   */
  async generateSignature(
    keyId: string,
    request: SignatureRequest
  ): Promise<DfnsResponse<SignatureResponse>> {
    this.ensureInitialized();
    return this.keys.generateSignature(keyId, request);
  }

  // ===== Advanced Service Quick Access =====

  /**
   * Quick webhook creation
   */
  async createWebhook(config: any): Promise<any> {
    this.ensureInitialized();
    return this.webhooks.createWebhook(config);
  }

  /**
   * Quick exchange account setup
   */
  async createExchangeAccount(config: any): Promise<any> {
    this.ensureInitialized();
    return this.exchanges.createExchangeAccount(config);
  }

  /**
   * Quick staking position creation
   */
  async createStake(request: any): Promise<any> {
    this.ensureInitialized();
    return this.staking.createStake(request);
  }

  /**
   * Quick transaction screening
   */
  async screenTransaction(request: any): Promise<any> {
    this.ensureInitialized();
    return this.amlKyt.screenOutboundTransaction(request);
  }

  /**
   * Quick smart account deployment
   */
  async deploySmartAccount(config: any): Promise<any> {
    this.ensureInitialized();
    return this.accountAbstraction.deploySmartAccount(config);
  }

  // ===== Dashboard & Analytics =====

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(): Promise<DfnsResponse<DfnsDashboardMetrics>> {
    this.ensureInitialized();

    try {
      // Fetch data from multiple endpoints including new services
      const [walletsResponse, keysResponse, transfersResponse, stakingResponse, exchangesResponse] = await Promise.all([
        this.wallets.listWallets({ limit: 100 }),
        this.keys.listKeys({ limit: 100 }),
        this.getRecentActivity({ limit: 50 }),
        this.staking.listStakes({ limit: 20 }).catch(() => ({ stakes: [], total: 0 })),
        this.exchanges.listExchangeAccounts().catch(() => [])
      ]);

      if (walletsResponse.error || keysResponse.error) {
        return {
          kind: 'error',
          error: {
            code: 'DASHBOARD_METRICS_FAILED',
            message: 'Failed to fetch dashboard metrics'
          }
        };
      }

      const wallets = walletsResponse.data || [];
      const keys = keysResponse.data || [];
      const recentActivity = transfersResponse.data || [];
      const stakes = stakingResponse.stakes || [];
      const exchanges = exchangesResponse || [];

      // Calculate enhanced metrics including new services
      const metrics: DfnsDashboardMetrics = {
        totalWallets: wallets.length,
        totalKeys: keys.length,
        totalTransactions: recentActivity.length,
        totalValue: this.calculateTotalValue(wallets),
        activePolicies: await this.getActivePoliciesCount(),
        pendingApprovals: await this.getPendingApprovalsCount(),
        recentActivity: recentActivity.slice(0, 10),
        networkDistribution: this.calculateNetworkDistribution(wallets),
        monthlyTransactionVolume: await this.calculateMonthlyVolume(),
        // Enhanced metrics with new services
        totalStakingValue: stakes.reduce((sum, stake) => sum + parseFloat(stake.amount || '0'), 0).toString(),
        totalExchangeAccounts: exchanges.length,
        accountAbstractionEnabled: wallets.filter(w => w.tags?.includes('account-abstraction')).length,
        complianceScreenings: await this.getComplianceScreeningsCount()
      };

      return {
        kind: 'success',
        data: metrics
      };
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'DASHBOARD_METRICS_FAILED',
          message: `Failed to calculate dashboard metrics: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * Get recent activity across all services
   */
  async getRecentActivity(params?: { 
    limit?: number; 
    entityType?: string;
  }): Promise<DfnsResponse<TransactionHistory[]>> {
    this.ensureInitialized();

    try {
      // This would fetch from an activity log endpoint
      // For now, return mock data
      const mockActivity: TransactionHistory[] = [
        {
          txHash: '0x1234567890abcdef',
          direction: 'Outgoing',
          status: DfnsTransactionStatus.Confirmed,
          asset: {
            symbol: 'ETH',
            decimals: 18,
            verified: true,
            name: 'Ethereum',
            nativeAsset: true
          },
          amount: '1.0',
          timestamp: new Date().toISOString()
        }
      ];

      return {
        kind: 'success',
        data: mockActivity
      };
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'ACTIVITY_FETCH_FAILED',
          message: `Failed to fetch recent activity: ${(error as Error).message}`
        }
      };
    }
  }

  // ===== Batch Operations =====

  /**
   * Create multiple wallets
   */
  async createMultipleWallets(
    requests: WalletCreationRequest[]
  ): Promise<DfnsResponse<Wallet[]>> {
    this.ensureInitialized();

    try {
      const results = await Promise.allSettled(
        requests.map(request => this.wallets.createWallet(request))
      );

      const successful: Wallet[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.data) {
          successful.push(result.value.data);
        } else {
          errors.push(`Request ${index + 1}: ${result.status === 'rejected' ? result.reason : 'Unknown error'}`);
        }
      });

      if (successful.length === 0) {
        return {
          kind: 'error',
          error: {
            code: 'BATCH_WALLET_CREATION_FAILED',
            message: `All wallet creations failed: ${errors.join(', ')}`
          }
        };
      }

      return {
        kind: 'success',
        data: successful
      };
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'BATCH_WALLET_CREATION_FAILED',
          message: `Batch wallet creation failed: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * Execute multiple transfers
   */
  async executeMultipleTransfers(
    transfers: Array<{ walletId: string; transfer: TransferRequest }>
  ): Promise<DfnsResponse<TransferResponse[]>> {
    this.ensureInitialized();

    try {
      const results = await Promise.allSettled(
        transfers.map(({ walletId, transfer }) => 
          this.wallets.transferAsset(walletId, transfer)
        )
      );

      const successful: TransferResponse[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.data) {
          successful.push(result.value.data);
        } else {
          errors.push(`Transfer ${index + 1}: ${result.status === 'rejected' ? result.reason : 'Unknown error'}`);
        }
      });

      return {
        kind: 'success',
        data: successful
      };
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'BATCH_TRANSFER_FAILED',
          message: `Batch transfer failed: ${(error as Error).message}`
        }
      };
    }
  }

  // ===== Configuration & Management =====

  /**
   * Update client configuration
   */
  updateConfig(updates: Partial<DfnsClientConfig>): void {
    this.client.updateConfig(updates);
  }

  /**
   * Get current configuration
   */
  getConfig(): DfnsClientConfig {
    return this.client.getConfig();
  }

  /**
   * Check system health
   */
  async checkHealth(): Promise<DfnsResponse<{ status: string; timestamp: string }>> {
    try {
      // Simple health check - try to list wallets
      const response = await this.wallets.listWallets({ limit: 1 });
      
      if (response.error) {
        return {
          kind: 'error',
          error: {
            code: 'HEALTH_CHECK_FAILED',
            message: 'DFNS services are not accessible'
          }
        };
      }

      return {
        kind: 'success',
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: `Health check failed: ${(error as Error).message}`
        }
      };
    }
  }

  // ===== Helper Methods =====

  /**
   * Ensure manager is initialized
   */
  private ensureInitialized(): void {
    if (!this.isReady()) {
      throw new Error('DFNS Manager is not initialized. Call initialize() first.');
    }
  }

  /**
   * Calculate total value across all wallets
   */
  private calculateTotalValue(wallets: Wallet[]): string {
    // Simplified calculation - in reality would fetch and sum all balances
    return `$${(wallets.length * 1000).toLocaleString()}`;
  }

  /**
   * Calculate network distribution
   */
  private calculateNetworkDistribution(wallets: Wallet[]) {
    const distribution = wallets.reduce((acc, wallet) => {
      acc[wallet.network] = (acc[wallet.network] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([network, count]) => ({
      network: network as any,
      count,
      percentage: Math.round((count / wallets.length) * 100)
    }));
  }

  /**
   * Get active policies count
   */
  private async getActivePoliciesCount(): Promise<number> {
    try {
      const response = await this.policies.listPolicies({ 
        status: DfnsPolicyStatus.Active,
        limit: 100 
      });
      return response.data?.length || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get pending approvals count
   */
  private async getPendingApprovalsCount(): Promise<number> {
    try {
      const response = await this.policies.listApprovals({ 
        status: DfnsPolicyApprovalStatus.Pending,
        limit: 100 
      });
      return response.data?.length || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Calculate monthly transaction volume
   */
  private async calculateMonthlyVolume() {
    // Mock data for monthly volume
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      volume: `$${Math.floor(Math.random() * 100000).toLocaleString()}`,
      count: Math.floor(Math.random() * 1000)
    }));
  }

  /**
   * Get compliance screenings count
   */
  private async getComplianceScreeningsCount(): Promise<number> {
    try {
      // In a real implementation, this would fetch from AML/KYT service
      return Math.floor(Math.random() * 100);
    } catch {
      return 0;
    }
  }

  // ===== Static Factory Methods =====

  /**
   * Create DFNS manager with service account authentication
   */
  static async createWithServiceAccount(
    serviceAccountId: string,
    privateKey: string,
    config?: Partial<DfnsClientConfig>
  ): Promise<DfnsManager> {
    const manager = new DfnsManager(config);
    await manager.authenticateServiceAccount(serviceAccountId, privateKey);
    return manager;
  }

  /**
   * Create DFNS manager with delegated authentication
   */
  static async createWithDelegatedAuth(
    username: string,
    credentialId: string,
    config?: Partial<DfnsClientConfig>
  ): Promise<DfnsManager> {
    const manager = new DfnsManager(config);
    await manager.authenticateDelegated(username, credentialId);
    return manager;
  }

  /**
   * Create DFNS manager with Personal Access Token
   */
  static async createWithPAT(
    token: string,
    config?: Partial<DfnsClientConfig>
  ): Promise<DfnsManager> {
    const manager = new DfnsManager(config);
    await manager.authenticateWithPAT(token);
    return manager;
  }
}

// ===== Export =====

export { DfnsManager };
export default DfnsManager;
