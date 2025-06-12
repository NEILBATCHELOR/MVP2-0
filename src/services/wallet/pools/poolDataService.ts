import { ethers, type Provider, JsonRpcProvider } from "ethers";
import { formatUnits, parseUnits } from "ethers";
import { 
  getUniswapV2FactoryContract, 
  getUniswapV2PairContract, 
  UNISWAP_V2_FACTORY, 
  WETH 
} from "../contracts/uniswapContracts";
import { Token, LiquidityPool, PoolProvider, PoolReserves } from "@/components/wallet/components/swap/types";
import { rpcManager } from '@/infrastructure/web3/rpc/RPCConnectionManager';
import { providerManager } from '@/infrastructure/web3/ProviderManager';

const AddressZero = "0x0000000000000000000000000000000000000000";
const WeiPerEther = BigInt("1000000000000000000");

/**
 * Service for fetching and managing liquidity pool data
 */
export class PoolDataService {
  private provider: Provider;
  private poolCache: Map<string, LiquidityPool>;
  private reservesCache: Map<string, { reserves: PoolReserves; timestamp: number }>;
  private readonly CACHE_TTL = 30 * 1000; // 30 seconds cache TTL
  
  constructor(provider?: Provider) {
    this.provider = provider || providerManager.getProvider('ethereum');
    this.poolCache = new Map();
    this.reservesCache = new Map();
  }
  
  /**
   * Generate a cache key for a token pair
   */
  private getPairCacheKey(tokenA: string, tokenB: string): string {
    return tokenA.toLowerCase() < tokenB.toLowerCase() 
      ? `${tokenA.toLowerCase()}-${tokenB.toLowerCase()}`
      : `${tokenB.toLowerCase()}-${tokenA.toLowerCase()}`;
  }
  
  /**
   * Get Uniswap V2 pair address for a token pair
   */
  async getUniswapV2PairAddress(tokenA: string, tokenB: string): Promise<string> {
    const factory = getUniswapV2FactoryContract(this.provider);
    const pairAddress = await factory.getPair(tokenA, tokenB);
    
    // Check if pair exists
    if (pairAddress === AddressZero) {
      throw new Error(`No Uniswap V2 pair exists for ${tokenA} and ${tokenB}`);
    }
    
    return pairAddress;
  }
  
  /**
   * Fetch pool reserves for a token pair from Uniswap V2
   */
  async getPoolReserves(tokenA: string, tokenB: string, poolProvider: PoolProvider = "uniswap_v2"): Promise<PoolReserves> {
    const cacheKey = this.getPairCacheKey(tokenA, tokenB) + poolProvider;
    const now = Date.now();
    
    // Check cache first
    const cachedReserves = this.reservesCache.get(cacheKey);
    if (cachedReserves && now - cachedReserves.timestamp < this.CACHE_TTL) {
      return cachedReserves.reserves;
    }
    
    try {
      let pairAddress: string;
      
      switch (poolProvider) {
        case "uniswap_v2":
          pairAddress = await this.getUniswapV2PairAddress(tokenA, tokenB);
          break;
        case "sushiswap":
          // Implement SushiSwap pair address lookup
          throw new Error("SushiSwap not implemented yet");
        default:
          throw new Error(`Unsupported pool provider: ${poolProvider}`);
      }
      
      const pairContract = getUniswapV2PairContract(pairAddress, this.provider);
      
      // Get reserves and token addresses from the pair contract
      const [reserves, token0, token1] = await Promise.all([
        pairContract.getReserves(),
        pairContract.token0(),
        pairContract.token1()
      ]);
      
      // Determine which token is which in the pair
      const token0IsTokenA = token0.toLowerCase() === tokenA.toLowerCase();
      
      // Format reserves properly based on token order
      const reserveA = token0IsTokenA ? reserves.reserve0 : reserves.reserve1;
      const reserveB = token0IsTokenA ? reserves.reserve1 : reserves.reserve0;
      
      const poolReserves: PoolReserves = {
        tokenA,
        tokenB,
        reserveA: reserveA.toString(),
        reserveB: reserveB.toString(),
        timestamp: now,
        provider: poolProvider,
        pairAddress
      };
      
      // Cache the result
      this.reservesCache.set(cacheKey, { reserves: poolReserves, timestamp: now });
      
      return poolReserves;
    } catch (error) {
      console.error(`Error fetching pool reserves:`, error);
      throw new Error(`Failed to fetch pool reserves for ${tokenA} and ${tokenB}`);
    }
  }
  
  /**
   * Get full pool data including reserves, liquidity, and fees
   */
  async getPoolData(tokenA: Token, tokenB: Token, poolProvider: PoolProvider = "uniswap_v2"): Promise<LiquidityPool> {
    const cacheKey = this.getPairCacheKey(tokenA.address, tokenB.address) + poolProvider;
    
    // Check cache first
    const cachedPool = this.poolCache.get(cacheKey);
    if (cachedPool) {
      return cachedPool;
    }
    
    try {
      // Get reserves first
      const reserves = await this.getPoolReserves(tokenA.address, tokenB.address, poolProvider);
      
      // Calculate additional pool metrics
      let fee: number;
      switch (poolProvider) {
        case "uniswap_v2":
        case "sushiswap":
          fee = 0.003; // 0.3%
          break;
        case "uniswap_v3":
          // Fees in V3 are tier-specific, would need to fetch from the pool
          fee = 0.003; // Default to 0.3% for now
          break;
        default:
          fee = 0.003;
      }
      
      // Convert to bigint for calculations
      const reserveABN = BigInt(reserves.reserveA);
      const reserveBBN = BigInt(reserves.reserveB);
      
      // Calculate liquidity (sqrt of product of reserves)
      const liquidity = Math.sqrt(
        Number(formatUnits(reserveABN, tokenA.decimals)) * 
        Number(formatUnits(reserveBBN, tokenB.decimals))
      );
      
      // Create the full pool data object
      const pool: LiquidityPool = {
        tokenA: {
          address: tokenA.address,
          symbol: tokenA.symbol,
          decimals: tokenA.decimals
        },
        tokenB: {
          address: tokenB.address,
          symbol: tokenB.symbol,
          decimals: tokenB.decimals
        },
        reserves,
        fee,
        liquidity,
        provider: poolProvider,
        pairAddress: reserves.pairAddress,
        lastUpdated: new Date().toISOString()
      };
      
      // Cache the result
      this.poolCache.set(cacheKey, pool);
      
      return pool;
    } catch (error) {
      console.error(`Error fetching pool data:`, error);
      throw new Error(`Failed to fetch pool data for ${tokenA.symbol} and ${tokenB.symbol}`);
    }
  }
  
  /**
   * Get multiple pools at once, optimized for batch retrieval
   */
  async getMultiplePools(
    tokenPairs: Array<{ tokenA: Token; tokenB: Token; provider?: PoolProvider }>
  ): Promise<Record<string, LiquidityPool>> {
    const result: Record<string, LiquidityPool> = {};
    
    // Process in chunks to avoid overloading the RPC endpoint
    const chunkSize = 5;
    for (let i = 0; i < tokenPairs.length; i += chunkSize) {
      const chunk = tokenPairs.slice(i, i + chunkSize);
      const promises = chunk.map(({ tokenA, tokenB, provider = "uniswap_v2" }) => 
        this.getPoolData(tokenA, tokenB, provider)
          .then(pool => {
            const key = this.getPairCacheKey(tokenA.address, tokenB.address) + provider;
            result[key] = pool;
          })
          .catch(error => {
            console.error(`Error fetching pool for ${tokenA.symbol}-${tokenB.symbol}:`, error);
            // Continue with other pools on error
          })
      );
      
      await Promise.all(promises);
    }
    
    return result;
  }
  
  /**
   * Calculate price impact for a given trade amount
   */
  calculatePriceImpact(
    pool: LiquidityPool, 
    inputAmount: string, 
    inputToken: Token
  ): number {
    // Determine which token in the pool is the input token
    const isTokenA = inputToken.address.toLowerCase() === pool.tokenA.address.toLowerCase();
    
    // Get the right reserves
    const reserveIn = isTokenA ? pool.reserves.reserveA : pool.reserves.reserveB;
    const reserveOut = isTokenA ? pool.reserves.reserveB : pool.reserves.reserveA;
    
    // Convert to bigint with proper decimals
    const inputAmountBN = parseUnits(inputAmount, inputToken.decimals);
    const reserveInBN = BigInt(reserveIn);
    const reserveOutBN = BigInt(reserveOut);
    
    // Don't calculate for 0 input or if input is very small relative to reserves
    if (inputAmountBN === 0n || inputAmountBN < (reserveInBN / 10000n)) {
      return 0;
    }
    
    // Calculate output without price impact (using spot price)
    const spotRatio = (reserveOutBN * WeiPerEther) / reserveInBN;
    const expectedOutput = (inputAmountBN * spotRatio) / WeiPerEther;
    
    // Calculate actual output using x*y=k formula
    // (reserveIn + inputAmount) * (reserveOut - outputAmount) = reserveIn * reserveOut
    // outputAmount = reserveOut - (reserveIn * reserveOut) / (reserveIn + inputAmount)
    const numerator = reserveInBN * reserveOutBN;
    const denominator = reserveInBN + inputAmountBN;
    const remainingOutput = numerator / denominator;
    const actualOutput = reserveOutBN - remainingOutput;
    
    // Calculate price impact
    if (actualOutput < expectedOutput) {
      const impact = Number(((expectedOutput - actualOutput) * 10000n) / expectedOutput) / 100;
      return impact;
    }
    
    return 0;
  }
  
  /**
   * Calculate optimal swap amount to minimize price impact
   */
  calculateOptimalTradeSize(
    pool: LiquidityPool, 
    maxInputAmount: string, 
    inputToken: Token, 
    maxPriceImpact: number = 1.0
  ): string {
    if (!maxInputAmount || parseFloat(maxInputAmount) === 0) {
      return "0";
    }
    
    // Start with the max amount
    let currentAmount = maxInputAmount;
    let currentImpact = this.calculatePriceImpact(pool, currentAmount, inputToken);
    
    // If the impact is already acceptable, return the max amount
    if (currentImpact <= maxPriceImpact) {
      return maxInputAmount;
    }
    
    // Binary search to find optimal amount
    let min = "0";
    let max = maxInputAmount;
    const maxIterations = 10; // Prevent infinite loops
    let iterations = 0;
    
    while (iterations < maxIterations) {
      iterations++;
      
      // Calculate the middle amount
      const minBN = parseUnits(min, inputToken.decimals);
      const maxBN = parseUnits(max, inputToken.decimals);
      const midBN = (minBN + maxBN) / 2n;
      const mid = formatUnits(midBN, inputToken.decimals);
      
      // Get price impact for this amount
      const impact = this.calculatePriceImpact(pool, mid, inputToken);
      
      if (Math.abs(impact - maxPriceImpact) < 0.1 || midBN === minBN || midBN === maxBN) {
        // Close enough or can't subdivide further
        return mid;
      }
      
      if (impact > maxPriceImpact) {
        // Too much impact, try smaller amount
        max = mid;
      } else {
        // Impact acceptable, try larger amount
        min = mid;
      }
    }
    
    // After max iterations, return the best approximation
    return min;
  }
  
  /**
   * Get recommended slippage based on token volatility and liquidity
   */
  getRecommendedSlippage(pool: LiquidityPool): number {
    // Base slippage on liquidity
    if (pool.liquidity > 1000000) {
      return 0.5; // 0.5% for very liquid pools
    } else if (pool.liquidity > 100000) {
      return 1.0; // 1.0% for moderately liquid pools
    } else {
      return 2.0; // 2.0% for low liquidity pools
    }
    
    // In a real implementation, this would also consider:
    // 1. Token volatility based on historical price data
    // 2. Recent pool trade volume
    // 3. Gas price volatility
  }
  
  /**
   * Clear all caches
   */
  clearCache(): void {
    this.poolCache.clear();
    this.reservesCache.clear();
  }
}

// Export singleton instance for easy use
export const poolDataService = new PoolDataService(
  new  JsonRpcProvider(import.meta.env.VITE_ETHEREUM_RPC_URL)
);