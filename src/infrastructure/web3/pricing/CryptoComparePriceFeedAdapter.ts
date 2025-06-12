import {
  TokenPrice,
  PriceDataPoint,
  TokenMetadata,
  PriceInterval,
  PriceFeedError,
  PriceFeedErrorType,
  PriceConversion,
  PriceData, // Legacy format
  HistoricalPriceData // Legacy format
} from './types';
import { BasePriceFeedAdapter } from './BasePriceFeedAdapter';

/**
 * CryptoCompare API adapter for price feed
 */
export class CryptoComparePriceFeedAdapter extends BasePriceFeedAdapter {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  
  constructor(apiKey?: string) {
    super('CryptoCompare', ['USD', 'EUR', 'BTC', 'ETH', 'GBP']);
    this.baseUrl = 'https://min-api.cryptocompare.com/data';
    this.apiKey = apiKey;
  }
  
  /**
   * Get request headers including API key if available
   */
  private getHeaders(): Record<string, string> {
    return this.apiKey 
      ? { 'Authorization': `Apikey ${this.apiKey}` }
      : {};
  }
  
  /**
   * Convert our currency format to CryptoCompare format
   */
  private formatCurrency(currency: string | PriceConversion): string {
    if (typeof currency === 'string') {
      return currency.toUpperCase();
    }
    
    // Handle PriceConversion enum
    switch (currency) {
      case PriceConversion.USD: return 'USD';
      case PriceConversion.EUR: return 'EUR';
      case PriceConversion.BTC: return 'BTC';
      case PriceConversion.ETH: return 'ETH';
      default: return 'USD';
    }
  }
  
  /**
   * Make an API request to CryptoCompare
   */
  private async fetchFromApi<T>(endpoint: string, params: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
    
    try {
      const response = await fetch(url.toString(), {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`CryptoCompare API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.Response === 'Error') {
        throw new Error(data.Message || 'CryptoCompare API error');
      }
      
      return data as T;
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Get current price for a token
   */
  async getCurrentPrice(tokenSymbol: string, currency: string | PriceConversion = 'USD'): Promise<TokenPrice> {
    const formattedCurrency = this.formatCurrency(currency);
    const symbol = tokenSymbol.toUpperCase();
    
    try {
      const data = await this.fetchFromApi<any>('/pricemultifull', {
        fsyms: symbol,
        tsyms: formattedCurrency
      });
      
      const priceData = data.RAW?.[symbol]?.[formattedCurrency];
      if (!priceData) {
        throw new PriceFeedError(
          PriceFeedErrorType.DATA_NOT_AVAILABLE,
          `Price data not available for ${symbol} in ${formattedCurrency}`
        );
      }
      
      return {
        symbol,
        currency: typeof currency === 'string' ? currency.toUpperCase() : currency,
        price: priceData.PRICE || 0,
        marketCap: priceData.MKTCAP || null,
        volume24h: priceData.VOLUME24HOUR || null,
        priceChange24h: priceData.CHANGEPCT24HOUR || null,
        lastUpdated: new Date(priceData.LASTUPDATE * 1000).toISOString()
      };
    } catch (error) {
      return this.handleError(error, tokenSymbol);
    }
  }
  
  /**
   * Legacy method: Get current price for a token
   * @deprecated Use getCurrentPrice instead
   */
  async getPrice(symbol: string, currency: PriceConversion = PriceConversion.USD): Promise<PriceData> {
    try {
      const tokenPrice = await this.getCurrentPrice(symbol, currency);
      
      // Convert to legacy format
      return {
        symbol: tokenPrice.symbol,
        price: tokenPrice.price,
        currency: typeof currency === 'string' ? PriceConversion.USD : currency,
        timestamp: tokenPrice.lastUpdated,
        change: {
          '24h': tokenPrice.priceChange24h || 0
        },
        marketCap: tokenPrice.marketCap || 0,
        volume24h: tokenPrice.volume24h || 0
      };
    } catch (error) {
      return this.handleError(error, symbol);
    }
  }
  
  /**
   * Legacy method: Get prices for multiple tokens
   * @deprecated Use getMultiplePrices instead
   */
  async getPrices(
    symbols: string[], 
    currency: PriceConversion = PriceConversion.USD
  ): Promise<Record<string, PriceData>> {
    try {
      const formattedCurrency = this.formatCurrency(currency);
      const symbolsString = symbols.map(s => s.toUpperCase()).join(',');
      
      const data = await this.fetchFromApi<any>('/pricemultifull', {
        fsyms: symbolsString,
        tsyms: formattedCurrency
      });
      
      const result: Record<string, PriceData> = {};
      
      if (!data.RAW) {
        throw new PriceFeedError(
          PriceFeedErrorType.DATA_NOT_AVAILABLE,
          `No price data available for the requested symbols`
        );
      }
      
      for (const symbol of symbols) {
        const upperSymbol = symbol.toUpperCase();
        const priceData = data.RAW[upperSymbol]?.[formattedCurrency];
        
        if (priceData) {
          result[upperSymbol] = {
            symbol: upperSymbol,
            price: priceData.PRICE || 0,
            currency,
            timestamp: priceData.LASTUPDATE ? priceData.LASTUPDATE * 1000 : Date.now(),
            change: {
              '24h': priceData.CHANGEPCT24HOUR || 0
            },
            marketCap: priceData.MKTCAP || 0,
            volume24h: priceData.VOLUME24HOUR || 0
          };
        }
      }
      
      return result;
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Get historical price data for a token
   */
  async getHistoricalPrices(
    tokenSymbol: string,
    currency: string | PriceConversion = 'USD',
    days: number = 7,
    interval: PriceInterval = PriceInterval.DAY
  ): Promise<PriceDataPoint[]> {
    const formattedCurrency = this.formatCurrency(currency);
    const symbol = tokenSymbol.toUpperCase();
    
    try {
      // Map interval to CryptoCompare's format
      let endpoint: string;
      let limit: number;
      let aggregation = 1;
      
      switch (interval) {
        case PriceInterval.MINUTE:
          endpoint = '/histominute';
          limit = Math.min(days * 24 * 60, 2000);  // API limit
          aggregation = 30; // 30 minute intervals
          break;
        case PriceInterval.HOUR:
          endpoint = '/histohour';
          limit = Math.min(days * 24, 2000);
          break;
        case PriceInterval.WEEK:
          endpoint = '/histoday';
          limit = Math.min(days, 2000);
          aggregation = 7; // Weekly aggregation
          break;
        case PriceInterval.DAY:
        default:
          endpoint = '/histoday';
          limit = Math.min(days, 2000);
          break;
      }
      
      const data = await this.fetchFromApi<any>(endpoint, {
        fsym: symbol,
        tsym: formattedCurrency,
        limit,
        aggregate: aggregation
      });
      
      if (!data.Data || !Array.isArray(data.Data)) {
        throw new PriceFeedError(
          PriceFeedErrorType.DATA_NOT_AVAILABLE,
          `Historical price data not available for ${symbol}`
        );
      }
      
      return data.Data.map((item: any) => ({
        timestamp: new Date(item.time * 1000).toISOString(),
        price: item.close,
        volume: item.volumeto || undefined,
        marketCap: undefined // Not provided by CryptoCompare
      }));
    } catch (error) {
      return this.handleError(error, tokenSymbol);
    }
  }
  
  /**
   * Legacy method: Get historical price data for a token
   * @deprecated Use getHistoricalPrices instead
   */
  async getHistoricalData(
    symbol: string, 
    days: number = 30, 
    interval: string = 'daily'
  ): Promise<HistoricalPriceData> {
    try {
      // Map interval string to enum
      let priceInterval: PriceInterval;
      switch (interval) {
        case 'minute':
        case 'minutes': 
          priceInterval = PriceInterval.MINUTE; 
          break;
        case 'hourly': 
          priceInterval = PriceInterval.HOUR; 
          break;
        case 'weekly': 
          priceInterval = PriceInterval.WEEK; 
          break;
        case 'daily':
        default: 
          priceInterval = PriceInterval.DAY;
      }
      
      const dataPoints = await this.getHistoricalPrices(
        symbol, 
        PriceConversion.USD,
        days,
        priceInterval
      );
      
      // Convert to legacy format
      return {
        symbol: symbol.toUpperCase(),
        currency: PriceConversion.USD,
        interval,
        days,
        dataPoints: dataPoints.map(point => ({
          timestamp: new Date(point.timestamp).getTime(),
          price: point.price,
          volume: point.volume,
          marketCap: point.marketCap
        }))
      };
    } catch (error) {
      return this.handleError(error, symbol);
    }
  }
  
  /**
   * Get token metadata
   */
  async getTokenMetadata(tokenSymbol: string): Promise<TokenMetadata> {
    const symbol = tokenSymbol.toUpperCase();
    
    try {
      const data = await this.fetchFromApi<any>('/coin/generalinfo', {
        fsyms: symbol,
        tsym: 'USD'
      });
      
      const coinInfo = data.Data?.[0]?.CoinInfo;
      
      if (!coinInfo) {
        throw new PriceFeedError(
          PriceFeedErrorType.TOKEN_NOT_FOUND,
          `Metadata not available for ${symbol}`
        );
      }
      
      return {
        symbol,
        name: coinInfo.FullName || symbol,
        description: coinInfo.Description || undefined,
        logoUrl: coinInfo.ImageUrl ? `https://www.cryptocompare.com${coinInfo.ImageUrl}` : undefined,
        website: coinInfo.Url || undefined,
        explorers: coinInfo.BlockExplorerUrl ? [coinInfo.BlockExplorerUrl] : undefined,
        socialLinks: {
          twitter: coinInfo.Twitter ? `https://twitter.com/${coinInfo.Twitter}` : undefined,
          reddit: coinInfo.Reddit || undefined,
          telegram: undefined,
          discord: undefined
        },
        contractAddresses: undefined,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      return this.handleError(error, tokenSymbol);
    }
  }
  
  /**
   * Check if this adapter supports a given currency
   * Overrides the base method to support legacy PriceConversion enum
   */
  supportsCurrency(currency: string | PriceConversion): boolean {
    if (typeof currency === 'string') {
      return super.supportsCurrency(currency);
    }
    
    // Handle PriceConversion enum
    switch (currency) {
      case PriceConversion.USD:
      case PriceConversion.EUR:
      case PriceConversion.BTC:
      case PriceConversion.ETH:
        return true;
      default:
        return false;
    }
  }
}