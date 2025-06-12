import { 
  PriceFeedAdapter, 
  PriceConversion, 
  TokenPrice, 
  PriceDataPoint, 
  PriceInterval, 
  TokenMetadata, 
  HistoricalDataPoint
} from './types';

/**
 * CoinGecko API adapter for price feed data
 */
export class CoinGeckoAdapter implements PriceFeedAdapter {
  private readonly API_BASE_URL = 'https://api.coingecko.com/api/v3';
  private readonly supportedCurrencies: string[] = ['usd', 'eur', 'gbp', 'jpy', 'cny'];
  private readonly symbolToIdMapping: Map<string, string> = new Map();
  
  /**
   * Creates a new CoinGecko adapter
   * @param apiKey Optional API key for premium access
   */
  constructor(private readonly apiKey?: string) {
    // Initialize common symbol mappings
    this.symbolToIdMapping.set('BTC', 'bitcoin');
    this.symbolToIdMapping.set('ETH', 'ethereum');
    this.symbolToIdMapping.set('SOL', 'solana');
    this.symbolToIdMapping.set('XRP', 'ripple');
    this.symbolToIdMapping.set('NEAR', 'near');
    this.symbolToIdMapping.set('AVAX', 'avalanche-2');
    this.symbolToIdMapping.set('MATIC', 'polygon');
  }
  
  /**
   * Get the adapter name
   */
  getName(): string {
    return 'CoinGecko';
  }
  
  /**
   * Check if a currency is supported by this adapter
   */
  supportsCurrency(currency: string): boolean {
    return this.supportedCurrencies.includes(currency.toLowerCase());
  }
  
  /**
   * Get list of supported currencies
   */
  getSupportedCurrencies(): string[] {
    return [...this.supportedCurrencies];
  }
  
  /**
   * Converts a symbol to CoinGecko ID
   * @param symbol Token symbol to convert
   * @returns CoinGecko ID or the symbol in lowercase if no mapping exists
   */
  private getTokenId(symbol: string): string {
    return this.symbolToIdMapping.get(symbol.toUpperCase()) || symbol.toLowerCase();
  }
  
  /**
   * Builds URL with API key if available
   * @param endpoint API endpoint
   * @param params Query parameters
   * @returns Complete URL with parameters
   */
  private buildUrl(endpoint: string, params: Record<string, string> = {}): string {
    const url = new URL(`${this.API_BASE_URL}${endpoint}`);
    
    if (this.apiKey) {
      params['x_cg_pro_api_key'] = this.apiKey;
    }
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    return url.toString();
  }
  
  /**
   * Makes an API request with error handling
   * @param url URL to fetch
   * @returns Response data or null if request failed
   */
  private async fetchWithErrorHandling<T>(url: string): Promise<T | null> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('CoinGecko API error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        return null;
      }
      
      return await response.json() as T;
    } catch (error) {
      console.error('Error fetching from CoinGecko:', error);
      return null;
    }
  }
  
  /**
   * Get current price for a token
   * @param tokenSymbol Token symbol (e.g., 'BTC', 'ETH')
   * @param currency Currency to convert price to
   * @returns TokenPrice or throws error if unavailable
   */
  async getCurrentPrice(tokenSymbol: string, currency: string = 'usd'): Promise<TokenPrice> {
    if (!this.supportsCurrency(currency)) {
      throw new Error(`Currency ${currency} is not supported`);
    }
    
    const tokenId = this.getTokenId(tokenSymbol);
    const url = this.buildUrl('/simple/price', {
      ids: tokenId,
      vs_currencies: currency,
      include_24h_change: 'true',
      include_market_cap: 'true',
      include_24h_vol: 'true',
      include_last_updated_at: 'true'
    });
    
    const data = await this.fetchWithErrorHandling<Record<string, Record<string, number>>>(url);
    
    if (!data || !data[tokenId] || data[tokenId][currency] === undefined) {
      throw new Error(`Unable to fetch price for ${tokenSymbol}`);
    }
    
    return {
      symbol: tokenSymbol,
      currency: currency,
      price: data[tokenId][currency],
      priceChange24h: data[tokenId][`${currency}_24h_change`],
      marketCap: data[tokenId][`${currency}_market_cap`],
      volume24h: data[tokenId][`${currency}_24h_vol`],
      lastUpdated: new Date(data[tokenId]['last_updated_at'] * 1000).toISOString()
    };
  }
  
  /**
   * Get historical price data for a token
   * @param tokenSymbol Token symbol
   * @param currency Currency to convert prices to
   * @param days Number of days of historical data to fetch
   * @param interval Interval between data points
   * @returns Array of price data points
   */
  async getHistoricalPrices(
    tokenSymbol: string,
    currency: string = 'usd',
    days: number = 30,
    interval: PriceInterval = PriceInterval.DAY
  ): Promise<PriceDataPoint[]> {
    if (!this.supportsCurrency(currency)) {
      throw new Error(`Currency ${currency} is not supported`);
    }
    
    const tokenId = this.getTokenId(tokenSymbol);
    
    // Map our interval to CoinGecko's format
    let cgInterval: string;
    switch (interval) {
      case PriceInterval.MINUTE:
        cgInterval = 'minute';
        break;
      case PriceInterval.HOUR:
        cgInterval = 'hourly';
        break;
      default:
        cgInterval = 'daily';
        break;
    }
    
    const url = this.buildUrl(`/coins/${tokenId}/market_chart`, {
      vs_currency: currency,
      days: days.toString(),
      interval: cgInterval
    });
    
    type CoingeckoHistoricalResponse = {
      prices: [number, number][]; // [timestamp, price]
      market_caps: [number, number][]; // [timestamp, market_cap]
      total_volumes: [number, number][]; // [timestamp, volume]
    };
    
    const data = await this.fetchWithErrorHandling<CoingeckoHistoricalResponse>(url);
    
    if (!data || !data.prices) {
      return [];
    }
    
    return data.prices.map((pricePoint, index) => {
      const [timestamp, price] = pricePoint;
      
      return {
        timestamp: new Date(timestamp).toISOString(),
        price,
        marketCap: data.market_caps[index]?.[1],
        volume: data.total_volumes[index]?.[1]
      };
    });
  }
  
  /**
   * Get detailed metadata for a token
   * @param tokenSymbol Token symbol
   * @returns Token metadata
   */
  async getTokenMetadata(tokenSymbol: string): Promise<TokenMetadata> {
    const tokenId = this.getTokenId(tokenSymbol);
    const url = this.buildUrl(`/coins/${tokenId}`, {
      localization: 'false',
      tickers: 'false',
      market_data: 'true',
      community_data: 'false',
      developer_data: 'false'
    });
    
    type CoingeckoTokenResponse = {
      id: string;
      symbol: string;
      name: string;
      image: { large: string };
      description: { en: string };
      links: {
        homepage: string[];
        blockchain_site: string[];
        twitter_screen_name: string;
        telegram_channel_identifier: string;
        subreddit_url: string;
      };
      platforms: Record<string, string>;
      market_data: {
        current_price: Record<string, number>;
        market_cap: Record<string, number>;
        market_cap_rank: number;
        total_volume: Record<string, number>;
        high_24h: Record<string, number>;
        low_24h: Record<string, number>;
        price_change_24h: number;
        price_change_percentage_24h: number;
        circulating_supply: number;
        total_supply: number;
        max_supply: number;
      };
      last_updated: string;
    };
    
    const data = await this.fetchWithErrorHandling<CoingeckoTokenResponse>(url);
    
    if (!data) {
      throw new Error(`Unable to fetch metadata for ${tokenSymbol}`);
    }
    
    return {
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      description: data.description?.en,
      logoUrl: data.image?.large,
      website: data.links?.homepage?.[0],
      explorers: data.links?.blockchain_site?.filter(Boolean),
      socialLinks: {
        twitter: data.links?.twitter_screen_name ? `https://twitter.com/${data.links.twitter_screen_name}` : undefined,
        telegram: data.links?.telegram_channel_identifier ? `https://t.me/${data.links.telegram_channel_identifier}` : undefined,
        reddit: data.links?.subreddit_url
      },
      contractAddresses: data.platforms,
      lastUpdated: data.last_updated
    };
  }

  // Legacy methods for backward compatibility
  
  /**
   * Get price for a token (legacy method)
   */
  async getPrice(symbol: string, currency: PriceConversion = PriceConversion.USD): Promise<number | null> {
    try {
      const tokenPrice = await this.getCurrentPrice(symbol, currency.toLowerCase());
      return tokenPrice.price;
    } catch (error) {
      console.error(`Error getting price for ${symbol}:`, error);
      return null;
    }
  }
  
  /**
   * Get prices for multiple tokens (legacy method)
   */
  async getPrices(symbols: string[], currency: PriceConversion = PriceConversion.USD): Promise<Map<string, number | null>> {
    const result = new Map<string, number | null>();
    
    await Promise.all(symbols.map(async (symbol) => {
      try {
        const tokenPrice = await this.getCurrentPrice(symbol, currency.toLowerCase());
        result.set(symbol, tokenPrice.price);
      } catch (error) {
        console.error(`Error getting price for ${symbol}:`, error);
        result.set(symbol, null);
      }
    }));
    
    return result;
  }
  
  /**
   * Get historical data (legacy method)
   */
  async getHistoricalData(
    symbol: string,
    days: number = 30,
    interval: string = 'daily'
  ): Promise<HistoricalDataPoint[]> {
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
    
    const data = await this.getHistoricalPrices(symbol, 'usd', days, priceInterval);
    
    return data.map(point => ({
      timestamp: new Date(point.timestamp).getTime(),
      price: point.price,
      volume: point.volume,
      marketCap: point.marketCap
    }));
  }
}