import { Contract, keccak256, type Provider, type Signer } from "ethers";
import { AbiCoder } from "ethers";

// Uniswap V4 contract addresses (mainnet)
export const UNISWAP_V4_POOL_MANAGER = "0x5150734B6B54e390EAEac49D1cFd1ED98F83Fe50";
export const UNISWAP_V4_UNIVERSAL_ROUTER = "0x643770E279d5D0733F21d6DC03A8efbABf3255B4";
export const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

// Import ABIs - these are minimal ABIs that include just the functions we need
export const UNISWAP_V4_POOL_MANAGER_ABI = [
  // Read functions
  "function getLiquidity(bytes32 id) external view returns (uint128)",
  "function getSlot0(bytes32 id) external view returns (uint160 sqrtPriceX96, int24 tick, uint8 protocolFee, uint8 hookFee)",
  
  // Swap functions
  "function swap(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, tuple(bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96, bytes hookData) params) external returns (tuple(int256 amount0, int256 amount1))",
  
  // Pool creation
  "function initialize(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, uint160 sqrtPriceX96) external returns (int24 tick)"
];

export const UNISWAP_V4_UNIVERSAL_ROUTER_ABI = [
  "function execute(bytes commands, bytes[] inputs, uint256 deadline) external payable returns (bytes[] outputs)"
];

// Default hook data - we'll expand this as we support more hooks
export const HOOK_REGISTRY: Record<string, {name: string, description: string, function?: string}> = {
  "0x0000000000000000000000000000000000000000": {
    name: "No Hook",
    description: "Standard V4 pool without hooks"
  },
  "0x1a6fE73c4Adac0369842553D22F3968A10DCb872": {
    name: "Dynamic Fee Hook",
    description: "Adjusts fees based on market volatility",
    function: "setDynamicFeeParameters"
  },
  "0x2b9e50f8C6Df553F0b8b3eDb3F132d29092E66eF": {
    name: "Limit Order Hook",
    description: "Allows setting limit orders within the pool",
    function: "placeLimitOrder"
  }
};

/**
 * Get a Uniswap V4 Pool Manager contract instance
 */
export function getPoolManagerContract(provider: Provider | Signer): Contract {
  return new Contract(
    UNISWAP_V4_POOL_MANAGER,
    UNISWAP_V4_POOL_MANAGER_ABI,
    provider
  );
}

/**
 * Get a Uniswap V4 Universal Router contract instance
 */
export function getUniversalRouterContract(provider: Provider | Signer): Contract {
  return new Contract(
    UNISWAP_V4_UNIVERSAL_ROUTER,
    UNISWAP_V4_UNIVERSAL_ROUTER_ABI,
    provider
  );
}

/**
 * Create a pool ID hash from key parameters
 * This is used to identify pools in the V4 Pool Manager
 */
export function computePoolId(
  token0: string, 
  token1: string, 
  fee: number, 
  tickSpacing: number, 
  hooks: string
): string {
  // Sort tokens to ensure consistent ID regardless of input order
  const [sortedToken0, sortedToken1] = token0.toLowerCase() < token1.toLowerCase() 
    ? [token0, token1] 
    : [token1, token0];
    
  return  keccak256(
     AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "uint24", "int24", "address"],
      [sortedToken0, sortedToken1, fee, tickSpacing, hooks]
    )
  );
}

/**
 * Format a hook address to ensure it starts with the required prefix
 * based on the hooks it implements
 */
export function formatHookAddress(address: string, hookMask: number): string {
  // In a real implementation, this would adjust the address to start with
  // the correct byte sequence based on which hooks are implemented
  // For now, we'll just return the address as is
  return address;
}

/**
 * Standard tick spacings for different fee tiers
 */
export const TICK_SPACINGS: Record<number, number> = {
  100: 1,    // 0.01%
  500: 10,   // 0.05%
  3000: 60,  // 0.3%
  10000: 200 // 1%
};