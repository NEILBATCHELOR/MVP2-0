import { z } from "zod";

// Schema for the swap form
export const swapFormSchema = z.object({
  fromToken: z.string(),
  toToken: z.string(),
  fromAmount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be a positive number"),
  slippage: z.string().default("1.0"),
  deadline: z.number().default(20),
  autoRouter: z.boolean().default(true),
});

export type SwapFormValues = z.infer<typeof swapFormSchema>;

// Uniswap version selector
export type UniswapVersion = "v2" | "v3" | "v4" | "auto";

// Uniswap Hook information
export interface HookInfo {
  address: string;
  name: string;
  description: string;
  features?: string[];
  verified?: boolean;
  deployedAt?: string;
  isVerified: boolean;
  implementedHooks: string[];
  gasEstimate?: number;
}

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  balance?: string;
  price?: number;
  chainId?: number;
}

export interface PriceData {
  price: number;
  priceChange24h: number;
  fromTokenUsdPrice?: number;
  toTokenUsdPrice?: number;
  gasCostUsd?: number;
}

export interface SwapRouteHop {
  address: string;
  symbol: string;
  logoURI: string;
}

export interface SwapRoute {
  name: string;
  portion: number;
  hops: {
    address: string;
    symbol: string;
    logoURI: string;
  }[];
}

export interface SwapRouteStep {
  protocol: string;
  tokenIn: {
    address: string;
    symbol: string;
    logoURI: string;
  };
  tokenOut: {
    address: string;
    symbol: string;
    logoURI: string;
  };
}

export interface Quote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  exchangeRate: string;
  priceImpact: string;
  minimumReceived: string;
  routes: SwapRoute[];
  gasCost: {
    eth: string;
    usd: string;
  };
  slippage: string;
  // Legacy fields for backward compatibility
  route?: SwapRouteStep[];
  estimatedGas?: string;
  provider?: SwapProvider;
  guaranteedPrice?: string;
  gasPrice?: string;
  protocolFee?: string;
  validUntil?: number;
}

export interface SwapTransaction {
  hash: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  walletAddress: string;
}

export interface TransactionResult {
  hash: string;
  status: "success" | "pending" | "failed";
}

export type SwapProvider = "auto" | "0x" | "1inch" | "paraswap" | "uniswap";
export type GasOption = "low" | "medium" | "high";
export type SwapState = "input" | "quote" | "confirmation" | "processing" | "success" | "error";

// New types for enhanced DEX integration

/**
 * Pool provider types
 */
export type PoolProvider = "uniswap_v2" | "uniswap_v3" | "sushiswap";

/**
 * Represents pool reserves for a token pair
 */
export interface PoolReserves {
  tokenA: string;
  tokenB: string;
  reserveA: string;
  reserveB: string;
  timestamp: number;
  provider: PoolProvider;
  pairAddress: string;
}

/**
 * Liquidity pool data
 */
export interface LiquidityPool {
  tokenA: {
    address: string;
    symbol: string;
    decimals: number;
  };
  tokenB: {
    address: string;
    symbol: string;
    decimals: number;
  };
  reserves: PoolReserves;
  fee: number;
  liquidity: number;
  provider: PoolProvider;
  pairAddress: string;
  lastUpdated: string;
}

/**
 * A segment of a swap route
 */
export interface RouteSegment {
  from: Token;
  to: Token;
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  pool?: LiquidityPool;
  pathAddresses: string[];
}

/**
 * Split route segment
 */
export interface SplitRouteSegment {
  pathSegments?: RouteSegment[];
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  percentage: number;
}

/**
 * Optimal route for a swap
 */
export interface OptimalRoute {
  fromToken: Token;
  toToken: Token;
  expectedOutput: string;
  inputAmount: string;
  priceImpact: number;
  segments: Array<RouteSegment | SplitRouteSegment>;
  isSplit: boolean;
  paths: string[][];
}

/**
 * Advanced price impact data
 */
export interface PriceImpactData {
  impact: number;
  priceBeforeSwap: string;
  priceAfterSwap: string;
  recommendedMaxSize?: string;
  isSafe: boolean;
}

/**
 * Parameters for on-chain swaps
 */
export interface OnChainSwapParams {
  router: string;
  routerType: "uniswap_v2" | "uniswap_v3" | "sushiswap";
  path: string[];
  amountIn: string;
  amountOutMin: string;
  deadline: number;
}

/**
 * Settings for advanced routing
 */
export interface RoutingSettings {
  maxHops: number;
  maxSplits: number;
  preferredDexes: PoolProvider[];
  excludedDexes: PoolProvider[];
  gasLimit?: string;
}

export interface SwapConfirmationProps {
  quote: Quote | null;
  fromToken: Token | null;
  toToken: Token | null;
  slippage: number;
  onConfirm: () => void;
  onCancel: () => void;
} 