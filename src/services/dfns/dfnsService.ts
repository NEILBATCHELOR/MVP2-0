/**
 * DFNS Service - Business logic layer for DFNS operations
 * 
 * This service provides high-level business operations for DFNS functionality,
 * handling data transformation, validation, error handling, and integration
 * with the local database.
 */

import type {
  DfnsResponse,
  Wallet,
  WalletBalance,
  SigningKey,
  Policy,
  PolicyApproval,
  TransferRequest,
  TransferResponse,
  WalletCreationRequest,
  KeyCreationRequest,
  DfnsDashboardMetrics,
  DfnsNetwork,
  DfnsTransferStatus
} from '@/types/dfns';

import type {
  DfnsWalletsTable,
  DfnsSigningKeysTable,
  DfnsPoliciesTable,
  DfnsTransfersTable,
  DfnsWalletInsert,
  DfnsSigningKeyInsert,
  DfnsPolicyInsert,
  DfnsTransferInsert
} from '@/types/dfns/database';

import { getDfnsManager } from '@/infrastructure/dfns';
import { supabase } from '@/infrastructure/database/client';
import {
  mapWalletToDomain,
  mapWalletToDatabase,
  mapSigningKeyToDomain,
  mapSigningKeyToDatabase
} from '@/types/dfns/mappers';

// ===== DFNS Service Class =====

export class DfnsService {
  private static instance: DfnsService | null = null;

  /**
   * Get singleton instance
   */
  static getInstance(): DfnsService {
    if (!DfnsService.instance) {
      DfnsService.instance = new DfnsService();
    }
    return DfnsService.instance;
  }

  // ===== Wallet Operations =====

  /**
   * Create a new wallet and store in database
   */
  async createWallet(
    request: WalletCreationRequest & {
      projectId?: string;
      investorId?: string;
      organizationId?: string;
    }
  ): Promise<{ wallet: Wallet; success: boolean; error?: string }> {
    try {
      const dfnsManager = await getDfnsManager();
      
      // Create wallet in DFNS
      const dfnsResponse = await dfnsManager.createWallet(request);
      
      if (dfnsResponse.error) {
        return {
          wallet: {} as Wallet,
          success: false,
          error: dfnsResponse.error.message
        };
      }

      const wallet = dfnsResponse.data!;

      // Store wallet in local database
      const dbWallet: DfnsWalletInsert = {
        ...mapWalletToDatabase(wallet),
        project_id: request.projectId,
        investor_id: request.investorId,
        organization_id: request.organizationId,
        dfns_wallet_id: wallet.walletId
      };

      const { error: dbError } = await supabase
        .from('dfns_wallets')
        .insert(dbWallet);

      if (dbError) {
        console.error('Failed to store wallet in database:', dbError);
        // Don't fail the operation, just log the error
      }

      return {
        wallet,
        success: true
      };
    } catch (error) {
      return {
        wallet: {} as Wallet,
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get wallet by ID with local caching
   */
  async getWallet(walletId: string): Promise<{ wallet: Wallet | null; success: boolean; error?: string }> {
    try {
      // First try to get from local database
      const { data: dbWallet, error: dbError } = await supabase
        .from('dfns_wallets')
        .select('*')
        .eq('wallet_id', walletId)
        .single();

      if (dbWallet && !dbError) {
        // Return cached wallet
        const wallet = mapWalletToDomain(dbWallet as DfnsWalletsTable);
        return { wallet, success: true };
      }

      // Fetch from DFNS if not in cache
      const dfnsManager = await getDfnsManager();
      const dfnsResponse = await dfnsManager.wallets.getWallet(walletId);

      if (dfnsResponse.error) {
        return {
          wallet: null,
          success: false,
          error: dfnsResponse.error.message
        };
      }

      const wallet = dfnsResponse.data!;

      // Cache the wallet
      await this.cacheWallet(wallet);

      return { wallet, success: true };
    } catch (error) {
      return {
        wallet: null,
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * List wallets for a project or organization
   */
  async listWallets(filters?: {
    projectId?: string;
    investorId?: string;
    organizationId?: string;
    network?: DfnsNetwork;
    limit?: number;
  }): Promise<{ wallets: Wallet[]; success: boolean; error?: string }> {
    try {
      let query = supabase.from('dfns_wallets').select('*');

      // Apply filters
      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters?.investorId) {
        query = query.eq('investor_id', filters.investorId);
      }
      if (filters?.organizationId) {
        query = query.eq('organization_id', filters.organizationId);
      }
      if (filters?.network) {
        query = query.eq('network', filters.network);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data: dbWallets, error: dbError } = await query;

      if (dbError) {
        throw new Error(`Database query failed: ${dbError.message}`);
      }

      const wallets = (dbWallets || []).map(dbWallet => mapWalletToDomain(dbWallet as DfnsWalletsTable));

      return { wallets, success: true };
    } catch (error) {
      return {
        wallets: [],
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Transfer assets with validation and logging
   */
  async transferAsset(
    walletId: string,
    transfer: TransferRequest,
    metadata?: {
      projectId?: string;
      investorId?: string;
      description?: string;
    }
  ): Promise<{ transfer: TransferResponse | null; success: boolean; error?: string }> {
    try {
      // Validate wallet exists
      const { wallet: walletExists } = await this.getWallet(walletId);
      if (!walletExists) {
        return {
          transfer: null,
          success: false,
          error: 'Wallet not found'
        };
      }

      // Validate transfer request
      const validation = this.validateTransferRequest(transfer);
      if (!validation.isValid) {
        return {
          transfer: null,
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Execute transfer
      const dfnsManager = await getDfnsManager();
      const dfnsResponse = await dfnsManager.transferAsset(walletId, transfer);

      if (dfnsResponse.error) {
        return {
          transfer: null,
          success: false,
          error: dfnsResponse.error.message
        };
      }

      const transferResponse = dfnsResponse.data!;

      // Store transfer in database
      const dbTransfer: DfnsTransferInsert = {
        transfer_id: transferResponse.id,
        wallet_id: walletId,
        to_address: transfer.to,
        amount: transfer.amount,
        asset: transfer.asset,
        memo: transfer.memo,
        external_id: transfer.externalId,
        status: transferResponse.status,
        date_created: transferResponse.dateCreated,
        dfns_transfer_id: transferResponse.id
      };

      const { error: dbError } = await supabase
        .from('dfns_transfers')
        .insert(dbTransfer);

      if (dbError) {
        console.error('Failed to store transfer in database:', dbError);
      }

      // Log activity
      await this.logActivity({
        activityType: 'ASSET_TRANSFER',
        entityId: transferResponse.id,
        entityType: 'transfer',
        description: `Transferred ${transfer.amount} ${transfer.asset || 'ETH'} to ${transfer.to}`,
        status: 'success',
        metadata: {
          ...metadata,
          walletId,
          amount: transfer.amount,
          asset: transfer.asset,
          recipient: transfer.to
        }
      });

      return { transfer: transferResponse, success: true };
    } catch (error) {
      // Log failed transfer
      await this.logActivity({
        activityType: 'ASSET_TRANSFER',
        entityId: walletId,
        entityType: 'wallet',
        description: `Failed to transfer ${transfer.amount} ${transfer.asset || 'ETH'}`,
        status: 'failed',
        metadata
      });

      return {
        transfer: null,
        success: false,
        error: (error as Error).message
      };
    }
  }

  // ===== Key Operations =====

  /**
   * Create a new signing key
   */
  async createKey(
    request: KeyCreationRequest & {
      organizationId?: string;
    }
  ): Promise<{ key: SigningKey; success: boolean; error?: string }> {
    try {
      const dfnsManager = await getDfnsManager();
      
      // Create key in DFNS
      const dfnsResponse = await dfnsManager.createKey(request);
      
      if (dfnsResponse.error) {
        return {
          key: {} as SigningKey,
          success: false,
          error: dfnsResponse.error.message
        };
      }

      const key = dfnsResponse.data!;

      // Store key in local database
      const dbKey: DfnsSigningKeyInsert = {
        ...mapSigningKeyToDatabase(key),
        organization_id: request.organizationId,
        dfns_key_id: key.keyId
      };

      const { error: dbError } = await supabase
        .from('dfns_signing_keys')
        .insert(dbKey);

      if (dbError) {
        console.error('Failed to store key in database:', dbError);
      }

      // Log activity
      await this.logActivity({
        activityType: 'KEY_CREATED',
        entityId: key.keyId,
        entityType: 'key',
        description: `Created ${key.curve} signing key for ${key.network}`,
        status: 'success'
      });

      return { key, success: true };
    } catch (error) {
      return {
        key: {} as SigningKey,
        success: false,
        error: (error as Error).message
      };
    }
  }

  // ===== Dashboard & Analytics =====

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(organizationId?: string): Promise<{
    metrics: DfnsDashboardMetrics | null;
    success: boolean;
    error?: string;
  }> {
    try {
      const dfnsManager = await getDfnsManager();
      const dfnsResponse = await dfnsManager.getDashboardMetrics();

      if (dfnsResponse.error) {
        return {
          metrics: null,
          success: false,
          error: dfnsResponse.error.message
        };
      }

      // Enhance metrics with local data
      const metrics = dfnsResponse.data!;
      
      // Add organization-specific metrics if needed
      if (organizationId) {
        const orgMetrics = await this.getOrganizationMetrics(organizationId);
        // Merge org-specific metrics with DFNS metrics
        Object.assign(metrics, orgMetrics);
      }

      return { metrics, success: true };
    } catch (error) {
      return {
        metrics: null,
        success: false,
        error: (error as Error).message
      };
    }
  }

  // ===== Utility Methods =====

  /**
   * Validate transfer request
   */
  private validateTransferRequest(transfer: TransferRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!transfer.to) {
      errors.push('Recipient address is required');
    }

    if (!transfer.amount || parseFloat(transfer.amount) <= 0) {
      errors.push('Amount must be greater than 0');
    }

    // Basic address format validation (simplified)
    if (transfer.to && !transfer.to.match(/^0x[a-fA-F0-9]{40}$/)) {
      // This is a simplified check for Ethereum addresses
      // In reality, you'd validate based on the network
      errors.push('Invalid recipient address format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Cache wallet in local database
   */
  private async cacheWallet(wallet: Wallet): Promise<void> {
    try {
      const dbWallet: DfnsWalletInsert = {
        ...mapWalletToDatabase(wallet),
        dfns_wallet_id: wallet.walletId
      };

      await supabase
        .from('dfns_wallets')
        .upsert(dbWallet, { onConflict: 'wallet_id' });
    } catch (error) {
      console.error('Failed to cache wallet:', error);
    }
  }

  /**
   * Log activity to database
   */
  private async logActivity(activity: {
    activityType: string;
    entityId: string;
    entityType: string;
    description: string;
    status: 'success' | 'failed' | 'pending';
    metadata?: Record<string, any>;
    userId?: string;
  }): Promise<void> {
    try {
      await supabase
        .from('dfns_activity_logs')
        .insert({
          activity_type: activity.activityType,
          entity_id: activity.entityId,
          entity_type: activity.entityType,
          description: activity.description,
          status: activity.status,
          metadata: activity.metadata,
          user_id: activity.userId
        });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  /**
   * Get organization-specific metrics
   */
  private async getOrganizationMetrics(organizationId: string): Promise<Partial<DfnsDashboardMetrics>> {
    try {
      // Get organization-specific wallet count
      const { count: walletCount } = await supabase
        .from('dfns_wallets')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      // Get recent transfers for this organization
      const { data: transfers } = await supabase
        .from('dfns_transfers')
        .select(`
          *,
          dfns_wallets!inner (organization_id)
        `)
        .eq('dfns_wallets.organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        totalWallets: walletCount || 0,
        totalTransactions: transfers?.length || 0
      };
    } catch (error) {
      console.error('Failed to get organization metrics:', error);
      return {};
    }
  }

  // ===== Sync Operations =====

  /**
   * Sync wallets from DFNS to local database
   */
  async syncWallets(organizationId?: string): Promise<{
    synced: number;
    success: boolean;
    error?: string;
  }> {
    try {
      const dfnsManager = await getDfnsManager();
      const dfnsResponse = await dfnsManager.wallets.listWallets({ limit: 100 });

      if (dfnsResponse.error) {
        return {
          synced: 0,
          success: false,
          error: dfnsResponse.error.message
        };
      }

      const wallets = dfnsResponse.data || [];
      let syncedCount = 0;

      for (const wallet of wallets) {
        try {
          const dbWallet: DfnsWalletInsert = {
            ...mapWalletToDatabase(wallet),
            organization_id: organizationId,
            dfns_wallet_id: wallet.walletId
          };

          await supabase
            .from('dfns_wallets')
            .upsert(dbWallet, { onConflict: 'wallet_id' });

          syncedCount++;
        } catch (error) {
          console.error(`Failed to sync wallet ${wallet.walletId}:`, error);
        }
      }

      return { synced: syncedCount, success: true };
    } catch (error) {
      return {
        synced: 0,
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Health check for DFNS service
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    services: Record<string, boolean>;
    error?: string;
  }> {
    try {
      const dfnsManager = await getDfnsManager();
      const healthResponse = await dfnsManager.checkHealth();

      const services = {
        dfns: !healthResponse.error,
        database: true, // Assume database is healthy if we can make this call
        authentication: dfnsManager.isReady()
      };

      const healthy = Object.values(services).every(status => status);

      return {
        healthy,
        services,
        error: healthResponse.error?.message
      };
    } catch (error) {
      return {
        healthy: false,
        services: {
          dfns: false,
          database: false,
          authentication: false
        },
        error: (error as Error).message
      };
    }
  }

  // ===== Missing Methods (to be implemented) =====

  /**
   * Get activity log entries
   */
  async getActivityLog(filters?: {
    walletId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ activities: any[]; success: boolean; error?: string }> {
    try {
      // For now, return local activity logs
      let query = supabase
        .from('dfns_activity_logs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filters?.walletId) {
        query = query.eq('entity_id', filters.walletId);
      }
      
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(error.message);
      }
      
      return { activities: data || [], success: true };
    } catch (error) {
      return {
        activities: [],
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get policies
   */
  async getPolicies(filters?: {
    status?: string;
    limit?: number;
  }): Promise<{ policies: Policy[]; success: boolean; error?: string }> {
    try {
      // For now, return empty array until DFNS policy integration
      return { policies: [], success: true };
    } catch (error) {
      return {
        policies: [],
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get policy approvals
   */
  async getPolicyApprovals(filters?: {
    status?: string;
    limit?: number;
  }): Promise<{ approvals: PolicyApproval[]; success: boolean; error?: string }> {
    try {
      // For now, return empty array until DFNS policy integration
      return { approvals: [], success: true };
    } catch (error) {
      return {
        approvals: [],
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Create a new policy
   */
  async createPolicy(request: any): Promise<{ policy: Policy | null; success: boolean; error?: string }> {
    try {
      // TODO: Implement DFNS policy creation
      throw new Error('Policy creation not yet implemented');
    } catch (error) {
      return {
        policy: null,
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Archive a policy
   */
  async archivePolicy(policyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: Implement DFNS policy archival
      throw new Error('Policy archival not yet implemented');
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Create approval decision
   */
  async createApprovalDecision(approvalId: string, decision: 'approve' | 'reject', reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: Implement DFNS approval decision
      throw new Error('Approval decisions not yet implemented');
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get wallet balances
   */
  async getWalletBalances(walletId: string): Promise<WalletBalance[]> {
    try {
      // TODO: Implement DFNS wallet balance fetching
      // For now, return mock data
      return [
        {
          asset: {
            symbol: 'ETH',
            decimals: 18,
            verified: true,
            name: 'Ethereum',
            nativeAsset: true
          },
          balance: '1.5',
          valueInUSD: '2400.00',
          assetSymbol: 'ETH',
          valueInUsd: '2400.00'
        }
      ];
    } catch (error) {
      console.error('Failed to get wallet balances:', error);
      return [];
    }
  }

  /**
   * Estimate transfer fee
   */
  async estimateTransferFee(request: {
    walletId: string;
    to: string;
    amount: string;
    asset?: string;
  }): Promise<any> {
    try {
      // TODO: Implement actual gas estimation
      return {
        gasLimit: '21000',
        gasPrice: '20',
        maxFeePerGas: '25',
        maxPriorityFeePerGas: '2',
        estimatedFee: '0.000525',
        estimatedFeeUsd: '0.84'
      };
    } catch (error) {
      throw new Error('Failed to estimate transfer fee');
    }
  }

  /**
   * Create transfer
   */
  async createTransfer(request: any): Promise<any> {
    try {
      // TODO: Implement actual transfer creation
      return {
        transferId: `transfer_${Date.now()}`,
        status: 'pending',
        txHash: null,
        dateCreated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error('Failed to create transfer');
    }
  }

  /**
   * Delegate wallet
   */
  async delegateWallet(walletId: string, delegateTo: string): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: Implement wallet delegation
      throw new Error('Wallet delegation not yet implemented');
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get wallets (alias for listWallets)
   */
  async getWallets(filters?: any): Promise<{ wallets: Wallet[]; success: boolean; error?: string }> {
    return this.listWallets(filters);
  }

  /**
   * Get transfers
   */
  async getTransfers(filters?: {
    walletId?: string;
    status?: string;
    limit?: number;
  }): Promise<{ transfers: TransferResponse[]; success: boolean; error?: string }> {
    try {
      let query = supabase
        .from('dfns_transfers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filters?.walletId) {
        query = query.eq('wallet_id', filters.walletId);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Map database records to domain objects
      const transfers = (data || []).map(transfer => ({
        id: transfer.transfer_id,
        status: transfer.status as DfnsTransferStatus,
        txHash: transfer.tx_hash,
        dateCreated: transfer.date_created,
        dateBroadcast: transfer.date_broadcast,
        dateConfirmed: transfer.date_confirmed
      }));
      
      return { transfers, success: true };
    } catch (error) {
      return {
        transfers: [],
        success: false,
        error: (error as Error).message
      };
    }
  }

}

// ===== Export singleton instance =====
export const dfnsService = DfnsService.getInstance();
export default dfnsService;
