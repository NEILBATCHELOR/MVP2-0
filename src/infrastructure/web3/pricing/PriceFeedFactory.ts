import { PriceFeedAdapter } from './types';
import { CoinGeckoAdapter } from './CoinGeckoAdapter';

/**
 * Supported price feed providers
 */
export type PriceFeedProvider = 'coingecko' | 'chainlink' | 'uniswap';

/**
 * Configuration options for price feed factory
 */
export interface PriceFeedFactoryConfig {
  coingeckoApiKey?: string;
  chainlinkRpcUrl?: string;
  uniswapSubgraphUrl?: string;
}

/**
 * Factory for creating price feed adapters
 */
export class PriceFeedFactory {
  private static instance: PriceFeedFactory;
  private adapters: Map<PriceFeedProvider, PriceFeedAdapter> = new Map();
  private config: PriceFeedFactoryConfig = {};
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}
  
  /**
   * Get singleton instance of the factory
   */
  public static getInstance(): PriceFeedFactory {
    if (!PriceFeedFactory.instance) {
      PriceFeedFactory.instance = new PriceFeedFactory();
    }
    return PriceFeedFactory.instance;
  }
  
  /**
   * Configure the factory with provider-specific settings
   * @param config Configuration object for different providers
   */
  public configure(config: PriceFeedFactoryConfig): void {
    this.config = { ...this.config, ...config };
    
    // Clear adapters to force recreation with new config
    this.clearCache();
  }
  
  /**
   * Create or get a price feed adapter for the specified provider
   * @param provider Price feed provider to use
   * @returns Price feed adapter instance
   */
  public getAdapter(provider: PriceFeedProvider): PriceFeedAdapter {
    // Return cached adapter if available
    if (this.adapters.has(provider)) {
      return this.adapters.get(provider)!;
    }
    
    // Create new adapter based on provider
    let adapter: PriceFeedAdapter;
    
    switch (provider) {
      case 'coingecko':
        adapter = new CoinGeckoAdapter(this.config.coingeckoApiKey);
        break;
        
      case 'chainlink':
        // TODO: Implement Chainlink adapter when needed
        throw new Error('Chainlink adapter not implemented yet');
        
      case 'uniswap':
        // TODO: Implement Uniswap adapter when needed
        throw new Error('Uniswap adapter not implemented yet');
        
      default:
        // Default to CoinGecko if provider not recognized
        adapter = new CoinGeckoAdapter();
    }
    
    // Cache the adapter for future use
    this.adapters.set(provider, adapter);
    return adapter;
  }
  
  /**
   * Get all available adapter providers
   * @returns Array of available provider names
   */
  public getAvailableProviders(): PriceFeedProvider[] {
    return ['coingecko'];
  }
  
  /**
   * Clear all cached adapters
   */
  public clearCache(): void {
    this.adapters.clear();
  }
}