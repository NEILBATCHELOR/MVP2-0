/**
 * Hook for managing token operations (mint, burn, pause, lock, etc.)
 */
import { useState, useCallback } from 'react';
import { TokenOperationType, TokenOperationParams } from '../types';
import { executeTokenOperation } from '../services/tokenService';

interface UseTokenOperationsProps {
  tokenId: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useTokenOperations({
  tokenId,
  onSuccess,
  onError
}: UseTokenOperationsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operationResult, setOperationResult] = useState<any | null>(null);

  // Generic function to execute any token operation
  const executeOperation = useCallback(async (
    operationType: TokenOperationType,
    params: Omit<TokenOperationParams, 'tokenId' | 'operationType'>
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await executeTokenOperation({
        tokenId,
        operationType,
        ...params
      });
      
      setOperationResult(result);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err: any) {
      setError(err.message || `Failed to execute ${operationType} operation`);
      if (onError) {
        onError(err);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tokenId, onSuccess, onError]);

  // Helper methods for specific operations
  const mint = useCallback((params: { recipient: string; amount: string }) => {
    return executeOperation(TokenOperationType.MINT, params);
  }, [executeOperation]);

  const burn = useCallback((params: { amount: string; sender?: string }) => {
    return executeOperation(TokenOperationType.BURN, params);
  }, [executeOperation]);

  const pause = useCallback(() => {
    return executeOperation(TokenOperationType.PAUSE, {});
  }, [executeOperation]);

  const unpause = useCallback(() => {
    return executeOperation(TokenOperationType.UNPAUSE, {});
  }, [executeOperation]);

  const lock = useCallback((params: { 
    targetAddress: string;
    amount?: string;
    lockDuration?: number;
    lockReason?: string;
    unlockTime?: string;
  }) => {
    return executeOperation(TokenOperationType.LOCK, params);
  }, [executeOperation]);

  const unlock = useCallback((params: { 
    targetAddress: string;
    lockId: string;
  }) => {
    return executeOperation(TokenOperationType.UNLOCK, params);
  }, [executeOperation]);

  const block = useCallback((params: { 
    targetAddress: string;
  }) => {
    return executeOperation(TokenOperationType.BLOCK, params);
  }, [executeOperation]);

  const unblock = useCallback((params: { 
    targetAddress: string;
  }) => {
    return executeOperation(TokenOperationType.UNBLOCK, params);
  }, [executeOperation]);

  return {
    loading,
    error,
    operationResult,
    executeOperation,
    mint,
    burn,
    pause,
    unpause,
    lock,
    unlock,
    block,
    unblock
  };
}

export default useTokenOperations;