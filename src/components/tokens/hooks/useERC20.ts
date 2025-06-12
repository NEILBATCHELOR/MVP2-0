/**
 * useERC20 Hook
 * 
 * React hook specifically for ERC-20 token operations and management.
 * Provides ERC-20 specific functionality and validations.
 */

import { useState, useCallback } from 'react';
import { useToken } from './useToken';
import { UseTokenOptions } from './types';
import { TokenStandard } from '@/types/core/centralModels';
import { 
  getERC20Properties,
  updateERC20Properties,
  createERC20Token
} from '../services/enhancedERC20Service';

interface UseERC20Options extends Omit<UseTokenOptions, 'standard'> {
  includeGovernance?: boolean;
  includeCompliance?: boolean;
}

interface ERC20HookResult {
  token: any;
  properties: any;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateProperties: (updates: any) => Promise<void>;
  mint: (to: string, amount: string) => Promise<void>;
  burn: (amount: string) => Promise<void>;
  pause: () => Promise<void>;
  unpause: () => Promise<void>;
  transferOwnership: (newOwner: string) => Promise<void>;
}

export function useERC20(options: UseERC20Options): ERC20HookResult {
  const {
    tokenId,
    includeGovernance = false,
    includeCompliance = false,
    ...tokenOptions
  } = options;

  const [properties, setProperties] = useState<any>(null);
  const [isOperationLoading, setIsOperationLoading] = useState(false);

  // Use base token hook
  const {
    token,
    isLoading: isTokenLoading,
    error,
    refetch: refetchToken,
    update
  } = useToken({
    ...tokenOptions,
    tokenId
  });

  // Fetch ERC-20 specific properties
  const fetchProperties = useCallback(async () => {
    if (!tokenId) return;

    try {
      const erc20Properties = await getERC20Properties(tokenId, {
        includeGovernance,
        includeCompliance
      });
      setProperties(erc20Properties);
    } catch (err) {
      console.error('Failed to fetch ERC-20 properties:', err);
    }
  }, [tokenId, includeGovernance, includeCompliance]);

  // Update ERC-20 properties
  const updateProperties = useCallback(async (updates: any) => {
    if (!tokenId) throw new Error('Token ID is required');

    setIsOperationLoading(true);
    try {
      const updatedProperties = await updateERC20Properties(tokenId, updates);
      setProperties(updatedProperties);
      await refetchToken(); // Refresh base token data
    } catch (err) {
      throw err;
    } finally {
      setIsOperationLoading(false);
    }
  }, [tokenId, refetchToken]);

  // ERC-20 specific operations
  const mint = useCallback(async (to: string, amount: string) => {
    if (!tokenId) throw new Error('Token ID is required');
    if (!token?.erc20Properties?.isMintable) {
      throw new Error('Token is not mintable');
    }

    setIsOperationLoading(true);
    try {
      // Implementation would call blockchain or update database
      // For now, this is a placeholder
      console.log('Minting', amount, 'tokens to', to);
      await refetchToken();
    } catch (err) {
      throw err;
    } finally {
      setIsOperationLoading(false);
    }
  }, [tokenId, token, refetchToken]);

  const burn = useCallback(async (amount: string) => {
    if (!tokenId) throw new Error('Token ID is required');
    if (!token?.erc20Properties?.isBurnable) {
      throw new Error('Token is not burnable');
    }

    setIsOperationLoading(true);
    try {
      // Implementation would call blockchain or update database
      console.log('Burning', amount, 'tokens');
      await refetchToken();
    } catch (err) {
      throw err;
    } finally {
      setIsOperationLoading(false);
    }
  }, [tokenId, token, refetchToken]);

  const pause = useCallback(async () => {
    if (!tokenId) throw new Error('Token ID is required');
    if (!token?.erc20Properties?.isPausable) {
      throw new Error('Token is not pausable');
    }

    setIsOperationLoading(true);
    try {
      console.log('Pausing token');
      await refetchToken();
    } catch (err) {
      throw err;
    } finally {
      setIsOperationLoading(false);
    }
  }, [tokenId, token, refetchToken]);

  const unpause = useCallback(async () => {
    if (!tokenId) throw new Error('Token ID is required');
    if (!token?.erc20Properties?.isPausable) {
      throw new Error('Token is not pausable');
    }

    setIsOperationLoading(true);
    try {
      console.log('Unpausing token');
      await refetchToken();
    } catch (err) {
      throw err;
    } finally {
      setIsOperationLoading(false);
    }
  }, [tokenId, token, refetchToken]);

  const transferOwnership = useCallback(async (newOwner: string) => {
    if (!tokenId) throw new Error('Token ID is required');
    if (!newOwner) throw new Error('New owner address is required');

    setIsOperationLoading(true);
    try {
      console.log('Transferring ownership to', newOwner);
      await refetchToken();
    } catch (err) {
      throw err;
    } finally {
      setIsOperationLoading(false);
    }
  }, [tokenId, refetchToken]);

  // Combined refetch function
  const refetch = useCallback(async () => {
    await Promise.all([
      refetchToken(),
      fetchProperties()
    ]);
  }, [refetchToken, fetchProperties]);

  return {
    token,
    properties,
    isLoading: isTokenLoading || isOperationLoading,
    error,
    refetch,
    updateProperties,
    mint,
    burn,
    pause,
    unpause,
    transferOwnership
  };
}
