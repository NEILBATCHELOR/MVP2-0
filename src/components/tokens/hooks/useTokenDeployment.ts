/**
 * Hook for managing token deployment operations
 */
import { useState, useCallback } from 'react';
import { 
  BlockchainNetwork, 
  NetworkEnvironment, 
  TokenDeploymentConfig,
  TokenDeploymentResult 
} from '../types';
import { deployToken } from '../services/tokenService';

interface UseTokenDeploymentProps {
  onSuccess?: (data: TokenDeploymentResult) => void;
  onError?: (error: any) => void;
}

export function useTokenDeployment({
  onSuccess,
  onError
}: UseTokenDeploymentProps = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deploymentResult, setDeploymentResult] = useState<TokenDeploymentResult | null>(null);

  // Deploy token to blockchain
  const deploy = useCallback(async (config: TokenDeploymentConfig) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await deployToken(config);
      
      setDeploymentResult(result);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to deploy token');
      if (onError) {
        onError(err);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  return {
    loading,
    error,
    deploymentResult,
    deploy
  };
}

export default useTokenDeployment;