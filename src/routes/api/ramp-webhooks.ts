/**
 * RAMP Network Webhook API Routes
 * 
 * Handles webhooks from RAMP Network for on-ramp and off-ramp transactions
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { supabase } from '@/infrastructure/supabaseClient';
import type { RampNetworkWebhook, RampPurchase, RampSale } from '@/types/dfns/fiat';
import type { RampWebhookEventRecord, RampWebhookEventInsert } from '@/types/ramp/database';

// Type aliases for cleaner code
type RampWebhookEventRow = RampWebhookEventRecord;
type RampWebhookEventInsertData = RampWebhookEventInsert;

const rampWebhookRouter = Router();

// Middleware to verify RAMP Network webhook signatures
const verifyRampSignature = (req: Request, res: Response, next: Function) => {
  const signature = req.headers['x-body-signature'] as string;
  const body = JSON.stringify(req.body);
  
  if (!signature) {
    return res.status(401).json({ error: 'Missing signature header' });
  }

  try {
    // TODO: Implement actual ECDSA signature verification
    // This requires the RAMP Network public key and proper ECDSA verification
    // For now, we'll skip verification in development
    if (process.env.NODE_ENV === 'production' && process.env.RAMP_NETWORK_WEBHOOK_SECRET) {
      // Implement signature verification here
      // const isValid = verifyECDSASignature(body, signature, publicKey);
      // if (!isValid) {
      //   return res.status(401).json({ error: 'Invalid signature' });
      // }
    }
    
    next();
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return res.status(401).json({ error: 'Signature verification failed' });
  }
};

/**
 * Handle RAMP Network on-ramp webhooks
 */
rampWebhookRouter.post('/onramp', verifyRampSignature, async (req: Request, res: Response) => {
  try {
    const webhookEvent: RampNetworkWebhook = req.body;
    
    console.log('Received RAMP on-ramp webhook:', {
      id: webhookEvent.id,
      type: webhookEvent.type,
      mode: webhookEvent.mode,
      timestamp: new Date().toISOString()
    });

    // Process the webhook event
    await processOnRampWebhook(webhookEvent);

    // Store webhook event in database
    await storeWebhookEvent(webhookEvent, 'onramp');

    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully',
      eventId: webhookEvent.id 
    });

  } catch (error) {
    console.error('Error processing RAMP on-ramp webhook:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: (error as Error).message 
    });
  }
});

/**
 * Handle RAMP Network off-ramp webhooks
 */
rampWebhookRouter.post('/offramp', verifyRampSignature, async (req: Request, res: Response) => {
  try {
    const webhookEvent: RampNetworkWebhook = req.body;
    
    console.log('Received RAMP off-ramp webhook:', {
      id: webhookEvent.id,
      type: webhookEvent.type,
      mode: webhookEvent.mode,
      timestamp: new Date().toISOString()
    });

    // Process the webhook event
    await processOffRampWebhook(webhookEvent);

    // Store webhook event in database
    await storeWebhookEvent(webhookEvent, 'offramp');

    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully',
      eventId: webhookEvent.id 
    });

  } catch (error) {
    console.error('Error processing RAMP off-ramp webhook:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: (error as Error).message 
    });
  }
});

/**
 * Get webhook delivery status
 */
rampWebhookRouter.get('/status/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    
    const { data: webhookEvent, error } = await supabase
      .from('ramp_webhook_events')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (error || !webhookEvent) {
      return res.status(404).json({ error: 'Webhook event not found' });
    }

    // Type the response properly
    const typedEvent = webhookEvent as RampWebhookEventRow;

    res.json({
      eventId: typedEvent.event_id,
      type: typedEvent.event_type,
      status: typedEvent.processing_status,
      createdAt: typedEvent.created_at,
      processedAt: typedEvent.processed_at,
      errorMessage: typedEvent.error_message
    });

  } catch (error) {
    console.error('Error fetching webhook status:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: (error as Error).message 
    });
  }
});

/**
 * Process on-ramp webhook events
 */
async function processOnRampWebhook(webhookEvent: RampNetworkWebhook): Promise<void> {
  const purchase = webhookEvent.payload as RampPurchase;
  
  try {
    switch (webhookEvent.type) {
      case 'CREATED':
        await handlePurchaseCreated(purchase);
        break;
      case 'RELEASED':
        await handlePurchaseReleased(purchase);
        break;
      case 'EXPIRED':
        await handlePurchaseExpired(purchase);
        break;
      case 'CANCELLED':
        await handlePurchaseCancelled(purchase);
        break;
      default:
        console.warn('Unknown webhook event type:', webhookEvent.type);
    }
  } catch (error) {
    console.error('Error processing on-ramp webhook:', error);
    throw error;
  }
}

/**
 * Process off-ramp webhook events
 */
async function processOffRampWebhook(webhookEvent: RampNetworkWebhook): Promise<void> {
  const sale = webhookEvent.payload as RampSale;
  
  try {
    switch (webhookEvent.type) {
      case 'CREATED':
        await handleSaleCreated(sale);
        break;
      case 'RELEASED':
        await handleSaleCompleted(sale);
        break;
      case 'EXPIRED':
        await handleSaleExpired(sale);
        break;
      case 'CANCELLED':
        await handleSaleCancelled(sale);
        break;
      default:
        console.warn('Unknown webhook event type:', webhookEvent.type);
    }
  } catch (error) {
    console.error('Error processing off-ramp webhook:', error);
    throw error;
  }
}

/**
 * Handle purchase created event
 */
async function handlePurchaseCreated(purchase: RampPurchase): Promise<void> {
  console.log('Processing purchase created:', purchase.id);
  
  // Update transaction status in database
  const { error } = await supabase
    .from('fiat_transactions')
    .update({
      status: 'pending',
      provider_transaction_id: purchase.id,
      updated_at: new Date().toISOString(),
      metadata: JSON.parse(JSON.stringify({
        ramp_purchase: purchase,
        processing_status: 'created'
      }))
    })
    .eq('provider_transaction_id', purchase.id);

  if (error) {
    console.error('Failed to update purchase status:', error);
  }
}

/**
 * Handle purchase released (completed) event
 */
async function handlePurchaseReleased(purchase: RampPurchase): Promise<void> {
  console.log('Processing purchase released:', purchase.id);
  
  // Update transaction status to completed
  const { error } = await supabase
    .from('fiat_transactions')
    .update({
      status: 'completed',
      tx_hash: purchase.finalTxHash,
      updated_at: new Date().toISOString(),
      metadata: JSON.parse(JSON.stringify({
        ramp_purchase: purchase,
        processing_status: 'completed',
        completion_time: new Date().toISOString()
      }))
    })
    .eq('provider_transaction_id', purchase.id);

  if (error) {
    console.error('Failed to update purchase completion:', error);
  }
}

/**
 * Handle purchase expired event
 */
async function handlePurchaseExpired(purchase: RampPurchase): Promise<void> {
  console.log('Processing purchase expired:', purchase.id);
  
  const { error } = await supabase
    .from('fiat_transactions')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString(),
      metadata: JSON.parse(JSON.stringify({
        ramp_purchase: purchase,
        processing_status: 'expired'
      }))
    })
    .eq('provider_transaction_id', purchase.id);

  if (error) {
    console.error('Failed to update purchase expiry:', error);
  }
}

/**
 * Handle purchase cancelled event
 */
async function handlePurchaseCancelled(purchase: RampPurchase): Promise<void> {
  console.log('Processing purchase cancelled:', purchase.id);
  
  const { error } = await supabase
    .from('fiat_transactions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
      metadata: JSON.parse(JSON.stringify({
        ramp_purchase: purchase,
        processing_status: 'cancelled'
      }))
    })
    .eq('provider_transaction_id', purchase.id);

  if (error) {
    console.error('Failed to update purchase cancellation:', error);
  }
}

/**
 * Handle sale created event
 */
async function handleSaleCreated(sale: RampSale): Promise<void> {
  console.log('Processing sale created:', sale.id);
  
  const { error } = await supabase
    .from('fiat_transactions')
    .update({
      status: 'pending',
      provider_transaction_id: sale.id,
      updated_at: new Date().toISOString(),
      metadata: JSON.parse(JSON.stringify({
        ramp_sale: sale,
        processing_status: 'created'
      }))
    })
    .eq('provider_transaction_id', sale.id);

  if (error) {
    console.error('Failed to update sale status:', error);
  }
}

/**
 * Handle sale completed event
 */
async function handleSaleCompleted(sale: RampSale): Promise<void> {
  console.log('Processing sale completed:', sale.id);
  
  const { error } = await supabase
    .from('fiat_transactions')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString(),
      metadata: JSON.parse(JSON.stringify({
        ramp_sale: sale,
        processing_status: 'completed',
        completion_time: new Date().toISOString()
      }))
    })
    .eq('provider_transaction_id', sale.id);

  if (error) {
    console.error('Failed to update sale completion:', error);
  }
}

/**
 * Handle sale expired event
 */
async function handleSaleExpired(sale: RampSale): Promise<void> {
  console.log('Processing sale expired:', sale.id);
  
  const { error } = await supabase
    .from('fiat_transactions')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString(),
      metadata: JSON.parse(JSON.stringify({
        ramp_sale: sale,
        processing_status: 'expired'
      }))
    })
    .eq('provider_transaction_id', sale.id);

  if (error) {
    console.error('Failed to update sale expiry:', error);
  }
}

/**
 * Handle sale cancelled event
 */
async function handleSaleCancelled(sale: RampSale): Promise<void> {
  console.log('Processing sale cancelled:', sale.id);
  
  const { error } = await supabase
    .from('fiat_transactions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
      metadata: JSON.parse(JSON.stringify({
        ramp_sale: sale,
        processing_status: 'cancelled'
      }))
    })
    .eq('provider_transaction_id', sale.id);

  if (error) {
    console.error('Failed to update sale cancellation:', error);
  }
}

/**
 * Store webhook event in database for auditing
 */
async function storeWebhookEvent(webhookEvent: RampNetworkWebhook, flowType: 'onramp' | 'offramp'): Promise<void> {
  try {
    // Map external webhook types to internal types
    const mapWebhookType = (externalType: string, flow: 'onramp' | 'offramp'): RampWebhookEventInsert['event_type'] => {
      const prefix = flow === 'onramp' ? 'PURCHASE' : 'SALE';
      switch (externalType) {
        case 'CREATED':
          return `${prefix}_CREATED` as RampWebhookEventInsert['event_type'];
        case 'RELEASED':
          return `${prefix}_COMPLETED` as RampWebhookEventInsert['event_type'];
        case 'EXPIRED':
          return `${prefix}_EXPIRED` as RampWebhookEventInsert['event_type'];
        case 'CANCELLED':
          return `${prefix}_FAILED` as RampWebhookEventInsert['event_type'];
        default:
          return `${prefix}_UPDATED` as RampWebhookEventInsert['event_type'];
      }
    };

    const insertData: RampWebhookEventInsert = {
      event_id: webhookEvent.id,
      event_type: mapWebhookType(webhookEvent.type, flowType),
      flow_type: flowType,
      payload: JSON.parse(JSON.stringify(webhookEvent.payload)),
      processing_status: 'processed',
      processed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('ramp_webhook_events')
      .insert(insertData);

    if (error) {
      console.error('Failed to store webhook event:', error);
    }
  } catch (error) {
    console.error('Error storing webhook event:', error);
  }
}

export default rampWebhookRouter;
