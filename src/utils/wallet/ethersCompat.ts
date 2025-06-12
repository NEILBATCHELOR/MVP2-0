/**
 * Ethers.js Compatibility Utility
 * 
 * This file provides compatibility functions for ethers.js v5 to handle
 * code that might be written for v6 patterns or vice versa.
 */

import { parseUnits, formatUnits, isAddress, keccak256, toUtf8Bytes, getAddress, JsonRpcProvider, BrowserProvider, Wallet, type Contract, type Signer, type BigNumberish, type Provider } from 'ethers';
import { rpcManager } from '@/infrastructure/web3/rpc/RPCConnectionManager';
import { providerManager } from '@/infrastructure/web3/ProviderManager';

export const ZeroAddress = '0x0000000000000000000000000000000000000000';
export { parseUnits, formatUnits, isAddress, keccak256, toUtf8Bytes, getAddress, JsonRpcProvider, BrowserProvider, Wallet };
export type { Contract, Signer, BigNumberish, Provider };

export function createProvider(keyOrEthereum: string | any): Provider {
  if (typeof keyOrEthereum === 'string') {
    // Try to use ProviderManager for known blockchains
    try {
      return providerManager.getProvider(keyOrEthereum as any);
    } catch {
      // Fallback: treat as direct URL (legacy, not recommended)
      return new JsonRpcProvider(keyOrEthereum);
    }
  } else {
    return new BrowserProvider(keyOrEthereum);
  }
}

export function createSigner(
  provider: Provider,
  privateKey?: string
): Signer {
  if (privateKey) {
    return new Wallet(privateKey, provider);
  }
  // For BrowserProvider
  if ('getSigner' in provider) {
    return (provider as any).getSigner();
  }
  throw new Error('Cannot create signer: either provide a private key or use a BrowserProvider');
}
