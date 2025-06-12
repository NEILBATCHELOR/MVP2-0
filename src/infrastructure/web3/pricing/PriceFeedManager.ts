import {
  PriceFeedAdapter,
  TokenPrice,
  PriceDataPoint,
  TokenMetadata,
  PriceInterval,
  PriceFeedError,
  PriceFeedErrorType
} from './types';

/**
 * Configuration options for the PriceFeedManager
 */
export interface PriceFeedManagerConfig {
  /** Default currency to use for price queries */
  defaultCurrency?: string;
  /** Cache TTL in milliseconds */
  cacheTtlMs?: number;
  /** Default price feed adapter to use */
  defaultAdapter?: PriceFeedAdapter;
  /** Logging level: none, error, warn, info, debug */
  logLevel?: 'none' | 'error' | 'warn' | 'info' | 'debug';
}

/**
 * Manager for price feed adapters with caching and fallback support
 */
export class PriceFeedManager {
  private adapters: PriceFeedAdapter[] = [];
  private defaultCurrency: string;
  private cacheTtlMs: number;
  private priceCache: Map<string, { data: TokenPrice, timestamp: number }> = new Map();
  private metadataCache: Map<string, { data: TokenMetadata, timestamp: number }> = new Map();
  private logLevel: 'none' | 'error' | 'warn' | 'info' | 'debug';
  
  constructor(config?: PriceFeedManagerConfig) {
    this.defaultCurrency = config?.defaultCurrency?.toUpperCase() || 'USD';
    this.cacheTtlMs = config?.cacheTtlMs || 60 * 1000; // Default: 1 minute
    this.logLevel = config?.logLevel || 'error';
    
    if (config?.defaultAdapter) {
      this.adapters.push(config.defaultAdapter);
    }
  }
  
  /**
   * Register a price feed adapter
   */
  registerAdapter(adapter: PriceFeedAdapter): void {
    if (!this.adapters.some(a => a.getName() === adapter.getName())) {
      this.adapters.push(adapter);
      this.log('info', `Registered price feed adapter: ${adapter.getName()}`);
    }
  }
  
  /**
   * Set the default currency for price queries
   */
  setDefaultCurrency(currency: string): void {
    this.defaultCurrency = currency.toUpperCase();
  }
  
  /**
   * Get current price for a token
   */
  async getCurrentPrice(
    tokenSymbol: string, 
    currency: string = this.defaultCurrency
  ): Promise<TokenPrice> {
    this.validateHasAdapters();
    currency = currency.toUpperCase();
    tokenSymbol = tokenSymbol.toUpperCase();
    
    // Check cache first
    const cacheKey = `${tokenSymbol}:${currency}:price`;
    const cached = this.priceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      this.log('debug', `Using cached price for ${tokenSymbol} in ${currency}`);
      return cached.data;
    }
    
    this.log('debug', `Fetching price for ${tokenSymbol} in ${currency}`);
    
    // Try each adapter until one succeeds
    let lastError: PriceFeedError | null = null;
    
    for (const adapter of this.adapters) {
      if (!adapter.supportsCurrency(currency)) {
        this.log('debug', `Adapter ${adapter.getName()} doesn't support ${currency}, skipping`);
        continue;
      }
      
      try {
        const price = await adapter.getCurrentPrice(tokenSymbol, currency);
        
        // Cache the result
        this.priceCache.set(cacheKey, {
          data: price,
          timestamp: Date.now()
        });
        
        this.log('debug', `Got price for ${tokenSymbol} from ${adapter.getName()}: ${price.price} ${currency}`);
        return price;
      } catch (error) {
        if (error instanceof PriceFeedError) {
          lastError = error;
          this.log('warn', `Failed to get price from ${adapter.getName()}: ${error.message}`);
        } else {
          this.log('error', `Unexpected error from ${adapter.getName()}: ${String(error)}`);
        }
        // Continue to next adapter
      }
    }
    
    if (lastError) {
      throw lastError;
    }
    
    throw new PriceFeedError(
      PriceFeedErrorType.UNKNOWN,
      `Failed to get price for ${tokenSymbol} in ${currency} from any adapter`
    );
  }
  
  /**
   * Get historical price data for a token
   */
  async getHistoricalPrices(
    tokenSymbol: string,
    currency: string = this.defaultCurrency,
    days: number = 7,
    interval: PriceInterval = PriceInterval.DAY
  ): Promise<PriceDataPoint[]> {
    this.validateHasAdapters();
    currency = currency.toUpperCase();
    tokenSymbol = tokenSymbol.toUpperCase();
    
    this.log('debug', `Fetching historical prices for ${tokenSymbol} in ${currency}, ${days} days, interval: ${interval}`);
    
    // Try each adapter until one succeeds
    let lastError: PriceFeedError | null = null;
    
    for (const adapter of this.adapters) {
      if (!adapter.supportsCurrency(currency)) {
        this.log('debug', `Adapter ${adapter.getName()} doesn't support ${currency}, skipping`);
        continue;
      }
      
      try {
        const prices = await adapter.getHistoricalPrices(tokenSymbol, currency, days, interval);
        this.log('debug', `Got ${prices.length} historical price points for ${tokenSymbol} from ${adapter.getName()}`);
        return prices;
      } catch (error) {
        if (error instanceof PriceFeedError) {
          lastError = error;
          this.log('warn', `Failed to get historical prices from ${adapter.getName()}: ${error.message}`);
        } else {
          this.log('error', `Unexpected error from ${adapter.getName()}: ${String(error)}`);
        }
        // Continue to next adapter
      }
    }
    
    if (lastError) {
      throw lastError;
    }
    
    throw new PriceFeedError(
      PriceFeedErrorType.UNKNOWN,
      `Failed to get historical prices for ${tokenSymbol} in ${currency} from any adapter`
    );
  }
  
  /**
   * Get token metadata
   */
  async getTokenMetadata(tokenSymbol: string): Promise<TokenMetadata> {
    this.validateHasAdapters();
    tokenSymbol = tokenSymbol.toUpperCase();
    
    // Check cache first
    const cacheKey = `${tokenSymbol}:metadata`;
    const cached = this.metadataCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      this.log('debug', `Using cached metadata for ${tokenSymbol}`);
      return cached.data;
    }
    
    this.log('debug', `Fetching metadata for ${tokenSymbol}`);
    
    // Try each adapter until one succeeds
    let lastError: PriceFeedError | null = null;
    
    for (const adapter of this.adapters) {
      try {
        const metadata = await adapter.getTokenMetadata(tokenSymbol);
        
        // Cache the result
        this.metadataCache.set(cacheKey, {
          data: metadata,
          timestamp: Date.now()
        });
        
        this.log('debug', `Got metadata for ${tokenSymbol} from ${adapter.getName()}`);
        return metadata;
      } catch (error) {
        if (error instanceof PriceFeedError) {
          lastError = error;
          this.log('warn', `Failed to get metadata from ${adapter.getName()}: ${error.message}`);
        } else {
          this.log('error', `Unexpected error from ${adapter.getName()}: ${String(error)}`);
        }
        // Continue to next adapter
      }
    }
    
    if (lastError) {
      throw lastError;
    }
    
    throw new PriceFeedError(
      PriceFeedErrorType.UNKNOWN,
      `Failed to get metadata for ${tokenSymbol} from any adapter`
    );
  }
  
  /**
   * Batch get prices for multiple tokens
   */
  async getMultiplePrices(
    tokenSymbols: string[],
    currency: string = this.defaultCurrency
  ): Promise<Record<string, TokenPrice>> {
    this.validateHasAdapters();
    currency = currency.toUpperCase();
    
    // Normalize symbols
    const normalizedSymbols = tokenSymbols.map(symbol => symbol.toUpperCase());
    
    this.log('debug', `Fetching prices for ${normalizedSymbols.length} tokens in ${currency}`);
    
    // Check cache for all tokens
    const result: Record<string, TokenPrice> = {};
    const uncachedSymbols: string[] = [];
    
    for (const symbol of normalizedSymbols) {
      const cacheKey = `${symbol}:${currency}:price`;
      const cached = this.priceCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
        result[symbol] = cached.data;
      } else {
        uncachedSymbols.push(symbol);
      }
    }
    
    // If all prices were cached, return early
    if (uncachedSymbols.length === 0) {
      return result;
    }
    
    // Try to fetch remaining prices in batches if possible
    for (const adapter of this.adapters) {
      if (!adapter.supportsCurrency(currency)) {
        continue;
      }
      
      const remainingSymbols = [...uncachedSymbols];
      
      try {
        // Try to fetch all remaining tokens at once if the adapter supports it
        for (const symbol of remainingSymbols) {
          try {
            const price = await adapter.getCurrentPrice(symbol, currency);
            result[symbol] = price;
            
            // Cache the result
            const cacheKey = `${symbol}:${currency}:price`;
            this.priceCache.set(cacheKey, {
              data: price,
              timestamp: Date.now()
            });
            
            // Remove from uncached symbols
            const index = uncachedSymbols.indexOf(symbol);
            if (index !== -1) {
              uncachedSymbols.splice(index, 1);
            }
          } catch (error) {
            // If this token fails, continue with others
            this.log('warn', `Failed to get price for ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      } catch (error) {
        // If batch fetch fails, continue with next adapter
        this.log('warn', `Batch price fetch failed with ${adapter.getName()}: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      // If we've fetched all tokens, break
      if (uncachedSymbols.length === 0) {
        break;
      }
    }
    
    return result;
  }
  
  /**
   * Clear the price cache
   */
  clearPriceCache(): void {
    this.priceCache.clear();
    this.log('info', 'Price cache cleared');
  }
  
  /**
   * Clear the metadata cache
   */
  clearMetadataCache(): void {
    this.metadataCache.clear();
    this.log('info', 'Metadata cache cleared');
  }
  
  /**
   * Set cache TTL in milliseconds
   */
  setCacheTtl(ttlMs: number): void {
    this.cacheTtlMs = ttlMs;
    this.log('info', `Cache TTL set to ${ttlMs}ms`);
  }
  
  /**
   * Get registered adapters
   */
  getAdapters(): PriceFeedAdapter[] {
    return [...this.adapters];
  }
  
  /**
   * Validate that we have at least one adapter registered
   */
  private validateHasAdapters(): void {
    if (this.adapters.length === 0) {
      throw new PriceFeedError(
        PriceFeedErrorType.API_ERROR,
        'No price feed adapters registered'
      );
    }
  }
  
  /**
   * Log a message based on log level
   */
  private log(level: 'error' | 'warn' | 'info' | 'debug', message: string): void {
    const levels = {
      none: 0,
      error: 1,
      warn: 2,
      info: 3,
      debug: 4
    };
    
    if (levels[this.logLevel] >= levels[level]) {
      const prefix = `[PriceFeedManager] [${level.toUpperCase()}]`;
      
      switch (level) {
        case 'error':
          console.error(prefix, message);
          break;
        case 'warn':
          console.warn(prefix, message);
          break;
        case 'info':
          console.info(prefix, message);
          break;
        case 'debug':
          console.debug(prefix, message);
          break;
      }
    }
  }
}