import { supabase } from '@/infrastructure/database/client';
import { 
  MoonpayService, 
  MoonpaySwapPair, 
  MoonpaySwapQuote, 
  MoonpaySwapTransaction 
} from '../MoonpayService';
import { v4 as uuidv4 } from 'uuid';

export interface SwapRouteAnalysis {
  directRoute?: {
    pair: MoonpaySwapPair;
    expectedOutput: number;
    priceImpact: number;
    fees: number;
  };
  indirectRoutes?: Array<{
    pairs: MoonpaySwapPair[];
    expectedOutput: number;
    priceImpact: number;
    fees: number;
    intermediaryTokens: string[];
  }>;
  bestRoute: 'direct' | 'indirect';
  recommendation: string;
}

export interface SwapPortfolioBalance {
  currency: string;
  balance: number;
  valueUSD: number;
  allocation: number; // percentage
}

export interface SwapHistory {
  transactions: MoonpaySwapTransaction[];
  totalVolume: number;
  totalFees: number;
  profitLoss: number;
  favoriteRoutes: Array<{
    route: string;
    count: number;
    avgAmount: number;
  }>;
}

export interface SwapLimitOrder {
  id: string;
  baseCurrency: string;
  quoteCurrency: string;
  baseAmount: number;
  targetRate: number;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface SwapSlippageSettings {
  auto: boolean;
  customPercentage?: number;
  maxSlippage: number;
}

/**
 * Advanced Swap Service for Cross-Chain Cryptocurrency Trading
 * Handles swap quotes, execution, route analysis, and portfolio management
 */
export class SwapService {
  private moonpayService: MoonpayService;
  private swapPairsCache: Map<string, MoonpaySwapPair[]> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes

  constructor(moonpayService: MoonpayService) {
    this.moonpayService = moonpayService;
  }

  // ===== SWAP PAIRS & ROUTES =====

  /**
   * Get available swap pairs with caching
   */
  async getSwapPairs(refresh: boolean = false): Promise<MoonpaySwapPair[]> {
    const cacheKey = 'all_pairs';
    const cached = this.swapPairsCache.get(cacheKey);
    
    if (!refresh && cached) {
      return cached;
    }

    try {
      const pairs = await this.moonpayService.getSwapPairs();
      this.swapPairsCache.set(cacheKey, pairs);
      
      // Auto-refresh cache
      setTimeout(() => {
        this.swapPairsCache.delete(cacheKey);
      }, this.cacheExpiry);

      return pairs;
    } catch (error) {
      console.error('Error getting swap pairs:', error);
      throw new Error(`Failed to get swap pairs: ${error.message}`);
    }
  }

  /**
   * Find best swap route with analysis
   */
  async analyzeSwapRoute(
    baseCurrency: string,
    quoteCurrency: string,
    baseAmount: number
  ): Promise<SwapRouteAnalysis> {
    try {
      const pairs = await this.getSwapPairs();
      
      // Find direct route
      const directPair = pairs.find(pair => 
        pair.baseCurrency === baseCurrency && pair.quoteCurrency === quoteCurrency
      );

      const analysis: SwapRouteAnalysis = {
        bestRoute: 'direct',
        recommendation: 'No suitable route found'
      };

      if (directPair && baseAmount >= directPair.minAmount && baseAmount <= directPair.maxAmount) {
        // Calculate direct route
        const expectedOutput = baseAmount * (1 - (directPair.networkFee / baseAmount));
        const priceImpact = this.calculatePriceImpact(baseAmount, directPair);
        
        analysis.directRoute = {
          pair: directPair,
          expectedOutput,
          priceImpact,
          fees: directPair.networkFee
        };
        analysis.recommendation = 'Direct route available with low fees';
      }

      // Find indirect routes (for complex swaps)
      const indirectRoutes = await this.findIndirectRoutes(baseCurrency, quoteCurrency, baseAmount, pairs);
      
      if (indirectRoutes.length > 0) {
        analysis.indirectRoutes = indirectRoutes;
        
        // Compare routes
        if (analysis.directRoute && indirectRoutes[0]) {
          analysis.bestRoute = indirectRoutes[0].expectedOutput > analysis.directRoute.expectedOutput 
            ? 'indirect' 
            : 'direct';
          analysis.recommendation = analysis.bestRoute === 'indirect' 
            ? 'Indirect route offers better rates despite higher complexity'
            : 'Direct route is most efficient';
        } else if (indirectRoutes[0]) {
          analysis.bestRoute = 'indirect';
          analysis.recommendation = 'Only indirect routes available';
        }
      }

      return analysis;
    } catch (error) {
      console.error('Error analyzing swap route:', error);
      throw new Error(`Failed to analyze swap route: ${error.message}`);
    }
  }

  // ===== SWAP EXECUTION =====

  /**
   * Get swap quote with slippage protection
   */
  async getSwapQuote(
    baseCurrency: string,
    quoteCurrency: string,
    baseAmount: number,
    fromAddress: string,
    toAddress: string,
    slippageSettings: SwapSlippageSettings
  ): Promise<MoonpaySwapQuote & { slippageAnalysis: any }> {
    try {
      const quote = await this.moonpayService.getSwapQuote(
        baseCurrency,
        quoteCurrency,
        baseAmount,
        fromAddress,
        toAddress
      );

      // Calculate slippage analysis
      const slippageAnalysis = this.calculateSlippageAnalysis(quote, slippageSettings);

      return {
        ...quote,
        slippageAnalysis
      };
    } catch (error) {
      console.error('Error getting swap quote:', error);
      throw new Error(`Failed to get swap quote: ${error.message}`);
    }
  }

  /**
   * Execute swap with monitoring
   */
  async executeSwap(
    quoteId: string,
    expectedSlippage: number
  ): Promise<MoonpaySwapTransaction> {
    try {
      const swapTransaction = await this.moonpayService.executeSwapQuote(quoteId);
      
      // Store in local database with enhanced metadata
      await this.storeSwapTransaction(swapTransaction, { expectedSlippage });
      
      // Start monitoring transaction
      this.monitorSwapTransaction(swapTransaction.id);
      
      return swapTransaction;
    } catch (error) {
      console.error('Error executing swap:', error);
      throw new Error(`Failed to execute swap: ${error.message}`);
    }
  }

  /**
   * Monitor swap transaction status
   */
  private async monitorSwapTransaction(transactionId: string): Promise<void> {
    const checkStatus = async () => {
      try {
        const transaction = await this.moonpayService.getSwapTransaction(transactionId);
        
        // Update local database
        await supabase
          .from('moonpay_swap_transactions')
          .update({
            status: transaction.status,
            tx_hash: transaction.txHash,
            updated_at: new Date().toISOString()
          })
          .eq('external_transaction_id', transactionId);

        // Continue monitoring if still pending
        if (transaction.status === 'pending' || transaction.status === 'processing') {
          setTimeout(checkStatus, 30000); // Check every 30 seconds
        }
      } catch (error) {
        console.error('Error monitoring swap transaction:', error);
      }
    };

    // Start monitoring after 10 seconds
    setTimeout(checkStatus, 10000);
  }

  // ===== PORTFOLIO MANAGEMENT =====

  /**
   * Get swap portfolio balances
   */
  async getPortfolioBalances(walletAddress: string): Promise<SwapPortfolioBalance[]> {
    try {
      const { data, error } = await supabase
        .from('moonpay_swap_transactions')
        .select('base_currency, quote_currency, base_amount, quote_amount, status, from_address, to_address')
        .or(`from_address.eq.${walletAddress},to_address.eq.${walletAddress}`)
        .eq('status', 'completed');

      if (error) throw error;

      // Calculate balances from completed swaps
      const balanceMap = new Map<string, number>();
      
      data.forEach(tx => {
        if (tx.from_address === walletAddress) {
          // Outgoing transaction
          balanceMap.set(tx.base_currency, (balanceMap.get(tx.base_currency) || 0) - tx.base_amount);
        }
        if (tx.to_address === walletAddress) {
          // Incoming transaction
          balanceMap.set(tx.quote_currency, (balanceMap.get(tx.quote_currency) || 0) + tx.quote_amount);
        }
      });

      // Convert to portfolio balances with USD values
      const portfolioBalances: SwapPortfolioBalance[] = [];
      let totalValueUSD = 0;

      for (const [currency, balance] of balanceMap) {
        if (balance > 0) {
          // Get current USD value (simplified - in production, use real price API)
          const valueUSD = balance * 1; // Placeholder
          totalValueUSD += valueUSD;
          
          portfolioBalances.push({
            currency,
            balance,
            valueUSD,
            allocation: 0 // Will be calculated after total
          });
        }
      }

      // Calculate allocations
      portfolioBalances.forEach(item => {
        item.allocation = (item.valueUSD / totalValueUSD) * 100;
      });

      return portfolioBalances.sort((a, b) => b.valueUSD - a.valueUSD);
    } catch (error) {
      console.error('Error getting portfolio balances:', error);
      throw new Error(`Failed to get portfolio balances: ${error.message}`);
    }
  }

  /**
   * Get comprehensive swap history with analytics
   */
  async getSwapHistory(
    walletAddress: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<SwapHistory> {
    try {
      const { data, error } = await supabase
        .from('moonpay_swap_transactions')
        .select('*')
        .or(`from_address.eq.${walletAddress},to_address.eq.${walletAddress}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const transactions = data.map(this.mapDatabaseToSwapTransaction);
      
      // Calculate analytics
      const totalVolume = transactions.reduce((sum, tx) => sum + tx.baseAmount, 0);
      const totalFees = transactions.reduce((sum, tx) => {
        const fees = tx.fees as any;
        return sum + (fees?.total || 0);
      }, 0);

      // Calculate profit/loss (simplified)
      const profitLoss = 0; // Would require historical price data

      // Find favorite routes
      const routeCount = new Map<string, { count: number; totalAmount: number }>();
      transactions.forEach(tx => {
        const route = `${tx.baseCurrency}-${tx.quoteCurrency}`;
        const existing = routeCount.get(route) || { count: 0, totalAmount: 0 };
        routeCount.set(route, {
          count: existing.count + 1,
          totalAmount: existing.totalAmount + tx.baseAmount
        });
      });

      const favoriteRoutes = Array.from(routeCount.entries())
        .map(([route, data]) => ({
          route,
          count: data.count,
          avgAmount: data.totalAmount / data.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        transactions,
        totalVolume,
        totalFees,
        profitLoss,
        favoriteRoutes
      };
    } catch (error) {
      console.error('Error getting swap history:', error);
      throw new Error(`Failed to get swap history: ${error.message}`);
    }
  }

  // ===== HELPER METHODS =====

  private calculatePriceImpact(amount: number, pair: MoonpaySwapPair): number {
    // Simplified price impact calculation
    const impactBasis = Math.min(amount / pair.maxAmount, 1);
    return impactBasis * 0.05; // Max 5% price impact
  }

  private async findIndirectRoutes(
    baseCurrency: string,
    quoteCurrency: string,
    baseAmount: number,
    pairs: MoonpaySwapPair[]
  ): Promise<any[]> {
    // Find routes through intermediary tokens (USDC, USDT, BTC, ETH)
    const intermediaries = ['USDC', 'USDT', 'BTC', 'ETH'];
    const routes: any[] = [];

    for (const intermediary of intermediaries) {
      if (intermediary === baseCurrency || intermediary === quoteCurrency) continue;

      const firstLeg = pairs.find(p => 
        p.baseCurrency === baseCurrency && p.quoteCurrency === intermediary
      );
      const secondLeg = pairs.find(p => 
        p.baseCurrency === intermediary && p.quoteCurrency === quoteCurrency
      );

      if (firstLeg && secondLeg) {
        const intermediaryAmount = baseAmount * (1 - (firstLeg.networkFee / baseAmount));
        const finalAmount = intermediaryAmount * (1 - (secondLeg.networkFee / intermediaryAmount));
        
        routes.push({
          pairs: [firstLeg, secondLeg],
          expectedOutput: finalAmount,
          priceImpact: this.calculatePriceImpact(baseAmount, firstLeg) + 
                      this.calculatePriceImpact(intermediaryAmount, secondLeg),
          fees: firstLeg.networkFee + secondLeg.networkFee,
          intermediaryTokens: [intermediary]
        });
      }
    }

    return routes.sort((a, b) => b.expectedOutput - a.expectedOutput);
  }

  private calculateSlippageAnalysis(quote: MoonpaySwapQuote, settings: SwapSlippageSettings) {
    const currentRate = quote.quoteAmount / quote.baseAmount;
    const slippagePercentage = settings.auto ? 0.5 : (settings.customPercentage || 0.5);
    const minReceived = quote.quoteAmount * (1 - slippagePercentage / 100);
    
    return {
      currentRate,
      slippagePercentage,
      minReceived,
      priceImpact: 0.1, // Simplified
      isHighSlippage: slippagePercentage > 2
    };
  }

  private async storeSwapTransaction(transaction: MoonpaySwapTransaction, metadata: any): Promise<void> {
    try {
      await supabase
        .from('moonpay_swap_transactions')
        .insert({
          id: uuidv4(),
          external_transaction_id: transaction.id,
          quote_id: transaction.quoteId,
          status: transaction.status,
          base_currency: transaction.baseCurrency,
          quote_currency: transaction.quoteCurrency,
          base_amount: transaction.baseAmount,
          quote_amount: transaction.quoteAmount,
          from_address: transaction.fromAddress,
          to_address: transaction.toAddress,
          tx_hash: transaction.txHash,
          metadata: metadata
        });
    } catch (error) {
      console.error('Error storing swap transaction:', error);
    }
  }

  private mapDatabaseToSwapTransaction(data: any): MoonpaySwapTransaction {
    return {
      id: data.external_transaction_id,
      quoteId: data.quote_id,
      status: data.status,
      baseCurrency: data.base_currency,
      quoteCurrency: data.quote_currency,
      baseAmount: data.base_amount,
      quoteAmount: data.quote_amount,
      fromAddress: data.from_address,
      toAddress: data.to_address,
      txHash: data.tx_hash,
      createdAt: data.created_at,
      completedAt: data.updated_at
    };
  }
}

export const swapService = new SwapService(new MoonpayService());
