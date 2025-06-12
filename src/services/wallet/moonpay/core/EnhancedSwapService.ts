/**
 * Enhanced MoonPay Swap Service
 * Advanced cryptocurrency swapping with routing, aggregation, and DeFi integration
 */

export interface SwapRoute {
  id: string;
  fromToken: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoUrl: string;
  };
  toToken: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoUrl: string;
  };
  fromAmount: number;
  toAmount: number;
  rate: number;
  priceImpact: number;
  minimumReceived: number;
  path: Array<{
    token: string;
    symbol: string;
    percentage: number;
  }>;
  protocols: Array<{
    name: string;
    percentage: number;
    estimatedGas: number;
  }>;
  estimatedGas: number;
  gasPrice: number;
  fees: {
    moonpayFee: number;
    protocolFees: number;
    networkFee: number;
    totalFee: number;
  };
  estimatedTime: number; // seconds
  slippageTolerance: number;
  validUntil: string;
  warnings: string[];
}

export interface SwapAggregation {
  bestRoute: SwapRoute;
  alternativeRoutes: SwapRoute[];
  comparison: {
    bestPrice: number;
    worstPrice: number;
    priceDifference: number;
    savings: number;
    savingsPercentage: number;
  };
  marketDepth: {
    available: number;
    impact1Percent: number;
    impact5Percent: number;
    impact10Percent: number;
  };
  liquidityAnalysis: {
    totalLiquidity: number;
    mainSources: Array<{
      protocol: string;
      liquidity: number;
      percentage: number;
    }>;
    fragmentation: number;
  };
}

export interface LimitOrder {
  id: string;
  userId: string;
  fromToken: string;
  toToken: string;
  fromAmount: number;
  targetRate: number;
  targetAmount: number;
  currentRate: number;
  fillPercentage: number;
  filledAmount: number;
  remainingAmount: number;
  status: 'open' | 'partially_filled' | 'filled' | 'cancelled' | 'expired';
  orderType: 'limit' | 'stop_loss' | 'take_profit';
  validUntil: string;
  slippageTolerance: number;
  partialFillEnabled: boolean;
  fills: Array<{
    amount: number;
    rate: number;
    timestamp: string;
    transactionHash: string;
    gasCost: number;
  }>;
  conditions: {
    minFillAmount?: number;
    maxGasPrice?: number;
    timeConditions?: Array<{
      type: 'after' | 'before' | 'between';
      timestamp: string | { start: string; end: string };
    }>;
  };
  createdAt: string;
  updatedAt: string;
  lastChecked: string;
}

export interface SwapStrategy {
  id: string;
  name: string;
  description: string;
  type: 'dca' | 'momentum' | 'mean_reversion' | 'arbitrage' | 'grid' | 'custom';
  isActive: boolean;
  configuration: {
    fromToken: string;
    toToken: string;
    totalAmount: number;
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    conditions: Array<{
      type: 'price_above' | 'price_below' | 'rsi_above' | 'rsi_below' | 'volume_spike' | 'custom';
      value: number;
      operator: 'greater_than' | 'less_than' | 'equals';
    }>;
    riskManagement: {
      maxSlippage: number;
      maxGasPrice: number;
      stopLoss?: number;
      takeProfit?: number;
    };
  };
  execution: {
    totalExecuted: number;
    averageRate: number;
    totalGasCost: number;
    successRate: number;
    lastExecution?: string;
    nextExecution?: string;
  };
  performance: {
    totalReturn: number;
    returnPercentage: number;
    benchmark: number;
    alpha: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
  history: Array<{
    date: string;
    action: 'buy' | 'sell' | 'pause' | 'resume';
    amount: number;
    rate: number;
    gasCost: number;
    reason: string;
    transactionHash?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface SwapAnalytics {
  overview: {
    totalVolume: number;
    totalSwaps: number;
    uniqueUsers: number;
    averageSize: number;
    totalFees: number;
  };
  topPairs: Array<{
    fromToken: string;
    toToken: string;
    volume: number;
    count: number;
    averageSize: number;
  }>;
  tokenMetrics: Array<{
    token: string;
    volume: number;
    price: number;
    priceChange24h: number;
    volatility: number;
    liquidity: number;
    dominance: number;
  }>;
  protocolUsage: Array<{
    protocol: string;
    volume: number;
    percentage: number;
    averageGas: number;
    successRate: number;
  }>;
  timeSeriesData: Array<{
    timestamp: string;
    volume: number;
    swapCount: number;
    averageSlippage: number;
    gasUsed: number;
  }>;
  userSegmentation: {
    retail: { count: number; volume: number };
    whale: { count: number; volume: number };
    institutional: { count: number; volume: number };
  };
}

export interface ArbitrageOpportunity {
  id: string;
  tokenPair: { from: string; to: string };
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  spreadPercentage: number;
  estimatedProfit: number;
  estimatedProfitPercentage: number;
  requiredCapital: number;
  maxTradeSize: number;
  gasEstimate: number;
  netProfit: number;
  confidence: number;
  timeWindow: number; // seconds
  complexity: 'simple' | 'triangle' | 'multi_hop';
  risks: Array<{
    type: 'slippage' | 'gas_spike' | 'price_movement' | 'liquidity';
    severity: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  executionSteps: Array<{
    action: 'buy' | 'sell' | 'transfer';
    exchange: string;
    token: string;
    amount: number;
    estimatedGas: number;
  }>;
  lastUpdated: string;
  expiresAt: string;
}

export interface LiquidityPool {
  id: string;
  protocol: string;
  address: string;
  token0: {
    address: string;
    symbol: string;
    reserve: number;
  };
  token1: {
    address: string;
    symbol: string;
    reserve: number;
  };
  totalLiquidity: number;
  volume24h: number;
  fees24h: number;
  apy: number;
  utilization: number;
  lpTokenSupply: number;
  lpTokenPrice: number;
  priceImpact: {
    onePercent: number;
    fivePercent: number;
    tenPercent: number;
  };
  historicalData: Array<{
    timestamp: string;
    liquidity: number;
    volume: number;
    fees: number;
    price: number;
  }>;
  lastUpdated: string;
}

/**
 * Enhanced Swap Service for MoonPay
 */
export class EnhancedSwapService {
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
   * Get available swap pairs
   */
  async getSwapPairs(): Promise<Array<{
    baseCurrency: string;
    quoteCurrency: string;
    minAmount: number;
    maxAmount: number;
    isActive: boolean;
    networkFee: number;
  }>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v3/swap/pairs`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Get swap pairs API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting swap pairs:', error);
      throw new Error(`Failed to get swap pairs: ${error.message}`);
    }
  }

  /**
   * Get optimal swap route with aggregation
   */
  async getSwapRoute(
    fromToken: string,
    toToken: string,
    amount: number,
    slippageTolerance: number = 1,
    gasPrice?: number,
    includeAlternatives: boolean = true
  ): Promise<SwapAggregation> {
    try {
      const params = new URLSearchParams({
        fromToken,
        toToken,
        amount: amount.toString(),
        slippageTolerance: slippageTolerance.toString(),
        includeAlternatives: includeAlternatives.toString(),
        ...(gasPrice && { gasPrice: gasPrice.toString() })
      });

      const response = await fetch(`${this.apiBaseUrl}/v4/swap/route?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Swap route API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting swap route:', error);
      throw new Error(`Failed to get swap route: ${error.message}`);
    }
  }

  /**
   * Execute swap transaction
   */
  async executeSwap(
    routeId: string,
    userAddress: string,
    slippageTolerance?: number,
    gasPrice?: number,
    referrer?: string
  ): Promise<{
    transactionId: string;
    transactionHash?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    estimatedCompletion: string;
    actualAmountReceived?: number;
    gasCost?: number;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/swap/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          routeId,
          userAddress,
          slippageTolerance,
          gasPrice,
          referrer
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Execute swap API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error executing swap:', error);
      throw new Error(`Failed to execute swap: ${error.message}`);
    }
  }

  /**
   * Create limit order
   */
  async createLimitOrder(orderData: {
    fromToken: string;
    toToken: string;
    fromAmount: number;
    targetRate: number;
    validUntil: string;
    slippageTolerance: number;
    partialFillEnabled: boolean;
    orderType: 'limit' | 'stop_loss' | 'take_profit';
    conditions?: any;
  }): Promise<LimitOrder> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/swap/limit-orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Create limit order API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating limit order:', error);
      throw new Error(`Failed to create limit order: ${error.message}`);
    }
  }

  /**
   * Get user limit orders
   */
  async getLimitOrders(
    userId: string,
    status?: string,
    limit: number = 50
  ): Promise<LimitOrder[]> {
    try {
      const params = new URLSearchParams({
        userId,
        limit: limit.toString(),
        ...(status && { status })
      });

      const response = await fetch(`${this.apiBaseUrl}/v4/swap/limit-orders?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Limit orders API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting limit orders:', error);
      throw new Error(`Failed to get limit orders: ${error.message}`);
    }
  }

  /**
   * Cancel limit order
   */
  async cancelLimitOrder(orderId: string): Promise<{ cancelled: boolean; refundAmount?: number }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/swap/limit-orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Cancel order API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error cancelling limit order:', error);
      throw new Error(`Failed to cancel limit order: ${error.message}`);
    }
  }

  /**
   * Create swap strategy
   */
  async createSwapStrategy(
    strategyData: Omit<SwapStrategy, 'id' | 'execution' | 'performance' | 'history' | 'createdAt' | 'updatedAt'>
  ): Promise<SwapStrategy> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/swap/strategies`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(strategyData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Create strategy API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating swap strategy:', error);
      throw new Error(`Failed to create swap strategy: ${error.message}`);
    }
  }

  /**
   * Get swap strategies
   */
  async getSwapStrategies(
    userId?: string,
    type?: string,
    isActive?: boolean
  ): Promise<SwapStrategy[]> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (type) params.append('type', type);
      if (isActive !== undefined) params.append('isActive', isActive.toString());

      const response = await fetch(`${this.apiBaseUrl}/v4/swap/strategies?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Swap strategies API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting swap strategies:', error);
      throw new Error(`Failed to get swap strategies: ${error.message}`);
    }
  }

  /**
   * Get arbitrage opportunities
   */
  async getArbitrageOpportunities(
    minProfit: number = 50, // USD
    maxComplexity: 'simple' | 'triangle' | 'multi_hop' = 'triangle',
    tokens?: string[]
  ): Promise<ArbitrageOpportunity[]> {
    try {
      const params = new URLSearchParams({
        minProfit: minProfit.toString(),
        maxComplexity,
        ...(tokens && { tokens: tokens.join(',') })
      });

      const response = await fetch(`${this.apiBaseUrl}/v4/swap/arbitrage?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Arbitrage opportunities API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting arbitrage opportunities:', error);
      throw new Error(`Failed to get arbitrage opportunities: ${error.message}`);
    }
  }

  /**
   * Execute arbitrage opportunity
   */
  async executeArbitrage(
    opportunityId: string,
    amount: number,
    userAddress: string
  ): Promise<{
    transactionIds: string[];
    estimatedProfit: number;
    status: 'pending' | 'executing' | 'completed' | 'failed';
    steps: Array<{
      step: number;
      status: string;
      transactionHash?: string;
    }>;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/swap/arbitrage/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          opportunityId,
          amount,
          userAddress
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Execute arbitrage API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error executing arbitrage:', error);
      throw new Error(`Failed to execute arbitrage: ${error.message}`);
    }
  }

  /**
   * Get liquidity pools
   */
  async getLiquidityPools(
    protocol?: string,
    tokens?: string[],
    minLiquidity?: number,
    sortBy: 'liquidity' | 'volume' | 'apy' = 'liquidity'
  ): Promise<LiquidityPool[]> {
    try {
      const params = new URLSearchParams({
        sortBy,
        ...(protocol && { protocol }),
        ...(tokens && { tokens: tokens.join(',') }),
        ...(minLiquidity && { minLiquidity: minLiquidity.toString() })
      });

      const response = await fetch(`${this.apiBaseUrl}/v4/swap/liquidity-pools?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Liquidity pools API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting liquidity pools:', error);
      throw new Error(`Failed to get liquidity pools: ${error.message}`);
    }
  }

  /**
   * Get swap analytics
   */
  async getSwapAnalytics(
    period: '24h' | '7d' | '30d' = '24h',
    tokens?: string[]
  ): Promise<SwapAnalytics> {
    try {
      const params = new URLSearchParams({
        period,
        ...(tokens && { tokens: tokens.join(',') })
      });

      const response = await fetch(`${this.apiBaseUrl}/v4/swap/analytics?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Swap analytics API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting swap analytics:', error);
      throw new Error(`Failed to get swap analytics: ${error.message}`);
    }
  }

  /**
   * Get token prices with multiple sources
   */
  async getTokenPrices(
    tokens: string[],
    vs_currency: string = 'usd',
    includeHistory: boolean = false
  ): Promise<Record<string, {
    price: number;
    priceChange24h: number;
    volume24h: number;
    marketCap: number;
    sources: Array<{
      exchange: string;
      price: number;
      volume: number;
    }>;
    history?: Array<{
      timestamp: string;
      price: number;
      volume: number;
    }>;
  }>> {
    try {
      const params = new URLSearchParams({
        tokens: tokens.join(','),
        vs_currency,
        includeHistory: includeHistory.toString()
      });

      const response = await fetch(`${this.apiBaseUrl}/v4/swap/prices?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Token prices API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting token prices:', error);
      throw new Error(`Failed to get token prices: ${error.message}`);
    }
  }

  /**
   * Simulate swap for testing
   */
  async simulateSwap(
    fromToken: string,
    toToken: string,
    amount: number,
    route?: string[]
  ): Promise<{
    estimatedOutput: number;
    priceImpact: number;
    gasEstimate: number;
    fees: number;
    warnings: string[];
    simulation: {
      success: boolean;
      revertReason?: string;
      gasUsed: number;
      logs: Array<{
        address: string;
        topics: string[];
        data: string;
      }>;
    };
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/swap/simulate`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fromToken,
          toToken,
          amount,
          route
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Simulate swap API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error simulating swap:', error);
      throw new Error(`Failed to simulate swap: ${error.message}`);
    }
  }
}

export const enhancedSwapService = new EnhancedSwapService(
  import.meta.env.VITE_MOONPAY_API_KEY || "",
  import.meta.env.VITE_MOONPAY_SECRET_KEY || ""
);
