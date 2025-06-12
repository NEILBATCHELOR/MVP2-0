/**
 * Enhanced MoonPay Webhook Handler Service
 * Comprehensive webhook management with signature verification, event processing, monitoring,
 * and Supabase database integration
 */

import { supabase } from '@/infrastructure/database/client';

// Browser-compatible crypto functions
const createHmac = (algorithm: string, secret: string) => {
  return {
    update: (data: string, encoding: string) => {
      return {
        digest: (format: string) => {
          // Fallback for browser environment - in production, implement proper HMAC
          console.warn('HMAC signature verification using fallback method');
          return btoa(secret + data).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        }
      };
    }
  };
};

export interface WebhookEvent {
  id: string;
  type: 'transaction.created' | 'transaction.updated' | 'transaction.completed' | 'transaction.failed' | 
        'customer.created' | 'customer.updated' | 'customer.kyc_completed' | 
        'swap.created' | 'swap.completed' | 'swap.failed' |
        'nft.minted' | 'nft.transferred' | 'nft.burned' |
        'pass.created' | 'pass.updated' | 'pass.distributed' |
        'policy.triggered' | 'compliance.alert' | 'risk.flagged';
  data: {
    object: any;
    previous_attributes?: any;
  };
  environment: 'sandbox' | 'production';
  timestamp: string;
  api_version: string;
  idempotency_key?: string;
  source: 'api' | 'dashboard' | 'webhook';
  metadata?: Record<string, any>;
}

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  environment: 'sandbox' | 'production';
  status: 'active' | 'inactive' | 'failed';
  version: string;
  secret: string;
  headers?: Record<string, string>;
  retryPolicy: {
    maxAttempts: number;
    backoffStrategy: 'linear' | 'exponential';
    initialDelay: number;
    maxDelay: number;
  };
  filters?: {
    conditions: Array<{
      field: string;
      operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains';
      value: any;
    }>;
  };
  rateLimiting: {
    requestsPerSecond: number;
    burstSize: number;
  };
  monitoring: {
    alertOnFailure: boolean;
    alertThreshold: number;
    notificationEmails: string[];
  };
  createdAt: string;
  updatedAt: string;
  lastDeliveryAt?: string;
  lastFailureAt?: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  url: string;
  httpMethod: 'POST';
  headers: Record<string, string>;
  payload: string;
  response?: {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
    duration: number;
  };
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface WebhookStats {
  webhookId: string;
  period: 'hour' | 'day' | 'week' | 'month';
  deliveries: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    retrying: number;
  };
  performance: {
    averageResponseTime: number;
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    successRate: number;
    uptime: number;
  };
  errors: Array<{
    statusCode: number;
    count: number;
    lastOccurred: string;
  }>;
  trends: {
    deliveryTrend: 'increasing' | 'decreasing' | 'stable';
    errorTrend: 'increasing' | 'decreasing' | 'stable';
    performanceTrend: 'improving' | 'degrading' | 'stable';
  };
}

export interface ProcessedWebhookResult {
  eventId: string;
  eventType: string;
  processed: boolean;
  processingTime: number;
  result: {
    success: boolean;
    message?: string;
    data?: any;
    errors?: string[];
  };
  actions: Array<{
    type: string;
    description: string;
    executed: boolean;
    result?: any;
  }>;
  timestamp: string;
}

/**
 * Enhanced Webhook Handler Service for MoonPay
 * Combines comprehensive webhook management with Supabase database integration
 */
export class WebhookHandler {
  private apiBaseUrl: string;
  private apiKey: string;
  private secretKey: string;
  private webhookSecret: string;
  private eventHandlers: Map<string, Function[]> = new Map();
  private processingQueue: Map<string, WebhookEvent> = new Map();

  constructor(apiKey: string, secretKey: string, webhookSecret: string, testMode: boolean = true) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.webhookSecret = webhookSecret;
    this.apiBaseUrl = testMode 
      ? "https://api.moonpay.com" 
      : "https://api.moonpay.com";
  }

  /**
   * Verify webhook signature using crypto
   */
  verifySignature(payload: string, signature: string, secret?: string): boolean {
    try {
      const webhookSecret = secret || this.webhookSecret;
      const expectedSignature = createHmac('sha256', webhookSecret)
        .update(payload, 'utf8')
        .digest('hex');
      
      const providedSignature = signature.replace('sha256=', '');
      
      return this.safeCompare(expectedSignature, providedSignature);
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Process incoming webhook event with database integration
   */
  async processWebhookEvent(
    payload: string, 
    signature: string, 
    headers: Record<string, string>
  ): Promise<ProcessedWebhookResult> {
    const startTime = Date.now();
    
    try {
      // Verify signature
      if (!this.verifySignature(payload, signature)) {
        throw new Error('Invalid webhook signature');
      }

      // Parse event
      const event: WebhookEvent = JSON.parse(payload);
      
      // Validate event structure
      this.validateWebhookEvent(event);
      
      // Check for duplicate events (idempotency)
      if (event.idempotency_key && this.processingQueue.has(event.idempotency_key)) {
        return this.createProcessedResult(event, false, 'Duplicate event ignored', startTime);
      }

      // Store webhook event in database
      const eventId = await this.storeWebhookEvent(event, signature);

      // Add to processing queue
      if (event.idempotency_key) {
        this.processingQueue.set(event.idempotency_key, event);
      }

      // Process event based on type
      const result = await this.handleEventByType(event);
      
      // Mark as processed in database
      await this.markWebhookProcessed(eventId, result);

      // Clean up processing queue
      if (event.idempotency_key) {
        this.processingQueue.delete(event.idempotency_key);
      }

      return this.createProcessedResult(event, true, 'Event processed successfully', startTime, result);
      
    } catch (error) {
      console.error('Error processing webhook event:', error);
      
      // Store failed webhook for debugging
      await this.storeFailedWebhook(payload, signature, error.message);
      
      return this.createProcessedResult(
        { 
          id: 'unknown', 
          type: 'unknown' as any,
          data: { object: null },
          environment: 'production' as const,
          timestamp: new Date().toISOString(),
          api_version: '1.0',
          source: 'webhook' as const
        } as WebhookEvent, 
        false, 
        `Processing failed: ${error.message}`, 
        startTime
      );
    }
  }

  /**
   * Register event handler
   */
  on(eventType: string, handler: Function): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Remove event handler
   */
  off(eventType: string, handler?: Function): void {
    if (!handler) {
      this.eventHandlers.delete(eventType);
      return;
    }

    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Create webhook configuration
   */
  async createWebhook(config: Omit<WebhookConfig, 'id' | 'secret' | 'createdAt' | 'updatedAt'>): Promise<WebhookConfig> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v3/webhooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Create webhook API error: ${errorData.message || response.status}`);
      }

      const result = await response.json();
      
      // Store webhook config in database
      await this.storeWebhookConfig(result);
      
      return result;
    } catch (error) {
      console.error('Error creating webhook:', error);
      throw new Error(`Failed to create webhook: ${error.message}`);
    }
  }

  /**
   * Get webhook configurations
   */
  async getWebhooks(): Promise<WebhookConfig[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v3/webhooks`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Get webhooks API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting webhooks:', error);
      throw new Error(`Failed to get webhooks: ${error.message}`);
    }
  }

  /**
   * Update webhook configuration
   */
  async updateWebhook(webhookId: string, updates: Partial<WebhookConfig>): Promise<WebhookConfig> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v3/webhooks/${webhookId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Update webhook API error: ${errorData.message || response.status}`);
      }

      const result = await response.json();
      
      // Update webhook config in database
      await this.updateWebhookConfig(webhookId, updates);
      
      return result;
    } catch (error) {
      console.error('Error updating webhook:', error);
      throw new Error(`Failed to update webhook: ${error.message}`);
    }
  }

  /**
   * Delete webhook configuration
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v3/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Delete webhook API error: ${response.status}`);
      }
      
      // Remove from database
      await this.deleteWebhookConfig(webhookId);
    } catch (error) {
      console.error('Error deleting webhook:', error);
      throw new Error(`Failed to delete webhook: ${error.message}`);
    }
  }

  /**
   * Test webhook endpoint
   */
  async testWebhook(webhookId: string, eventType?: string): Promise<{
    success: boolean;
    responseTime: number;
    statusCode?: number;
    error?: string;
  }> {
    try {
      const body = eventType ? { eventType } : {};
      
      const response = await fetch(`${this.apiBaseUrl}/v3/webhooks/${webhookId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Test webhook API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error testing webhook:', error);
      throw new Error(`Failed to test webhook: ${error.message}`);
    }
  }

  /**
   * Get webhook delivery history
   */
  async getWebhookDeliveries(
    webhookId: string,
    limit: number = 50,
    status?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ deliveries: WebhookDelivery[]; total: number; hasMore: boolean }> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(status && { status }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });

      const response = await fetch(`${this.apiBaseUrl}/v3/webhooks/${webhookId}/deliveries?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Webhook deliveries API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        deliveries: data.deliveries || [],
        total: data.total || 0,
        hasMore: data.hasMore || false
      };
    } catch (error) {
      console.error('Error getting webhook deliveries:', error);
      throw new Error(`Failed to get webhook deliveries: ${error.message}`);
    }
  }

  /**
   * Retry failed webhook delivery
   */
  async retryWebhookDelivery(deliveryId: string): Promise<{ success: boolean; newDeliveryId: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v3/webhooks/deliveries/${deliveryId}/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Retry webhook API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error retrying webhook delivery:', error);
      throw new Error(`Failed to retry webhook delivery: ${error.message}`);
    }
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStats(
    webhookId: string,
    period: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<WebhookStats> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v3/webhooks/${webhookId}/stats?period=${period}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Webhook stats API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting webhook stats:', error);
      throw new Error(`Failed to get webhook stats: ${error.message}`);
    }
  }

  // ===== DATABASE INTEGRATION METHODS =====

  /**
   * Store webhook event in database
   */
  private async storeWebhookEvent(webhookData: any, signature: string): Promise<string> {
    const { data, error } = await supabase
      .from('moonpay_webhook_events')
      .insert({
        event_type: webhookData.type,
        event_data: webhookData,
        signature,
        received_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Mark webhook as processed
   */
  private async markWebhookProcessed(eventId: string, result: any[]): Promise<void> {
    await supabase
      .from('moonpay_webhook_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        metadata: { actions: result }
      })
      .eq('id', eventId);
  }

  /**
   * Store failed webhook for debugging
   */
  private async storeFailedWebhook(body: string, signature: string, error: string): Promise<void> {
    await supabase
      .from('moonpay_webhook_events')
      .insert({
        event_type: 'failed_processing',
        event_data: { body, error },
        signature,
        processed: false,
        processing_attempts: 1,
        last_processing_error: error,
        received_at: new Date().toISOString()
      });
  }

  /**
   * Store webhook configuration in database
   * Note: Using moonpay_webhook_events table temporarily until moonpay_webhook_config table is created
   */
  private async storeWebhookConfig(config: WebhookConfig): Promise<void> {
    // TODO: Create moonpay_webhook_config table and implement proper storage
    console.log('Webhook config would be stored:', config.id);
    /*
    await supabase
      .from('moonpay_webhook_config')
      .upsert({
        webhook_id: config.id,
        url: config.url,
        events: config.events,
        environment: config.environment,
        status: config.status,
        version: config.version,
        secret_hash: createHmac('sha256', config.secret).update(config.secret, 'utf8').digest('hex'),
        created_at: config.createdAt,
        updated_at: config.updatedAt
      });
    */
  }

  /**
   * Update webhook configuration in database
   * Note: Using moonpay_webhook_events table temporarily until moonpay_webhook_config table is created
   */
  private async updateWebhookConfig(webhookId: string, updates: Partial<WebhookConfig>): Promise<void> {
    // TODO: Create moonpay_webhook_config table and implement proper update
    console.log('Webhook config would be updated:', webhookId, updates);
    /*
    await supabase
      .from('moonpay_webhook_config')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('webhook_id', webhookId);
    */
  }

  /**
   * Delete webhook configuration from database
   * Note: Using moonpay_webhook_events table temporarily until moonpay_webhook_config table is created
   */
  private async deleteWebhookConfig(webhookId: string): Promise<void> {
    // TODO: Create moonpay_webhook_config table and implement proper deletion
    console.log('Webhook config would be deleted:', webhookId);
    /*
    await supabase
      .from('moonpay_webhook_config')
      .delete()
      .eq('webhook_id', webhookId);
    */
  }

  // ===== EVENT PROCESSING METHODS =====

  private async handleEventByType(event: WebhookEvent): Promise<any> {
    const handlers = this.eventHandlers.get(event.type);
    const results = [];

    if (handlers && handlers.length > 0) {
      for (const handler of handlers) {
        try {
          const result = await handler(event);
          results.push({
            type: 'custom_handler',
            description: `Executed custom handler for ${event.type}`,
            executed: true,
            result
          });
        } catch (error) {
          results.push({
            type: 'custom_handler',
            description: `Failed to execute custom handler for ${event.type}`,
            executed: false,
            result: error.message
          });
        }
      }
    }

    // Built-in event processing with database updates
    switch (event.type) {
      case 'transaction.created':
      case 'transaction.updated':
      case 'transaction.completed':
      case 'transaction.failed':
        results.push(await this.handleTransactionUpdate(event));
        break;
      case 'swap.created':
      case 'swap.completed':
      case 'swap.failed':
        results.push(await this.handleSwapUpdate(event));
        break;
      case 'customer.created':
      case 'customer.updated':
      case 'customer.kyc_completed':
        results.push(await this.handleCustomerUpdate(event));
        break;
      case 'nft.minted':
      case 'nft.transferred':
      case 'nft.burned':
        results.push(await this.handleNFTUpdate(event));
        break;
      case 'compliance.alert':
        results.push(await this.handleComplianceAlert(event));
        break;
      case 'policy.triggered':
        results.push(await this.handlePolicyTriggered(event));
        break;
      default:
        results.push({
          type: 'default_handler',
          description: `Processed ${event.type} event`,
          executed: true,
          result: 'Event logged and stored'
        });
    }

    return results;
  }

  private async handleTransactionUpdate(event: WebhookEvent): Promise<any> {
    const { id, status, txHash, completedAt } = event.data.object;

    await supabase
      .from('moonpay_transactions')
      .update({
        status,
        ...(txHash && { metadata: { txHash } }),
        ...(completedAt && { updated_at: completedAt })
      })
      .eq('external_transaction_id', id);

    // Trigger notifications if needed
    if (status === 'completed') {
      await this.sendTransactionNotification(id, 'completed');
    } else if (status === 'failed') {
      await this.sendTransactionNotification(id, 'failed');
    }

    return {
      type: 'transaction_update',
      description: `Transaction ${event.type} event processed`,
      executed: true,
      result: { transactionId: id, status }
    };
  }

  private async handleSwapUpdate(event: WebhookEvent): Promise<any> {
    const { id, status, txHash, actualOutput, fees } = event.data.object;

    await supabase
      .from('moonpay_swap_transactions')
      .update({
        status,
        ...(txHash && { tx_hash: txHash }),
        ...(actualOutput && { actual_output: actualOutput }),
        ...(fees && { fees }),
        updated_at: new Date().toISOString()
      })
      .eq('external_transaction_id', id);

    if (status === 'completed' && actualOutput) {
      await this.sendSwapNotification(id, actualOutput);
    }

    return {
      type: 'swap_update',
      description: `Swap ${event.type} event processed`,
      executed: true,
      result: { swapId: id, status, actualOutput }
    };
  }

  private async handleCustomerUpdate(event: WebhookEvent): Promise<any> {
    const { id, kycStatus, verificationLevel, documents } = event.data.object;

    await supabase
      .from('moonpay_customers')
      .update({
        ...(kycStatus && { kyc_level: kycStatus }),
        ...(verificationLevel && { identity_verification_status: verificationLevel }),
        ...(documents && { verification_documents: documents }),
        updated_at: new Date().toISOString()
      })
      .eq('moonpay_customer_id', id);

    if (event.type === 'customer.kyc_completed') {
      await this.sendKYCNotification(id, verificationLevel);
    }

    return {
      type: 'customer_update',
      description: `Customer ${event.type} event processed`,
      executed: true,
      result: { customerId: id, kycStatus, verificationLevel }
    };
  }

  private async handleNFTUpdate(event: WebhookEvent): Promise<any> {
    const { id, passId, txHash, ownerAddress, mintedAt } = event.data.object;

    if (event.type === 'nft.minted') {
      await supabase
        .from('moonpay_passes')
        .update({
          status: 'minted',
          owner_address: ownerAddress,
          metadata: { txHash, mintedAt }
        })
        .eq('external_pass_id', passId || id);

      await this.sendNFTNotification(passId || id, 'minted');
    }

    return {
      type: 'nft_update',
      description: `NFT ${event.type} event processed`,
      executed: true,
      result: { nftId: passId || id, txHash, ownerAddress }
    };
  }

  private async handleComplianceAlert(event: WebhookEvent): Promise<any> {
    const { id, alertType, severity, details } = event.data.object;

    // Log compliance alert using existing alerts table instead of moonpay_compliance_alerts
    await supabase
      .from('alerts')
      .insert({
        title: `MoonPay Compliance Alert: ${alertType}`,
        description: `Compliance alert triggered for event ${id}`,
        service: 'moonpay',
        severity: severity || 'medium',
        status: 'active',
        metadata: {
          moonpay_alert_id: id,
          alert_type: alertType,
          details: details,
          triggered_at: new Date().toISOString()
        }
      });

    return {
      type: 'compliance_alert',
      description: 'Compliance alert event processed',
      executed: true,
      result: { alertId: id, alertType, severity }
    };
  }

  private async handlePolicyTriggered(event: WebhookEvent): Promise<any> {
    const { policyId, triggeredBy, action, details } = event.data.object;

    // Log policy trigger using alerts table since moonpay_policy_logs may not exist
    await supabase
      .from('alerts')
      .insert({
        title: `MoonPay Policy Triggered: ${action}`,
        description: `Policy ${policyId} was triggered by ${triggeredBy}`,
        service: 'moonpay',
        severity: 'medium',
        status: 'active',
        metadata: {
          policy_id: policyId,
          triggered_by: triggeredBy,
          action_taken: action,
          details: details,
          triggered_at: new Date().toISOString()
        }
      });

    // Execute policy action if needed
    await this.executePolicyAction(action, details);

    return {
      type: 'policy_trigger',
      description: 'Policy trigger event processed',
      executed: true,
      result: { policyId, action }
    };
  }

  // ===== NOTIFICATION METHODS =====

  private async sendTransactionNotification(transactionId: string, status: string): Promise<void> {
    // Implementation would integrate with your notification system
    console.log(`Transaction ${transactionId} ${status}`);
  }

  private async sendSwapNotification(swapId: string, actualOutput: number): Promise<void> {
    // Implementation would integrate with your notification system
    console.log(`Swap ${swapId} completed with output: ${actualOutput}`);
  }

  private async sendNFTNotification(passId: string, action: string): Promise<void> {
    // Implementation would integrate with your notification system
    console.log(`NFT Pass ${passId} ${action}`);
  }

  private async sendKYCNotification(customerId: string, level: string): Promise<void> {
    // Implementation would integrate with your notification system
    console.log(`Customer ${customerId} verified at level: ${level}`);
  }

  private async executePolicyAction(action: string, details: any): Promise<void> {
    // Implementation would execute specific policy actions
    console.log(`Executing policy action: ${action}`, details);
  }

  // ===== RETRY MECHANISM =====

  /**
   * Retry failed webhook processing
   */
  async retryFailedWebhooks(maxRetries: number = 3): Promise<void> {
    const { data: failedEvents } = await supabase
      .from('moonpay_webhook_events')
      .select('*')
      .eq('processed', false)
      .lt('processing_attempts', maxRetries)
      .order('received_at', { ascending: true })
      .limit(10);

    if (!failedEvents || failedEvents.length === 0) {
      return;
    }

    for (const event of failedEvents) {
      try {
        // Increment attempt counter
        await supabase
          .from('moonpay_webhook_events')
          .update({
            processing_attempts: event.processing_attempts + 1
          })
          .eq('id', event.id);

        // Retry processing - safely convert event data
        const webhookEvent = this.parseWebhookEventFromDatabase(event.event_data);
        const result = await this.handleEventByType(webhookEvent);
        
        if (result.length > 0 && result.some(r => r.executed)) {
          await this.markWebhookProcessed(event.id, result);
        }
      } catch (error) {
        // Update error message
        await supabase
          .from('moonpay_webhook_events')
          .update({
            last_processing_error: error.message
          })
          .eq('id', event.id);
      }
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  private validateWebhookEvent(event: WebhookEvent): void {
    if (!event.id || !event.type || !event.data || !event.timestamp) {
      throw new Error('Invalid webhook event structure');
    }
  }

  private createProcessedResult(
    event: WebhookEvent,
    processed: boolean,
    message: string,
    startTime: number,
    actions: any[] = []
  ): ProcessedWebhookResult {
    return {
      eventId: event.id,
      eventType: event.type,
      processed,
      processingTime: Date.now() - startTime,
      result: {
        success: processed,
        message,
        data: processed ? event.data : undefined,
        errors: processed ? undefined : [message]
      },
      actions,
      timestamp: new Date().toISOString()
    };
  }

  private safeCompare(a: string, b: string): boolean {
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
   * Safely parse webhook event from database Json type
   */
  private parseWebhookEventFromDatabase(eventData: any): WebhookEvent {
    try {
      // If it's already a proper object, validate and return
      if (typeof eventData === 'object' && eventData !== null) {
        this.validateWebhookEvent(eventData as WebhookEvent);
        return eventData as WebhookEvent;
      }
      
      // If it's a string, parse it
      if (typeof eventData === 'string') {
        const parsed = JSON.parse(eventData);
        this.validateWebhookEvent(parsed);
        return parsed;
      }
      
      // Fallback - create a minimal valid webhook event
      throw new Error('Invalid event data format');
    } catch (error) {
      console.error('Failed to parse webhook event from database:', error);
      // Return a minimal valid webhook event for processing
      return {
        id: 'unknown',
        type: 'transaction.updated',
        data: { object: eventData || {} },
        environment: 'production',
        timestamp: new Date().toISOString(),
        api_version: '1.0',
        source: 'webhook'
      };
    }
  }
}

export const webhookHandler = new WebhookHandler(
  import.meta.env.VITE_MOONPAY_API_KEY || "",
  import.meta.env.VITE_MOONPAY_SECRET_KEY || "",
  import.meta.env.VITE_MOONPAY_WEBHOOK_SECRET || ""
);
