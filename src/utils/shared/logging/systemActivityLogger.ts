/**
 * System Activity Logger
 * 
 * Utilities for tracking and logging system-initiated processes and activities.
 * This module helps with creating, updating, and completing system process records,
 * and logging activities related to those processes.
 */

import { supabase } from "@/infrastructure/database/client";
import { v4 as uuidv4 } from "uuid";

// Add this type definition at the top of the file, after the imports
type SystemProcessUpdate = {
  end_time: string;
  status: string;
  updated_at: string;
  metadata?: Record<string, any>;
};

/**
 * Represents a system process that can generate multiple activity logs
 */
export interface SystemProcess {
  id: string;
  processName: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  cancellable?: boolean;
  errorDetails?: any;
  metadata?: Record<string, any>;
}

/**
 * Create a new system process and return its ID
 */
export const startSystemProcess = async (
  processName: string, 
  metadata?: Record<string, any>,
  priority?: 'low' | 'normal' | 'high' | 'critical',
  cancellable?: boolean
): Promise<string> => {
  try {
    const processId = uuidv4();
    
    const { error } = await supabase.from("system_processes").insert({
      id: processId,
      process_name: processName,
      start_time: new Date().toISOString(),
      status: 'running',
      progress: 0,
      priority: priority || 'normal',
      cancellable: cancellable || false,
      metadata
    });
    
    if (error) {
      console.error("Error starting system process:", error);
      return "";
    }
    
    return processId;
  } catch (error) {
    console.error("Exception in startSystemProcess:", error);
    return "";
  }
};

/**
 * Update the progress of a system process
 */
export const updateProcessProgress = async (
  processId: string,
  progress: number,
  processedCount?: number,
  status?: 'running' | 'completed' | 'failed' | 'cancelled'
): Promise<boolean> => {
  try {
    // Use direct update instead of RPC call since function might not exist yet
    const updateData: Record<string, any> = {
      progress,
      updated_at: new Date().toISOString()
    };
    
    if (status) {
      updateData.status = status;
    }
    
    if (processedCount !== undefined) {
      updateData.metadata = {
        processed_count: processedCount
      };
    }
    
    const { error } = await supabase
      .from("system_processes")
      .update(updateData)
      .eq("id", processId);
    
    if (error) {
      console.error("Error updating process progress:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception in updateProcessProgress:", error);
    return false;
  }
};

/**
 * Complete a system process (success case)
 */
export const completeSystemProcess = async (
  processId: string, 
  metadata?: Record<string, any>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("system_processes")
      .update({
        end_time: new Date().toISOString(),
        status: 'completed',
        progress: 100,
        metadata: metadata,
        updated_at: new Date().toISOString()
      })
      .eq("id", processId);
    
    if (error) {
      console.error("Error completing system process:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception in completeSystemProcess:", error);
    return false;
  }
};

/**
 * Mark a system process as failed
 */
export const failSystemProcess = async (
  processId: string, 
  errorDetails: any
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("system_processes")
      .update({
        end_time: new Date().toISOString(),
        status: 'failed',
        error_details: errorDetails,
        updated_at: new Date().toISOString()
      })
      .eq("id", processId);
    
    if (error) {
      console.error("Error marking system process as failed:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception in failSystemProcess:", error);
    return false;
  }
};

/**
 * Cancel a system process
 */
export const cancelSystemProcess = async (
  processId: string, 
  reason?: string
): Promise<boolean> => {
  try {
    const now = new Date().toISOString();
    
    // Create update object with explicit typing to avoid deep inference
    const updatePayload: SystemProcessUpdate = {
      end_time: now,
      status: 'cancelled',
      updated_at: now,
      metadata: {
        cancelled_at: now,
        cancel_reason: reason || 'User cancelled'
      }
    };
    
    // Use type assertion to help TypeScript
    const { error } = await supabase
      .from('system_processes')
      .update(updatePayload as any)
      .eq('id', processId)
      .eq('cancellable', true);
    
    if (error) {
      console.error("Error cancelling system process:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception in cancelSystemProcess:", error);
    return false;
  }
};

/**
 * Log an activity related to a system process
 */
export const logSystemActivity = async (
  processId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: string,
  metadata?: Record<string, any>,
  severity: 'info' | 'warning' | 'error' | 'critical' = 'info'
): Promise<boolean> => {
  try {
    // Get process info for context
    const { data: processData } = await supabase
      .from("system_processes")
      .select("process_name")
      .eq("id", processId)
      .single();
      
    const { error } = await supabase.from("audit_logs").insert({
      action,
      action_type: "system",
      entity_type: entityType,
      entity_id: entityId,
      details: details || "System process activity",
      status: severity === 'error' || severity === 'critical' ? 'failed' : 'success',
      system_process_id: processId,
      is_automated: true,
      source: "system_process",
      severity,
      metadata: {
        ...metadata,
        process_name: processData?.process_name || "unknown",
        process_id: processId,
        automated: true
      },
      timestamp: new Date().toISOString()
    });
    
    if (error) {
      console.error("Error logging system activity:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception in logSystemActivity:", error);
    return false;
  }
};

/**
 * Start a batch operation and log its initialization
 */
export const startBatchOperation = async (
  operationType: string,
  targetIds: string[],
  metadata?: Record<string, any>
): Promise<string> => {
  try {
    const batchId = uuidv4();
    
    // Create the batch operation record
    const { error: batchError } = await supabase.from("bulk_operations").insert({
      id: batchId,
      operation_type: operationType,
      status: 'processing',
      target_ids: targetIds,
      progress: 0,
      processed_count: 0,
      failed_count: 0,
      metadata,
      created_at: new Date().toISOString()
    });
    
    if (batchError) {
      console.error("Error creating batch operation:", batchError);
      return "";
    }
    
    // Log the batch operation start
    const { error: logError } = await supabase.from("audit_logs").insert({
      action: `batch_${operationType}_started`,
      action_type: "system",
      entity_type: "bulk_operation",
      entity_id: batchId,
      details: `Started batch ${operationType} operation on ${targetIds.length} items`,
      status: 'success',
      batch_operation_id: batchId,
      is_automated: true,
      source: "batch_processor",
      metadata: {
        batch_id: batchId,
        operation_type: operationType,
        target_count: targetIds.length,
        automated: true
      },
      timestamp: new Date().toISOString()
    });
    
    if (logError) {
      console.error("Error logging batch operation start:", logError);
    }
    
    return batchId;
  } catch (error) {
    console.error("Exception in startBatchOperation:", error);
    return "";
  }
};

/**
 * Update the progress of a batch operation
 */
export const updateBatchProgress = async (
  batchId: string,
  progress: number,
  processedCount?: number,
  failedCount?: number,
  status?: 'processing' | 'completed' | 'failed' | 'cancelled'
): Promise<boolean> => {
  try {
    // Use direct update instead of RPC call since function might not exist yet
    const updateData: Record<string, any> = {
      progress
    };
    
    if (processedCount !== undefined) {
      updateData.processed_count = processedCount;
    }
    
    if (failedCount !== undefined) {
      updateData.failed_count = failedCount;
    }
    
    if (status) {
      updateData.status = status;
    }
    
    const { error } = await supabase
      .from("bulk_operations")
      .update(updateData)
      .eq("id", batchId);
    
    if (error) {
      console.error("Error updating batch progress:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception in updateBatchProgress:", error);
    return false;
  }
};

/**
 * Complete a batch operation
 */
export const completeBatchOperation = async (
  batchId: string,
  status: 'completed' | 'failed' | 'cancelled' = 'completed',
  metadata?: Record<string, any>,
  errorDetails?: any
): Promise<boolean> => {
  try {
    // Update the batch operation record
    const updateData: Record<string, any> = {
      status,
      completed_at: new Date().toISOString(),
      progress: status === 'completed' ? 100 : undefined,
      metadata: { ...metadata, completion_time: new Date().toISOString() }
    };
    
    if (errorDetails && status === 'failed') {
      updateData.error_details = errorDetails;
    }
    
    const { error: batchError } = await supabase
      .from("bulk_operations")
      .update(updateData)
      .eq("id", batchId);
    
    if (batchError) {
      console.error("Error completing batch operation:", batchError);
      return false;
    }
    
    // Log the batch operation completion
    const { error: logError } = await supabase.from("audit_logs").insert({
      action: `batch_operation_${status}`,
      action_type: "system",
      entity_type: "bulk_operation",
      entity_id: batchId,
      details: `Batch operation ${status}`,
      status: status === 'completed' ? 'success' : status,
      batch_operation_id: batchId,
      is_automated: true,
      source: "batch_processor",
      metadata: {
        batch_id: batchId,
        completion_status: status,
        error_details: errorDetails,
        automated: true
      },
      timestamp: new Date().toISOString()
    });
    
    if (logError) {
      console.error("Error logging batch operation completion:", logError);
    }
    
    return true;
  } catch (error) {
    console.error("Exception in completeBatchOperation:", error);
    return false;
  }
};

/**
 * Process a single item in a batch operation
 */
export const processBatchItem = async (
  batchId: string,
  itemId: string,
  action: string,
  result: 'success' | 'failed',
  details?: string,
  metadata?: Record<string, any>
): Promise<boolean> => {
  try {
    // Log the item processing
    const { error } = await supabase.from("audit_logs").insert({
      action: `batch_item_${action}`,
      action_type: "system",
      entity_type: "batch_item",
      entity_id: itemId,
      details: details || `Processed item in batch operation`,
      status: result,
      batch_operation_id: batchId,
      is_automated: true,
      source: "batch_processor",
      metadata: {
        batch_id: batchId,
        item_id: itemId,
        ...metadata,
        automated: true
      },
      timestamp: new Date().toISOString()
    });
    
    if (error) {
      console.error("Error logging batch item processing:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception in processBatchItem:", error);
    return false;
  }
};

/**
 * Utility function to run a process with automatic activity logging
 * Handles process creation, progress updates, completion and error states
 */
export const runSystemProcess = async <T>(
  processName: string,
  processFunction: (processId: string) => Promise<T>,
  metadata?: Record<string, any>,
  priority?: 'low' | 'normal' | 'high' | 'critical',
  cancellable?: boolean
): Promise<T | null> => {
  // Create new process
  const processId = await startSystemProcess(processName, metadata, priority, cancellable);
  
  if (!processId) {
    console.error(`Failed to create system process for ${processName}`);
    return null;
  }
  
  try {
    // Execute the process function
    const result = await processFunction(processId);
    
    // Mark process as complete
    await completeSystemProcess(processId, {
      ...(metadata || {}),
      result: typeof result === 'object' ? result : { value: result },
      completed_at: new Date().toISOString()
    });
    
    return result;
  } catch (error) {
    // Log the error
    console.error(`Error in system process ${processName}:`, error);
    
    // Mark process as failed
    await failSystemProcess(processId, error);
    
    // Return null to indicate failure
    return null;
  }
};

/**
 * Utility function to run a batch operation with automatic progress tracking
 */
export const runBatchOperation = async <T>(
  operationType: string,
  items: string[],
  itemProcessor: (itemId: string, batchId: string, index: number) => Promise<{ success: boolean, result?: any, error?: any }>,
  metadata?: Record<string, any>,
  progressCallback?: (progress: number, processed: number, failed: number) => void
): Promise<{
  success: boolean,
  processed: number,
  failed: number,
  results: Record<string, any>
}> => {
  // Start batch operation
  const batchId = await startBatchOperation(operationType, items, metadata);
  
  if (!batchId) {
    console.error(`Failed to create batch operation for ${operationType}`);
    return { success: false, processed: 0, failed: 0, results: {} };
  }
  
  const results: Record<string, any> = {};
  let processedCount = 0;
  let failedCount = 0;
  
  try {
    // Process each item
    for (let i = 0; i < items.length; i++) {
      const itemId = items[i];
      
      try {
        // Process item
        const itemResult = await itemProcessor(itemId, batchId, i);
        
        // Update counts
        if (itemResult.success) {
          processedCount++;
          results[itemId] = itemResult.result || true;
        } else {
          failedCount++;
          results[itemId] = itemResult.error || false;
        }
        
        // Log item processing
        await processBatchItem(
          batchId,
          itemId,
          operationType,
          itemResult.success ? 'success' : 'failed',
          `Processed item ${i+1}/${items.length}`,
          { result: itemResult.result, error: itemResult.error }
        );
        
        // Update batch progress
        const progress = Math.round(((processedCount + failedCount) / items.length) * 100);
        await updateBatchProgress(batchId, progress, processedCount, failedCount);
        
        // Call progress callback if provided
        if (progressCallback) {
          progressCallback(progress, processedCount, failedCount);
        }
      } catch (error) {
        // Handle item processing error
        failedCount++;
        results[itemId] = error;
        
        // Log item failure
        await processBatchItem(
          batchId,
          itemId,
          operationType,
          'failed',
          `Error processing item ${i+1}/${items.length}`,
          { error }
        );
      }
    }
    
    // Complete batch operation
    const success = failedCount === 0;
    await completeBatchOperation(
      batchId,
      success ? 'completed' : 'failed',
      {
        processed: processedCount,
        failed: failedCount,
        total: items.length,
        completion_time: new Date().toISOString()
      },
      success ? undefined : { failed_items: items.filter(id => !results[id] || results[id] === false) }
    );
    
    return {
      success,
      processed: processedCount,
      failed: failedCount,
      results
    };
  } catch (error) {
    // Handle batch processing error
    console.error(`Error in batch operation ${operationType}:`, error);
    
    // Mark batch as failed
    await completeBatchOperation(
      batchId,
      'failed',
      {
        processed: processedCount,
        failed: failedCount,
        total: items.length,
        error: String(error)
      },
      error
    );
    
    return {
      success: false,
      processed: processedCount,
      failed: failedCount + (items.length - processedCount - failedCount),
      results
    };
  }
};