/**
 * Blockchain Factory
 * 
 * Factory pattern for creating and managing blockchain adapter instances
 * Supports all major blockchain networks with proper configuration
 */

import type { IBlockchainAdapter, SupportedChain, NetworkType, ConnectionConfig } from '../adapters/IBlockchainAdapter';
import { rpcManager } from '../rpc/RPCConnectionManager';

// Import adapters
import { EthereumAdapter } from '../adapters/evm/EthereumAdapter';
import { PolygonAdapter, ArbitrumAdapter, OptimismAdapter, BaseAdapter, AvalancheAdapter } from '../adapters/evm/ChainAdapters';
import { BitcoinAdapter } from '../adapters/bitcoin/BitcoinAdapter';
import { SolanaAdapter } from '../adapters/solana/SolanaAdapter';
// Phase 3+ adapters (to be implemented)
// import { NEARAdapter } from '../adapters/near/NEARAdapter';
// import { RippleAdapter } from '../adapters/ripple/RippleAdapter';
// import { StellarAdapter } from '../adapters/stellar/StellarAdapter';
// import { SuiAdapter } from '../adapters/sui/SuiAdapter';
// import { AptosAdapter } from '../adapters/aptos/AptosAdapter';

/**
 * Configuration for blockchain network connections
 */
export interface ChainConfig {
  chain: SupportedChain;
  networkType: NetworkType;
  rpcUrl: string;
  explorerUrl: string;
  apiKey?: string;
  chainId: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/**
 * Default configurations for supported chains
 */
export const DEFAULT_CHAIN_CONFIGS: Record<SupportedChain, ChainConfig[]> = {
  ethereum: [
    {
      chain: 'ethereum',
      networkType: 'mainnet',
      rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/',
      explorerUrl: 'https://etherscan.io',
      chainId: '1',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
    },
    {
      chain: 'ethereum',
      networkType: 'testnet',
      rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/',
      explorerUrl: 'https://sepolia.etherscan.io',
      chainId: '11155111',
      nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 }
    }
  ],
  polygon: [
    {
      chain: 'polygon',
      networkType: 'mainnet',
      rpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2/',
      explorerUrl: 'https://polygonscan.com',
      chainId: '137',
      nativeCurrency: { name: 'Polygon', symbol: 'MATIC', decimals: 18 }
    },
    {
      chain: 'polygon',
      networkType: 'testnet',
      rpcUrl: 'https://polygon-amoy.g.alchemy.com/v2/',
      explorerUrl: 'https://amoy.polygonscan.com',
      chainId: '80002',
      nativeCurrency: { name: 'Polygon', symbol: 'MATIC', decimals: 18 }
    }
  ],
  arbitrum: [
    {
      chain: 'arbitrum',
      networkType: 'mainnet',
      rpcUrl: 'https://arb-mainnet.g.alchemy.com/v2/',
      explorerUrl: 'https://arbiscan.io',
      chainId: '42161',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
    }
  ],
  optimism: [
    {
      chain: 'optimism',
      networkType: 'mainnet',
      rpcUrl: 'https://opt-mainnet.g.alchemy.com/v2/',
      explorerUrl: 'https://optimistic.etherscan.io',
      chainId: '10',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
    }
  ],
  base: [
    {
      chain: 'base',
      networkType: 'mainnet',
      rpcUrl: 'https://base-mainnet.g.alchemy.com/v2/',
      explorerUrl: 'https://basescan.org',
      chainId: '8453',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
    }
  ],
  avalanche: [
    {
      chain: 'avalanche',
      networkType: 'mainnet',
      rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
      explorerUrl: 'https://snowtrace.io',
      chainId: '43114',
      nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 }
    }
  ],
  bitcoin: [
    {
      chain: 'bitcoin',
      networkType: 'mainnet',
      rpcUrl: 'https://blockstream.info/api',
      explorerUrl: 'https://blockstream.info',
      chainId: 'bitcoin-mainnet',
      nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 }
    },
    {
      chain: 'bitcoin',
      networkType: 'testnet',
      rpcUrl: 'https://blockstream.info/testnet/api',
      explorerUrl: 'https://blockstream.info/testnet',
      chainId: 'bitcoin-testnet',
      nativeCurrency: { name: 'Test Bitcoin', symbol: 'tBTC', decimals: 8 }
    }
  ],
  solana: [
    {
      chain: 'solana',
      networkType: 'mainnet',
      rpcUrl: 'https://api.mainnet-beta.solana.com',
      explorerUrl: 'https://explorer.solana.com',
      chainId: 'solana-mainnet',
      nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 }
    },
    {
      chain: 'solana',
      networkType: 'devnet',
      rpcUrl: 'https://api.devnet.solana.com',
      explorerUrl: 'https://explorer.solana.com',
      chainId: 'solana-devnet',
      nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 }
    }
  ],
  near: [
    {
      chain: 'near',
      networkType: 'mainnet',
      rpcUrl: 'https://rpc.mainnet.near.org',
      explorerUrl: 'https://explorer.near.org',
      chainId: 'near-mainnet',
      nativeCurrency: { name: 'NEAR', symbol: 'NEAR', decimals: 24 }
    },
    {
      chain: 'near',
      networkType: 'testnet',
      rpcUrl: 'https://rpc.testnet.near.org',
      explorerUrl: 'https://explorer.testnet.near.org',
      chainId: 'near-testnet',
      nativeCurrency: { name: 'NEAR', symbol: 'NEAR', decimals: 24 }
    }
  ],
  ripple: [
    {
      chain: 'ripple',
      networkType: 'mainnet',
      rpcUrl: 'wss://xrplcluster.com',
      explorerUrl: 'https://livenet.xrpl.org',
      chainId: 'ripple-mainnet',
      nativeCurrency: { name: 'XRP', symbol: 'XRP', decimals: 6 }
    },
    {
      chain: 'ripple',
      networkType: 'testnet',
      rpcUrl: 'wss://s.altnet.rippletest.net:51233',
      explorerUrl: 'https://testnet.xrpl.org',
      chainId: 'ripple-testnet',
      nativeCurrency: { name: 'Test XRP', symbol: 'XRP', decimals: 6 }
    }
  ],
  stellar: [
    {
      chain: 'stellar',
      networkType: 'mainnet',
      rpcUrl: 'https://horizon.stellar.org',
      explorerUrl: 'https://stellarchain.io',
      chainId: 'stellar-mainnet',
      nativeCurrency: { name: 'Stellar Lumens', symbol: 'XLM', decimals: 7 }
    },
    {
      chain: 'stellar',
      networkType: 'testnet',
      rpcUrl: 'https://horizon-testnet.stellar.org',
      explorerUrl: 'https://stellarchain.io/testnet',
      chainId: 'stellar-testnet',
      nativeCurrency: { name: 'Test Lumens', symbol: 'XLM', decimals: 7 }
    }
  ],
  sui: [
    {
      chain: 'sui',
      networkType: 'mainnet',
      rpcUrl: 'https://fullnode.mainnet.sui.io:443',
      explorerUrl: 'https://explorer.sui.io',
      chainId: 'sui-mainnet',
      nativeCurrency: { name: 'Sui', symbol: 'SUI', decimals: 9 }
    },
    {
      chain: 'sui',
      networkType: 'testnet',
      rpcUrl: 'https://fullnode.testnet.sui.io:443',
      explorerUrl: 'https://explorer.sui.io/testnet',
      chainId: 'sui-testnet',
      nativeCurrency: { name: 'Sui', symbol: 'SUI', decimals: 9 }
    }
  ],
  aptos: [
    {
      chain: 'aptos',
      networkType: 'mainnet',
      rpcUrl: 'https://fullnode.mainnet.aptoslabs.com/v1',
      explorerUrl: 'https://explorer.aptoslabs.com',
      chainId: 'aptos-mainnet',
      nativeCurrency: { name: 'Aptos', symbol: 'APT', decimals: 8 }
    },
    {
      chain: 'aptos',
      networkType: 'testnet',
      rpcUrl: 'https://fullnode.testnet.aptoslabs.com/v1',
      explorerUrl: 'https://explorer.aptoslabs.com/testnet',
      chainId: 'aptos-testnet',
      nativeCurrency: { name: 'Aptos', symbol: 'APT', decimals: 8 }
    }
  ]
};

/**
 * Factory class for creating blockchain adapter instances
 */
export class BlockchainFactory {
  private static adapters = new Map<string, IBlockchainAdapter>();
  private static configs = new Map<string, ChainConfig>();

  /**
   * Register a blockchain configuration
   */
  static registerConfig(config: ChainConfig): void {
    const key = `${config.chain}-${config.networkType}`;
    this.configs.set(key, config);
  }

  /**
   * Create or get an existing blockchain adapter
   */
  static async createAdapter(
    chain: SupportedChain, 
    networkType: NetworkType = 'mainnet',
    customConfig?: Partial<ChainConfig>
  ): Promise<IBlockchainAdapter> {
    const key = `${chain}-${networkType}`;
    
    // Return existing adapter if available
    if (this.adapters.has(key)) {
      return this.adapters.get(key)!;
    }

    // Get configuration
    const config = this.getConfig(chain, networkType, customConfig);
    
    // Create adapter based on chain type
    let adapter: IBlockchainAdapter;
    
    switch (chain) {
      case 'ethereum':
        adapter = new EthereumAdapter(networkType);
        break;
        
      case 'polygon':
        adapter = new PolygonAdapter(networkType);
        break;
        
      case 'arbitrum':
        adapter = new ArbitrumAdapter(networkType);
        break;
        
      case 'optimism':
        adapter = new OptimismAdapter(networkType);
        break;
        
      case 'base':
        adapter = new BaseAdapter(networkType);
        break;
        
      case 'avalanche':
        adapter = new AvalancheAdapter(networkType);
        break;
        
      case 'bitcoin':
        adapter = new BitcoinAdapter(networkType);
        break;
        
      case 'solana':
        adapter = new SolanaAdapter(networkType);
        break;
        
      case 'near':
        throw new Error('NEAR adapter not yet implemented - coming in Phase 3');
        // adapter = new NEARAdapter(config);
        break;
        
      case 'ripple':
        throw new Error('Ripple adapter not yet implemented - coming in Phase 3');
        // adapter = new RippleAdapter(config);
        break;
        
      case 'stellar':
        throw new Error('Stellar adapter not yet implemented - coming in Phase 4');
        // adapter = new StellarAdapter(config);
        break;
        
      case 'sui':
        throw new Error('Sui adapter not yet implemented - coming in Phase 4');
        // adapter = new SuiAdapter(config);
        break;
        
      case 'aptos':
        throw new Error('Aptos adapter not yet implemented - coming in Phase 4');
        // adapter = new AptosAdapter(config);
        break;
        
      default:
        throw new Error(`Unsupported blockchain: ${chain}`);
    }

    // Initialize the adapter
    await adapter.connect({
      rpcUrl: config.rpcUrl,
      networkId: config.chainId,
      apiKey: config.apiKey
    });

    // Cache the adapter
    this.adapters.set(key, adapter);
    
    return adapter;
  }

  /**
   * Get configuration for a specific chain and network
   */
  private static getConfig(
    chain: SupportedChain, 
    networkType: NetworkType,
    customConfig?: Partial<ChainConfig>
  ): ChainConfig {
    const key = `${chain}-${networkType}`;
    
    // Check for registered custom config first
    if (this.configs.has(key)) {
      return { ...this.configs.get(key)!, ...customConfig };
    }

    // Try to get RPC URL from environment-driven RPC manager
    const rpcUrl = rpcManager.getRPCUrl(chain, networkType);
    const rpcConfig = rpcManager.getProviderConfig(chain, networkType);
    
    if (rpcUrl && rpcConfig) {
      // Create config from RPC manager
      const envConfig: ChainConfig = {
        chain,
        networkType,
        rpcUrl,
        explorerUrl: this.getExplorerUrl(chain, networkType),
        chainId: this.getChainId(chain, networkType),
        nativeCurrency: this.getNativeCurrency(chain),
        apiKey: rpcConfig.apiKey
      };
      
      return { ...envConfig, ...customConfig };
    }

    // Fallback to default configuration
    const defaultConfigs = DEFAULT_CHAIN_CONFIGS[chain];
    const defaultConfig = defaultConfigs?.find(c => c.networkType === networkType);
    
    if (!defaultConfig) {
      throw new Error(`No configuration found for ${chain} ${networkType}. Please check your .env file for VITE_${chain.toUpperCase()}_RPC_URL`);
    }

    return { ...defaultConfig, ...customConfig };
  }

  /**
   * Get explorer URL for a chain and network
   */
  static getExplorerUrl(chain: SupportedChain, networkType: NetworkType): string {
    const explorers: Record<SupportedChain, Record<NetworkType, string>> = {
      ethereum: {
        mainnet: 'https://etherscan.io',
        testnet: 'https://sepolia.etherscan.io',
        devnet: 'https://sepolia.etherscan.io',
        regtest: 'https://sepolia.etherscan.io'
      },
      polygon: {
        mainnet: 'https://polygonscan.com',
        testnet: 'https://amoy.polygonscan.com',
        devnet: 'https://amoy.polygonscan.com',
        regtest: 'https://amoy.polygonscan.com'
      },
      arbitrum: {
        mainnet: 'https://arbiscan.io',
        testnet: 'https://sepolia.arbiscan.io',
        devnet: 'https://sepolia.arbiscan.io',
        regtest: 'https://sepolia.arbiscan.io'
      },
      optimism: {
        mainnet: 'https://optimistic.etherscan.io',
        testnet: 'https://sepolia-optimism.etherscan.io',
        devnet: 'https://sepolia-optimism.etherscan.io',
        regtest: 'https://sepolia-optimism.etherscan.io'
      },
      base: {
        mainnet: 'https://basescan.org',
        testnet: 'https://sepolia.basescan.org',
        devnet: 'https://sepolia.basescan.org',
        regtest: 'https://sepolia.basescan.org'
      },
      avalanche: {
        mainnet: 'https://snowtrace.io',
        testnet: 'https://testnet.snowtrace.io',
        devnet: 'https://testnet.snowtrace.io',
        regtest: 'https://testnet.snowtrace.io'
      },
      bitcoin: {
        mainnet: 'https://blockstream.info',
        testnet: 'https://blockstream.info/testnet',
        devnet: 'https://blockstream.info/testnet',
        regtest: 'https://blockstream.info/testnet'
      },
      solana: {
        mainnet: 'https://explorer.solana.com',
        testnet: 'https://explorer.solana.com',
        devnet: 'https://explorer.solana.com',
        regtest: 'https://explorer.solana.com'
      },
      near: {
        mainnet: 'https://explorer.near.org',
        testnet: 'https://explorer.testnet.near.org',
        devnet: 'https://explorer.testnet.near.org',
        regtest: 'https://explorer.testnet.near.org'
      },
      ripple: {
        mainnet: 'https://livenet.xrpl.org',
        testnet: 'https://testnet.xrpl.org',
        devnet: 'https://testnet.xrpl.org',
        regtest: 'https://testnet.xrpl.org'
      },
      stellar: {
        mainnet: 'https://stellarchain.io',
        testnet: 'https://stellarchain.io/testnet',
        devnet: 'https://stellarchain.io/testnet',
        regtest: 'https://stellarchain.io/testnet'
      },
      sui: {
        mainnet: 'https://explorer.sui.io',
        testnet: 'https://explorer.sui.io/testnet',
        devnet: 'https://explorer.sui.io/testnet',
        regtest: 'https://explorer.sui.io/testnet'
      },
      aptos: {
        mainnet: 'https://explorer.aptoslabs.com',
        testnet: 'https://explorer.aptoslabs.com/testnet',
        devnet: 'https://explorer.aptoslabs.com/testnet',
        regtest: 'https://explorer.aptoslabs.com/testnet'
      }
    };

    return explorers[chain]?.[networkType] || '';
  }

  /**
   * Get chain ID for a chain and network
   */
  static getChainId(chain: SupportedChain, networkType: NetworkType): string {
    const chainIds: Record<SupportedChain, Record<NetworkType, string>> = {
      ethereum: { mainnet: '1', testnet: '11155111', devnet: '11155111', regtest: '11155111' },
      polygon: { mainnet: '137', testnet: '80002', devnet: '80002', regtest: '80002' },
      arbitrum: { mainnet: '42161', testnet: '421614', devnet: '421614', regtest: '421614' },
      optimism: { mainnet: '10', testnet: '11155420', devnet: '11155420', regtest: '11155420' },
      base: { mainnet: '8453', testnet: '84532', devnet: '84532', regtest: '84532' },
      avalanche: { mainnet: '43114', testnet: '43113', devnet: '43113', regtest: '43113' },
      bitcoin: { mainnet: 'bitcoin-mainnet', testnet: 'bitcoin-testnet', devnet: 'bitcoin-testnet', regtest: 'bitcoin-regtest' },
      solana: { mainnet: 'solana-mainnet', testnet: 'solana-testnet', devnet: 'solana-devnet', regtest: 'solana-devnet' },
      near: { mainnet: 'near-mainnet', testnet: 'near-testnet', devnet: 'near-testnet', regtest: 'near-testnet' },
      ripple: { mainnet: 'ripple-mainnet', testnet: 'ripple-testnet', devnet: 'ripple-testnet', regtest: 'ripple-testnet' },
      stellar: { mainnet: 'stellar-mainnet', testnet: 'stellar-testnet', devnet: 'stellar-testnet', regtest: 'stellar-testnet' },
      sui: { mainnet: 'sui-mainnet', testnet: 'sui-testnet', devnet: 'sui-testnet', regtest: 'sui-testnet' },
      aptos: { mainnet: 'aptos-mainnet', testnet: 'aptos-testnet', devnet: 'aptos-testnet', regtest: 'aptos-testnet' }
    };

    return chainIds[chain]?.[networkType] || `${chain}-${networkType}`;
  }

  /**
   * Get native currency for a chain
   */
  private static getNativeCurrency(chain: SupportedChain): { name: string; symbol: string; decimals: number } {
    const currencies: Record<SupportedChain, { name: string; symbol: string; decimals: number }> = {
      ethereum: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      polygon: { name: 'Polygon', symbol: 'MATIC', decimals: 18 },
      arbitrum: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      optimism: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      base: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      avalanche: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
      bitcoin: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
      solana: { name: 'Solana', symbol: 'SOL', decimals: 9 },
      near: { name: 'NEAR', symbol: 'NEAR', decimals: 24 },
      ripple: { name: 'XRP', symbol: 'XRP', decimals: 6 },
      stellar: { name: 'Stellar Lumens', symbol: 'XLM', decimals: 7 },
      sui: { name: 'Sui', symbol: 'SUI', decimals: 9 },
      aptos: { name: 'Aptos', symbol: 'APT', decimals: 8 }
    };

    return currencies[chain];
  }

  /**
   * Get all supported chains
   */
  static getSupportedChains(): SupportedChain[] {
    return Object.keys(DEFAULT_CHAIN_CONFIGS) as SupportedChain[];
  }

  /**
   * Get available networks for a chain
   */
  static getAvailableNetworks(chain: SupportedChain): NetworkType[] {
    return DEFAULT_CHAIN_CONFIGS[chain]?.map(config => config.networkType) || [];
  }

  /**
   * Disconnect and clean up all adapters
   */
  static async disconnectAll(): Promise<void> {
    for (const adapter of this.adapters.values()) {
      await adapter.disconnect();
    }
    this.adapters.clear();
  }

  /**
   * Get an existing adapter without creating a new one
   */
  static getAdapter(chain: SupportedChain, networkType: NetworkType = 'mainnet'): IBlockchainAdapter | null {
    const key = `${chain}-${networkType}`;
    return this.adapters.get(key) || null;
  }
}
