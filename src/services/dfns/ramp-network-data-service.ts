/**
 * RAMP Network Data Service
 * 
 * Manages RAMP Network data synchronization, asset caching, and transaction management
 */

import { supabase } from '@/infrastructure/supabaseClient';
import { RampNetworkManager } from '@/infrastructure/dfns/fiat/ramp-network-manager';
import type { Database, Tables } from '@/types/core/database';
import type { 
  RampAssetInfo, 
  RampPurchase, 
  RampSale, 
  FiatServiceResult,
  RampNetworkEnhancedConfig 
} from '@/types/dfns/fiat';
import type { 
  RampAssetCacheEntry as RampAssetCacheEntryType,
  RampTransactionEvent as RampTransactionEventType
} from '@/types/ramp/database';

// Type aliases for database operations
type RampAssetCacheRow = Tables<'ramp_supported_assets'>;
type RampAssetCacheInsert = {
  symbol: string;
  name: string;
  chain: string;
  type: string;
  address?: string;
  logo_url?: string;
  enabled: boolean;
  hidden: boolean;
  decimals: number;
  price_data?: Record<string, number> | null;
  currency_code: string;
  min_purchase_amount?: number;
  max_purchase_amount?: number | null;
  min_purchase_crypto_amount?: string;
  network_fee?: number | null;
  flow_type: 'onramp' | 'offramp' | 'both';
  last_updated: string;
};
type RampTransactionEventRow = Tables<'ramp_transaction_events'>;
type RampTransactionEventInsert = {
  transaction_id: string;
  event_type: string;
  event_data: Record<string, any>;
  ramp_event_id?: string | null;
  session_id?: string | null;
  user_agent?: string | null;
  ip_address?: string | null;
  timestamp: string;
};

// Use types from ramp database instead of extending raw database types
export type RampAssetCacheEntry = RampAssetCacheEntryType;
export type RampTransactionEvent = RampTransactionEventType;

export class RampNetworkDataService {
  private rampManager: RampNetworkManager | null = null;
  private assetSyncInterval: NodeJS.Timeout | null = null;

  constructor(config?: RampNetworkEnhancedConfig) {
    if (config) {
      this.rampManager = new RampNetworkManager(config);
    }
  }

  /**
   * Initialize the service with configuration
   */
  async initialize(config: RampNetworkEnhancedConfig): Promise<void> {
    this.rampManager = new RampNetworkManager(config);
    
    // Start periodic asset synchronization
    await this.syncSupportedAssets();
    this.startAssetSyncScheduler();
  }

  /**
   * Sync supported assets from RAMP Network API
   */
  async syncSupportedAssets(currencyCode: string = 'USD'): Promise<FiatServiceResult<void>> {
    if (!this.rampManager) {
      return {
        data: null,
        success: false,
        error: 'RAMP Network manager not initialized'
      };
    }

    try {
      console.log('Syncing RAMP Network supported assets...');

      // Fetch assets from both on-ramp and off-ramp endpoints
      const [onrampResult, offrampResult] = await Promise.all([
        this.rampManager.getSupportedAssets(currencyCode),
        this.rampManager.getSupportedOffRampAssets(currencyCode)
      ]);

      if (!onrampResult.success && !offrampResult.success) {
        return {
          data: null,
          success: false,
          error: `Failed to fetch assets: ${onrampResult.error || offrampResult.error}`
        };
      }

      // Process on-ramp assets
      if (onrampResult.success && onrampResult.data) {
        await this.storeAssets(onrampResult.data, 'onramp', currencyCode);
      }

      // Process off-ramp assets
      if (offrampResult.success && offrampResult.data) {
        await this.storeAssets(offrampResult.data, 'offramp', currencyCode);
      }

      console.log('RAMP Network assets sync completed successfully');

      return {
        data: undefined,
        success: true
      };

    } catch (error) {
      console.error('Error syncing RAMP Network assets:', error);
      return {
        data: null,
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Store assets in database cache
   */
  private async storeAssets(assets: RampAssetInfo[], flowType: 'onramp' | 'offramp', currencyCode: string): Promise<void> {
    for (const asset of assets) {
      try {
        const assetData: RampAssetCacheInsert = {
          symbol: asset.symbol,
          name: asset.name,
          chain: asset.chain,
          type: asset.type,
          address: asset.address,
          logo_url: asset.logoUrl,
          enabled: asset.enabled,
          hidden: asset.hidden,
          decimals: asset.decimals,
          price_data: asset.price || null,
          currency_code: currencyCode,
          min_purchase_amount: asset.minPurchaseAmount,
          max_purchase_amount: asset.maxPurchaseAmount === -1 ? null : asset.maxPurchaseAmount,
          min_purchase_crypto_amount: asset.minPurchaseCryptoAmount,
          network_fee: asset.networkFee || null,
          flow_type: flowType,
          last_updated: new Date().toISOString()
        };

        // Upsert asset data using proper typing
        const { error } = await (supabase as any)
          .from('ramp_supported_assets')
          .upsert(assetData, {
            onConflict: 'symbol,chain,flow_type'
          });

        if (error) {
          console.error(`Failed to store asset ${asset.symbol}:`, error);
        }

      } catch (error) {
        console.error(`Error processing asset ${asset.symbol}:`, error);
      }
    }
  }

  /**
   * Get cached supported assets
   */
  async getCachedSupportedAssets(options: {
    flowType?: 'onramp' | 'offramp' | 'both';
    enabled?: boolean;
    currencyCode?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<FiatServiceResult<RampAssetCacheEntry[]>> {
    try {
      let query = (supabase as any)
        .from('ramp_supported_assets')
        .select('*')
        .order('symbol', { ascending: true });

      // Apply filters
      if (options.flowType && options.flowType !== 'both') {
        query = query.in('flow_type', [options.flowType, 'both']);
      }

      if (options.enabled !== undefined) {
        query = query.eq('enabled', options.enabled);
      }

      if (options.currencyCode) {
        query = query.eq('currency_code', options.currencyCode);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        return {
          data: null,
          success: false,
          error: error.message
        };
      }

      return {
        data: (data || []) as RampAssetCacheEntry[],
        success: true
      };

    } catch (error) {
      return {
        data: null,
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Track transaction event
   */
  async trackTransactionEvent(
    transactionId: string,
    eventType: string,
    eventData: Record<string, any>,
    options: {
      rampEventId?: string;
      sessionId?: string;
      userAgent?: string;
      ipAddress?: string;
    } = {}
  ): Promise<FiatServiceResult<RampTransactionEvent>> {
    try {
      const eventRecord: RampTransactionEventInsert = {
        transaction_id: transactionId,
        event_type: eventType,
        event_data: eventData,
        ramp_event_id: options.rampEventId || null,
        session_id: options.sessionId || null,
        user_agent: options.userAgent || null,
        ip_address: options.ipAddress || null,
        timestamp: new Date().toISOString()
      };

      const { data, error } = await (supabase as any)
        .from('ramp_transaction_events')
        .insert(eventRecord)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          success: false,
          error: error.message
        };
      }

      return {
        data: data as RampTransactionEvent,
        success: true
      };

    } catch (error) {
      return {
        data: null,
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get transaction events
   */
  async getTransactionEvents(
    transactionId: string,
    options: {
      eventType?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<FiatServiceResult<RampTransactionEvent[]>> {
    try {
      let query = (supabase as any)
        .from('ramp_transaction_events')
        .select('*')
        .eq('transaction_id', transactionId)
        .order('timestamp', { ascending: false });

      if (options.eventType) {
        query = query.eq('event_type', options.eventType);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        return {
          data: null,
          success: false,
          error: error.message
        };
      }

      return {
        data: (data || []) as RampTransactionEvent[],
        success: true
      };

    } catch (error) {
      return {
        data: null,
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Update transaction from RAMP webhook
   */
  async updateTransactionFromWebhook(
    providerTransactionId: string,
    webhookData: RampPurchase | RampSale,
    status: string
  ): Promise<FiatServiceResult<void>> {
    try {
      // Serialize the webhook data to JSON-compatible format
      const serializedMetadata = JSON.parse(JSON.stringify({
        ...webhookData,
        last_webhook_update: new Date().toISOString()
      }));

      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        metadata: serializedMetadata
      };

      // Add specific fields based on webhook data
      if ('finalTxHash' in webhookData && webhookData.finalTxHash) {
        (updateData as any).tx_hash = webhookData.finalTxHash;
      }

      const { error } = await supabase
        .from('fiat_transactions')
        .update(updateData)
        .eq('provider_transaction_id', providerTransactionId)
        .eq('provider', 'ramp_network');

      if (error) {
        return {
          data: null,
          success: false,
          error: error.message
        };
      }

      return {
        data: undefined,
        success: true
      };

    } catch (error) {
      return {
        data: null,
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get transaction analytics
   */
  async getTransactionAnalytics(options: {
    startDate?: string;
    endDate?: string;
    provider?: string;
    type?: 'onramp' | 'offramp';
    status?: string;
  } = {}): Promise<FiatServiceResult<any>> {
    try {
      let query = supabase
        .from('fiat_transactions')
        .select(`
          id,
          provider,
          type,
          status,
          amount,
          currency,
          crypto_asset,
          created_at
        `);

      // Apply filters
      if (options.startDate) {
        query = query.gte('created_at', options.startDate);
      }

      if (options.endDate) {
        query = query.lte('created_at', options.endDate);
      }

      if (options.provider) {
        query = query.eq('provider', options.provider);
      }

      if (options.type) {
        query = query.eq('type', options.type);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query;

      if (error) {
        return {
          data: null,
          success: false,
          error: error.message
        };
      }

      // Process analytics
      const analytics = this.processTransactionAnalytics(data || []);

      return {
        data: analytics,
        success: true
      };

    } catch (error) {
      return {
        data: null,
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Process transaction analytics
   */
  private processTransactionAnalytics(transactions: any[]): any {
    const analytics = {
      total: transactions.length,
      byType: { onramp: 0, offramp: 0 },
      byStatus: {} as Record<string, number>,
      byProvider: {} as Record<string, number>,
      byCurrency: {} as Record<string, number>,
      totalVolume: 0,
      averageAmount: 0
    };

    let totalAmount = 0;

    transactions.forEach(tx => {
      // Count by type
      analytics.byType[tx.type as 'onramp' | 'offramp']++;

      // Count by status
      analytics.byStatus[tx.status] = (analytics.byStatus[tx.status] || 0) + 1;

      // Count by provider
      analytics.byProvider[tx.provider] = (analytics.byProvider[tx.provider] || 0) + 1;

      // Count by currency
      analytics.byCurrency[tx.currency] = (analytics.byCurrency[tx.currency] || 0) + 1;

      // Calculate volume
      const amount = parseFloat(tx.amount) || 0;
      totalAmount += amount;
    });

    analytics.totalVolume = totalAmount;
    analytics.averageAmount = transactions.length > 0 ? totalAmount / transactions.length : 0;

    return analytics;
  }

  /**
   * Start asset sync scheduler
   */
  private startAssetSyncScheduler(): void {
    // Sync assets every 6 hours
    this.assetSyncInterval = setInterval(async () => {
      try {
        await this.syncSupportedAssets();
      } catch (error) {
        console.error('Scheduled asset sync failed:', error);
      }
    }, 6 * 60 * 60 * 1000); // 6 hours
  }

  /**
   * Stop asset sync scheduler
   */
  stopAssetSyncScheduler(): void {
    if (this.assetSyncInterval) {
      clearInterval(this.assetSyncInterval);
      this.assetSyncInterval = null;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopAssetSyncScheduler();
    if (this.rampManager) {
      this.rampManager.closeWidget();
    }
  }
}

// Singleton instance
let rampDataServiceInstance: RampNetworkDataService | null = null;

/**
 * Get or create RAMP Network data service instance
 */
export function getRampNetworkDataService(config?: RampNetworkEnhancedConfig): RampNetworkDataService {
  if (!rampDataServiceInstance) {
    rampDataServiceInstance = new RampNetworkDataService(config);
  }
  return rampDataServiceInstance;
}

export default RampNetworkDataService;
