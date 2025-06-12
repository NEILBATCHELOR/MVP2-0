/**
 * MoonPay Unified Service Manager
 * Provides centralized access to all MoonPay services
 */

// Import all services directly
import { OnRampService, onRampService } from './core/OnRampService';
import { OffRampService, offRampService } from './core/OffRampService';
import { EnhancedSwapService, enhancedSwapService } from './core/EnhancedSwapService';
import { SwapService, swapService } from './core/SwapService';
import { EnhancedNFTService, enhancedNFTService } from './core/EnhancedNFTService';
import { WebhookHandler, webhookHandler } from './core/WebhookHandler';

import { CustomerService, customerService } from './management/CustomerService';
import { AccountService, accountService } from './management/AccountService';
import { AnalyticsService, analyticsService } from './management/AnalyticsService';
import { PolicyService, policyService } from './management/PolicyService';
import { PartnerService, partnerService } from './management/PartnerService';

import { NetworkFeesService, networkFeesService } from './infrastructure/NetworkFeesService';
import { GeolocationService, geolocationService } from './infrastructure/GeolocationService';
import { ComplianceService, complianceService } from './infrastructure/ComplianceService';
import { HealthMonitor, healthMonitor } from './infrastructure/HealthMonitor';

// Export all services
export {
  OnRampService,
  onRampService,
  OffRampService,
  offRampService,
  EnhancedSwapService,
  enhancedSwapService,
  SwapService,
  swapService,
  EnhancedNFTService,
  enhancedNFTService,
  WebhookHandler,
  webhookHandler,
  CustomerService,
  customerService,
  AccountService,
  accountService,
  AnalyticsService,
  analyticsService,
  PolicyService,
  policyService,
  PartnerService,
  partnerService,
  NetworkFeesService,
  networkFeesService,
  GeolocationService,
  geolocationService,
  ComplianceService,
  complianceService,
  HealthMonitor,
  healthMonitor
};

// Service types - Core
export type {
  OnRampTransaction,
  OnRampCurrency,
  OnRampQuote,
  OnRampLimits,
  PaymentMethod
} from './core/OnRampService';

export type {
  OffRampTransaction,
  OffRampQuote,
  PayoutMethod
} from './core/OffRampService';

// Unified types
export type {
  MoonpayQuote,
  MoonpayTransaction,
  BaseQuote,
  BaseTransaction
} from './types';

export {
  isOnRampQuote,
  isOffRampQuote,
  isOnRampTransaction,
  isOffRampTransaction,
  normalizeQuote,
  normalizeTransaction,
  getQuoteDisplayAmount,
  getTransactionDisplayInfo
} from './types';

export type {
  SwapRoute,
  SwapAggregation,
  LimitOrder,
  SwapStrategy,
  SwapAnalytics,
  ArbitrageOpportunity,
  LiquidityPool
} from './core/EnhancedSwapService';

export type {
  SwapRouteAnalysis,
  SwapPortfolioBalance,
  SwapHistory,
  SwapLimitOrder,
  SwapSlippageSettings
} from './core/SwapService';

export type {
  MoonpaySwapPair,
  MoonpaySwapQuote,
  MoonpaySwapTransaction
} from './MoonpayService';

export type {
  NFTCollection,
  NFTToken,
  NFTListing,
  NFTMarketplaceStats,
  NFTPortfolio,
  NFTMintingCampaign,
  NFTRoyaltyDistribution
} from './core/EnhancedNFTService';

export type {
  WebhookEvent,
  WebhookConfig,
  WebhookDelivery,
  WebhookStats,
  ProcessedWebhookResult
} from './core/WebhookHandler';

// Service types - Management
export type {
  CustomerProfile,
  CustomerBadges,
  IdentityVerificationSession
} from './management/CustomerService';

export type {
  PartnerAccount,
  PartnerOnboarding,
  PartnerMetrics,
  PartnerIntegration,
  DomainManagement
} from './management/PartnerService';

// Service types - Infrastructure
export type {
  ServiceHealthStatus,
  OverallHealthStatus,
  HealthCheckConfig,
  PerformanceMetrics
} from './infrastructure/HealthMonitor';

// Configuration interface
export interface MoonPayConfig {
  apiKey: string;
  secretKey: string;
  webhookSecret?: string;
  testMode?: boolean;
  services?: {
    onRamp?: boolean;
    offRamp?: boolean;
    swap?: boolean;
    nft?: boolean;
    customer?: boolean;
    account?: boolean;
    analytics?: boolean;
    policy?: boolean;
    partner?: boolean;
    networkFees?: boolean;
    geolocation?: boolean;
    compliance?: boolean;
    webhooks?: boolean;
    healthMonitor?: boolean;
  };
  features?: {
    realTimeUpdates?: boolean;
    advancedAnalytics?: boolean;
    complianceMonitoring?: boolean;
    networkOptimization?: boolean;
    arbitrageDetection?: boolean;
    nftValuation?: boolean;
    predictiveInsights?: boolean;
    automatedReporting?: boolean;
  };
}

// Unified service interface
export interface MoonPayServices {
  // Core services
  onRamp: OnRampService;
  offRamp: OffRampService;
  swap: EnhancedSwapService;
  nft: EnhancedNFTService;
  webhook: WebhookHandler;
  
  // Management services
  customer: CustomerService;
  account: AccountService;
  analytics: AnalyticsService;
  policy: PolicyService;
  partner: PartnerService;
  
  // Infrastructure services
  networkFees: NetworkFeesService;
  geolocation: GeolocationService;
  compliance: ComplianceService;
  healthMonitor: HealthMonitor;
}

/**
 * Create unified MoonPay services instance
 */
export function createMoonPayServices(config: MoonPayConfig): MoonPayServices {
  const { 
    apiKey, 
    secretKey, 
    webhookSecret = '', 
    testMode = true,
    services = {},
    features = {}
  } = config;

  // Default all services to enabled
  const serviceConfig = {
    onRamp: true,
    offRamp: true,
    swap: true,
    nft: true,
    customer: true,
    account: true,
    analytics: true,
    policy: true,
    partner: true,
    networkFees: true,
    geolocation: true,
    compliance: true,
    webhooks: true,
    healthMonitor: true,
    ...services
  };

  const createdServices: Partial<MoonPayServices> = {};

  // Core services
  if (serviceConfig.onRamp) {
    createdServices.onRamp = new OnRampService(apiKey, secretKey, testMode);
  }
  if (serviceConfig.offRamp) {
    createdServices.offRamp = new OffRampService(apiKey, secretKey, testMode);
  }
  if (serviceConfig.swap) {
    createdServices.swap = new EnhancedSwapService(apiKey, secretKey, testMode);
  }
  if (serviceConfig.nft) {
    createdServices.nft = new EnhancedNFTService(apiKey, secretKey, testMode);
  }
  if (serviceConfig.webhooks) {
    createdServices.webhook = new WebhookHandler(apiKey, secretKey, webhookSecret, testMode);
  }

  // Management services
  if (serviceConfig.customer) {
    createdServices.customer = new CustomerService(apiKey, secretKey, testMode);
  }
  if (serviceConfig.account) {
    createdServices.account = new AccountService(apiKey, secretKey, testMode);
  }
  if (serviceConfig.analytics) {
    createdServices.analytics = new AnalyticsService(apiKey, secretKey, testMode);
  }
  if (serviceConfig.policy) {
    createdServices.policy = new PolicyService(apiKey, secretKey, testMode);
  }
  if (serviceConfig.partner) {
    createdServices.partner = new PartnerService(apiKey, secretKey, testMode);
  }

  // Infrastructure services
  if (serviceConfig.networkFees) {
    createdServices.networkFees = new NetworkFeesService(apiKey, secretKey, testMode);
  }
  if (serviceConfig.geolocation) {
    createdServices.geolocation = new GeolocationService(apiKey, secretKey, testMode);
  }
  if (serviceConfig.compliance) {
    createdServices.compliance = new ComplianceService(apiKey, secretKey, testMode);
  }
  if (serviceConfig.healthMonitor) {
    createdServices.healthMonitor = new HealthMonitor(apiKey, secretKey);
    // Start monitoring if enabled
    if (features.realTimeUpdates) {
      createdServices.healthMonitor.startMonitoring();
    }
  }

  return createdServices as MoonPayServices;
}

/**
 * Default service manager instance
 */
export const moonPayServices = createMoonPayServices({
  apiKey: import.meta.env.VITE_MOONPAY_API_KEY || "",
  secretKey: import.meta.env.VITE_MOONPAY_SECRET_KEY || "",
  webhookSecret: import.meta.env.VITE_MOONPAY_WEBHOOK_SECRET || "",
  testMode: import.meta.env.VITE_MOONPAY_TEST_MODE !== 'false',
  features: {
    realTimeUpdates: import.meta.env.PROD || false, // Only enable in production
    advancedAnalytics: true,
    complianceMonitoring: true,
    networkOptimization: true,
    arbitrageDetection: false,
    nftValuation: true,
    predictiveInsights: true,
    automatedReporting: true
  }
});

/**
 * Enhanced service health check
 */
export async function checkMoonPayServicesHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'down';
  services: Record<string, 'up' | 'down' | 'degraded'>;
  details: Record<string, any>;
}> {
  const results: Record<string, any> = {};
  const services: Record<string, 'up' | 'down' | 'degraded'> = {};

  try {
    // Use health monitor if available
    if (moonPayServices.healthMonitor) {
      const healthStatus = await moonPayServices.healthMonitor.getHealthStatus();
      return {
        status: healthStatus.status,
        services: Object.fromEntries(
          healthStatus.services.map(s => [s.serviceName, s.status === 'healthy' ? 'up' : s.status === 'degraded' ? 'degraded' : 'down'])
        ),
        details: Object.fromEntries(
          healthStatus.services.map(s => [s.serviceName, s.details])
        )
      };
    }

    // Fallback to basic health checks
    const tests = [
      { 
        name: 'onRamp', 
        test: () => moonPayServices.onRamp?.getSupportedCurrencies() 
      },
      { 
        name: 'offRamp', 
        test: () => moonPayServices.offRamp?.getSupportedSellCurrencies() 
      },
      { 
        name: 'swap', 
        test: () => moonPayServices.swap?.getSwapPairs() 
      },
      { 
        name: 'nft', 
        test: () => moonPayServices.nft?.getCollections({ limit: 1 }) 
      },
      { 
        name: 'customer', 
        test: () => moonPayServices.customer?.getCustomerBadges('0x742d35cc6671c0532925a3b8d6931d9e6b1d4e8e') 
      }
    ];

    const testPromises = tests.map(async ({ name, test }) => {
      if (!test) {
        services[name] = 'down';
        results[name] = { status: 'down', error: 'Service not available' };
        return;
      }

      try {
        const startTime = Date.now();
        await test();
        const duration = Date.now() - startTime;
        
        services[name] = duration < 5000 ? 'up' : 'degraded';
        results[name] = { status: services[name], responseTime: duration };
      } catch (error) {
        services[name] = 'down';
        results[name] = { status: 'down', error: error.message };
      }
    });

    await Promise.all(testPromises);

    // Determine overall status
    const downCount = Object.values(services).filter(s => s === 'down').length;
    const degradedCount = Object.values(services).filter(s => s === 'degraded').length;
    
    let status: 'healthy' | 'degraded' | 'down' = 'healthy';
    if (downCount > 2) status = 'down';
    else if (downCount > 0 || degradedCount > 1) status = 'degraded';

    return { status, services, details: results };
    
  } catch (error) {
    return {
      status: 'down',
      services: Object.keys(services).reduce((acc, key) => ({ ...acc, [key]: 'down' }), {}),
      details: { error: error.message }
    };
  }
}

/**
 * Enhanced configuration factory
 */
export function createEnhancedMoonpayConfig(options: Partial<MoonPayConfig> = {}): MoonPayConfig {
  const isDevelopment = typeof window !== 'undefined' && 
    (window.location?.hostname === 'localhost' || 
     window.location?.hostname === '127.0.0.1' ||
     import.meta.env?.DEV === true ||
     import.meta.env?.MODE === 'development');

  return {
    apiKey: options.apiKey || import.meta.env.VITE_MOONPAY_API_KEY || "",
    secretKey: options.secretKey || import.meta.env.VITE_MOONPAY_SECRET_KEY || "",
    webhookSecret: options.webhookSecret || import.meta.env.VITE_MOONPAY_WEBHOOK_SECRET || "",
    testMode: options.testMode ?? (import.meta.env.VITE_MOONPAY_TEST_MODE !== 'false'),
    services: {
      onRamp: true,
      offRamp: true,
      swap: true,
      nft: true,
      customer: true,
      account: true,
      analytics: true,
      policy: true,
      partner: true,
      networkFees: true,
      geolocation: true,
      compliance: true,
      webhooks: true,
      healthMonitor: true,
      ...options.services
    },
    features: {
      realTimeUpdates: !isDevelopment, // Disable in development to avoid CORS issues
      advancedAnalytics: true,
      complianceMonitoring: true,
      networkOptimization: true,
      arbitrageDetection: false,
      nftValuation: true,
      predictiveInsights: true,
      automatedReporting: true,
      ...options.features
    }
  };
}

/**
 * Common MoonPay utilities
 */
export const MoonPayUtils = {
  /**
   * Generate widget signature for secure URLs
   */
  generateSignature: (query: string, secretKey: string): string => {
    // Implement HMAC-SHA256 signature generation
    // This would require crypto functionality
    return '';
  },

  /**
   * Validate webhook signature
   */
  validateWebhookSignature: (payload: string, signature: string, secret: string): boolean => {
    // Implement webhook signature validation
    return true;
  },

  /**
   * Format currency amount for display
   */
  formatCurrencyAmount: (amount: number, currency: string, decimals: number = 2): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(amount);
  },

  /**
   * Format crypto amount for display
   */
  formatCryptoAmount: (amount: number, symbol: string, decimals: number = 8): string => {
    return `${amount.toFixed(decimals)} ${symbol.toUpperCase()}`;
  },

  /**
   * Get explorer URL for transaction
   */
  getExplorerUrl: (txHash: string, network: string): string => {
    const explorers: Record<string, string> = {
      ethereum: `https://etherscan.io/tx/${txHash}`,
      bitcoin: `https://blockstream.info/tx/${txHash}`,
      polygon: `https://polygonscan.com/tx/${txHash}`,
      bsc: `https://bscscan.com/tx/${txHash}`,
      avalanche: `https://snowtrace.io/tx/${txHash}`,
      solana: `https://solscan.io/tx/${txHash}`
    };

    return explorers[network.toLowerCase()] || `https://etherscan.io/tx/${txHash}`;
  },

  /**
   * Estimate transaction completion time
   */
  estimateCompletionTime: (paymentMethod: string): string => {
    const times: Record<string, string> = {
      'credit_debit_card': '5-15 minutes',
      'apple_pay': '5-10 minutes',
      'google_pay': '5-10 minutes',
      'sepa_bank_transfer': '1-3 business days',
      'gbp_bank_transfer': '1-2 business days',
      'bank_transfer': '1-3 business days'
    };

    return times[paymentMethod] || '5-30 minutes';
  },

  /**
   * Create service manager
   */
  createServices: createMoonPayServices,

  /**
   * Check service health
   */
  checkHealth: checkMoonPayServicesHealth,

  /**
   * Create enhanced configuration
   */
  createConfig: createEnhancedMoonpayConfig
};

// Re-export everything for backwards compatibility
export * from './core/OnRampService';
export * from './core/OffRampService';
export * from './core/EnhancedSwapService';
export * from './core/SwapService';
export * from './core/EnhancedNFTService';
export * from './core/WebhookHandler';
export * from './management/CustomerService';
export * from './management/AccountService';
export * from './management/AnalyticsService';
export * from './management/PolicyService';
export * from './management/PartnerService';
export * from './infrastructure/NetworkFeesService';
export * from './infrastructure/GeolocationService';
export * from './infrastructure/ComplianceService';
export * from './infrastructure/HealthMonitor';
export * from './MoonpayService';

// Default export
export default moonPayServices;
