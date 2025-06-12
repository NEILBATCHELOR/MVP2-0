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
 * Configuration for CoinGecko API
 */
export interface CoinGeckoConfig {
  apiKey?: string;
  baseUrl?: string;
  rateLimitPerMinute?: number;
}

/**
 * CoinGecko price feed adapter
 */
export class CoinGeckoPriceFeed implements PriceFeedAdapter {
  private baseUrl: string;
  private apiKey: string | null;
  private supportedCurrencies: Set<string>;
  private tokenIdMap: Map<string, string> = new Map();
  private lastRequestTime: number = 0;
  private rateLimitPerMinute: number;
  private requestCount: number = 0;
  private requestResetTime: number = 0;

  constructor(config?: CoinGeckoConfig) {
    this.apiKey = config?.apiKey || null;
    this.baseUrl = config?.baseUrl || 'https://api.coingecko.com/api/v3';
    this.rateLimitPerMinute = config?.rateLimitPerMinute || 50;
    this.supportedCurrencies = new Set([
      'usd', 'eur', 'jpy', 'gbp', 'aud', 'cad', 'chf', 'cny', 'inr'
    ]);
    
    // Pre-populate some common token IDs
    this.tokenIdMap.set('btc', 'bitcoin');
    this.tokenIdMap.set('eth', 'ethereum');
    this.tokenIdMap.set('sol', 'solana');
    this.tokenIdMap.set('xrp', 'ripple');
    this.tokenIdMap.set('near', 'near');
  }

  /**
   * Get name of this price feed adapter
   */
  getName(): string {
    return 'CoinGecko';
  }

  /**
   * Check if a currency is supported
   */
  supportsCurrency(currency: string): boolean {
    return this.supportedCurrencies.has(currency.toLowerCase());
  }

  /**
   * Get list of supported currencies
   */
  getSupportedCurrencies(): string[] {
    return Array.from(this.supportedCurrencies);
  }

  /**
   * Make a rate-limited API request to CoinGecko
   */
  private async fetchWithRateLimit(endpoint: string): Promise<any> {
    const now = Date.now();
    
    // Reset counter if a minute has passed
    if (now - this.requestResetTime > 60000) {
      this.requestCount = 0;
      this.requestResetTime = now;
    }
    
    // Check if rate limit is reached
    if (this.requestCount >= this.rateLimitPerMinute) {
      const waitTime = 60000 - (now - this.requestResetTime);
      if (waitTime > 0) {
        throw new PriceFeedError(
          PriceFeedErrorType.RATE_LIMIT,
          `Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds.`
        );
      }
    }
    
    // Add delay between requests to avoid hitting rate limits
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < 250 && this.lastRequestTime > 0) {
      await new Promise(resolve => setTimeout(resolve, 250 - timeSinceLastRequest));
    }
    
    try {
      const url = `${this.baseUrl}${endpoint}${this.apiKey ? `&x_cg_api_key=${this.apiKey}` : ''}`;
      const response = await fetch(url);
      this.lastRequestTime = Date.now();
      this.requestCount++;
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new PriceFeedError(
            PriceFeedErrorType.RATE_LIMIT,
            'CoinGecko API rate limit exceeded'
          );
        }
        
        throw new PriceFeedError(
          PriceFeedErrorType.API_ERROR,
          `CoinGecko API error: ${response.status} ${response.statusText}`
        );
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof PriceFeedError) {
        throw error;
      }
      
      throw new PriceFeedError(
        PriceFeedErrorType.NETWORK_ERROR,
        'Failed to fetch data from CoinGecko'
      );
    }
  }

  /**
   * Convert token symbol to CoinGecko ID
   */
  private async getTokenId(symbol: string): Promise<string> {
    const normalizedSymbol = symbol.toLowerCase();
    
    // Check if we already have the ID mapped
    if (this.tokenIdMap.has(normalizedSymbol)) {
      return this.tokenIdMap.get(normalizedSymbol)!;
    }
    
    try {
      // Search for the token
      const data = await this.fetchWithRateLimit('/search?query=' + encodeURIComponent(normalizedSymbol));
      
      if (data.coins && data.coins.length > 0) {
        // Find exact match by symbol
        const exactMatch = data.coins.find((coin: any) => 
          coin.symbol.toLowerCase() === normalizedSymbol
        );
        
        if (exactMatch) {
          this.tokenIdMap.set(normalizedSymbol, exactMatch.id);
          return exactMatch.id;
        }
        
        // If no exact match, use the first result
        this.tokenIdMap.set(normalizedSymbol, data.coins[0].id);
        return data.coins[0].id;
      }
      
      throw new PriceFeedError(
        PriceFeedErrorType.TOKEN_NOT_FOUND,
        `Token symbol "${symbol}" not found`
      );
    } catch (error) {
      if (error instanceof PriceFeedError) {
        throw error;
      }
      
      throw new PriceFeedError(
        PriceFeedErrorType.UNKNOWN,
        `Failed to find token ID for symbol "${symbol}"`
      );
    }
  }

  /**
   * Get current price for a token
   */
  public async getCurrentPrice(tokenSymbol: string, currency: string = 'usd'): Promise<TokenPrice> {
    if (!this.supportsCurrency(currency)) {
      throw new PriceFeedError(
        PriceFeedErrorType.CURRENCY_NOT_SUPPORTED,
        `Currency "${currency}" is not supported`
      );
    }
    
    try {
      const tokenId = await this.getTokenId(tokenSymbol);
      const normalizedCurrency = currency.toLowerCase();
      
      const data = await this.fetchWithRateLimit(
        `/coins/${tokenId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
      );
      
      if (!data.market_data || !data.market_data.current_price[normalizedCurrency]) {
        throw new PriceFeedError(
          PriceFeedErrorType.DATA_NOT_AVAILABLE,
          `Price data not available for ${tokenSymbol} in ${currency}`
        );
      }
      
      return {
        symbol: tokenSymbol.toUpperCase(),
        currency: currency.toLowerCase(),
        price: data.market_data.current_price[normalizedCurrency],
        priceChange24h: data.market_data.price_change_percentage_24h_in_currency?.[normalizedCurrency],
        marketCap: data.market_data.market_cap?.[normalizedCurrency],
        volume24h: data.market_data.total_volume?.[normalizedCurrency],
        lastUpdated: data.market_data.last_updated
      };
    } catch (error) {
      if (error instanceof PriceFeedError) {
        throw error;
      }
      
      throw new PriceFeedError(
        PriceFeedErrorType.UNKNOWN,
        `Failed to get current price for ${tokenSymbol}`
      );
    }
  }

  /**
   * Get prices for multiple tokens
   */
  public async getMultiplePrices(tokenSymbols: string[], currency: string = 'usd'): Promise<Record<string, TokenPrice>> {
    if (!this.supportsCurrency(currency)) {
      throw new PriceFeedError(
        PriceFeedErrorType.CURRENCY_NOT_SUPPORTED,
        `Currency "${currency}" is not supported`
      );
    }
    
    try {
      // Map all symbols to IDs (this will cache the IDs for future use)
      const tokenIds = await Promise.all(tokenSymbols.map(symbol => this.getTokenId(symbol)));
      
      // Create a map from ID to symbol for reverse lookup
      const idToSymbol = new Map<string, string>();
      tokenSymbols.forEach((symbol, index) => {
        idToSymbol.set(tokenIds[index], symbol);
      });
      
      const data = await this.fetchWithRateLimit(
        `/coins/markets?vs_currency=${currency}&ids=${tokenIds.join(',')}&order=market_cap_desc&per_page=${tokenIds.length}&page=1&sparkline=false&price_change_percentage=24h`
      );
      
      const result: Record<string, TokenPrice> = {};
      
      data.forEach((item: any) => {
        const symbol = idToSymbol.get(item.id) || item.symbol.toUpperCase();
        
        result[symbol] = {
          symbol: symbol,
          currency: currency.toLowerCase(),
          price: item.current_price,
          priceChange24h: item.price_change_percentage_24h,
          marketCap: item.market_cap,
          volume24h: item.total_volume,
          lastUpdated: item.last_updated
        };
      });
      
      return result;
    } catch (error) {
      if (error instanceof PriceFeedError) {
        throw error;
      }
      
      throw new PriceFeedError(
        PriceFeedErrorType.UNKNOWN,
        `Failed to get prices for multiple tokens`
      );
    }
  }

  /**
   * Get historical price data
   */
  public async getHistoricalPrices(
    tokenSymbol: string, 
    currency: string = 'usd', 
    days: number = 7, 
    interval: PriceInterval = PriceInterval.DAY
  ): Promise<PriceDataPoint[]> {
    if (!this.supportsCurrency(currency)) {
      throw new PriceFeedError(
        PriceFeedErrorType.CURRENCY_NOT_SUPPORTED,
        `Currency "${currency}" is not supported`
      );
    }
    
    try {
      const tokenId = await this.getTokenId(tokenSymbol);
      
      // Map our interval to CoinGecko's format
      let cgInterval: string;
      switch (interval) {
        case PriceInterval.MINUTE:
          cgInterval = 'minutely';
          break;
        case PriceInterval.HOUR:
          cgInterval = 'hourly';
          break;
        default:
          cgInterval = 'daily';
          break;
      }
      
      const data = await this.fetchWithRateLimit(
        `/coins/${tokenId}/market_chart?vs_currency=${currency}&days=${days}&interval=${cgInterval}`
      );
      
      if (!data.prices || !Array.isArray(data.prices)) {
        throw new PriceFeedError(
          PriceFeedErrorType.DATA_NOT_AVAILABLE,
          `Historical price data not available for ${tokenSymbol}`
        );
      }
      
      return data.prices.map(([timestamp, price]: [number, number]) => ({
        timestamp: new Date(timestamp).toISOString(),
        price,
        volume: data.total_volumes?.find((v: [number, number]) => v[0] === timestamp)?.[1],
        marketCap: data.market_caps?.find((m: [number, number]) => m[0] === timestamp)?.[1]
      }));
    } catch (error) {
      if (error instanceof PriceFeedError) {
        throw error;
      }
      
      throw new PriceFeedError(
        PriceFeedErrorType.UNKNOWN,
        `Failed to get historical prices for ${tokenSymbol}`
      );
    }
  }

  /**
   * Get token metadata
   */
  public async getTokenMetadata(tokenSymbol: string): Promise<TokenMetadata> {
    try {
      const tokenId = await this.getTokenId(tokenSymbol);
      
      const data = await this.fetchWithRateLimit(
        `/coins/${tokenId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
      );
      
      return {
        symbol: data.symbol.toUpperCase(),
        name: data.name,
        description: data.description?.en,
        logoUrl: data.image?.large,
        website: data.links?.homepage?.[0],
        explorers: data.links?.blockchain_site?.filter((url: string) => url),
        socialLinks: {
          twitter: data.links?.twitter_screen_name ? `https://twitter.com/${data.links.twitter_screen_name}` : undefined,
          telegram: data.links?.telegram_channel_identifier ? `https://t.me/${data.links.telegram_channel_identifier}` : undefined,
          reddit: data.links?.subreddit_url,
        },
        contractAddresses: data.platforms,
        lastUpdated: data.last_updated
      };
    } catch (error) {
      if (error instanceof PriceFeedError) {
        throw error;
      }
      
      throw new PriceFeedError(
        PriceFeedErrorType.UNKNOWN,
        `Failed to get metadata for ${tokenSymbol}`
      );
    }
  }
}