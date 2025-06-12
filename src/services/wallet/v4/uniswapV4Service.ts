import { ethers } from 'ethers';
import { Contract, JsonRpcProvider, BrowserProvider, formatUnits, parseUnits, ZeroAddress, MaxUint256 } from 'ethers';
// Import types from a relative path instead of using @/ alias
import { 
  Token, 
  Quote, 
  GasOption, 
  PriceImpactData, 
  HookInfo 
} from "../../../components/wallet/components/swap/types";
import { 
  UNISWAP_V4_POOL_MANAGER, 
  WETH, 
  HOOK_REGISTRY, 
  getPoolManagerContract, 
  getUniversalRouterContract, 
  computePoolId,
  TICK_SPACINGS
} from "./uniswapV4Contracts";
import { getERC20Contract } from "../contracts/uniswapContracts";

/**
 * Service for interacting with Uniswap V4 contracts
 */
export class UniswapV4Service {
  private provider: JsonRpcProvider | BrowserProvider | null = null;

  constructor(provider?: JsonRpcProvider | BrowserProvider) {
    if (provider) {
      this.initializeProvider(provider);
    } else if (typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined') {
      // Create a BrowserProvider from window.ethereum
      this.provider = new BrowserProvider((window as any).ethereum);
    }
  }

  /**
   * Initialize provider from external connection
   */
  public initializeProvider(provider: JsonRpcProvider | BrowserProvider): void {
    this.provider = provider;
  }

  /**
   * Check if a token needs approval for the V4 Pool Manager
   */
  public async checkTokenAllowance(
    tokenAddress: string,
    walletAddress: string
  ): Promise<boolean> {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    try {
      const contract = new Contract(tokenAddress, [
        'function allowance(address owner, address spender) public view returns (uint256)'
      ], this.provider);
      const allowance = await contract.allowance(walletAddress, UNISWAP_V4_POOL_MANAGER);
      
      // Consider anything greater than 0 as approved for now
      return allowance > 0;
    } catch (error) {
      console.error("Failed to check token allowance:", error);
      throw new Error(`Failed to check allowance for ${tokenAddress}`);
    }
  }

  /**
   * Approve a token for the V4 Pool Manager
   */
  public async approveToken(
    tokenAddress: string
  ): Promise<string> {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    try {
      const signer = await this.provider.getSigner();
      const contract = new Contract(tokenAddress, [
        'function approve(address spender, uint256 amount) public returns (bool)'
      ], signer);
      
      // Approve maximum amount
      const tx = await contract.approve(
        UNISWAP_V4_POOL_MANAGER,
        MaxUint256
      );
      
      return tx.hash;
    } catch (error) {
      console.error("Failed to approve token:", error);
      throw new Error(`Failed to approve ${tokenAddress}`);
    }
  }

  /**
   * Check if a V4 pool exists for the given tokens and hook
   */
  public async checkPoolExists(
    token0: Token,
    token1: Token,
    fee: number = 3000,
    hookAddress: string = ZeroAddress
  ): Promise<boolean> {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    try {
      // Ensure token addresses are in the correct order
      const [sortedToken0, sortedToken1] = token0.address.toLowerCase() < token1.address.toLowerCase()
        ? [token0, token1]
        : [token1, token0];
      
      const tickSpacing = TICK_SPACINGS[fee] || 60; // Default to 0.3% fee tier if not specified
      
      // Compute the pool ID
      const poolId = computePoolId(
        sortedToken0.address,
        sortedToken1.address,
        fee,
        tickSpacing,
        hookAddress
      );
      
      // Try to get liquidity to check if pool exists
      const poolManager = getPoolManagerContract(this.provider);
      const liquidity = await poolManager.getLiquidity(poolId);
      
      return !liquidity.isZero();
    } catch (error) {
      // Most likely the pool doesn't exist if we get an error
      return false;
    }
  }

  /**
   * Get a quote for a V4 swap
   */
  public async getSwapQuote(
    fromToken: Token,
    toToken: Token,
    amount: string,
    slippage: number,
    hookAddress: string = ZeroAddress
  ): Promise<Quote> {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    try {
      // Check if pool exists
      const poolExists = await this.checkPoolExists(
        fromToken,
        toToken,
        3000, // Default to 0.3% fee tier
        hookAddress
      );

      if (!poolExists) {
        throw new Error(`No V4 pool exists for ${fromToken.symbol} and ${toToken.symbol} with specified hook`);
      }

      // For the initial implementation, we'll use a simplified approach to price calculation
      // In a full implementation, we would use the actual pool state and math
      
      // Convert amount to the right format
      const amountIn = parseUnits(amount, fromToken.decimals);
      
      // Get pool data
      const [sortedToken0, sortedToken1] = fromToken.address.toLowerCase() < toToken.address.toLowerCase()
        ? [fromToken, toToken]
        : [toToken, fromToken];
      
      const poolManager = getPoolManagerContract(this.provider);
      const poolId = computePoolId(
        sortedToken0.address,
        sortedToken1.address,
        3000, // Default fee tier
        60,  // Default tick spacing
        hookAddress
      );
      
      const slot0 = await poolManager.getSlot0(poolId);
      const sqrtPriceX96 = slot0.sqrtPriceX96;
      
      // Calculate output amount (simplified calculation - not accurate for production)
      // In a real implementation we would use the actual V4 math for precise quotes
      // Calculate 2^96 without using the ** operator
      const twoTo96 = BigInt("79228162514264337593543950336"); // 2^96 precalculated
      // Convert sqrtPriceX96 to BigInt to avoid number/bigint operation issues
      const sqrtPriceX96BigInt = BigInt(Math.floor(sqrtPriceX96));
      const priceX96 = (sqrtPriceX96BigInt * sqrtPriceX96BigInt) / twoTo96;
      let amountOut;
      
      // Use the precalculated 2^96 value
      if (fromToken.address.toLowerCase() === sortedToken0.address.toLowerCase()) {
        amountOut = (amountIn * priceX96) / twoTo96;
      } else {
        amountOut = (amountIn * twoTo96) / priceX96;
      }
      
      // Apply slippage to get minimum received
      const slippageFactor = 10000 - Math.floor(slippage * 100);
      const minAmountOut = (amountOut * BigInt(slippageFactor)) / BigInt(10000);
      
      // Format the returned values
      const outputAmount = formatUnits(amountOut, toToken.decimals);
      const minOutputAmount = formatUnits(minAmountOut, toToken.decimals);
      
      // Estimate price impact (simplified)
      const priceImpact = "0.5"; // Placeholder
      
      // Create a quote object
      return {
        fromToken: fromToken.address,
        toToken: toToken.address,
        fromAmount: amount,
        toAmount: outputAmount,
        exchangeRate: (Number(outputAmount) / Number(amount)).toString(),
        priceImpact,
        minimumReceived: minOutputAmount,
        routes: [{
          name: "Uniswap V4",
          portion: 100,
          hops: [
            {
              address: fromToken.address,
              symbol: fromToken.symbol,
              logoURI: fromToken.logoURI
            },
            {
              address: toToken.address,
              symbol: toToken.symbol,
              logoURI: toToken.logoURI
            }
          ]
        }],
        gasCost: {
          eth: "0.001", // Placeholder - should be calculated
          usd: "2.50"   // Placeholder - should be calculated
        },
        slippage: slippage.toString(),
        provider: "uniswap",
        validUntil: Math.floor(Date.now() / 1000) + 300 // 5 minutes
      };
    } catch (error) {
      console.error("Failed to get V4 swap quote:", error);
      throw new Error(`Failed to get quote: ${error.message}`);
    }
  }

  /**
   * Execute a swap on Uniswap V4
   */
  public async executeSwap(
    fromToken: Token,
    toToken: Token,
    amount: string,
    slippage: number,
    hookAddress: string = ZeroAddress,
    hookData: string = "0x",
    gasOption: GasOption = "medium"
  ): Promise<string> {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    try {
      // Get signer from provider
      const signer = await this.provider.getSigner();
      const walletAddress = await signer.getAddress();
      
      // Check allowance and approve if needed
      if (fromToken.address !== ZeroAddress && fromToken.address.toLowerCase() !== WETH.toLowerCase()) {
        const allowance = await this.checkTokenAllowance(fromToken.address, walletAddress);
        
        if (!allowance) {
          await this.approveToken(fromToken.address);
        }
      }
      
      // Prepare the swap parameters
      const [token0, token1] = fromToken.address.toLowerCase() < toToken.address.toLowerCase()
        ? [fromToken, toToken]
        : [toToken, fromToken];
      
      const zeroForOne = fromToken.address.toLowerCase() === token0.address.toLowerCase();
      
      // Convert amount to the right format
      const amountIn = parseUnits(amount, fromToken.decimals);
      
      // Create the pool key
      const poolKey = {
        currency0: token0.address,
        currency1: token1.address,
        fee: 3000, // Default fee tier
        tickSpacing: 60, // Default tick spacing
        hooks: hookAddress
      };
      
      // Create the swap params
      // In a real implementation, we would calculate the sqrtPriceLimitX96 correctly
      const params = {
        zeroForOne,
        amountSpecified: amountIn,
        sqrtPriceLimitX96: zeroForOne 
          ? BigInt("4295128740") // Minimum price
          : BigInt("1461446703485210103287273052203988822378723970341") // Maximum price
      };
      
      // Execute the swap
      const poolManager = getPoolManagerContract(signer);
      
      // For this initial implementation, we're using a direct swap
      // In production, you'd likely use the Universal Router for better gas efficiency
      const tx = await poolManager.swap(
        poolKey,
        params,
        { gasLimit: 300000 } // Provide a reasonable gas limit
      );
      
      // Return the transaction hash
      return tx.hash;
    } catch (error) {
      console.error("Failed to execute V4 swap:", error);
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  /**
   * Calculate price impact for a swap
   */
  public async calculatePriceImpact(
    fromToken: Token,
    toToken: Token,
    amount: string,
    hookAddress: string = ZeroAddress
  ): Promise<PriceImpactData> {
    // This is a simplified implementation - in a real scenario you'd calculate
    // the actual price impact based on the pool's reserves and math
    
    try {
      return {
        impact: 0.5, // Placeholder
        priceBeforeSwap: "1.0", // Placeholder
        priceAfterSwap: "0.995", // Placeholder
        isSafe: true
      };
    } catch (error) {
      console.error("Failed to calculate price impact:", error);
      throw new Error(`Failed to calculate price impact: ${error.message}`);
    }
  }

  /**
   * Get a list of available hooks for a token pair
   */
  public async getAvailableHooks(
    fromToken: Token,
    toToken: Token
  ): Promise<HookInfo[]> {
    // In a real implementation, you would query an on-chain registry or API
    // For now, we'll return a few hardcoded hooks
    return Object.entries(HOOK_REGISTRY).map(([address, info]) => ({
      address,
      name: info.name,
      description: info.description,
      features: [],
      verified: true,
      deployedAt: "2024-02-01", // Placeholder
      isVerified: true,
      implementedHooks: ["BeforeSwap", "AfterSwap"] // Placeholder
    }));
  }

  /**
   * Create a new V4 pool with the specified parameters
   */
  public async createPool(
    token0: Token,
    token1: Token,
    fee: number = 3000,
    hookAddress: string = ZeroAddress,
    initialPrice: string
  ): Promise<string> {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    try {
      const signer = await this.provider.getSigner();
      
      // Sort tokens to ensure they're in the right order
      const [sortedToken0, sortedToken1] = token0.address.toLowerCase() < token1.address.toLowerCase()
        ? [token0, token1]
        : [token1, token0];
      
      const tickSpacing = TICK_SPACINGS[fee] || 60; // Default to 0.3% fee tier
      
      // Create the pool key
      const poolKey = {
        currency0: sortedToken0.address,
        currency1: sortedToken1.address,
        fee,
        tickSpacing,
        hooks: hookAddress
      };
      
      // Convert initial price to sqrtPriceX96
      // This is a simplified conversion - in production you'd want to be more precise
      const initialPriceBN = parseUnits(initialPrice, 18);
      // Calculate sqrt price X96 without using 2**96 directly
      const sqrtPriceValue = Math.sqrt(parseFloat(initialPrice));
      const sqrtPrice = BigInt(
        Math.floor(sqrtPriceValue * 79228162514264337593543950336).toString() // 2^96 precalculated
      );
      
      // Initialize the pool
      const poolManager = getPoolManagerContract(signer);
      const tx = await poolManager.initialize(
        poolKey,
        sqrtPrice,
        { gasLimit: 500000 }
      );
      
      return tx.hash;
    } catch (error) {
      console.error("Failed to create V4 pool:", error);
      throw new Error(`Failed to create pool: ${error.message}`);
    }
  }
}

// Export a singleton instance
export const uniswapV4Service = new UniswapV4Service();