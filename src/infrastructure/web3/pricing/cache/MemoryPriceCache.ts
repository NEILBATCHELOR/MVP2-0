import { PriceData, PriceConversion, CacheOptions } from '../types';

/**
 * In-memory cache for price data
 */
export class MemoryPriceCache {
  private cache: Map<string, { 
    data: PriceData; 
    timestamp: number; 
    expiry: number;
  }> = new Map();
  
  private options: Required<CacheOptions>;
  
  constructor(options: CacheOptions) {
    this.options = {
      ttl: options.ttl,
      refreshThreshold: options.refreshThreshold || options.ttl * 0.8,
      maxSize: options.maxSize || 1000
    };
  }
  
  /**
   * Generate a cache key from symbol and currency
   */
  private getCacheKey(symbol: string, currency: PriceConversion): string {
    return `${symbol.toUpperCase()}:${currency}`;
  }
  
  /**
   * Set price data in the cache
   */
  public set(symbol: string, data: PriceData, currency: PriceConversion): void {
    const key = this.getCacheKey(symbol, currency);
    const now = Date.now();
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiry: now + this.options.ttl
    });
    
    // Manage cache size - remove oldest entries if we exceed maxSize
    if (this.cache.size > this.options.maxSize) {
      const entries = Array.from(this.cache.entries());
      const sortedByTimestamp = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = sortedByTimestamp.slice(0, Math.floor(this.options.maxSize * 0.2));
      
      for (const [key] of toRemove) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Get price data from the cache if valid
   */
  public get(symbol: string, currency: PriceConversion): PriceData | null {
    const key = this.getCacheKey(symbol, currency);
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    const now = Date.now();
    
    // Return null if expired
    if (now > cached.expiry) {
      return null;
    }
    
    return cached.data;
  }
  
  /**
   * Check if data should be refreshed (older than threshold but not expired)
   */
  public shouldRefresh(symbol: string, currency: PriceConversion): boolean {
    const key = this.getCacheKey(symbol, currency);
    const cached = this.cache.get(key);
    
    if (!cached) {
      return true;
    }
    
    const now = Date.now();
    return now > (cached.timestamp + this.options.refreshThreshold) && now <= cached.expiry;
  }
  
  /**
   * Clear all cached data
   */
  public clear(): void {
    this.cache.clear();
  }
  
  /**
   * Clear cached data for a specific symbol
   */
  public clearSymbol(symbol: string): void {
    const prefix = `${symbol.toUpperCase()}:`;
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Get number of items in cache
   */
  public get size(): number {
    return this.cache.size;
  }
}