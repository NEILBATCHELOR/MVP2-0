/**
 * RAMP Network Database Types
 * 
 * Type definitions for RAMP Network database entities and operations
 */

import type { RampWebhookType, RampAssetInfo } from './core';

// ===== Asset Cache Types =====

export interface RampAssetCacheEntry {
  id?: string;
  symbol: string;
  name: string;
  chain: string;
  type: string;
  address: string | null;
  logo_url: string;
  enabled: boolean;
  hidden: boolean;
  decimals: number;
  price_data: Record<string, number>;
  currency_code: string;
  min_purchase_amount: number | null;
  max_purchase_amount: number | null;
  min_purchase_crypto_amount: string | null;
  network_fee: number | null;
  flow_type: 'onramp' | 'offramp' | 'both';
  last_updated: string;
  created_at?: string;
  updated_at?: string;
}

export interface RampAssetCacheInsert extends Omit<RampAssetCacheEntry, 'id' | 'created_at' | 'updated_at'> {
  created_at?: string;
  updated_at?: string;
}

export interface RampAssetCacheUpdate extends Partial<Omit<RampAssetCacheEntry, 'id' | 'created_at'>> {
  updated_at?: string;
}

// ===== Transaction Event Types =====

export interface RampTransactionEvent {
  id?: string;
  transaction_id: string;
  event_type: string;
  event_data: Record<string, any>;
  ramp_event_id?: string;
  timestamp: string;
  session_id?: string;
  user_agent?: string;
  ip_address?: string;
  created_at?: string;
}

export interface RampTransactionEventInsert extends Omit<RampTransactionEvent, 'id' | 'created_at'> {
  created_at?: string;
}

// ===== Webhook Event Types =====

export interface RampWebhookEventRecord {
  id?: string;
  event_id: string;
  event_type: RampWebhookType;
  flow_type: 'onramp' | 'offramp';
  payload: Record<string, any>;
  processing_status: 'pending' | 'processed' | 'failed';
  processed_at?: string;
  error_message?: string;
  retry_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface RampWebhookEventInsert extends Omit<RampWebhookEventRecord, 'id' | 'created_at' | 'updated_at'> {
  created_at?: string;
  updated_at?: string;
}

export interface RampWebhookEventUpdate extends Partial<Omit<RampWebhookEventRecord, 'id' | 'created_at'>> {
  updated_at?: string;
}

// ===== Configuration Types =====

export interface RampConfigurationRecord {
  id?: string;
  environment: 'staging' | 'production';
  api_key: string;
  host_app_name: string;
  host_logo_url: string;
  enabled_flows: ('ONRAMP' | 'OFFRAMP')[];
  webhook_secret?: string;
  feature_flags: Record<string, boolean>;
  customization_settings: Record<string, any>;
  rate_limits: Record<string, number>;
  created_at?: string;
  updated_at?: string;
}

export interface RampConfigurationInsert extends Omit<RampConfigurationRecord, 'id' | 'created_at' | 'updated_at'> {
  created_at?: string;
  updated_at?: string;
}

export interface RampConfigurationUpdate extends Partial<Omit<RampConfigurationRecord, 'id' | 'created_at'>> {
  updated_at?: string;
}

// ===== Session Tracking =====

export interface RampSessionRecord {
  id?: string;
  session_id: string;
  user_id?: string;
  widget_instance_id?: string;
  flow_type: 'onramp' | 'offramp';
  integration_mode: 'overlay' | 'hosted' | 'embedded';
  user_agent?: string;
  ip_address?: string;
  started_at: string;
  ended_at?: string;
  status: 'active' | 'completed' | 'abandoned' | 'error';
  events_count: number;
  conversion_completed: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface RampSessionInsert extends Omit<RampSessionRecord, 'id' | 'created_at' | 'updated_at'> {
  created_at?: string;
  updated_at?: string;
}

export interface RampSessionUpdate extends Partial<Omit<RampSessionRecord, 'id' | 'created_at'>> {
  updated_at?: string;
}

// ===== Analytics Types =====

export interface RampAnalyticsRecord {
  id?: string;
  date: string; // YYYY-MM-DD format
  metric_type: 'daily' | 'weekly' | 'monthly';
  flow_type: 'onramp' | 'offramp' | 'both';
  total_sessions: number;
  completed_transactions: number;
  abandoned_sessions: number;
  error_sessions: number;
  conversion_rate: number;
  average_session_duration: number;
  total_volume_usd: number;
  unique_users: number;
  top_assets: Record<string, number>;
  top_payment_methods: Record<string, number>;
  geographic_distribution: Record<string, number>;
  created_at?: string;
  updated_at?: string;
}

export interface RampAnalyticsInsert extends Omit<RampAnalyticsRecord, 'id' | 'created_at' | 'updated_at'> {
  created_at?: string;
  updated_at?: string;
}

// ===== Query Types =====

export interface RampAssetQuery {
  flowType?: 'onramp' | 'offramp' | 'both';
  enabled?: boolean;
  currencyCode?: string;
  chain?: string;
  symbol?: string;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'symbol' | 'name' | 'last_updated';
  orderDirection?: 'asc' | 'desc';
}

export interface RampEventQuery {
  transactionId?: string;
  eventType?: string;
  sessionId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'timestamp' | 'created_at';
  orderDirection?: 'asc' | 'desc';
}

export interface RampWebhookQuery {
  eventType?: RampWebhookType;
  flowType?: 'onramp' | 'offramp';
  processingStatus?: 'pending' | 'processed' | 'failed';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'processed_at';
  orderDirection?: 'asc' | 'desc';
}

export interface RampAnalyticsQuery {
  startDate: string;
  endDate: string;
  metricType: 'daily' | 'weekly' | 'monthly';
  flowType?: 'onramp' | 'offramp' | 'both';
  aggregation?: 'sum' | 'avg' | 'count';
  groupBy?: string[];
}

// ===== Result Types =====

export interface RampDatabaseResult<T> {
  data: T | null;
  error?: string;
  count?: number;
  success: boolean;
}

export interface RampPaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  error?: string;
  success: boolean;
}

// ===== Migration Types =====

export interface RampMigrationScript {
  version: string;
  description: string;
  up: string;
  down: string;
  createdAt: string;
}

export interface RampSchemaVersion {
  version: string;
  applied_at: string;
  checksum: string;
}
