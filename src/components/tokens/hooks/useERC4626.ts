/**
 * useERC4626 Hook
 * 
 * React hook for ERC-4626 tokenized vault operations.
 */

import { useToken } from './useToken';
import { UseTokenOptions } from './types';

interface UseERC4626Options extends Omit<UseTokenOptions, 'standard'> {}

export function useERC4626(options: UseERC4626Options) {
  const { tokenId, ...tokenOptions } = options;
  
  const tokenHook = useToken({ ...tokenOptions, tokenId });
  
  return {
    ...tokenHook,
    // ERC4626-specific methods
    deposit: async (assets: string, receiver: string) => {
      console.log('Depositing assets:', { assets, receiver });
    },
    withdraw: async (assets: string, receiver: string, owner: string) => {
      console.log('Withdrawing assets:', { assets, receiver, owner });
    }
  };
}
