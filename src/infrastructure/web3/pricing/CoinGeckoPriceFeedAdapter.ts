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
 * Adapter for CoinGecko API with support for both new and legacy interfaces
 */
export class CoinGeckoPriceFeedAdapter extends BasePriceFeedAdapter {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly tokenIdCache: Map<string, string> = new Map();
  private readonly metadataCache: Map<string, TokenMetadata> = new Map();
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private resetTime: number = 0;
  
  constructor(apiKey?: string) {
    super('CoinGecko', [
      'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 
      'CHF', 'CNY', 'INR', 'BTC', 'ETH'
    ]);
    
    this.baseUrl = 'https://api.coingecko.com/api/v3';
    this.apiKey = apiKey;
    
    // Precache common token mappings
    this.tokenIdCache.set('btc', 'bitcoin');
    this.tokenIdCache.set('eth', 'ethereum');
    this.tokenIdCache.set('sol', 'solana');
    this.tokenIdCache.set('avax', 'avalanche-2');
    this.tokenIdCache.set('matic', 'polygon');
    this.tokenIdCache.set('near', 'near');
    this.tokenIdCache.set('xrp', 'ripple');
    this.tokenIdCache.set('usdt', 'tether');
    this.tokenIdCache.set('usdc', 'usd-coin');
    this.tokenIdCache.set('bnb', 'binancecoin');
    this.tokenIdCache.set('ada', 'cardano');
    this.tokenIdCache.set('dot', 'polkadot');
    this.tokenIdCache.set('ftm', 'fantom');
    this.tokenIdCache.set('op', 'optimism');
    this.tokenIdCache.set('arb', 'arbitrum');
  }
  
  /**
   * Make a rate-limited API request to CoinGecko
   */
  private async fetchWithRateLimit(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    // Reset counter if time has passed
    const now = Date.now();
    if (now - this.resetTime > 60000) { // 1 minute
      this.requestCount = 0;
      this.resetTime = now;
    }
    
    // Enforce rate limits (10 calls/minute for free tier)
    const rateLimit = this.apiKey ? 30 : 10;
    if (this.requestCount >= rateLimit) {
      throw new PriceFeedError(
        PriceFeedErrorType.RATE_LIMIT,
        `Rate limit of ${rateLimit} requests per minute exceeded for CoinGecko API`
      );
    }
    
    // Add delay between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < 250 && this.lastRequestTime > 0) {
      await new Promise(resolve => setTimeout(resolve, 250 - timeSinceLastRequest));
    }
    
    // Build URL with parameters
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    // Add API key if available
    if (this.apiKey) {
      url.searchParams.append('x_cg_pro_api_key', this.apiKey);
    }
    
    try {
      const response = await fetch(url.toString());
      this.lastRequestTime = Date.now();
      this.requestCount++;
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new PriceFeedError(
            PriceFeedErrorType.RATE_LIMIT,
            'CoinGecko API rate limit exceeded'
          );
        }
        
        const errorText = await response.text();
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Get CoinGecko token ID from symbol
   * @param tokenSymbol Token symbol (e.g., "BTC", "ETH")
   * @returns CoinGecko ID for the token
   */
  private async getTokenId(tokenSymbol: string): Promise<string> {
    const normalizedSymbol = tokenSymbol.toLowerCase();
    
    // Check cache first
    if (this.tokenIdCache.has(normalizedSymbol)) {
      return this.tokenIdCache.get(normalizedSymbol)!;
    }
    
    try {
      // Search for the token
      const searchData = await this.fetchWithRateLimit('/search', {
        query: normalizedSymbol
      });
      
      if (!searchData.coins || searchData.coins.length === 0) {
        throw new PriceFeedError(
          PriceFeedErrorType.TOKEN_NOT_FOUND,
          `Token ${tokenSymbol} not found on CoinGecko`
        );
      }
      
      // Find exact match by symbol or use the first result
      const exactMatch = searchData.coins.find(
        (coin: any) => coin.symbol.toLowerCase() === normalizedSymbol
      );
      
      const tokenId = exactMatch ? exactMatch.id : searchData.coins[0].id;
      
      // Cache the result
      this.tokenIdCache.set(normalizedSymbol, tokenId);
      return tokenId;
    } catch (error) {
      return this.handleError(error, tokenSymbol);
    }
  }
  
  /**
   * Convert currency parameter to lowercase string
   */
  private normalizeCurrency(currency: string | PriceConversion): string {
    if (typeof currency === 'string') {
      return currency.toLowerCase();
    }
    
    // Handle PriceConversion enum
    switch (currency) {
      case PriceConversion.USD: return 'usd';
      case PriceConversion.EUR: return 'eur';
      case PriceConversion.BTC: return 'btc';
      case PriceConversion.ETH: return 'eth';
      default: return 'usd';
    }
  }
  
  /**
   * Get current price for a token
   */
  async getCurrentPrice(tokenSymbol: string, currency: string | PriceConversion = 'USD'): Promise<TokenPrice> {
    const normalizedCurrency = this.normalizeCurrency(currency);
    this.validateCurrency(normalizedCurrency);
    
    try {
      const tokenId = await this.getTokenId(tokenSymbol);
      
      const data = await this.fetchWithRateLimit('/simple/price', {
        ids: tokenId,
        vs_currencies: normalizedCurrency,
        include_market_cap: 'true',
        include_24h_vol: 'true',
        include_24h_change: 'true',
        include_last_updated_at: 'true'
      });
      
      if (!data[tokenId] || data[tokenId][normalizedCurrency] === undefined) {
        throw new PriceFeedError(
          PriceFeedErrorType.DATA_NOT_AVAILABLE,
          `Price data not available for ${tokenSymbol} in ${currency}`
        );
      }
      
      const priceData = data[tokenId];
      
      return {
        symbol: tokenSymbol.toUpperCase(),
        currency: typeof currency === 'string' ? currency.toUpperCase() : currency,
        price: priceData[normalizedCurrency],
        marketCap: priceData[`${normalizedCurrency}_market_cap`] || null,
        volume24h: priceData[`${normalizedCurrency}_24h_vol`] || null,
        priceChange24h: priceData[`${normalizedCurrency}_24h_change`] || null,
        lastUpdated: priceData.last_updated_at ? 
          new Date(priceData.last_updated_at * 1000).toISOString() : 
          new Date().toISOString()
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
        timestamp: Date.now(),
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
   * Get historical price data for a token
   */
  async getHistoricalPrices(
    tokenSymbol: string,
    currency: string | PriceConversion = 'USD',
    days: number = 7,
    interval: PriceInterval = PriceInterval.DAY
  ): Promise<PriceDataPoint[]> {
    const normalizedCurrency = this.normalizeCurrency(currency);
    this.validateCurrency(normalizedCurrency);
    
    try {
      const tokenId = await this.getTokenId(tokenSymbol);
      
      // Map our interval to CoinGecko format
      let cgInterval: string;
      switch (interval) {
        case PriceInterval.MINUTE:
          cgInterval = 'minutely';
          break;
        case PriceInterval.HOUR:
          cgInterval = 'hourly';
          break;
        case PriceInterval.WEEK:
          cgInterval = 'daily'; // CoinGecko doesn't have weekly interval
          break;
        case PriceInterval.DAY:
        default:
          cgInterval = 'daily';
      }
      
      const data = await this.fetchWithRateLimit(`/coins/${tokenId}/market_chart`, {
        vs_currency: normalizedCurrency,
        days: days.toString(),
        interval: cgInterval
      });
      
      if (!data.prices || !Array.isArray(data.prices) || data.prices.length === 0) {
        throw new PriceFeedError(
          PriceFeedErrorType.DATA_NOT_AVAILABLE,
          `Historical price data not available for ${tokenSymbol}`
        );
      }
      
      return data.prices.map((pricePoint: [number, number], index: number) => {
        const dataPoint: PriceDataPoint = {
          timestamp: new Date(pricePoint[0]).toISOString(),
          price: pricePoint[1]
        };
        
        // Add volume and market cap if available at the same timestamp
        if (data.market_caps && data.market_caps[index]) {
          dataPoint.marketCap = data.market_caps[index][1];
        }
        
        if (data.total_volumes && data.total_volumes[index]) {
          dataPoint.volume = data.total_volumes[index][1];
        }
        
        return dataPoint;
      });
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
        case 'hourly': priceInterval = PriceInterval.HOUR; break;
        case 'weekly': priceInterval = PriceInterval.WEEK; break;
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
          marketCap: point.marketCap,
          volume: point.volume
        }))
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
      const result: Record<string, PriceData> = {};
      
      for (const symbol of symbols) {
        try {
          const price = await this.getPrice(symbol, currency);
          result[symbol.toUpperCase()] = price;
        } catch (error) {
          console.error(`Error getting price for ${symbol}:`, error);
          // Continue with other symbols
        }
      }
      
      return result;
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Get token metadata
   */
  async getTokenMetadata(tokenSymbol: string): Promise<TokenMetadata> {
    const normalizedSymbol = tokenSymbol.toLowerCase();
    
    // Check cache first
    if (this.metadataCache.has(normalizedSymbol)) {
      return structuredClone(this.metadataCache.get(normalizedSymbol)!);
    }
    
    try {
      const tokenId = await this.getTokenId(normalizedSymbol);
      
      const data = await this.fetchWithRateLimit(`/coins/${tokenId}`, {
        localization: 'false',
        tickers: 'false',
        market_data: 'false',
        community_data: 'false',
        developer_data: 'false'
      });
      
      // Build metadata object
      const metadata: TokenMetadata = {
        symbol: tokenSymbol.toUpperCase(),
        name: data.name,
        description: data.description?.en,
        logoUrl: data.image?.large,
        website: data.links?.homepage?.[0] || undefined,
        explorers: data.links?.blockchain_site?.filter(Boolean) || undefined,
        socialLinks: {
          twitter: data.links?.twitter_screen_name ? 
            `https://twitter.com/${data.links.twitter_screen_name}` : undefined,
          telegram: data.links?.telegram_channel_identifier ? 
            `https://t.me/${data.links.telegram_channel_identifier}` : undefined,
          reddit: data.links?.subreddit_url || undefined
        },
        contractAddresses: data.platforms || undefined,
        lastUpdated: new Date().toISOString()
      };
      
      // Cache the result
      this.metadataCache.set(normalizedSymbol, structuredClone(metadata));
      
      return metadata;
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