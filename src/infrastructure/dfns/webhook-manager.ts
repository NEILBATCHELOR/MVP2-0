/**
 * DFNS Webhook Manager - Webhook and event management for DFNS integration
 * 
 * This service manages DFNS webhooks including:
 * - Webhook configuration and registration
 * - Event subscription management
 * - Webhook delivery tracking and retry logic
 * - Event payload validation and processing
 * - Webhook security and verification
 */

import type { DfnsClientConfig } from '@/types/dfns';
import { DfnsAuthenticator } from './auth';
import { DFNS_CONFIG, DFNS_ENDPOINTS } from './config';

// ===== Webhook Management Types =====

export interface WebhookConfig {
  id?: string;
  name: string;
  url: string;
  description?: string;
  events: DfnsWebhookEvent[];
  status: WebhookStatus;
  secret?: string;
  headers?: Record<string, string>;
  externalId?: string;
  retryConfig?: WebhookRetryConfig;
  filterConfig?: WebhookFilterConfig;
}

export interface WebhookRetryConfig {
  maxAttempts: number;
  backoffFactor: number;
  maxDelay: number;
  retryOn: number[]; // HTTP status codes to retry on
}

export interface WebhookFilterConfig {
  walletIds?: string[];
  networks?: string[];
  minAmount?: string;
  maxAmount?: string;
  assetSymbols?: string[];
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: DfnsWebhookEvent;
  payload: Record<string, any>;
  status: WebhookDeliveryStatus;
  responseCode?: number;
  responseBody?: string;
  responseHeaders?: Record<string, string>;
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export interface WebhookEvent {
  id: string;
  type: DfnsWebhookEvent;
  source: string; // Add required property
  timestamp: string;
  data: Record<string, any>;
  webhookIds: string[];
  processed: boolean; // Add required property
  webhookCount: number; // Add required property
  createdAt: string; // Add required property
  processingStatus: WebhookEventProcessingStatus;
}

export enum WebhookStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Failed = 'Failed'
}

export enum WebhookDeliveryStatus {
  Pending = 'Pending',
  Delivered = 'Delivered',
  Failed = 'Failed',
  Retrying = 'Retrying',
  Cancelled = 'Cancelled'
}

export enum WebhookEventProcessingStatus {
  Pending = 'Pending',
  Processing = 'Processing',
  Completed = 'Completed',
  Failed = 'Failed'
}

export enum DfnsWebhookEvent {
  // Wallet events
  WalletCreated = 'wallet.created',
  WalletUpdated = 'wallet.updated',
  WalletDelegated = 'wallet.delegated',
  WalletExported = 'wallet.exported',
  WalletImported = 'wallet.imported',
  
  // Transfer events
  TransferInitiated = 'transfer.initiated',
  TransferBroadcasted = 'transfer.broadcasted',
  TransferConfirmed = 'transfer.confirmed',
  TransferFailed = 'transfer.failed',
  
  // Transaction events
  TransactionBroadcasted = 'transaction.broadcasted',
  TransactionConfirmed = 'transaction.confirmed',
  TransactionFailed = 'transaction.failed',
  
  // Signature events
  SignatureInitiated = 'signature.initiated',
  SignatureSigned = 'signature.signed',
  SignatureFailed = 'signature.failed',
  
  // Policy events
  PolicyApprovalPending = 'policy.approval.pending',
  PolicyApprovalApproved = 'policy.approval.approved',
  PolicyApprovalRejected = 'policy.approval.rejected',
  
  // User events
  UserRegistered = 'user.registered',
  UserActivated = 'user.activated',
  UserDeactivated = 'user.deactivated',
  
  // Key events
  KeyCreated = 'key.created',
  KeyDelegated = 'key.delegated',
  KeyExported = 'key.exported',
  KeyImported = 'key.imported',
  
  // Service Account events
  ServiceAccountCreated = 'service_account.created',
  ServiceAccountActivated = 'service_account.activated',
  ServiceAccountDeactivated = 'service_account.deactivated',
  
  // Credential events
  CredentialCreated = 'credential.created',
  CredentialActivated = 'credential.activated',
  CredentialDeactivated = 'credential.deactivated'
}

// ===== DFNS Webhook Manager Class =====

export class DfnsWebhookManager {
  private config: DfnsClientConfig;
  private authenticator: DfnsAuthenticator;

  constructor(config: DfnsClientConfig, authenticator?: DfnsAuthenticator) {
    this.config = config;
    this.authenticator = authenticator || new DfnsAuthenticator(config);
  }

  // ===== Webhook Configuration =====

  /**
   * Create a new webhook
   */
  async createWebhook(webhookConfig: Omit<WebhookConfig, 'id'>): Promise<WebhookConfig> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to create webhooks');
      }

      // Validate webhook configuration
      this.validateWebhookConfig(webhookConfig);

      // Get user action signature for webhook creation
      const userActionSignature = await this.authenticator.signUserAction(
        'POST',
        DFNS_ENDPOINTS.webhooks.create,
        webhookConfig
      );

      const response = await fetch(`${this.config.baseUrl}${DFNS_ENDPOINTS.webhooks.create}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        },
        body: JSON.stringify({
          ...webhookConfig,
          retryConfig: webhookConfig.retryConfig || this.getDefaultRetryConfig()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Webhook creation failed: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to create webhook: ${(error as Error).message}`);
    }
  }

  /**
   * List all webhooks
   */
  async listWebhooks(): Promise<WebhookConfig[]> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to list webhooks');
      }

      const response = await fetch(`${this.config.baseUrl}${DFNS_ENDPOINTS.webhooks.list}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list webhooks: ${response.statusText}`);
      }

      const data = await response.json();
      return data.webhooks || [];
    } catch (error) {
      throw new Error(`Failed to list webhooks: ${(error as Error).message}`);
    }
  }

  /**
   * Get webhook details
   */
  async getWebhook(webhookId: string): Promise<WebhookConfig> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to get webhook');
      }

      const response = await fetch(`${this.config.baseUrl}${DFNS_ENDPOINTS.webhooks.get(webhookId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get webhook: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get webhook: ${(error as Error).message}`);
    }
  }

  /**
   * Update webhook configuration
   */
  async updateWebhook(
    webhookId: string,
    updates: Partial<Omit<WebhookConfig, 'id'>>
  ): Promise<WebhookConfig> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to update webhook');
      }

      const userActionSignature = await this.authenticator.signUserAction(
        'PUT',
        DFNS_ENDPOINTS.webhooks.update(webhookId),
        updates
      );

      const response = await fetch(`${this.config.baseUrl}${DFNS_ENDPOINTS.webhooks.update(webhookId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed to update webhook: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to update webhook: ${(error as Error).message}`);
    }
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to delete webhook');
      }

      const userActionSignature = await this.authenticator.signUserAction(
        'DELETE',
        DFNS_ENDPOINTS.webhooks.delete(webhookId)
      );

      const response = await fetch(`${this.config.baseUrl}${DFNS_ENDPOINTS.webhooks.delete(webhookId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete webhook: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Failed to delete webhook: ${(error as Error).message}`);
    }
  }

  /**
   * Test webhook endpoint
   */
  async testWebhook(webhookId: string): Promise<{ success: boolean; responseTime: number; error?: string }> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to test webhook');
      }

      const startTime = Date.now();
      
      const response = await fetch(`${this.config.baseUrl}${DFNS_ENDPOINTS.webhooks.ping(webhookId)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          responseTime,
          error: errorData.message || 'Webhook test failed'
        };
      }

      return {
        success: true,
        responseTime
      };
    } catch (error) {
      return {
        success: false,
        responseTime: 0,
        error: (error as Error).message
      };
    }
  }

  // ===== Event Management =====

  /**
   * List webhook events with optional filtering
   */
  async listWebhookEvents(options: {
    webhookId?: string;
    eventType?: DfnsWebhookEvent;
    status?: WebhookEventProcessingStatus;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ events: WebhookEvent[]; total: number }> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to list webhook events');
      }

      const queryParams = new URLSearchParams();
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });

      const url = `${this.config.baseUrl}${DFNS_ENDPOINTS.webhooks.events}?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list webhook events: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        events: data.events || [],
        total: data.total || 0
      };
    } catch (error) {
      throw new Error(`Failed to list webhook events: ${(error as Error).message}`);
    }
  }

  /**
   * Get webhook event details
   */
  async getWebhookEvent(eventId: string): Promise<WebhookEvent> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to get webhook event');
      }

      const response = await fetch(`${this.config.baseUrl}${DFNS_ENDPOINTS.webhooks.event(eventId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get webhook event: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get webhook event: ${(error as Error).message}`);
    }
  }

  // ===== Delivery Management =====

  /**
   * List webhook deliveries
   */
  async listWebhookDeliveries(
    webhookId: string,
    options: {
      status?: WebhookDeliveryStatus;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ deliveries: WebhookDelivery[]; total: number }> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to list webhook deliveries');
      }

      const queryParams = new URLSearchParams();
      queryParams.append('webhookId', webhookId);
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });

      const url = `${this.config.baseUrl}/webhooks/deliveries?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list webhook deliveries: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        deliveries: data.deliveries || [],
        total: data.total || 0
      };
    } catch (error) {
      throw new Error(`Failed to list webhook deliveries: ${(error as Error).message}`);
    }
  }

  /**
   * Retry failed webhook delivery
   */
  async retryWebhookDelivery(deliveryId: string): Promise<WebhookDelivery> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to retry webhook delivery');
      }

      const userActionSignature = await this.authenticator.signUserAction(
        'POST',
        `/webhooks/deliveries/${deliveryId}/retry`
      );

      const response = await fetch(`${this.config.baseUrl}/webhooks/deliveries/${deliveryId}/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to retry webhook delivery: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to retry webhook delivery: ${(error as Error).message}`);
    }
  }

  // ===== Webhook Security =====

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
    timestamp?: string
  ): boolean {
    try {
      // Create the message to verify (payload + timestamp if provided)
      const message = timestamp ? `${timestamp}.${payload}` : payload;
      
      // Generate expected signature
      const expectedSignature = this.generateWebhookSignature(message, secret);
      
      // Compare signatures (constant time comparison)
      return this.constantTimeEqual(signature, expectedSignature);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Generate webhook signature for testing
   */
  generateWebhookSignature(payload: string, secret: string): string {
    // In a real implementation, use HMAC-SHA256
    // For now, simplified implementation
    return this.createHmacSha256(payload, secret);
  }

  /**
   * Validate webhook payload structure
   */
  validateWebhookPayload(payload: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check required fields
    if (!payload.id) {
      errors.push('Missing required field: id');
    }
    
    if (!payload.type) {
      errors.push('Missing required field: type');
    }
    
    if (!payload.timestamp) {
      errors.push('Missing required field: timestamp');
    }
    
    if (!payload.data) {
      errors.push('Missing required field: data');
    }
    
    // Validate event type
    if (payload.type && !Object.values(DfnsWebhookEvent).includes(payload.type)) {
      errors.push(`Invalid event type: ${payload.type}`);
    }
    
    // Validate timestamp format
    if (payload.timestamp && isNaN(Date.parse(payload.timestamp))) {
      errors.push(`Invalid timestamp format: ${payload.timestamp}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // ===== Event Subscription Helpers =====

  /**
   * Subscribe to specific events
   */
  async subscribeToEvents(
    webhookId: string,
    events: DfnsWebhookEvent[]
  ): Promise<WebhookConfig> {
    const webhook = await this.getWebhook(webhookId);
    const updatedEvents = [...new Set([...webhook.events, ...events])];
    
    return this.updateWebhook(webhookId, { events: updatedEvents });
  }

  /**
   * Unsubscribe from specific events
   */
  async unsubscribeFromEvents(
    webhookId: string,
    events: DfnsWebhookEvent[]
  ): Promise<WebhookConfig> {
    const webhook = await this.getWebhook(webhookId);
    const updatedEvents = webhook.events.filter(event => !events.includes(event));
    
    return this.updateWebhook(webhookId, { events: updatedEvents });
  }

  /**
   * Get event statistics
   */
  async getWebhookStatistics(
    webhookId: string,
    period: 'day' | 'week' | 'month' = 'week'
  ): Promise<{
    totalEvents: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    averageResponseTime: number;
    eventsByType: Record<DfnsWebhookEvent, number>;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
      }

      const { deliveries } = await this.listWebhookDeliveries(webhookId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 1000 // Get all deliveries for the period
      });

      const stats = {
        totalEvents: deliveries.length,
        successfulDeliveries: deliveries.filter(d => d.status === WebhookDeliveryStatus.Delivered).length,
        failedDeliveries: deliveries.filter(d => d.status === WebhookDeliveryStatus.Failed).length,
        averageResponseTime: 0,
        eventsByType: {} as Record<DfnsWebhookEvent, number>
      };

      // Calculate average response time (simplified)
      const responseTimes = deliveries
        .filter(d => d.deliveredAt)
        .map(d => new Date(d.deliveredAt!).getTime() - new Date(d.createdAt).getTime());
      
      if (responseTimes.length > 0) {
        stats.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      }

      // Count events by type
      deliveries.forEach(delivery => {
        stats.eventsByType[delivery.event] = (stats.eventsByType[delivery.event] || 0) + 1;
      });

      return stats;
    } catch (error) {
      throw new Error(`Failed to get webhook statistics: ${(error as Error).message}`);
    }
  }

  // ===== Private Helper Methods =====

  /**
   * Validate webhook configuration
   */
  private validateWebhookConfig(config: Omit<WebhookConfig, 'id'>): void {
    if (!config.name.trim()) {
      throw new Error('Webhook name is required');
    }
    
    if (!config.url.trim()) {
      throw new Error('Webhook URL is required');
    }
    
    try {
      new URL(config.url);
    } catch {
      throw new Error('Invalid webhook URL format');
    }
    
    if (!config.events || config.events.length === 0) {
      throw new Error('At least one event must be selected');
    }
    
    const validEvents = Object.values(DfnsWebhookEvent);
    const invalidEvents = config.events.filter(event => !validEvents.includes(event));
    if (invalidEvents.length > 0) {
      throw new Error(`Invalid events: ${invalidEvents.join(', ')}`);
    }
  }

  /**
   * Get default retry configuration
   */
  private getDefaultRetryConfig(): WebhookRetryConfig {
    return {
      maxAttempts: 3,
      backoffFactor: 2,
      maxDelay: 300000, // 5 minutes
      retryOn: [408, 429, 500, 502, 503, 504]
    };
  }

  /**
   * Create HMAC SHA256 signature
   */
  private createHmacSha256(message: string, secret: string): string {
    // Simplified implementation - in production use proper HMAC
    const encoder = new TextEncoder();
    const data = encoder.encode(message + secret);
    return Array.from(new Uint8Array(data))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Constant time string comparison
   */
  private constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  /**
   * Base64 URL encode
   */
  private base64UrlEncode(data: string): string {
    return btoa(data)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}

// ===== Export =====

export default DfnsWebhookManager;
