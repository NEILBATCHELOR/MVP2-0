/**
 * RAMP Network Events & Webhooks Types
 * 
 * Type definitions for RAMP Network events and webhook handling
 */

import type { RampPurchase, RampSale, RampWebhookType } from './core';

// ===== Event Types =====

export type RampEventType =
  | 'WIDGET_CLOSE'
  | 'WIDGET_CONFIG_DONE'
  | 'WIDGET_CONFIG_FAILED'
  | 'WIDGET_CLOSE_REQUEST'
  | 'WIDGET_CLOSE_REQUEST_CANCELLED'
  | 'WIDGET_CLOSE_REQUEST_CONFIRMED'
  | 'PURCHASE_CREATED'
  | 'OFFRAMP_SALE_CREATED'
  | 'SEND_CRYPTO_REQUEST';

export interface RampEventPayload {
  type: RampEventType;
  payload: any;
  widgetInstanceId?: string;
  timestamp?: string;
}

// ===== Widget Events =====

export interface RampWidgetCloseEvent {
  type: 'WIDGET_CLOSE';
  payload: null;
  widgetInstanceId: string;
}

export interface RampWidgetConfigDoneEvent {
  type: 'WIDGET_CONFIG_DONE';
  payload: null;
  widgetInstanceId: string;
}

export interface RampWidgetConfigFailedEvent {
  type: 'WIDGET_CONFIG_FAILED';
  payload: null;
  widgetInstanceId: string;
}

export interface RampWidgetCloseRequestEvent {
  type: 'WIDGET_CLOSE_REQUEST';
  payload: null;
  widgetInstanceId?: string;
}

export interface RampWidgetCloseRequestCancelledEvent {
  type: 'WIDGET_CLOSE_REQUEST_CANCELLED';
  payload: null;
}

export interface RampWidgetCloseRequestConfirmedEvent {
  type: 'WIDGET_CLOSE_REQUEST_CONFIRMED';
  payload: null;
}

// ===== Transaction Events =====

export interface RampPurchaseCreatedEvent {
  type: 'PURCHASE_CREATED';
  payload: {
    purchase: RampPurchase;
    purchaseViewToken: string;
    apiUrl: string;
  };
  widgetInstanceId: string;
}

export interface RampSaleCreatedEvent {
  type: 'OFFRAMP_SALE_CREATED';
  payload: {
    sale: RampSale;
    saleViewToken: string;
    apiUrl: string;
  };
  widgetInstanceId: string;
}

export interface RampSendCryptoRequestEvent {
  type: 'SEND_CRYPTO_REQUEST';
  payload: {
    cryptoAmount: string;
    cryptoAddress: string;
    assetInfo: any;
  };
  widgetInstanceId?: string;
}

// ===== Union Type for All Events =====

export type RampEvent =
  | RampWidgetCloseEvent
  | RampWidgetConfigDoneEvent
  | RampWidgetConfigFailedEvent
  | RampWidgetCloseRequestEvent
  | RampWidgetCloseRequestCancelledEvent
  | RampWidgetCloseRequestConfirmedEvent
  | RampPurchaseCreatedEvent
  | RampSaleCreatedEvent
  | RampSendCryptoRequestEvent;

// ===== Webhook Types =====

export type RampWebhookMode = 'ONRAMP' | 'OFFRAMP';

export interface RampWebhookEvent {
  id: string;
  type: RampWebhookType;
  mode: RampWebhookMode;
  payload: RampPurchase | RampSale;
  timestamp: string;
}

export interface RampOnRampWebhookEvent {
  id: string;
  type: RampWebhookType;
  purchase: RampPurchase;
}

export interface RampOffRampWebhookEvent {
  id: string;
  type: RampWebhookType;
  mode: 'OFFRAMP';
  payload: RampSale;
}

// ===== Webhook Signature =====

export interface RampWebhookSignature {
  algorithm: 'ECDSA';
  signature: string;
  header: string; // X-Body-Signature
}

export interface RampWebhookVerification {
  isValid: boolean;
  publicKey: string;
  message: string;
  signature: string;
  error?: string;
}

// ===== Event Handler Types =====

export type RampEventHandler<T = any> = (event: T) => void | Promise<void>;

export interface RampEventListeners {
  onWidgetClose?: RampEventHandler<RampWidgetCloseEvent>;
  onWidgetConfigDone?: RampEventHandler<RampWidgetConfigDoneEvent>;
  onWidgetConfigFailed?: RampEventHandler<RampWidgetConfigFailedEvent>;
  onPurchaseCreated?: RampEventHandler<RampPurchaseCreatedEvent>;
  onSaleCreated?: RampEventHandler<RampSaleCreatedEvent>;
  onSendCryptoRequest?: RampEventHandler<RampSendCryptoRequestEvent>;
  onWidgetCloseRequest?: RampEventHandler<RampWidgetCloseRequestEvent>;
  onWidgetCloseRequestCancelled?: RampEventHandler<RampWidgetCloseRequestCancelledEvent>;
  onWidgetCloseRequestConfirmed?: RampEventHandler<RampWidgetCloseRequestConfirmedEvent>;
  onError?: RampEventHandler<Error>;
  onAll?: RampEventHandler<RampEvent>;
}

// ===== Event Manager =====

export interface RampEventManager {
  addEventListener<T extends RampEventType>(
    eventType: T, 
    handler: RampEventHandler
  ): void;
  removeEventListener<T extends RampEventType>(
    eventType: T, 
    handler: RampEventHandler
  ): void;
  emit<T extends RampEventType>(
    eventType: T, 
    data: any
  ): void;
  removeAllListeners(): void;
}

// ===== Database Event Types =====
// Note: Database record types are imported from ./database to avoid duplication

export type { RampWebhookEventRecord, RampTransactionEvent as RampTransactionEventRecord } from './database';

// ===== Event Analytics =====

export interface RampEventAnalytics {
  totalEvents: number;
  eventsByType: Record<RampEventType, number>;
  eventsByStatus: Record<string, number>;
  averageProcessingTime: number;
  failureRate: number;
  retryRate: number;
  timeRange: {
    startDate: string;
    endDate: string;
  };
}
