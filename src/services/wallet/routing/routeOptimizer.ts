import { ethers } from "ethers";
import { parseUnits, formatUnits } from "ethers";
import { 
  Token, 
  SwapRoute, 
  OptimalRoute,
  RouteSegment,
  LiquidityPool
} from "@/components/wallet/components/swap/types";
import { PoolDataService } from "../pools/poolDataService";
import { WETH } from "../contracts/uniswapContracts";
import { rpcManager } from '@/infrastructure/web3/rpc/RPCConnectionManager';
import { providerManager } from '@/infrastructure/web3/ProviderManager';

/**
 * Service for finding optimal routes between tokens
 */
export class RouteOptimizerService {
  private poolDataService: PoolDataService;
  private commonBridgeTokens: string[];
  
  constructor(poolDataService: PoolDataService) {
    this.poolDataService = poolDataService;
    
    // Common bridge tokens for routing
    this.commonBridgeTokens = [
      WETH,                                              // WETH
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",     // USDC
      "0x6B175474E89094C44Da98b954EedeAC495271d0F",     // DAI
      "0xdAC17F958D2ee523a2206206994597C13D831ec7",     // USDT
      "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"      // WBTC
    ];
  }
  
  /**
   * Find the optimal route between two tokens
   */
  async findOptimalRoute(
    fromToken: Token,
    toToken: Token,
    amount: string,
    maxSlippage: number = 1.0,
    maxHops: number = 2
  ): Promise<OptimalRoute> {
    // For direct pair
    const directRoute = await this.findDirectRoute(fromToken, toToken, amount, maxSlippage);
    
    // If amount is very small or there's a good direct route, don't bother with multi-hop
    if (parseFloat(amount) < 10 || (directRoute && directRoute.priceImpact < 1.0)) {
      if (directRoute) {
        return this.createOptimalRoute([directRoute], fromToken, toToken, amount);
      }
    }
    
    // Find routes through bridge tokens (better for larger amounts)
    const bridgeRoutes = await this.findBridgeRoutes(fromToken, toToken, amount, maxSlippage);
    
    // Find split routes for even larger amounts to reduce price impact
    const splitRoutes = await this.findSplitRoutes(fromToken, toToken, amount, maxSlippage);
    
    // Combine all routes and pick the best one
    const allRoutes = [
      ...(directRoute ? [this.createOptimalRoute([directRoute], fromToken, toToken, amount)] : []),
      ...bridgeRoutes,
      ...splitRoutes
    ];
    
    if (allRoutes.length === 0) {
      throw new Error(`No viable route found from ${fromToken.symbol} to ${toToken.symbol}`);
    }
    
    // Sort by total output amount (highest first)
    allRoutes.sort((a, b) => parseFloat(b.expectedOutput) - parseFloat(a.expectedOutput));
    
    return allRoutes[0];
  }
  
  /**
   * Find a direct route between two tokens
   */
  private async findDirectRoute(
    fromToken: Token,
    toToken: Token,
    amount: string,
    maxSlippage: number
  ): Promise<RouteSegment | null> {
    try {
      // Get pool data
      const pool = await this.poolDataService.getPoolData(fromToken, toToken);
      
      // Calculate price impact
      const priceImpact = this.poolDataService.calculatePriceImpact(pool, amount, fromToken);
      
      // If price impact is too high, suggest optimal amount
      let actualAmount = amount;
      if (priceImpact > maxSlippage) {
        actualAmount = this.poolDataService.calculateOptimalTradeSize(pool, amount, fromToken, maxSlippage);
        
        // If the optimal amount is too small, this route is not viable
        if (parseFloat(actualAmount) < parseFloat(amount) * 0.1) {
          return null;
        }
      }
      
      // Calculate expected output
      const isTokenA = fromToken.address.toLowerCase() === pool.tokenA.address.toLowerCase();
      const reserveIn = isTokenA ? pool.reserves.reserveA : pool.reserves.reserveB;
      const reserveOut = isTokenA ? pool.reserves.reserveB : pool.reserves.reserveA;
      
      const inputAmountBN =  parseUnits(actualAmount, fromToken.decimals);
      const reserveInBN = BigInt(reserveIn);
      const reserveOutBN = BigInt(reserveOut);
      
      // Calculate output using x*y=k formula
      const numerator = reserveOutBN * inputAmountBN;
      const denominator = reserveInBN + inputAmountBN;
      const outputAmountBN = numerator / denominator;
      
      const outputTokenDecimals = isTokenA ? toToken.decimals : fromToken.decimals;
      const outputAmount =  formatUnits(outputAmountBN.toString(), outputTokenDecimals);
      
      // Create route segment
      return {
        from: fromToken,
        to: toToken,
        inputAmount: actualAmount,
        outputAmount,
        priceImpact,
        pool,
        pathAddresses: [fromToken.address, toToken.address]
      };
    } catch (error) {
      console.log(`No direct route available from ${fromToken.symbol} to ${toToken.symbol}:`, error);
      return null;
    }
  }
  
  /**
   * Find routes through bridge tokens
   */
  private async findBridgeRoutes(
    fromToken: Token,
    toToken: Token,
    amount: string,
    maxSlippage: number
  ): Promise<OptimalRoute[]> {
    const routes: OptimalRoute[] = [];
    
    // Skip if from and to are the same
    if (fromToken.address.toLowerCase() === toToken.address.toLowerCase()) {
      return routes;
    }
    
    // For each bridge token
    for (const bridgeTokenAddress of this.commonBridgeTokens) {
      // Skip if bridge token is the same as from or to
      if (
        bridgeTokenAddress.toLowerCase() === fromToken.address.toLowerCase() ||
        bridgeTokenAddress.toLowerCase() === toToken.address.toLowerCase()
      ) {
        continue;
      }
      
      try {
        // Create mock token for bridge
        const bridgeToken: Token = {
          address: bridgeTokenAddress,
          symbol: this.getSymbolForAddress(bridgeTokenAddress),
          name: this.getSymbolForAddress(bridgeTokenAddress),
          decimals: 18, // Most bridge tokens are 18 decimals
          logoURI: ""
        };
        
        // Find route from fromToken to bridgeToken
        const firstHop = await this.findDirectRoute(fromToken, bridgeToken, amount, maxSlippage);
        if (!firstHop) continue;
        
        // Find route from bridgeToken to toToken
        const secondHop = await this.findDirectRoute(
          bridgeToken, 
          toToken, 
          firstHop.outputAmount, 
          maxSlippage
        );
        if (!secondHop) continue;
        
        // Create the multi-hop route
        routes.push(this.createOptimalRoute([firstHop, secondHop], fromToken, toToken, amount));
      } catch (error) {
        // Continue to next bridge token on error
        continue;
      }
    }
    
    return routes;
  }
  
  /**
   * Find routes that split the amount across multiple paths
   */
  private async findSplitRoutes(
    fromToken: Token,
    toToken: Token,
    amount: string,
    maxSlippage: number
  ): Promise<OptimalRoute[]> {
    if (parseFloat(amount) < 1000) {
      // Only use split routes for larger amounts
      return [];
    }
    
    const routes: OptimalRoute[] = [];
    
    try {
      // Try a simple 50/50 split for now
      const halfAmount = (parseFloat(amount) / 2).toString();
      
      // Direct route with half the amount
      const directRoute = await this.findDirectRoute(fromToken, toToken, halfAmount, maxSlippage);
      
      // Route through WETH with the other half
      const wethToken: Token = {
        address: WETH,
        symbol: "WETH",
        name: "Wrapped Ether",
        decimals: 18,
        logoURI: ""
      };
      
      const firstHopWeth = await this.findDirectRoute(fromToken, wethToken, halfAmount, maxSlippage);
      if (!firstHopWeth) return routes;
      
      const secondHopWeth = await this.findDirectRoute(wethToken, toToken, firstHopWeth.outputAmount, maxSlippage);
      if (!secondHopWeth) return routes;
      
      // If we have both routes, create a split route
      if (directRoute) {
        const segments = [
          {
            ...directRoute,
            percentage: 50
          },
          {
            pathSegments: [firstHopWeth, secondHopWeth],
            inputAmount: halfAmount,
            outputAmount: secondHopWeth.outputAmount,
            priceImpact: Math.max(firstHopWeth.priceImpact, secondHopWeth.priceImpact),
            percentage: 50
          }
        ];
        
        // Calculate total expected output
        const totalOutput = (
          parseFloat(directRoute.outputAmount) +
          parseFloat(secondHopWeth.outputAmount)
        ).toString();
        
        // Create split route
        routes.push({
          fromToken,
          toToken,
          expectedOutput: totalOutput,
          inputAmount: amount,
          priceImpact: Math.max(directRoute.priceImpact, 
            Math.max(firstHopWeth.priceImpact, secondHopWeth.priceImpact)),
          segments,
          isSplit: true,
          paths: [
            [fromToken.address, toToken.address],
            [fromToken.address, WETH, toToken.address]
          ]
        });
      }
    } catch (error) {
      console.error("Error finding split routes:", error);
    }
    
    return routes;
  }
  
  /**
   * Create an optimal route from route segments
   */
  private createOptimalRoute(
    segments: RouteSegment[],
    fromToken: Token,
    toToken: Token,
    inputAmount: string
  ): OptimalRoute {
    // Single hop route
    if (segments.length === 1) {
      return {
        fromToken,
        toToken,
        expectedOutput: segments[0].outputAmount,
        inputAmount,
        priceImpact: segments[0].priceImpact,
        segments: [{ ...segments[0], percentage: 100 }],
        isSplit: false,
        paths: [segments[0].pathAddresses]
      };
    }
    
    // Multi-hop route
    let currentPath: string[] = [segments[0].from.address];
    let maxPriceImpact = 0;
    
    for (const segment of segments) {
      currentPath.push(segment.to.address);
      maxPriceImpact = Math.max(maxPriceImpact, segment.priceImpact);
    }
    
    return {
      fromToken,
      toToken,
      expectedOutput: segments[segments.length - 1].outputAmount,
      inputAmount,
      priceImpact: maxPriceImpact,
      segments: [
        {
          pathSegments: segments,
          inputAmount,
          outputAmount: segments[segments.length - 1].outputAmount,
          priceImpact: maxPriceImpact,
          percentage: 100
        }
      ],
      isSplit: false,
      paths: [currentPath]
    };
  }
  
  /**
   * Get a token symbol for a common address
   */
  private getSymbolForAddress(address: string): string {
    const addressMap: Record<string, string> = {
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": "WETH",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": "USDC",
      "0x6B175474E89094C44Da98b954EedeAC495271d0F": "DAI",
      "0xdAC17F958D2ee523a2206206994597C13D831ec7": "USDT",
      "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": "WBTC"
    };
    
    return addressMap[address] || "UNKNOWN";
  }
}

// Export singleton instance for easy use
export const routeOptimizerService = new RouteOptimizerService(
  new PoolDataService(
    providerManager.getProvider('ethereum')
  )
);