/**
 * Common types shared across all Ripple services
 */

// Generic API Response Types
export interface RippleApiResponse<T = any> {
  data?: T;
  status: 'success' | 'error';
  error?: RippleApiError;
  meta?: ResponseMeta;
}

export interface RippleApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId?: string;
}

export interface ResponseMeta {
  page?: number;
  size?: number;
  totalCount?: number;
  hasMore?: boolean;
  requestId?: string;
  processingTime?: number;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    size: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Currency and Money Types
export interface Currency {
  code: string;
  name: string;
  symbol?: string;
  precision: number;
  isDigital: boolean;
  isStablecoin?: boolean;
}

export interface Money {
  amount: string;
  currency: Currency;
  displayValue?: string;
}

// Network and Environment Types
export type RippleNetwork = 'mainnet' | 'testnet' | 'devnet';

export interface NetworkConfig {
  network: RippleNetwork;
  apiBaseUrl: string;
  webSocketUrl?: string;
  explorerUrl?: string;
  isTestnet: boolean;
}

// Audit and Tracking Types
export interface AuditTrail {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId?: string;
  timestamp: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Status Types
export type EntityStatus = 'active' | 'inactive' | 'pending' | 'suspended' | 'deleted';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected' | 'expired';

// Address Types
export interface StandardAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isVerified?: boolean;
}

// Contact Information Types
export interface ContactInfo {
  email?: string;
  phone?: string;
  website?: string;
  socialMedia?: Record<string, string>;
}

// File and Document Types
export interface DocumentReference {
  id: string;
  name: string;
  type: DocumentType;
  url?: string;
  mimeType?: string;
  size?: number;
  uploadedAt: string;
  expiresAt?: string;
}

export type DocumentType = 
  | 'identity'
  | 'address_proof'
  | 'business_registration'
  | 'financial_statement'
  | 'compliance_certificate'
  | 'other';

// Validation Types
export interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
}

// Service Result Types
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
  metadata?: Record<string, any>;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
  category: ErrorCategory;
}

export type ErrorCategory = 
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'network'
  | 'server'
  | 'business_logic'
  | 'rate_limit'
  | 'maintenance';

// Webhook Types
export interface WebhookPayload {
  id: string;
  type: string;
  timestamp: string;
  data: Record<string, any>;
  signature?: string;
}

export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret?: string;
  retryConfig?: WebhookRetryConfig;
}

export interface WebhookRetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  maxDelay: number;
}

// Time and Date Types
export interface TimeRange {
  start: string; // ISO string
  end: string; // ISO string
}

export interface BusinessHours {
  timezone: string;
  days: {
    [key: string]: {
      isOpen: boolean;
      openTime?: string;
      closeTime?: string;
    };
  };
}

// Compliance and Risk Types
export interface RiskProfile {
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
  lastAssessed: string;
  nextReview?: string;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskFactor {
  type: string;
  score: number;
  weight: number;
  description?: string;
}

// Feature Flag Types
export interface FeatureFlag {
  name: string;
  isEnabled: boolean;
  rolloutPercentage?: number;
  conditions?: Record<string, any>;
}

// Cache Types
export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize?: number;
  strategy: 'lru' | 'fifo' | 'ttl';
}

export interface CachedItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  key: string;
}

// Metrics and Analytics Types
export interface Metric {
  name: string;
  value: number;
  unit?: string;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface AnalyticsEvent {
  event: string;
  userId?: string;
  sessionId?: string;
  properties?: Record<string, any>;
  timestamp: string;
}

// Configuration Types
export interface ServiceConfig {
  serviceName: string;
  version: string;
  environment: string;
  features: FeatureFlag[];
  cache?: CacheConfig;
  rateLimits?: RateLimitConfig;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit?: number;
}

// Health Check Types
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  timestamp: string;
  uptime: number;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  responseTime?: number;
  details?: string;
}
