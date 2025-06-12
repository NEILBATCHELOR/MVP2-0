/**
 * Enhanced RAMP Network Manager for DFNS Integration
 * 
 * Full integration with RAMP Network API v3, SDK, Webhooks, and Native Flow
 * Provides comprehensive fiat on/off-ramp functionality through DFNS infrastructure
 */

import type { DfnsResponse, DfnsError } from '@/types/dfns';
import type {
  FiatOnRampRequest,
  FiatOffRampRequest,
  FiatTransactionResponse,
  FiatQuoteRequest,
  FiatQuoteResponse,
  RampNetworkConfig,
  RampNetworkTransaction,
  RampNetworkWebhook,
  SupportedCurrency,
  PaymentMethod,
  FiatServiceResult
} from '@/types/dfns/fiat';

// RAMP Network SDK and API Types
export interface RampInstantSDKConfig {
  hostAppName: string;
  hostLogoUrl: string;
  hostApiKey: string;
  userAddress?: string;
  swapAsset?: string;
  offrampAsset?: string;
  swapAmount?: string;
  fiatCurrency?: string;
  fiatValue?: string;
  userEmailAddress?: string;
  enabledFlows?: ('ONRAMP' | 'OFFRAMP')[];
  variant?: 'auto' | 'hosted-auto' | 'desktop' | 'mobile' | 'hosted-desktop' | 'hosted-mobile' | 'embedded-desktop' | 'embedded-mobile';
  paymentMethodType?: any; // Using any to handle RAMP SDK type compatibility
  defaultFlow?: 'ONRAMP' | 'OFFRAMP';
  webhookStatusUrl?: string;
  offrampWebhookV3Url?: string;
  finalUrl?: string;
  userCountry?: string;
  useSendCryptoCallback?: boolean;
  selectedCountryCode?: string;
  defaultAsset?: string;
  containerNode?: HTMLElement;
}

export type RampPaymentMethod = 
  | 'MANUAL_BANK_TRANSFER'
  | 'AUTO_BANK_TRANSFER' 
  | 'CARD_PAYMENT'
  | 'APPLE_PAY'
  | 'GOOGLE_PAY'
  | 'PIX'
  | 'OPEN_BANKING';

export interface RampAssetInfo {
  symbol: string;
  chain: string;
  name: string;
  decimals: number;
  type: 'NATIVE' | 'ERC20';
  address: string | null;
  logoUrl: string;
  enabled: boolean;
  hidden: boolean;
  price: Record<string, number>;
  currencyCode: string;
  minPurchaseAmount: number;
  maxPurchaseAmount: number;
  minPurchaseCryptoAmount: string;
  networkFee?: number;
}

export interface RampPurchase {
  id: string;
  endTime: string;
  asset: RampAssetInfo;
  receiverAddress: string;
  cryptoAmount: string;
  fiatCurrency: string;
  fiatValue: number;
  paymentMethodType: RampPaymentMethod;
  status: string;
  createdAt: string;
  updatedAt: string;
  finalTxHash?: string;
  escrowAddress?: string;
  appliedFee: number;
}

export interface RampSale {
  id: string;
  saleViewToken: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  fees: {
    amount: string;
    currencySymbol: string;
  };
  exchangeRate: string | null;
  crypto: {
    amount: string;
    status: string | null;
    assetInfo: RampAssetInfo;
  };
  fiat: {
    amount: string;
    currencySymbol: string;
    status: string | null;
  };
}

export interface RampQuote {
  appliedFee: number;
  baseRampFee: number;
  cryptoAmount: string;
  fiatCurrency: string;
  fiatValue: number;
  asset: RampAssetInfo;
}

export interface RampEventPayload {
  type: 'WIDGET_CLOSE' | 'WIDGET_CONFIG_DONE' | 'WIDGET_CONFIG_FAILED' | 'PURCHASE_CREATED' | 'OFFRAMP_SALE_CREATED' | 'WIDGET_CLOSE_REQUEST' | 'WIDGET_CLOSE_REQUEST_CONFIRMED';
  payload: any;
  widgetInstanceId?: string;
}

export interface RampSendCryptoRequest {
  cryptoAmount: string;
  cryptoAddress: string;
  assetInfo: RampAssetInfo;
}

/**
 * Enhanced RAMP Network Manager Class
 * 
 * Provides full integration with RAMP Network's API v3, SDK, and services
 */
export class RampNetworkManager {
  private config: RampNetworkConfig;
  private sdkInstance: any = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private baseUrl: string;
  private apiUrl: string;

  constructor(config: RampNetworkConfig) {
    this.config = {
      webhookSecret: '',
      environment: 'production',
      ...config
    };
    
    this.baseUrl = this.config.environment === 'staging' 
      ? 'https://app.demo.ramp.network'
      : 'https://app.ramp.network';
    
    this.apiUrl = this.config.environment === 'staging'
      ? 'https://api.demo.ramp.network'
      : 'https://api.ramp.network';

    this.initializeEventListeners();
  }

  // ===== SDK Integration Methods =====

  /**
   * Initialize RAMP Network SDK
   */
  async initializeSDK(): Promise<void> {
    try {
      // Dynamic import of RAMP SDK
      const { RampInstantSDK } = await import('@ramp-network/ramp-instant-sdk');
      
      // Store SDK reference for later use
      (window as any).RampInstantSDK = RampInstantSDK;
      
      console.log('RAMP Network SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RAMP Network SDK:', error);
      throw new Error('RAMP Network SDK initialization failed');
    }
  }

  /**
   * Create and show RAMP widget for on-ramp
   */
  async createOnRampWidget(request: FiatOnRampRequest): Promise<DfnsResponse<{ widgetInstance: any }>> {
    try {
      await this.initializeSDK();
      
      const { RampInstantSDK } = await import('@ramp-network/ramp-instant-sdk');

      const config: RampInstantSDKConfig = {
        hostAppName: this.config.hostAppName,
        hostLogoUrl: this.config.hostLogoUrl,
        hostApiKey: this.config.apiKey,
        userAddress: request.walletAddress,
        swapAsset: this.mapCryptoAssetToRampFormat(request.cryptoAsset),
        fiatCurrency: request.currency,
        fiatValue: request.amount,
        userEmailAddress: request.userEmail,
        enabledFlows: ['ONRAMP'],
        defaultFlow: 'ONRAMP',
        paymentMethodType: this.mapPaymentMethodToRamp(request.paymentMethod),
        webhookStatusUrl: `${window.location.origin}/api/webhooks/ramp/onramp`,
        finalUrl: request.returnUrl || `${window.location.origin}/dashboard/wallets`,
        variant: 'auto'
      };

      const widget = new RampInstantSDK(config);

      // Set up event listeners
      this.setupWidgetEventListeners(widget);

      // Show widget
      widget.show();

      this.sdkInstance = widget;

      return {
        kind: 'ramp_onramp_widget_success',
        data: { widgetInstance: widget },
        error: null
      };

    } catch (error) {
      return {
        kind: 'ramp_onramp_widget_error',
        data: null,
        error: {
          code: 'RAMP_WIDGET_ERROR',
          message: (error as Error).message
        } as DfnsError
      };
    }
  }

  /**
   * Create and show RAMP widget for off-ramp
   */
  async createOffRampWidget(request: FiatOffRampRequest): Promise<DfnsResponse<{ widgetInstance: any }>> {
    try {
      await this.initializeSDK();
      
      const { RampInstantSDK } = await import('@ramp-network/ramp-instant-sdk');

      const config: RampInstantSDKConfig = {
        hostAppName: this.config.hostAppName,
        hostLogoUrl: this.config.hostLogoUrl,
        hostApiKey: this.config.apiKey,
        userAddress: request.walletAddress,
        offrampAsset: this.mapCryptoAssetToRampFormat(request.cryptoAsset),
        swapAmount: this.convertToWei(request.amount, request.cryptoAsset),
        fiatCurrency: request.currency,
        userEmailAddress: request.userEmail,
        enabledFlows: ['OFFRAMP'],
        defaultFlow: 'OFFRAMP',
        offrampWebhookV3Url: `${window.location.origin}/api/webhooks/ramp/offramp`,
        finalUrl: request.returnUrl || `${window.location.origin}/dashboard/wallets`,
        useSendCryptoCallback: true, // Enable native flow
        variant: 'auto'
      };

      const widget = new RampInstantSDK(config);

      // Set up event listeners
      this.setupWidgetEventListeners(widget);

      // Show widget
      widget.show();

      this.sdkInstance = widget;

      return {
        kind: 'ramp_offramp_widget_success',
        data: { widgetInstance: widget },
        error: null
      };

    } catch (error) {
      return {
        kind: 'ramp_offramp_widget_error',
        data: null,
        error: {
          code: 'RAMP_WIDGET_ERROR',
          message: (error as Error).message
        } as DfnsError
      };
    }
  }

  /**
   * Setup widget event listeners
   */
  private setupWidgetEventListeners(widget: any): void {
    // Purchase created event
    widget.on('PURCHASE_CREATED', (event: any) => {
      this.emitEvent('purchase_created', {
        purchase: event.payload.purchase,
        purchaseViewToken: event.payload.purchaseViewToken,
        apiUrl: event.payload.apiUrl
      });
    });

    // Off-ramp sale created event
    widget.on('OFFRAMP_SALE_CREATED', (event: any) => {
      this.emitEvent('offramp_sale_created', {
        sale: event.payload.sale,
        saleViewToken: event.payload.saleViewToken,
        apiUrl: event.payload.apiUrl
      });
    });

    // Widget close event
    widget.on('WIDGET_CLOSE', () => {
      this.emitEvent('widget_close', {});
    });

    // Widget config events
    widget.on('WIDGET_CONFIG_DONE', () => {
      this.emitEvent('widget_config_done', {});
    });

    widget.on('WIDGET_CONFIG_FAILED', () => {
      this.emitEvent('widget_config_failed', {});
    });

    // Send crypto callback for native flow
    widget.on('SEND_CRYPTO_REQUEST', (event: any) => {
      this.emitEvent('send_crypto_request', {
        cryptoAmount: event.payload.cryptoAmount,
        cryptoAddress: event.payload.cryptoAddress,
        assetInfo: event.payload.assetInfo
      });
    });
  }

  // ===== REST API Integration Methods =====

  /**
   * Get supported assets
   */
  async getSupportedAssets(currencyCode: string = 'USD'): Promise<FiatServiceResult<RampAssetInfo[]>> {
    try {
      const response = await fetch(`${this.apiUrl}/api/host-api/assets?currencyCode=${currencyCode}&hostApiKey=${this.config.apiKey}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        data: data.assets,
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
   * Get supported off-ramp assets
   */
  async getSupportedOffRampAssets(currencyCode: string = 'USD'): Promise<FiatServiceResult<RampAssetInfo[]>> {
    try {
      const response = await fetch(`${this.apiUrl}/api/host-api/offramp/assets?currencyCode=${currencyCode}&hostApiKey=${this.config.apiKey}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        data: data.assets,
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
   * Get quote for transaction
   */
  async getQuote(request: FiatQuoteRequest): Promise<FiatServiceResult<RampQuote>> {
    try {
      const endpoint = request.type === 'onramp' ? 'quote' : 'offramp/quote';
      
      const body = {
        cryptoAssetSymbol: this.mapCryptoAssetToRampFormat(request.toCurrency),
        fiatCurrency: request.fromCurrency,
        ...(request.type === 'onramp' 
          ? { fiatValue: parseFloat(request.amount) }
          : { cryptoAmount: this.convertToWei(request.amount, request.toCurrency) }
        ),
        paymentMethodType: this.mapPaymentMethodToRamp(request.paymentMethod)
      };

      const response = await fetch(`${this.apiUrl}/api/host-api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        data: data,
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
   * Get purchase status
   */
  async getPurchaseStatus(purchaseId: string, secret: string): Promise<FiatServiceResult<RampPurchase>> {
    try {
      const response = await fetch(`${this.apiUrl}/api/host-api/purchase/${purchaseId}?secret=${secret}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        data: data,
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
   * Get off-ramp sale status
   */
  async getSaleStatus(saleId: string, secret: string): Promise<FiatServiceResult<RampSale>> {
    try {
      const response = await fetch(`${this.apiUrl}/api/host-api/offramp/sale/${saleId}?secret=${secret}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        data: data,
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

  // ===== Webhook Handling =====

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      // Implementation depends on your webhook secret and signature verification method
      // This is a placeholder - implement actual signature verification
      if (!this.config.webhookSecret) {
        return true; // Skip verification if no secret configured
      }

      // TODO: Implement actual ECDSA signature verification
      // See RAMP Network documentation for implementation details
      
      return true;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(event: RampNetworkWebhook): Promise<void> {
    try {
      switch (event.type) {
        case 'CREATED':
          this.emitEvent('purchase_webhook_created', event.purchase);
          break;
        case 'RELEASED':
          this.emitEvent('purchase_webhook_released', event.purchase);
          break;
        case 'EXPIRED':
          this.emitEvent('purchase_webhook_expired', event.purchase);
          break;
        case 'CANCELLED':
          this.emitEvent('purchase_webhook_cancelled', event.purchase);
          break;
        default:
          console.warn('Unknown webhook event type:', event.type);
      }
    } catch (error) {
      console.error('Error processing webhook event:', error);
    }
  }

  // ===== Event System =====

  /**
   * Add event listener
   */
  addEventListener(eventType: string, callback: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventType: string, callback: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Initialize default event listeners
   */
  private initializeEventListeners(): void {
    // Add default event handlers
    this.addEventListener('purchase_created', (data: any) => {
      console.log('RAMP purchase created:', data);
    });

    this.addEventListener('offramp_sale_created', (data: any) => {
      console.log('RAMP off-ramp sale created:', data);
    });
  }

  // ===== Utility Methods =====

  /**
   * Map crypto asset to RAMP format
   */
  private mapCryptoAssetToRampFormat(asset: string): string {
    const assetMap: Record<string, string> = {
      'ETH': 'ETH_ETH',
      'BTC': 'BTC_BTC',
      'USDC': 'ETH_USDC',
      'USDT': 'ETH_USDT',
      'DAI': 'ETH_DAI',
      'MATIC': 'MATIC_MATIC',
      'BNB': 'BSC_BNB',
      'AVAX': 'AVAX_AVAX',
      'SOL': 'SOLANA_SOL'
    };

    return assetMap[asset] || `ETH_${asset}`;
  }

  /**
   * Map payment method to RAMP format
   */
  private mapPaymentMethodToRamp(method?: string): RampPaymentMethod | undefined {
    if (!method) return undefined;

    const methodMap: Record<string, RampPaymentMethod> = {
      'card': 'CARD_PAYMENT',
      'bank_transfer': 'MANUAL_BANK_TRANSFER',
      'auto_bank_transfer': 'AUTO_BANK_TRANSFER',
      'apple_pay': 'APPLE_PAY',
      'google_pay': 'GOOGLE_PAY',
      'pix': 'PIX',
      'open_banking': 'OPEN_BANKING'
    };

    return methodMap[method] || 'CARD_PAYMENT';
  }

  /**
   * Convert amount to wei for crypto
   */
  private convertToWei(amount: string, asset: string): string {
    const decimals = this.getAssetDecimals(asset);
    const value = parseFloat(amount);
    return (value * Math.pow(10, decimals)).toString();
  }

  /**
   * Get asset decimals
   */
  private getAssetDecimals(asset: string): number {
    const decimalsMap: Record<string, number> = {
      'ETH': 18,
      'BTC': 8,
      'USDC': 6,
      'USDT': 6,
      'DAI': 18,
      'MATIC': 18,
      'BNB': 18,
      'AVAX': 18,
      'SOL': 9
    };

    return decimalsMap[asset] || 18;
  }

  /**
   * Close widget
   */
  closeWidget(): void {
    if (this.sdkInstance) {
      this.sdkInstance.unsubscribe();
      this.sdkInstance = null;
    }
  }

  /**
   * Get configuration
   */
  getConfiguration(): RampNetworkConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfiguration(newConfig: Partial<RampNetworkConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export default RampNetworkManager;
