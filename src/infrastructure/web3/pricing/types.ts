/**
 * Defines the interface for price feed adapters
 */
export interface PriceFeedAdapter {
  /**
   * Get the name of the price feed adapter
   */
  getName(): string;
  
  /**
   * Check if a currency is supported by this adapter
   */
  supportsCurrency(currency: string): boolean;
  
  /**
   * Get supported currencies for this adapter
   */
  getSupportedCurrencies(): string[];
  
  /**
   * Get current price for a token
   * @param tokenSymbol The token symbol (e.g., "BTC", "ETH")
   * @param currency The currency to get price in (e.g., "USD", "EUR")
   */
  getCurrentPrice(tokenSymbol: string, currency?: string): Promise<TokenPrice>;
  
  /**
   * Get historical price data for a token
   * @param tokenSymbol The token symbol (e.g., "BTC", "ETH")
   * @param currency The currency to get prices in (e.g., "USD", "EUR")
   * @param days Number of days of data to retrieve
   * @param interval The interval between data points
   */
  getHistoricalPrices(
    tokenSymbol: string,
    currency?: string,
    days?: number,
    interval?: PriceInterval
  ): Promise<PriceDataPoint[]>;
  
  /**
   * Get metadata for a token
   * @param tokenSymbol The token symbol (e.g., "BTC", "ETH")
   */
  getTokenMetadata(tokenSymbol: string): Promise<TokenMetadata>;
}

/**
 * Standard currencies for price conversion
 * Used in legacy adapter implementations
 */
export enum PriceConversion {
  USD = 'USD',
  EUR = 'EUR',
  BTC = 'BTC',
  ETH = 'ETH'
}

/**
 * Current price information for a token
 */
export interface TokenPrice {
  symbol: string;
  currency: string;
  price: number;
  marketCap?: number | null;
  volume24h?: number | null;
  priceChange24h?: number | null;
  lastUpdated: string; // ISO timestamp
}

/**
 * Historical price data point
 */
export interface PriceDataPoint {
  timestamp: string; // ISO timestamp
  price: number;
  marketCap?: number;
  volume?: number;
}

/**
 * Token metadata
 */
export interface TokenMetadata {
  symbol: string;
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  explorers?: string[];
  socialLinks?: {
    twitter?: string;
    telegram?: string;
    discord?: string;
    reddit?: string;
  };
  contractAddresses?: Record<string, string>;
  lastUpdated: string; // ISO timestamp
}

/**
 * Time interval for price data
 */
export enum PriceInterval {
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week'
}

/**
 * Error types for price feed operations
 */
export enum PriceFeedErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  TOKEN_NOT_FOUND = 'TOKEN_NOT_FOUND',
  CURRENCY_NOT_SUPPORTED = 'CURRENCY_NOT_SUPPORTED',
  DATA_NOT_AVAILABLE = 'DATA_NOT_AVAILABLE',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Custom error class for price feed operations
 */
export class PriceFeedError extends Error {
  type: PriceFeedErrorType;
  
  constructor(type: PriceFeedErrorType, message: string) {
    super(message);
    this.name = 'PriceFeedError';
    this.type = type;
    
    // This is necessary for proper instanceof checks in TypeScript
    Object.setPrototypeOf(this, PriceFeedError.prototype);
  }
}

/**
 * Legacy interfaces for backward compatibility
 */

/**
 * Historical data point (legacy format)
 */
export interface HistoricalDataPoint {
  timestamp: number;
  price: number;
  volume?: number;
  marketCap?: number;
}

/**
 * Historical price data (legacy format)
 */
export interface HistoricalPriceData {
  symbol: string;
  currency: PriceConversion;
  interval: string;
  days: number;
  dataPoints: HistoricalDataPoint[];
}

/**
 * Price data (legacy format)
 */
export interface PriceData {
  symbol: string;
  price: number;
  currency: PriceConversion;
  timestamp: number | string;
  change?: {
    '24h'?: number;
    '7d'?: number;
    '30d'?: number;
  };
  marketCap?: number;
  volume24h?: number;
}

/**
 * Cache options
 */
export interface CacheOptions {
  ttl: number;
  refreshThreshold?: number;
  maxSize?: number;
}

/**
 * Market overview data
 */
export interface MarketOverview {
  btcDominance: number;
  totalMarketCap: number;
  totalVolume24h: number;
  topGainers: Array<{
    symbol: string;
    name: string;
    price: number;
    changePercent: number;
  }>;
  topLosers: Array<{
    symbol: string;
    name: string;
    price: number;
    changePercent: number;
  }>;
}