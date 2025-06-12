/**
 * Hook for batch token operations in client components
 */
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { TokenFormData } from '../types';
import { TokenStandard } from '@/types/core/centralModels';
import {
  createTokensBatch,
  updateTokensBatch,
  deleteTokensBatch,
  importTokensFromTemplates,
  cloneTokensBatch,
  updateTokenStatusBatch
} from '../services/tokenBatchService';

type BatchOperationStatus = 'idle' | 'loading' | 'success' | 'error';

interface BatchResults {
  success: boolean;
  results: any[];
  failed: number;
  succeeded: number;
  errors: any[];
}

export interface UseBatchTokenOperationsProps {
  projectId: string;
  onSuccess?: (results: BatchResults) => void;
  onError?: (error: any) => void;
}

export function useBatchTokenOperations({
  projectId,
  onSuccess,
  onError
}: UseBatchTokenOperationsProps) {
  const [status, setStatus] = useState<BatchOperationStatus>('idle');
  const [results, setResults] = useState<BatchResults | null>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Helper to handle all batch operations in a consistent way
  const handleBatchOperation = async (
    operation: () => Promise<BatchResults>,
    successMessage: string,
    errorPrefix: string
  ) => {
    setLoading(true);
    setStatus('loading');
    setError(null);
    
    try {
      const batchResults = await operation();
      setResults(batchResults);
      
      // Show appropriate toast based on results
      if (batchResults.success) {
        toast({
          title: 'Success',
          description: successMessage,
          variant: 'default',
        });
        setStatus('success');
        onSuccess?.(batchResults);
      } else {
        // Partial success
        toast({
          title: 'Partial Success',
          description: `Completed ${batchResults.succeeded} operation(s), but ${batchResults.failed} failed. See details for more information.`,
          variant: 'destructive',
        });
        setStatus('error');
        setError({
          message: `${errorPrefix} - ${batchResults.failed} operation(s) failed`,
          details: batchResults.errors
        });
        onError?.({
          message: `${errorPrefix} - ${batchResults.failed} operation(s) failed`,
          details: batchResults.errors
        });
      }
    } catch (err: any) {
      // Complete failure
      setStatus('error');
      setError(err);
      toast({
        title: 'Error',
        description: `${errorPrefix}: ${err.message || 'Unknown error'}`,
        variant: 'destructive',
      });
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create multiple tokens at once
   */
  const createTokens = async (tokensData: Partial<TokenFormData>[]) => {
    return handleBatchOperation(
      () => createTokensBatch(projectId, tokensData),
      `Successfully created ${tokensData.length} token(s)`,
      'Failed to create tokens'
    );
  };

  /**
   * Update multiple tokens at once
   */
  const updateTokens = async (tokensData: { id: string; data: Partial<TokenFormData> }[]) => {
    return handleBatchOperation(
      () => updateTokensBatch(projectId, tokensData),
      `Successfully updated ${tokensData.length} token(s)`,
      'Failed to update tokens'
    );
  };

  /**
   * Delete multiple tokens at once
   */
  const deleteTokens = async (tokenIds: string[]) => {
    return handleBatchOperation(
      () => deleteTokensBatch(projectId, tokenIds),
      `Successfully deleted ${tokenIds.length} token(s)`,
      'Failed to delete tokens'
    );
  };

  /**
   * Import tokens from templates
   */
  const importFromTemplates = async (
    templates: { templateId: string; overrides?: Partial<TokenFormData> }[]
  ) => {
    return handleBatchOperation(
      () => importTokensFromTemplates(projectId, templates),
      `Successfully imported ${templates.length} token(s) from templates`,
      'Failed to import tokens from templates'
    );
  };

  /**
   * Clone multiple tokens with modifications
   */
  const cloneTokens = async (
    cloneRequests: { sourceTokenId: string; modifications?: Partial<TokenFormData> }[]
  ) => {
    return handleBatchOperation(
      () => cloneTokensBatch(projectId, cloneRequests),
      `Successfully cloned ${cloneRequests.length} token(s)`,
      'Failed to clone tokens'
    );
  };

  /**
   * Update statuses for multiple tokens
   */
  const updateTokenStatuses = async (
    statusUpdates: { tokenId: string; status: string }[]
  ) => {
    return handleBatchOperation(
      () => updateTokenStatusBatch(projectId, statusUpdates),
      `Successfully updated status for ${statusUpdates.length} token(s)`,
      'Failed to update token statuses'
    );
  };

  // Reset state to initial values
  const reset = () => {
    setStatus('idle');
    setResults(null);
    setError(null);
    setLoading(false);
  };

  return {
    // Operations
    createTokens,
    updateTokens,
    deleteTokens,
    importFromTemplates,
    cloneTokens,
    updateTokenStatuses,
    
    // State
    status,
    results,
    error,
    isLoading: loading,
    reset,
    
    // Helpers
    isIdle: status === 'idle',
    isProcessing: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
  };
} 