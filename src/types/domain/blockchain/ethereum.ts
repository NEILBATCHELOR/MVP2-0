/**
 * Type definitions for Ethereum provider
 */

export interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
  isConnected: () => boolean;
}

declare global {
  interface Window {
    ethereum?: any; // Keep as 'any' to match CBW SDK
  }
}

export function getEthereumProvider(): EthereumProvider | undefined {
  if (typeof window !== 'undefined' && window.ethereum) {
    return window.ethereum as EthereumProvider;
  }
  return undefined;
} 