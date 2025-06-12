import { Contract, type Provider, type Signer } from "ethers";

// Import ABIs
import UniswapV2RouterABI from "../abi/uniswapV2Router.json";

// Contract addresses - eventually move to environment variables
const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const UNISWAP_V3_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const SUSHISWAP_ROUTER = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";

// Common tokens
export const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
export const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
export const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

/**
 * Create a Uniswap V2 Router contract instance
 */
export function getUniswapV2RouterContract(provider: Provider | Signer): Contract {
  return new Contract(UNISWAP_V2_ROUTER, UniswapV2RouterABI, provider);
}

/**
 * Interface for the ERC20 token contract (for approvals)
 */
export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

/**
 * Create an ERC20 token contract instance
 */
export function getERC20Contract(tokenAddress: string, provider: Provider | Signer): Contract {
  return new Contract(tokenAddress, ERC20_ABI, provider);
}

/**
 * Interface for Uniswap V2 Pair contract
 */
export const UNISWAP_V2_PAIR_ABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)"
];

/**
 * Create a Uniswap V2 Pair contract instance
 */
export function getUniswapV2PairContract(pairAddress: string, provider: Provider | Signer): Contract {
  return new Contract(pairAddress, UNISWAP_V2_PAIR_ABI, provider);
}

/**
 * Interface for Uniswap V2 Factory contract
 */
export const UNISWAP_V2_FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)",
  "function allPairs(uint) external view returns (address pair)",
  "function allPairsLength() external view returns (uint)"
];

/**
 * Constants for Uniswap V2 Factory
 */
export const UNISWAP_V2_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

/**
 * Create a Uniswap V2 Factory contract instance
 */
export function getUniswapV2FactoryContract(provider: Provider | Signer): Contract {
  return new Contract(UNISWAP_V2_FACTORY, UNISWAP_V2_FACTORY_ABI, provider);
}