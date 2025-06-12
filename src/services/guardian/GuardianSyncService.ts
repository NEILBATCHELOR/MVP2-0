/**
 * 🔄 Guardian API & Database Sync Service
 * Systematically sync API data with database storage
 */

import { GuardianApiClient } from '@/infrastructure/guardian/GuardianApiClient';
import { GuardianTestDatabaseService } from './GuardianTestDatabaseService';
import type { GuardianWallet, GuardianOperation } from '@/types/guardian/guardianTesting';

export interface SyncResult {
  success: boolean;
  walletsProcessed: number;
  operationsProcessed: number;
  walletsAdded: number;
  walletsUpdated: number;
  operationsAdded: number;
  operationsUpdated: number;
  errors: string[];
  summary: {
    apiWallets: number;
    dbWallets: number;
    apiOperations: number;
    dbOperations: number;
  };
}

export interface SyncOptions {
  syncWallets?: boolean;
  syncOperations?: boolean;
  maxWallets?: number;
  maxOperations?: number;
}

export class GuardianSyncService {
  private apiClient: GuardianApiClient;

  constructor() {
    this.apiClient = new GuardianApiClient();
  }

  /**
   * 🎯 Complete sync of both wallets and operations
   */
  async syncAll(options: SyncOptions = {}): Promise<SyncResult> {
    const { 
      syncWallets = true, 
      syncOperations = true,
      maxWallets = 100,
      maxOperations = 100
    } = options;

    const result: SyncResult = {
      success: false,
      walletsProcessed: 0,
      operationsProcessed: 0,
      walletsAdded: 0,
      walletsUpdated: 0,
      operationsAdded: 0,
      operationsUpdated: 0,
      errors: [],
      summary: {
        apiWallets: 0,
        dbWallets: 0,
        apiOperations: 0,
        dbOperations: 0
      }
    };

    try {
      console.log('🔄 Starting Guardian sync...');

      // Get API data
      const [apiWallets, apiOperations] = await Promise.all([
        syncWallets ? this.apiClient.getWallets().catch(e => { 
          result.errors.push(`API wallets fetch failed: ${e.message}`);
          return [];
        }) : [],
        syncOperations ? this.apiClient.listOperations().catch(e => {
          result.errors.push(`API operations fetch failed: ${e.message}`);
          return [];
        }) : []
      ]);

      result.summary.apiWallets = apiWallets.length;
      result.summary.apiOperations = apiOperations.length;

      // Get database data
      const [dbWallets, dbOperations] = await Promise.all([
        GuardianTestDatabaseService.getGuardianWallets(maxWallets),
        GuardianTestDatabaseService.getGuardianOperations(maxOperations)
      ]);

      result.summary.dbWallets = dbWallets.length;
      result.summary.dbOperations = dbOperations.length;

      // Sync wallets
      if (syncWallets && apiWallets.length > 0) {
        const walletSync = await this.syncWallets(apiWallets, dbWallets);
        result.walletsProcessed = walletSync.processed;
        result.walletsAdded = walletSync.added;
        result.walletsUpdated = walletSync.updated;
        result.errors.push(...walletSync.errors);
      }

      // Sync operations
      if (syncOperations && apiOperations.length > 0) {
        const operationSync = await this.syncOperations(apiOperations, dbOperations);
        result.operationsProcessed = operationSync.processed;
        result.operationsAdded = operationSync.added;
        result.operationsUpdated = operationSync.updated;
        result.errors.push(...operationSync.errors);
      }

      result.success = result.errors.length === 0;
      console.log('✅ Guardian sync completed:', result);

      return result;

    } catch (error) {
      result.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.success = false;
      return result;
    }
  }

  /**
   * 🏦 Sync wallets between API and database
   */
  private async syncWallets(apiWallets: any[], dbWallets: GuardianWallet[]) {
    const result = { processed: 0, added: 0, updated: 0, errors: [] };

    for (const apiWallet of apiWallets) {
      try {
        result.processed++;
        
        // Find existing wallet in database
        const existingWallet = dbWallets.find(
          dw => dw.guardian_wallet_id === apiWallet.id || 
                dw.guardian_internal_id === apiWallet.id
        );

        if (existingWallet) {
          // Update existing wallet
          if (existingWallet.wallet_status !== apiWallet.status) {
            await GuardianTestDatabaseService.updateGuardianWallet(
              existingWallet.guardian_wallet_id,
              {
                wallet_status: apiWallet.status,
                guardian_internal_id: apiWallet.id,
                wallet_metadata: apiWallet,
                wallet_addresses: this.extractAddresses(apiWallet)
              }
            );
            result.updated++;
          }
        } else {
          // Add new wallet
          await GuardianTestDatabaseService.recordGuardianWallet({
            guardian_wallet_id: apiWallet.id,
            guardian_internal_id: apiWallet.id,
            wallet_name: `Synced Wallet ${apiWallet.id.substring(0, 8)}`,
            wallet_status: apiWallet.status || 'unknown',
            wallet_metadata: apiWallet,
            wallet_addresses: this.extractAddresses(apiWallet),
            // created_by: // Property removed 'guardian_sync'
          });
          result.added++;
        }

      } catch (error) {
        result.errors.push(`Wallet ${apiWallet.id} sync failed: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * ⚙️ Sync operations between API and database
   */
  private async syncOperations(apiOperations: any[], dbOperations: GuardianOperation[]) {
    const result = { processed: 0, added: 0, updated: 0, errors: [] };

    for (const apiOperation of apiOperations) {
      try {
        result.processed++;
        
        // Find existing operation in database
        const existingOperation = dbOperations.find(
          dbOp => dbOp.operation_id === apiOperation.id
        );

        if (existingOperation) {
          // Update existing operation
          if (existingOperation.operation_status !== apiOperation.status) {
            await GuardianTestDatabaseService.updateGuardianOperation(
              existingOperation.operation_id,
              {
                operation_status: apiOperation.status,
                operation_result: apiOperation.result || apiOperation,
                completed_at: apiOperation.status === 'processed' ? new Date().toISOString() : null
              }
            );
            result.updated++;
          }
        } else {
          // Add new operation
          await GuardianTestDatabaseService.recordGuardianOperation({
            operation_id: apiOperation.id,
            operation_type: apiOperation.type || 'wallet_creation',
            operation_status: apiOperation.status || 'unknown',
            operation_result: apiOperation.result || apiOperation,
            completed_at: apiOperation.status === 'processed' ? new Date().toISOString() : null,
            // created_by: // Property removed 'guardian_sync'
          });
          result.added++;
        }

      } catch (error) {
        result.errors.push(`Operation ${apiOperation.id} sync failed: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * 📍 Extract wallet addresses from API response
   */
  private extractAddresses(apiWallet: any): any[] {
    if (!apiWallet.accounts || !Array.isArray(apiWallet.accounts)) {
      return [];
    }

    return apiWallet.accounts.map(account => ({
      address: account.address,
      type: account.type,
      network: account.network
    }));
  }

  /**
   * 🔍 Get sync status and recommendations
   */
  async getSyncStatus(): Promise<{
    needsSync: boolean;
    recommendations: string[];
    apiCounts: { wallets: number; operations: number };
    dbCounts: { wallets: number; operations: number };
  }> {
    try {
      const [apiWallets, apiOperations, dbWallets, dbOperations] = await Promise.all([
        this.apiClient.getWallets().catch(() => []),
        this.apiClient.listOperations().catch(() => []),
        GuardianTestDatabaseService.getGuardianWallets(100),
        GuardianTestDatabaseService.getGuardianOperations(100)
      ]);

      const apiCounts = {
        wallets: apiWallets.length,
        operations: apiOperations.length
      };

      const dbCounts = {
        wallets: dbWallets.length,
        operations: dbOperations.length
      };

      const recommendations: string[] = [];
      let needsSync = false;

      if (apiCounts.wallets > dbCounts.wallets) {
        recommendations.push(`${apiCounts.wallets - dbCounts.wallets} new wallets in API`);
        needsSync = true;
      }

      if (apiCounts.operations > dbCounts.operations) {
        recommendations.push(`${apiCounts.operations - dbCounts.operations} new operations in API`);
        needsSync = true;
      }

      if (apiCounts.wallets === 0 && apiCounts.operations === 0) {
        recommendations.push('API returned no data - check connectivity');
      }

      if (!needsSync && apiCounts.wallets > 0) {
        recommendations.push('Data appears synchronized');
      }

      return {
        needsSync,
        recommendations,
        apiCounts,
        dbCounts
      };

    } catch (error) {
      return {
        needsSync: true,
        recommendations: [`Sync check failed: ${error.message}`],
        apiCounts: { wallets: 0, operations: 0 },
        dbCounts: { wallets: 0, operations: 0 }
      };
    }
  }
}
