/**
 * RAMP Network Types Index
 * 
 * Central export point for all RAMP Network type definitions
 */

// ===== Core Types =====
export * from './core';

// ===== SDK Types =====
export * from './sdk';

// ===== Event Types (excluding conflicting exports) =====
export type {
  RampEventType,
  RampEventPayload,
  RampWidgetCloseEvent,
  RampWidgetConfigDoneEvent,
  RampWidgetConfigFailedEvent,
  RampWidgetCloseRequestEvent,
  RampWidgetCloseRequestCancelledEvent,
  RampWidgetCloseRequestConfirmedEvent,
  RampPurchaseCreatedEvent,
  RampSaleCreatedEvent,
  RampSendCryptoRequestEvent,
  RampEvent,
  RampWebhookEvent,
  RampOnRampWebhookEvent,
  RampOffRampWebhookEvent,
  RampWebhookSignature,
  RampWebhookVerification,
  RampEventHandler,
  RampEventListeners,
  RampEventManager,
  RampTransactionEventRecord,
  RampEventAnalytics
} from './events';

// Note: RampWebhookType from events is intentionally not re-exported to avoid conflict with core

// ===== Database Types =====
export * from './database';

// ===== Re-export Common Types for Convenience =====
export type {
  // Core
  RampAssetInfo,
  RampPurchase,
  RampSale,
  RampQuote,
  RampPaymentMethod,
  RampEnvironment,
  RampNetworkFlow,
  RampApiResponse,
  RampServiceResult,
} from './core';

export type {
  // Configuration
  RampSDKConfig,
  RampNetworkConfig,
  RampNetworkEnhancedConfig,
  RampFeatureFlags,
  RampWidgetProps,
  RampIntegrationSettings
} from './sdk';

export type {
  // Database
  RampAssetCacheEntry,
  RampTransactionEvent,
  RampWebhookEventRecord,
  RampSessionRecord,
  RampAnalyticsRecord,
  RampAssetQuery,
  RampEventQuery,
  RampWebhookQuery,
  RampAnalyticsQuery,
  RampDatabaseResult,
  RampPaginatedResult
} from './database';
