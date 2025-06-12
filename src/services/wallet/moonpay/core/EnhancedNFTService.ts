/**
 * Enhanced MoonPay NFT Service
 * Advanced NFT marketplace, minting, trading, and management capabilities
 */

export interface NFTCollection {
  id: string;
  name: string;
  description: string;
  symbol: string;
  contractAddress: string;
  network: string;
  standard: 'ERC721' | 'ERC1155' | 'SPL' | 'BEP721' | 'BEP1155';
  totalSupply: number;
  maxSupply?: number;
  mintedCount: number;
  burnedCount: number;
  floorPrice?: number;
  volume24h: number;
  volumeTotal: number;
  holderCount: number;
  creator: {
    address: string;
    name?: string;
    verified: boolean;
  };
  royalties: {
    percentage: number;
    recipient: string;
  };
  metadata: {
    image: string;
    bannerImage?: string;
    externalUrl?: string;
    discord?: string;
    twitter?: string;
    instagram?: string;
  };
  categories: string[];
  tags: string[];
  isVerified: boolean;
  isNSFW: boolean;
  tradingEnabled: boolean;
  mintingEnabled: boolean;
  revealDate?: string;
  launchDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface NFTToken {
  id: string;
  tokenId: string;
  collectionId: string;
  name: string;
  description?: string;
  image: string;
  animationUrl?: string;
  externalUrl?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: 'number' | 'boost_percentage' | 'boost_number' | 'date';
    max_value?: number;
  }>;
  rarity: {
    rank: number;
    score: number;
    percentile: number;
  };
  owner: {
    address: string;
    name?: string;
  };
  currentListing?: {
    id: string;
    price: number;
    currency: string;
    marketplace: string;
    expiresAt: string;
  };
  lastSale?: {
    price: number;
    currency: string;
    timestamp: string;
    buyer: string;
    seller: string;
  };
  transferHistory: Array<{
    from: string;
    to: string;
    timestamp: string;
    transactionHash: string;
    price?: number;
    currency?: string;
  }>;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface NFTListing {
  id: string;
  tokenId: string;
  collectionId: string;
  seller: {
    address: string;
    name?: string;
    verified: boolean;
  };
  price: number;
  currency: string;
  marketplace: 'moonpay' | 'opensea' | 'blur' | 'looksrare' | 'x2y2' | 'other';
  listingType: 'fixed_price' | 'auction' | 'dutch_auction';
  startTime: string;
  endTime: string;
  isActive: boolean;
  reservePrice?: number;
  buyoutPrice?: number;
  minBidIncrement?: number;
  currentBid?: {
    amount: number;
    bidder: string;
    timestamp: string;
  };
  bids: Array<{
    id: string;
    amount: number;
    bidder: string;
    timestamp: string;
    isWinning: boolean;
  }>;
  status: 'active' | 'sold' | 'cancelled' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface NFTMarketplaceStats {
  overview: {
    totalCollections: number;
    totalTokens: number;
    totalVolume: number;
    totalSales: number;
    averagePrice: number;
    uniqueHolders: number;
    activeListings: number;
  };
  topCollections: Array<{
    collection: NFTCollection;
    volume24h: number;
    floorPrice: number;
    priceChange24h: number;
    salesCount24h: number;
  }>;
  recentSales: Array<{
    token: NFTToken;
    price: number;
    currency: string;
    buyer: string;
    seller: string;
    timestamp: string;
    marketplace: string;
  }>;
  priceHistory: Array<{
    timestamp: string;
    averagePrice: number;
    volume: number;
    salesCount: number;
  }>;
  trends: {
    volumeTrend: 'up' | 'down' | 'stable';
    priceTrend: 'up' | 'down' | 'stable';
    activityTrend: 'up' | 'down' | 'stable';
  };
}

export interface NFTPortfolio {
  owner: string;
  totalValue: number;
  totalCount: number;
  collections: Array<{
    collection: NFTCollection;
    tokenCount: number;
    floorValue: number;
    estimatedValue: number;
    profitLoss: number;
    profitLossPercentage: number;
  }>;
  tokens: NFTToken[];
  performance: {
    totalInvested: number;
    currentValue: number;
    realizedGains: number;
    unrealizedGains: number;
    roi: number;
  };
  recentActivity: Array<{
    type: 'purchase' | 'sale' | 'transfer' | 'mint';
    token: NFTToken;
    price?: number;
    timestamp: string;
    transactionHash: string;
  }>;
}

export interface NFTMintingCampaign {
  id: string;
  collectionId: string;
  name: string;
  description: string;
  mintPrice: number;
  currency: string;
  maxPerWallet: number;
  maxSupply: number;
  mintedCount: number;
  startTime: string;
  endTime: string;
  whitelistEnabled: boolean;
  whitelistAddresses: string[];
  phases: Array<{
    name: string;
    startTime: string;
    endTime: string;
    price: number;
    maxPerWallet: number;
    eligibility: 'public' | 'whitelist' | 'holders';
  }>;
  revealStrategy: 'immediate' | 'delayed' | 'batch';
  revealDate?: string;
  metadataUri: string;
  status: 'upcoming' | 'active' | 'paused' | 'completed' | 'cancelled';
  social: {
    discord?: string;
    twitter?: string;
    website?: string;
  };
  analytics: {
    pageViews: number;
    uniqueVisitors: number;
    conversionRate: number;
    socialEngagement: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NFTRoyaltyDistribution {
  id: string;
  collectionId: string;
  period: { start: string; end: string };
  totalRoyalties: number;
  currency: string;
  transactions: Array<{
    tokenId: string;
    salePrice: number;
    royaltyAmount: number;
    buyer: string;
    seller: string;
    timestamp: string;
    marketplace: string;
  }>;
  distributions: Array<{
    recipient: string;
    amount: number;
    percentage: number;
    status: 'pending' | 'paid' | 'failed';
    transactionHash?: string;
  }>;
  status: 'calculating' | 'ready' | 'distributed' | 'failed';
  createdAt: string;
  distributedAt?: string;
}

/**
 * Enhanced NFT Service for MoonPay
 */
export class EnhancedNFTService {
  private apiBaseUrl: string;
  private apiKey: string;
  private secretKey: string;

  constructor(apiKey: string, secretKey: string, testMode: boolean = true) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.apiBaseUrl = testMode 
      ? "https://api.moonpay.com" 
      : "https://api.moonpay.com";
  }

  /**
   * Get NFT collections with advanced filtering
   */
  async getCollections(filters: {
    category?: string;
    network?: string;
    verified?: boolean;
    sortBy?: 'volume' | 'floor_price' | 'created_date' | 'trending';
    orderBy?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  } = {}): Promise<{ collections: NFTCollection[]; total: number; hasMore: boolean }> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.apiBaseUrl}/v4/nft/collections?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Collections API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        collections: data.collections || [],
        total: data.total || 0,
        hasMore: data.hasMore || false
      };
    } catch (error) {
      console.error('Error getting NFT collections:', error);
      throw new Error(`Failed to get NFT collections: ${error.message}`);
    }
  }

  /**
   * Get collection details with analytics
   */
  async getCollectionDetails(collectionId: string, includeAnalytics: boolean = true): Promise<{
    collection: NFTCollection;
    analytics?: {
      volume24h: number;
      volume7d: number;
      volume30d: number;
      floorPrice24h: number;
      avgPrice24h: number;
      salesCount24h: number;
      holderGrowth: number;
      topTraits: Array<{ trait: string; count: number; floorPrice: number }>;
    };
  }> {
    try {
      const params = new URLSearchParams();
      if (includeAnalytics) {
        params.append('includeAnalytics', 'true');
      }

      const response = await fetch(`${this.apiBaseUrl}/v4/nft/collections/${collectionId}?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Collection details API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting collection details:', error);
      throw new Error(`Failed to get collection details: ${error.message}`);
    }
  }

  /**
   * Get NFT tokens with advanced filtering
   */
  async getTokens(filters: {
    collectionId?: string;
    owner?: string;
    listed?: boolean;
    priceRange?: { min: number; max: number };
    traits?: Record<string, string[]>;
    rarity?: { min: number; max: number };
    sortBy?: 'price' | 'rarity' | 'recent' | 'oldest';
    limit?: number;
    offset?: number;
  } = {}): Promise<{ tokens: NFTToken[]; total: number; hasMore: boolean }> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (typeof value === 'object') {
            params.append(key, JSON.stringify(value));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`${this.apiBaseUrl}/v4/nft/tokens?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Tokens API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        tokens: data.tokens || [],
        total: data.total || 0,
        hasMore: data.hasMore || false
      };
    } catch (error) {
      console.error('Error getting NFT tokens:', error);
      throw new Error(`Failed to get NFT tokens: ${error.message}`);
    }
  }

  /**
   * Get token details with full metadata
   */
  async getTokenDetails(
    collectionId: string, 
    tokenId: string,
    includeHistory: boolean = true
  ): Promise<NFTToken> {
    try {
      const params = new URLSearchParams();
      if (includeHistory) {
        params.append('includeHistory', 'true');
      }

      const response = await fetch(`${this.apiBaseUrl}/v4/nft/collections/${collectionId}/tokens/${tokenId}?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Token details API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting token details:', error);
      throw new Error(`Failed to get token details: ${error.message}`);
    }
  }

  /**
   * Create NFT listing
   */
  async createListing(listingData: {
    tokenId: string;
    collectionId: string;
    price: number;
    currency: string;
    listingType: 'fixed_price' | 'auction' | 'dutch_auction';
    duration: number; // hours
    reservePrice?: number;
    buyoutPrice?: number;
  }): Promise<NFTListing> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/nft/listings`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(listingData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Create listing API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating NFT listing:', error);
      throw new Error(`Failed to create NFT listing: ${error.message}`);
    }
  }

  /**
   * Purchase NFT
   */
  async purchaseNFT(
    listingId: string,
    buyerAddress: string,
    paymentMethod?: 'crypto' | 'fiat'
  ): Promise<{
    transactionId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    paymentUrl?: string;
    transactionHash?: string;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/nft/purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          listingId,
          buyerAddress,
          paymentMethod: paymentMethod || 'fiat'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Purchase NFT API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error purchasing NFT:', error);
      throw new Error(`Failed to purchase NFT: ${error.message}`);
    }
  }

  /**
   * Place bid on NFT auction
   */
  async placeBid(
    listingId: string,
    bidAmount: number,
    bidderAddress: string
  ): Promise<{
    bidId: string;
    status: 'placed' | 'outbid' | 'winning' | 'failed';
    currentHighestBid: number;
    nextMinimumBid: number;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/nft/bids`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          listingId,
          bidAmount,
          bidderAddress
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Place bid API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error placing bid:', error);
      throw new Error(`Failed to place bid: ${error.message}`);
    }
  }

  /**
   * Get marketplace statistics
   */
  async getMarketplaceStats(period: '24h' | '7d' | '30d' | 'all' = '24h'): Promise<NFTMarketplaceStats> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/nft/marketplace/stats?period=${period}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Marketplace stats API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting marketplace stats:', error);
      throw new Error(`Failed to get marketplace stats: ${error.message}`);
    }
  }

  /**
   * Get user NFT portfolio
   */
  async getUserPortfolio(userAddress: string, includePerformance: boolean = true): Promise<NFTPortfolio> {
    try {
      const params = new URLSearchParams();
      if (includePerformance) {
        params.append('includePerformance', 'true');
      }

      const response = await fetch(`${this.apiBaseUrl}/v4/nft/portfolio/${userAddress}?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Portfolio API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting user portfolio:', error);
      throw new Error(`Failed to get user portfolio: ${error.message}`);
    }
  }

  /**
   * Create minting campaign
   */
  async createMintingCampaign(
    campaignData: Omit<NFTMintingCampaign, 'id' | 'mintedCount' | 'analytics' | 'createdAt' | 'updatedAt'>
  ): Promise<NFTMintingCampaign> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/nft/minting/campaigns`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Create campaign API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating minting campaign:', error);
      throw new Error(`Failed to create minting campaign: ${error.message}`);
    }
  }

  /**
   * Mint NFT tokens
   */
  async mintTokens(
    campaignId: string,
    quantity: number,
    recipientAddress: string,
    paymentMethod?: 'crypto' | 'fiat'
  ): Promise<{
    transactionId: string;
    tokenIds: string[];
    status: 'pending' | 'processing' | 'completed' | 'failed';
    paymentUrl?: string;
    transactionHash?: string;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/nft/minting/mint`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          campaignId,
          quantity,
          recipientAddress,
          paymentMethod: paymentMethod || 'fiat'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Mint tokens API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error minting tokens:', error);
      throw new Error(`Failed to mint tokens: ${error.message}`);
    }
  }

  /**
   * Get royalty distributions
   */
  async getRoyaltyDistributions(
    collectionId: string,
    period?: { start: string; end: string }
  ): Promise<NFTRoyaltyDistribution[]> {
    try {
      const params = new URLSearchParams();
      if (period) {
        params.append('startDate', period.start);
        params.append('endDate', period.end);
      }

      const response = await fetch(`${this.apiBaseUrl}/v4/nft/collections/${collectionId}/royalties?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Royalty distributions API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting royalty distributions:', error);
      throw new Error(`Failed to get royalty distributions: ${error.message}`);
    }
  }

  /**
   * Calculate NFT valuation
   */
  async calculateValuation(
    collectionId: string,
    tokenId: string,
    method: 'floor_price' | 'recent_sales' | 'ai_estimate' | 'comprehensive' = 'comprehensive'
  ): Promise<{
    estimatedValue: number;
    currency: string;
    confidence: number;
    factors: Array<{
      factor: string;
      weight: number;
      value: number;
      influence: 'positive' | 'negative' | 'neutral';
    }>;
    comparables: Array<{
      tokenId: string;
      salePrice: number;
      saleDate: string;
      similarity: number;
    }>;
    lastUpdated: string;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/nft/valuation`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          collectionId,
          tokenId,
          method
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Valuation API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calculating valuation:', error);
      throw new Error(`Failed to calculate valuation: ${error.message}`);
    }
  }

  /**
   * Get trending NFTs
   */
  async getTrendingNFTs(
    timeframe: '1h' | '6h' | '24h' | '7d' = '24h',
    category?: string,
    limit: number = 20
  ): Promise<Array<{
    token: NFTToken;
    collection: NFTCollection;
    trendingScore: number;
    priceChange: number;
    volumeChange: number;
    socialMentions: number;
  }>> {
    try {
      const params = new URLSearchParams({
        timeframe,
        limit: limit.toString(),
        ...(category && { category })
      });

      const response = await fetch(`${this.apiBaseUrl}/v4/nft/trending?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Trending NFTs API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting trending NFTs:', error);
      throw new Error(`Failed to get trending NFTs: ${error.message}`);
    }
  }
}

export const enhancedNFTService = new EnhancedNFTService(
  import.meta.env.VITE_MOONPAY_API_KEY || "",
  import.meta.env.VITE_MOONPAY_SECRET_KEY || ""
);
