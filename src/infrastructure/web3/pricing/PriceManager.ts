/**
 * PriceManager.ts
 * 
 * Core manager class for handling all price-related functionality.
 * Implements the factory pattern to create appropriate price feed adapters
 * and provides a unified interface for price data across the application.
 */

import { 
  PriceData, 
  TokenMetadata, 
  PriceConversion, 
  HistoricalPriceData,
  PriceFeedAdapter,
  CacheOptions,
  MarketOverview,
  TokenPrice,
  PriceDataPoint,
  PriceInterval
} from './types';
// Use the adapters - we'll ensure they implement the correct interface
import { CoinGeckoAdapter } from './CoinGeckoAdapter';
import { MemoryPriceCache } from './cache/MemoryPriceCache';

/**
 * Extended PriceFeedAdapter interface with legacy methods
 */
interface LegacyPriceFeedAdapter extends PriceFeedAdapter {
  getPrice?(symbol: string, currency: PriceConversion): Promise<PriceData>;
  getPrices?(symbols: string[], currency: PriceConversion): Promise<Record<string, PriceData>>;
  getHistoricalData?(symbol: string, days: number, interval?: string): Promise<HistoricalPriceData>;
}

/**
 * Legacy adapter wrapper for the new implementation
 */
class LegacyAdapterWrapper implements LegacyPriceFeedAdapter {
  constructor(private adapter: PriceFeedAdapter) {}
  
  getName(): string {
    return this.adapter.getName();
  }
  
  supportsCurrency(currency: string): boolean {
    return this.adapter.supportsCurrency(currency);
  }
  
  getSupportedCurrencies(): string[] {
    return this.adapter.getSupportedCurrencies();
  }
  
  async getCurrentPrice(tokenSymbol: string, currency?: string): Promise<TokenPrice> {
    return this.adapter.getCurrentPrice(tokenSymbol, currency);
  }
  
  async getHistoricalPrices(
    tokenSymbol: string,
    currency?: string,
    days?: number,
    interval?: PriceInterval
  ): Promise<PriceDataPoint[]> {
    return this.adapter.getHistoricalPrices(tokenSymbol, currency, days, interval);
  }
  
  async getTokenMetadata(tokenSymbol: string): Promise<TokenMetadata> {
    return this.adapter.getTokenMetadata(tokenSymbol);
  }
  
  // Legacy methods to maintain backward compatibility
  async getPrice(symbol: string, currency: PriceConversion = PriceConversion.USD): Promise<PriceData> {
    // Try to use adapter's native getPrice if available
    if ('getPrice' in this.adapter && typeof (this.adapter as any).getPrice === 'function') {
      const priceResult = await (this.adapter as any).getPrice(symbol, currency);
      
      // If the result is a number, convert to PriceData format
      if (typeof priceResult === 'number') {
        return {
          symbol,
          price: priceResult,
          currency,
          timestamp: Date.now(),
        };
      }
      
      // If it's already PriceData, return it
      if (priceResult !== null) {
        return priceResult as PriceData;
      }
    }
    
    // Otherwise use the new interface method and convert
    const tokenPrice = await this.adapter.getCurrentPrice(
      symbol, 
      currency.toString().toLowerCase()
    );
    
    return {
      symbol: tokenPrice.symbol,
      price: tokenPrice.price,
      currency,
      timestamp: new Date(tokenPrice.lastUpdated).getTime(),
      change: {
        '24h': tokenPrice.priceChange24h || undefined
      },
      marketCap: tokenPrice.marketCap || undefined,
      volume24h: tokenPrice.volume24h || undefined
    };
  }
  
  async getPrices(symbols: string[], currency: PriceConversion = PriceConversion.USD): Promise<Record<string, PriceData>> {
    // If adapter has native getPrices method, try to use it
    if ('getPrices' in this.adapter && typeof (this.adapter as any).getPrices === 'function') {
      const prices = await (this.adapter as any).getPrices(symbols, currency);
      
      // Check if it returned a Map (old format)
      if (prices instanceof Map) {
        const result: Record<string, PriceData> = {};
        prices.forEach((price, symbol) => {
          if (price !== null) {
            result[symbol] = {
              symbol,
              price,
              currency,
              timestamp: Date.now()
            };
          }
        });
        return result;
      }
      
      // Check if it returned the expected format
      return prices;
    }
    
    // Otherwise fetch prices individually using the new interface
    const result: Record<string, PriceData> = {};
    await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const tokenPrice = await this.adapter.getCurrentPrice(
            symbol, 
            currency.toString().toLowerCase()
          );
          
          result[symbol] = {
            symbol: tokenPrice.symbol,
            price: tokenPrice.price,
            currency,
            timestamp: new Date(tokenPrice.lastUpdated).getTime(),
            change: {
              '24h': tokenPrice.priceChange24h || undefined
            },
            marketCap: tokenPrice.marketCap || undefined,
            volume24h: tokenPrice.volume24h || undefined
          };
        } catch (error) {
          console.error(`Error fetching price for ${symbol}:`, error);
        }
      })
    );
    
    return result;
  }
  
  async getHistoricalData(
    symbol: string, 
    days: number = 30, 
    interval: string = 'daily'
  ): Promise<HistoricalPriceData> {
    // If adapter has native getHistoricalData method, use it
    if ('getHistoricalData' in this.adapter && typeof (this.adapter as any).getHistoricalData === 'function') {
      return (this.adapter as any).getHistoricalData(symbol, days, interval);
    }
    
    // Map interval string to enum
    let priceInterval: PriceInterval;
    switch (interval) {
      case 'hourly':
        priceInterval = PriceInterval.HOUR;
        break;
      case 'minutely':
        priceInterval = PriceInterval.MINUTE;
        break;
      default:
        priceInterval = PriceInterval.DAY;
    }
    
    // Use the new interface method and convert
    const dataPoints = await this.adapter.getHistoricalPrices(
      symbol,
      'usd',
      days,
      priceInterval
    );
    
    // Convert to legacy format
    return {
      symbol,
      currency: PriceConversion.USD,
      interval,
      days,
      dataPoints: dataPoints.map(point => ({
        timestamp: new Date(point.timestamp).getTime(),
        price: point.price,
        marketCap: point.marketCap,
        volume: point.volume
      }))
    };
  }
}

export class PriceManager {
  private adapters: Map<string, LegacyPriceFeedAdapter> = new Map();
  private defaultAdapter: string = 'coingecko';
  private cache: MemoryPriceCache;
  private symbolToAdapterMap: Map<string, string> = new Map();
  
  constructor(cacheOptions?: CacheOptions) {
    // Initialize cache with default or provided options
    this.cache = new MemoryPriceCache(cacheOptions || { 
      ttl: 5 * 60 * 1000, // 5 minutes default cache
      refreshThreshold: 4 * 60 * 1000, // Refresh after 4 minutes
      maxSize: 1000
    });
    
    // Register default adapter
    this.registerAdapter('coingecko', new LegacyAdapterWrapper(new CoinGeckoAdapter()));
  }

  /**
   * Register a new price feed adapter
   */
  public registerAdapter(name: string, adapter: LegacyPriceFeedAdapter): void {
    this.adapters.set(name.toLowerCase(), adapter);
  }

  /**
   * Set the default adapter to use when no specific adapter is requested
   */
  public setDefaultAdapter(name: string): void {
    if (!this.adapters.has(name.toLowerCase())) {
      throw new Error(`Adapter ${name} not registered`);
    }
    this.defaultAdapter = name.toLowerCase();
  }

  /**
   * Map a token symbol to a specific adapter
   */
  public mapSymbolToAdapter(symbol: string, adapterName: string): void {
    if (!this.adapters.has(adapterName.toLowerCase())) {
      throw new Error(`Adapter ${adapterName} not registered`);
    }
    this.symbolToAdapterMap.set(symbol.toUpperCase(), adapterName.toLowerCase());
  }

  /**
   * Get the appropriate adapter for a given symbol
   */
  private getAdapterForSymbol(symbol: string): LegacyPriceFeedAdapter {
    const adapterName = this.symbolToAdapterMap.get(symbol.toUpperCase()) || this.defaultAdapter;
    const adapter = this.adapters.get(adapterName);
    
    if (!adapter) {
      throw new Error(`No adapter available for ${symbol}`);
    }
    
    return adapter;
  }

  /**
   * Get the current price for a token
   */
  public async getPrice(symbol: string, currency: PriceConversion = PriceConversion.USD): Promise<PriceData> {
    // Check cache first
    const cachedData = this.cache.get(symbol, currency);
    if (cachedData) {
      return cachedData;
    }

    // Fetch from appropriate adapter
    const adapter = this.getAdapterForSymbol(symbol);
    
    if (!adapter.getPrice) {
      throw new Error(`Adapter for ${symbol} does not support getPrice method`);
    }
    
    // Get price data
    const priceData = await adapter.getPrice(symbol, currency);
    
    // Cache the result
    this.cache.set(symbol, priceData, currency);
    
    return priceData;
  }

  /**
   * Get prices for multiple tokens
   */
  public async getPrices(symbols: string[], currency: PriceConversion = PriceConversion.USD): Promise<Record<string, PriceData>> {
    const result: Record<string, PriceData> = {};
    const missingSymbols: Record<string, string[]> = {};
    
    // Check cache first for each symbol
    for (const symbol of symbols) {
      const cachedData = this.cache.get(symbol, currency);
      if (cachedData) {
        result[symbol] = cachedData;
      } else {
        // Group symbols by their adapters for batch fetching
        const adapterName = this.symbolToAdapterMap.get(symbol.toUpperCase()) || this.defaultAdapter;
        if (!missingSymbols[adapterName]) {
          missingSymbols[adapterName] = [];
        }
        missingSymbols[adapterName].push(symbol);
      }
    }
    
    // Fetch missing symbols from appropriate adapters
    const fetchPromises = Object.entries(missingSymbols).map(async ([adapterName, symbolsToFetch]) => {
      const adapter = this.adapters.get(adapterName);
      if (!adapter || !adapter.getPrices) {
        throw new Error(`Adapter ${adapterName} not found or doesn't support getPrices`);
      }
      
      const priceData = await adapter.getPrices(symbolsToFetch, currency);
      
      // Cache and add to results
      Object.entries(priceData).forEach(([symbol, data]) => {
        this.cache.set(symbol, data, currency);
        result[symbol] = data;
      });
    });
    
    await Promise.all(fetchPromises);
    return result;
  }

  /**
   * Get historical price data for a token
   */
  public async getHistoricalData(
    symbol: string, 
    days: number,
    interval?: string
  ): Promise<HistoricalPriceData> {
    const adapter = this.getAdapterForSymbol(symbol);
    
    if (!adapter.getHistoricalData) {
      throw new Error(`Adapter for ${symbol} does not support getHistoricalData method`);
    }
    
    return adapter.getHistoricalData(symbol, days, interval);
  }

  /**
   * Get token metadata
   */
  public async getTokenMetadata(symbol: string): Promise<TokenMetadata> {
    const adapter = this.getAdapterForSymbol(symbol);
    return adapter.getTokenMetadata(symbol);
  }

  /**
   * Get overall market data
   */
  public async getMarketOverview(): Promise<MarketOverview> {
    // Default to CoinGecko for market overview as it has comprehensive data
    const adapter = this.adapters.get('coingecko') || this.getAdapterForSymbol('BTC');
    
    // This would be implemented in the CoinGeckoAdapter
    // For now returning mock data
    return {
      btcDominance: 45.2,
      totalMarketCap: 1253000000000,
      totalVolume24h: 48700000000,
      topGainers: [
        { symbol: 'ETH', name: 'Ethereum', price: 3200, changePercent: 5.4 },
        { symbol: 'SOL', name: 'Solana', price: 120, changePercent: 4.2 }
      ],
      topLosers: [
        { symbol: 'AVAX', name: 'Avalanche', price: 28, changePercent: -3.1 },
        { symbol: 'LINK', name: 'Chainlink', price: 14, changePercent: -2.3 }
      ]
    };
  }

  /**
   * Clear all cached price data
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear cached data for a specific symbol
   */
  public clearCacheForSymbol(symbol: string): void {
    this.cache.clearSymbol(symbol);
  }

  /**
   * Get list of supported tokens from all adapters
   */
  public async getSupportedTokens(): Promise<TokenMetadata[]> {
    // This would typically fetch from all adapters and combine results
    // For MVP, we're keeping it simple
    const defaultAdapter = this.adapters.get(this.defaultAdapter);
    if (!defaultAdapter) {
      return [];
    }
    
    // Mock implementation - in reality would fetch from adapter
    return [
      { 
        symbol: 'BTC', 
        name: 'Bitcoin', 
        lastUpdated: new Date().toISOString() 
      },
      { 
        symbol: 'ETH', 
        name: 'Ethereum', 
        lastUpdated: new Date().toISOString() 
      },
      { 
        symbol: 'SOL', 
        name: 'Solana', 
        lastUpdated: new Date().toISOString() 
      },
      { 
        symbol: 'XRP', 
        name: 'Ripple', 
        lastUpdated: new Date().toISOString() 
      },
      { 
        symbol: 'NEAR', 
        name: 'NEAR Protocol', 
        lastUpdated: new Date().toISOString() 
      }
    ];
  }
}

// Export a singleton instance for easy use
export const priceManager = new PriceManager();

// Also export the class for testing or custom instances
export default PriceManager;