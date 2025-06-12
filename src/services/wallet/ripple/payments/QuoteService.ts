/**
 * Ripple Quote Service
 * Manages payment quotes and rate calculations
 */

import type {
  RippleQuoteV4,
  QuoteRequest,
  QuoteCollection,
  ServiceResult,
  MoneyAmount,
  PaymentCorridor
} from '../types';
import { RippleApiClient, createRippleApiClient } from '../utils/ApiClient';
import { RippleErrorHandler } from '../utils/ErrorHandler';
import { PAYMENTS_ENDPOINTS, buildFullEndpoint } from '../config';
import { 
  validate, 
  required, 
  stringLength, 
  currencyCode, 
  countryCode,
  COMMON_SCHEMAS 
} from '../utils/Validators';

export interface QuoteConfig {
  environment?: 'test' | 'production';
  tokenProvider?: () => Promise<any>;
  maxRetries?: number;
  timeout?: number;
  defaultExpiryMinutes?: number;
}

export interface QuoteComparison {
  quotes: RippleQuoteV4[];
  recommended: RippleQuoteV4;
  cheapest: RippleQuoteV4;
  fastest: RippleQuoteV4;
  statistics: QuoteStatistics;
}

export interface QuoteStatistics {
  averageFee: string;
  averageRate: string;
  feeRange: { min: string; max: string };
  rateRange: { min: string; max: string };
  timeRange: { min: string; max: string };
  totalQuotes: number;
}

export interface QuoteFilters {
  maxFee?: string;
  minRate?: string;
  maxSettlementTime?: string;
  paymentMethods?: string[];
  excludeProviders?: string[];
}

export interface RateInfo {
  sourceCurrency: string;
  destinationCurrency: string;
  rate: string;
  inverseRate: string;
  spread: string;
  timestamp: string;
  provider: string;
  isLive: boolean;
}

export class QuoteService {
  private apiClient: RippleApiClient;
  private config: Required<QuoteConfig>;

  constructor(config: QuoteConfig = {}) {
    this.config = {
      environment: config.environment || 'test',
      tokenProvider: config.tokenProvider,
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 30000,
      defaultExpiryMinutes: config.defaultExpiryMinutes || 15
    };

    this.apiClient = createRippleApiClient(
      {
        environment: this.config.environment,
        retries: this.config.maxRetries,
        timeout: this.config.timeout
      },
      this.config.tokenProvider
    );
  }

  /**
   * Create a quote collection for payment estimation
   */
  async createQuoteCollection(
    quoteRequest: QuoteRequest
  ): Promise<ServiceResult<QuoteCollection>> {
    try {
      // Validate quote request
      const validation = this.validateQuoteRequest(quoteRequest);
      if (!validation.isValid) {
        return RippleErrorHandler.createFailureResult(
          new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
        );
      }

      return await this.apiClient.post<QuoteCollection>(
        PAYMENTS_ENDPOINTS.CREATE_QUOTE_COLLECTION,
        quoteRequest
      );
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get a quote collection by ID
   */
  async getQuoteCollection(quoteCollectionId: string): Promise<ServiceResult<QuoteCollection>> {
    try {
      const validation = validate({ quoteCollectionId }, {
        quoteCollectionId: [
          (value) => required(value, 'quoteCollectionId'),
          (value) => stringLength(value, 'quoteCollectionId', 1, 100)
        ]
      });

      if (!validation.isValid) {
        return RippleErrorHandler.createFailureResult(
          new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
        );
      }

      const endpoint = buildFullEndpoint(
        PAYMENTS_ENDPOINTS.GET_QUOTE_COLLECTION,
        { id: quoteCollectionId }
      );

      return await this.apiClient.get<QuoteCollection>(endpoint);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get best quote from a collection based on criteria
   */
  async getBestQuote(
    quoteCollectionId: string,
    criteria: 'cheapest' | 'fastest' | 'balanced' = 'balanced'
  ): Promise<ServiceResult<RippleQuoteV4>> {
    try {
      const collectionResult = await this.getQuoteCollection(quoteCollectionId);
      
      if (!collectionResult.success || !collectionResult.data) {
        return RippleErrorHandler.createFailureResult(
          collectionResult.error || new Error('Failed to get quote collection')
        );
      }

      const quotes = collectionResult.data.quotes;
      
      if (quotes.length === 0) {
        return RippleErrorHandler.createFailureResult(
          new Error('No quotes available in collection')
        );
      }

      let bestQuote: RippleQuoteV4;

      switch (criteria) {
        case 'cheapest':
          bestQuote = quotes.reduce((best, current) => 
            parseFloat(current.fee.value) < parseFloat(best.fee.value) ? current : best
          );
          break;
        
        case 'fastest':
          bestQuote = quotes.reduce((best, current) => {
            const bestTime = best.estimatedSettlementTime ? 
              this.parseTimeToSeconds(best.estimatedSettlementTime) : Infinity;
            const currentTime = current.estimatedSettlementTime ? 
              this.parseTimeToSeconds(current.estimatedSettlementTime) : Infinity;
            
            return currentTime < bestTime ? current : best;
          });
          break;
        
        case 'balanced':
        default:
          // Score based on fee (40%) and time (30%) and exchange rate (30%)
          bestQuote = quotes.reduce((best, current) => {
            const bestScore = this.calculateQuoteScore(best);
            const currentScore = this.calculateQuoteScore(current);
            
            return currentScore > bestScore ? current : best;
          });
          break;
      }

      return RippleErrorHandler.createSuccessResult(bestQuote);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Compare multiple quotes and provide recommendations
   */
  async compareQuotes(
    quoteCollectionId: string,
    filters?: QuoteFilters
  ): Promise<ServiceResult<QuoteComparison>> {
    try {
      const collectionResult = await this.getQuoteCollection(quoteCollectionId);
      
      if (!collectionResult.success || !collectionResult.data) {
        return RippleErrorHandler.createFailureResult(
          collectionResult.error || new Error('Failed to get quote collection')
        );
      }

      let quotes = collectionResult.data.quotes;
      
      // Apply filters if provided
      if (filters) {
        quotes = this.filterQuotes(quotes, filters);
      }

      if (quotes.length === 0) {
        return RippleErrorHandler.createFailureResult(
          new Error('No quotes match the specified criteria')
        );
      }

      // Find best quotes by different criteria
      const cheapest = quotes.reduce((best, current) => 
        parseFloat(current.fee.value) < parseFloat(best.fee.value) ? current : best
      );

      const fastest = quotes.reduce((best, current) => {
        const bestTime = best.estimatedSettlementTime ? 
          this.parseTimeToSeconds(best.estimatedSettlementTime) : Infinity;
        const currentTime = current.estimatedSettlementTime ? 
          this.parseTimeToSeconds(current.estimatedSettlementTime) : Infinity;
        
        return currentTime < bestTime ? current : best;
      });

      const recommended = quotes.reduce((best, current) => {
        const bestScore = this.calculateQuoteScore(best);
        const currentScore = this.calculateQuoteScore(current);
        
        return currentScore > bestScore ? current : best;
      });

      // Calculate statistics
      const statistics = this.calculateQuoteStatistics(quotes);

      const comparison: QuoteComparison = {
        quotes,
        recommended,
        cheapest,
        fastest,
        statistics
      };

      return RippleErrorHandler.createSuccessResult(comparison);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get current exchange rates for currency pairs
   */
  async getExchangeRates(
    sourceCurrency?: string,
    destinationCurrency?: string
  ): Promise<ServiceResult<RateInfo[]>> {
    try {
      const queryParams: any = {};
      
      if (sourceCurrency) {
        const validation = currencyCode(sourceCurrency, 'sourceCurrency');
        if (validation) {
          return RippleErrorHandler.createFailureResult(
            new Error(`Invalid source currency: ${validation.message}`)
          );
        }
        queryParams.source = sourceCurrency;
      }

      if (destinationCurrency) {
        const validation = currencyCode(destinationCurrency, 'destinationCurrency');
        if (validation) {
          return RippleErrorHandler.createFailureResult(
            new Error(`Invalid destination currency: ${validation.message}`)
          );
        }
        queryParams.destination = destinationCurrency;
      }

      const endpoint = buildFullEndpoint(
        PAYMENTS_ENDPOINTS.GET_EXCHANGE_RATES,
        undefined,
        queryParams
      );

      const result = await this.apiClient.get(endpoint);
      
      if (result.success && result.data) {
        // Transform API response to RateInfo format
        const rates = this.transformRatesResponse(result.data);
        return RippleErrorHandler.createSuccessResult(rates);
      }

      return result;
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Get a quick quote estimate without creating a full collection
   */
  async getQuickQuote(
    sourceAmount: MoneyAmount,
    destinationCurrency: string,
    sourceCountry?: string,
    destinationCountry?: string
  ): Promise<ServiceResult<RippleQuoteV4>> {
    try {
      const quoteRequest: QuoteRequest = {
        sourceAmount,
        destinationCurrency,
        ...(sourceCountry && { sourceCountry }),
        ...(destinationCountry && { destinationCountry })
      };

      // Create a quote collection
      const collectionResult = await this.createQuoteCollection(quoteRequest);
      
      if (!collectionResult.success || !collectionResult.data) {
        return RippleErrorHandler.createFailureResult(
          collectionResult.error || new Error('Failed to create quote collection')
        );
      }

      const quotes = collectionResult.data.quotes;
      
      if (quotes.length === 0) {
        return RippleErrorHandler.createFailureResult(
          new Error('No quotes available for this request')
        );
      }

      // Return the best balanced quote
      const bestQuote = quotes.reduce((best, current) => {
        const bestScore = this.calculateQuoteScore(best);
        const currentScore = this.calculateQuoteScore(current);
        
        return currentScore > bestScore ? current : best;
      });

      return RippleErrorHandler.createSuccessResult(bestQuote);
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  /**
   * Check if a quote is still valid (not expired)
   */
  isQuoteValid(quote: RippleQuoteV4): boolean {
    const now = new Date();
    const expiryDate = new Date(quote.expiresAt);
    
    return now < expiryDate;
  }

  /**
   * Calculate the time remaining before quote expires
   */
  getQuoteTimeRemaining(quote: RippleQuoteV4): number {
    const now = new Date();
    const expiryDate = new Date(quote.expiresAt);
    
    return Math.max(0, expiryDate.getTime() - now.getTime());
  }

  /**
   * Refresh an expired quote with the same parameters
   */
  async refreshQuote(expiredQuote: RippleQuoteV4): Promise<ServiceResult<RippleQuoteV4>> {
    try {
      // Extract original parameters from the expired quote
      const quoteRequest: QuoteRequest = {
        sourceAmount: expiredQuote.sourceAmount,
        destinationCurrency: expiredQuote.destinationAmount.currency
      };

      return await this.getQuickQuote(
        quoteRequest.sourceAmount,
        quoteRequest.destinationCurrency
      );
    } catch (error) {
      return RippleErrorHandler.createFailureResult(error);
    }
  }

  // Private helper methods

  private validateQuoteRequest(request: QuoteRequest) {
    return validate(request, {
      sourceAmount: COMMON_SCHEMAS.moneyAmount('sourceAmount'),
      destinationCurrency: [
        (value) => required(value, 'destinationCurrency'),
        (value) => currencyCode(value, 'destinationCurrency')
      ]
    });
  }

  private filterQuotes(quotes: RippleQuoteV4[], filters: QuoteFilters): RippleQuoteV4[] {
    return quotes.filter(quote => {
      // Filter by maximum fee
      if (filters.maxFee && parseFloat(quote.fee.value) > parseFloat(filters.maxFee)) {
        return false;
      }

      // Filter by minimum exchange rate
      if (filters.minRate && parseFloat(quote.exchangeRate) < parseFloat(filters.minRate)) {
        return false;
      }

      // Filter by maximum settlement time
      if (filters.maxSettlementTime && quote.estimatedSettlementTime) {
        const quoteTime = this.parseTimeToSeconds(quote.estimatedSettlementTime);
        const maxTime = this.parseTimeToSeconds(filters.maxSettlementTime);
        if (quoteTime > maxTime) {
          return false;
        }
      }

      return true;
    });
  }

  private calculateQuoteScore(quote: RippleQuoteV4): number {
    // Scoring algorithm: lower fees and faster settlement = higher score
    const feeScore = 100 - Math.min(100, parseFloat(quote.fee.value));
    
    const timeScore = quote.estimatedSettlementTime ? 
      100 - Math.min(100, this.parseTimeToSeconds(quote.estimatedSettlementTime) / 60) : 50;
    
    const rateScore = parseFloat(quote.exchangeRate) * 10; // Assuming higher rate is better

    // Weighted score: 40% fee, 30% time, 30% rate
    return (feeScore * 0.4) + (timeScore * 0.3) + (rateScore * 0.3);
  }

  private calculateQuoteStatistics(quotes: RippleQuoteV4[]): QuoteStatistics {
    const fees = quotes.map(q => parseFloat(q.fee.value));
    const rates = quotes.map(q => parseFloat(q.exchangeRate));
    const times = quotes
      .filter(q => q.estimatedSettlementTime)
      .map(q => this.parseTimeToSeconds(q.estimatedSettlementTime!));

    return {
      averageFee: (fees.reduce((sum, fee) => sum + fee, 0) / fees.length).toFixed(4),
      averageRate: (rates.reduce((sum, rate) => sum + rate, 0) / rates.length).toFixed(6),
      feeRange: {
        min: Math.min(...fees).toFixed(4),
        max: Math.max(...fees).toFixed(4)
      },
      rateRange: {
        min: Math.min(...rates).toFixed(6),
        max: Math.max(...rates).toFixed(6)
      },
      timeRange: {
        min: times.length > 0 ? Math.min(...times).toString() : '0',
        max: times.length > 0 ? Math.max(...times).toString() : '0'
      },
      totalQuotes: quotes.length
    };
  }

  private parseTimeToSeconds(timeString: string): number {
    // Parse time strings like "5 minutes", "1 hour", "30 seconds"
    const match = timeString.match(/(\d+)\s*(second|minute|hour|day)s?/i);
    if (!match) return 0;

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 'second': return value;
      case 'minute': return value * 60;
      case 'hour': return value * 3600;
      case 'day': return value * 86400;
      default: return 0;
    }
  }

  private transformRatesResponse(data: any): RateInfo[] {
    // Transform API response to standardized RateInfo format
    // This would depend on the actual API response structure
    if (Array.isArray(data)) {
      return data.map(item => ({
        sourceCurrency: item.source_currency || item.from,
        destinationCurrency: item.destination_currency || item.to,
        rate: item.rate || item.exchange_rate,
        inverseRate: item.inverse_rate || (1 / parseFloat(item.rate)).toString(),
        spread: item.spread || '0',
        timestamp: item.timestamp || new Date().toISOString(),
        provider: item.provider || 'ripple',
        isLive: item.is_live !== false
      }));
    }

    return [];
  }

  /**
   * Update the token provider for authentication
   */
  setTokenProvider(provider: () => Promise<any>): void {
    this.apiClient.setTokenProvider(provider);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<QuoteConfig>): void {
    this.config = { ...this.config, ...config };
    this.apiClient.updateConfig(config);
  }
}

// Factory function for creating quote service
export const createQuoteService = (config?: QuoteConfig): QuoteService => {
  return new QuoteService(config);
};
