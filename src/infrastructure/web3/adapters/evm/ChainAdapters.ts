/**
 * Polygon Adapter
 * 
 * Polygon-specific implementation extending the base EVM adapter
 * Supports both mainnet and testnet (Amoy)
 */

import { EVMAdapter } from './EVMAdapter';
import type { SupportedChain, NetworkType } from '../IBlockchainAdapter';

export class PolygonAdapter extends EVMAdapter {
  constructor(networkType: NetworkType = 'mainnet') {
    const configs = {
      mainnet: {
        chainId: '137',
        explorerUrl: 'https://polygonscan.com',
        nativeCurrency: { name: 'Polygon', symbol: 'MATIC', decimals: 18 }
      },
      testnet: {
        chainId: '80002',
        explorerUrl: 'https://amoy.polygonscan.com',
        nativeCurrency: { name: 'Polygon', symbol: 'MATIC', decimals: 18 }
      }
    };

    const config = configs[networkType as keyof typeof configs];
    if (!config) {
      throw new Error(`Unsupported network type for Polygon: ${networkType}`);
    }

    super(
      'polygon' as SupportedChain,
      networkType,
      config.chainId,
      config.nativeCurrency,
      config.explorerUrl
    );
  }

  // Polygon-specific methods
  getContractExplorerUrl(contractAddress: string): string {
    const baseUrl = this.networkType === 'mainnet' 
      ? 'https://polygonscan.com' 
      : 'https://amoy.polygonscan.com';
    return `${baseUrl}/address/${contractAddress}`;
  }

  // Override for Polygon's faster block times
  async waitForTransaction(txHash: string, confirmations = 3) {
    // Polygon has faster blocks, so we want more confirmations by default
    return await super.waitForTransaction(txHash, confirmations);
  }
}

/**
 * Arbitrum Adapter
 */
export class ArbitrumAdapter extends EVMAdapter {
  constructor(networkType: NetworkType = 'mainnet') {
    const configs = {
      mainnet: {
        chainId: '42161',
        explorerUrl: 'https://arbiscan.io',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
      },
      testnet: {
        chainId: '421614',
        explorerUrl: 'https://sepolia.arbiscan.io',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
      }
    };

    const config = configs[networkType as keyof typeof configs];
    if (!config) {
      throw new Error(`Unsupported network type for Arbitrum: ${networkType}`);
    }

    super(
      'arbitrum' as SupportedChain,
      networkType,
      config.chainId,
      config.nativeCurrency,
      config.explorerUrl
    );
  }

  getContractExplorerUrl(contractAddress: string): string {
    const baseUrl = this.networkType === 'mainnet' 
      ? 'https://arbiscan.io' 
      : 'https://sepolia.arbiscan.io';
    return `${baseUrl}/address/${contractAddress}`;
  }
}

/**
 * Optimism Adapter
 */
export class OptimismAdapter extends EVMAdapter {
  constructor(networkType: NetworkType = 'mainnet') {
    const configs = {
      mainnet: {
        chainId: '10',
        explorerUrl: 'https://optimistic.etherscan.io',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
      },
      testnet: {
        chainId: '11155420',
        explorerUrl: 'https://sepolia-optimism.etherscan.io',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
      }
    };

    const config = configs[networkType as keyof typeof configs];
    if (!config) {
      throw new Error(`Unsupported network type for Optimism: ${networkType}`);
    }

    super(
      'optimism' as SupportedChain,
      networkType,
      config.chainId,
      config.nativeCurrency,
      config.explorerUrl
    );
  }

  getContractExplorerUrl(contractAddress: string): string {
    const baseUrl = this.networkType === 'mainnet' 
      ? 'https://optimistic.etherscan.io' 
      : 'https://sepolia-optimism.etherscan.io';
    return `${baseUrl}/address/${contractAddress}`;
  }
}

/**
 * Base Adapter
 */
export class BaseAdapter extends EVMAdapter {
  constructor(networkType: NetworkType = 'mainnet') {
    const configs = {
      mainnet: {
        chainId: '8453',
        explorerUrl: 'https://basescan.org',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
      },
      testnet: {
        chainId: '84532',
        explorerUrl: 'https://sepolia.basescan.org',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
      }
    };

    const config = configs[networkType as keyof typeof configs];
    if (!config) {
      throw new Error(`Unsupported network type for Base: ${networkType}`);
    }

    super(
      'base' as SupportedChain,
      networkType,
      config.chainId,
      config.nativeCurrency,
      config.explorerUrl
    );
  }

  getContractExplorerUrl(contractAddress: string): string {
    const baseUrl = this.networkType === 'mainnet' 
      ? 'https://basescan.org' 
      : 'https://sepolia.basescan.org';
    return `${baseUrl}/address/${contractAddress}`;
  }
}

/**
 * Avalanche Adapter
 */
export class AvalancheAdapter extends EVMAdapter {
  constructor(networkType: NetworkType = 'mainnet') {
    const configs = {
      mainnet: {
        chainId: '43114',
        explorerUrl: 'https://snowtrace.io',
        nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 }
      },
      testnet: {
        chainId: '43113',
        explorerUrl: 'https://testnet.snowtrace.io',
        nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 }
      }
    };

    const config = configs[networkType as keyof typeof configs];
    if (!config) {
      throw new Error(`Unsupported network type for Avalanche: ${networkType}`);
    }

    super(
      'avalanche' as SupportedChain,
      networkType,
      config.chainId,
      config.nativeCurrency,
      config.explorerUrl
    );
  }

  getContractExplorerUrl(contractAddress: string): string {
    const baseUrl = this.networkType === 'mainnet' 
      ? 'https://snowtrace.io' 
      : 'https://testnet.snowtrace.io';
    return `${baseUrl}/address/${contractAddress}`;
  }

  // Avalanche C-Chain specific features
  async getAvalancheChainId(): Promise<string> {
    return this.chainId;
  }
}
