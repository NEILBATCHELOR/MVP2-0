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
 * Base adapter implementation with common functionality for price feed adapters
 */
export abstract class BasePriceFeedAdapter implements PriceFeedAdapter {
  protected readonly name: string;
  protected readonly supportedCurrenciesList: string[];
  
  constructor(name: string, supportedCurrencies: string[] = ['USD']) {
    this.name = name;
    this.supportedCurrenciesList = supportedCurrencies.map(c => c.toUpperCase());
  }
  
  /**
   * Get the name of the price feed adapter
   */
  getName(): string {
    return this.name;
  }
  
  /**
   * Check if a currency is supported by this adapter
   */
  supportsCurrency(currency: string): boolean {
    return this.supportedCurrenciesList.includes(currency.toUpperCase());
  }
  
  /**
   * Get supported currencies for this adapter
   */
  getSupportedCurrencies(): string[] {
    return [...this.supportedCurrenciesList];
  }
  
  /**
   * Validate that a currency is supported
   * @throws PriceFeedError if currency is not supported
   */
  protected validateCurrency(currency: string): void {
    if (!this.supportsCurrency(currency)) {
      throw new PriceFeedError(
        PriceFeedErrorType.CURRENCY_NOT_SUPPORTED,
        `Currency ${currency} is not supported by ${this.name}`
      );
    }
  }
  
  /**
   * Standard error handling for subclasses
   */
  protected handleError(error: unknown, tokenSymbol?: string): never {
    // If it's already a PriceFeedError, just rethrow it
    if (error instanceof PriceFeedError) {
      throw error;
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Pattern match common error cases
    if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED')) {
      throw new PriceFeedError(
        PriceFeedErrorType.NETWORK_ERROR,
        `Network error when accessing ${this.name}: ${errorMessage}`
      );
    }
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      throw new PriceFeedError(
        PriceFeedErrorType.RATE_LIMIT,
        `Rate limit exceeded when accessing ${this.name}: ${errorMessage}`
      );
    }
    
    if (tokenSymbol && (errorMessage.includes('not found') || errorMessage.includes('unknown'))) {
      throw new PriceFeedError(
        PriceFeedErrorType.TOKEN_NOT_FOUND,
        `Token ${tokenSymbol} not found on ${this.name}: ${errorMessage}`
      );
    }
    
    // Default to API error
    throw new PriceFeedError(
      PriceFeedErrorType.API_ERROR,
      `API error from ${this.name}: ${errorMessage}`
    );
  }
  
  // Abstract methods to be implemented by concrete adapters
  abstract getCurrentPrice(tokenSymbol: string, currency?: string): Promise<TokenPrice>;
  abstract getHistoricalPrices(
    tokenSymbol: string,
    currency?: string,
    days?: number,
    interval?: PriceInterval
  ): Promise<PriceDataPoint[]>;
  abstract getTokenMetadata(tokenSymbol: string): Promise<TokenMetadata>;
}