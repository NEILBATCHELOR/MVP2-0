/**
 * useERC1400 Hook
 * 
 * React hook for ERC-1400 security token operations and management.
 */

import { useToken } from './useToken';
import { UseTokenOptions } from './types';

interface UseERC1400Options extends Omit<UseTokenOptions, 'standard'> {}

export function useERC1400(options: UseERC1400Options) {
  const { tokenId, ...tokenOptions } = options;
  
  const tokenHook = useToken({ ...tokenOptions, tokenId });
  
  return {
    ...tokenHook,
    // ERC1400-specific methods
    issueByPartition: async (partition: string, to: string, amount: string) => {
      console.log('Issuing by partition:', { partition, to, amount });
    },
    redeemByPartition: async (partition: string, amount: string) => {
      console.log('Redeeming by partition:', { partition, amount });
    }
  };
}
