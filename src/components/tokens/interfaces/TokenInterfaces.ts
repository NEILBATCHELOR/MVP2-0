import { DeploymentStatus } from '@/types/deployment/deployment';
import { TokenType } from '@/types/core/centralModels';

/**
 * Interface for token details displayed in various token-related components
 */
export interface TokenDetails {
  id: string;
  name: string;
  symbol: string;
  standard: string;
  blocks?: Record<string, any>;
  address?: string;
  blockchain?: string;
  decimals: number;
  total_supply?: string;
  deployment_status?: DeploymentStatus;
  deployment_transaction?: string;
  deployment_block?: number;
  deployment_timestamp?: string;
  deployment_environment?: string;
  configurationLevel?: 'basic' | 'advanced' | 'min' | 'max';
}

/**
 * Interface for token configuration used in deployment forms
 */
export interface TokenConfig {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  standard?: string;
  initialHolderAddress?: string;
  features?: {
    isBurnable?: boolean;
    isMintable?: boolean;
    isPausable?: boolean;
    isUpgradeable?: boolean;
  };
  metadata?: Record<string, string>;
}

/**
 * Interface for token deployment parameters
 */
export interface TokenDeploymentParams {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: string;
  blockchain: string;
  environment: 'mainnet' | 'testnet';
  tokenType: TokenType;
  features?: {
    burnable?: boolean;
    mintable?: boolean;
    pausable?: boolean;
    upgradeable?: boolean;
  };
  customOptions?: Record<string, any>;
}

/**
 * Interface for token deployment result
 */
export interface TokenDeploymentResult {
  tokenAddress: string;
  transactionHash: string;
  blockNumber?: number;
  timestamp?: number;
  status: 'pending' | 'success' | 'failed';
}

/**
 * Interface for token transaction details
 */
export interface TokenTransaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  type: 'transfer' | 'mint' | 'burn' | 'approve' | 'other';
  status: 'pending' | 'confirmed' | 'failed';
}

// ===== NEW FOUNDRY CONTRACT INTERFACES =====

/**
 * ERC20 Token Configuration for Foundry deployment
 */
export interface FoundryERC20Config {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: string; // In token units (not wei)
  maxSupply: string; // 0 means no cap
  transfersPaused: boolean;
  mintingEnabled: boolean;
  burningEnabled: boolean;
  votingEnabled: boolean;
  initialOwner: string;
}

/**
 * ERC721 Token Configuration for Foundry deployment
 */
export interface FoundryERC721Config {
  name: string;
  symbol: string;
  baseURI: string;
  maxSupply: number; // 0 means no cap
  mintPrice: string; // In wei
  transfersPaused: boolean;
  mintingEnabled: boolean;
  burningEnabled: boolean;
  publicMinting: boolean;
  initialOwner: string;
}

/**
 * ERC1155 Token Configuration for Foundry deployment
 */
export interface FoundryERC1155Config {
  name: string;
  symbol: string;
  baseURI: string;
  transfersPaused: boolean;
  mintingEnabled: boolean;
  burningEnabled: boolean;
  publicMinting: boolean;
  initialOwner: string;
}

/**
 * ERC4626 Vault Configuration for Foundry deployment
 */
export interface FoundryERC4626Config {
  name: string;
  symbol: string;
  decimals: number;
  asset: string; // Underlying asset address
  managementFee: number; // Basis points (10000 = 100%)
  performanceFee: number; // Basis points
  depositLimit: string; // In asset units
  minDeposit: string; // In asset units
  depositsEnabled: boolean;
  withdrawalsEnabled: boolean;
  transfersPaused: boolean;
  initialOwner: string;
}

/**
 * ERC3525 Token Configuration for Foundry deployment
 */
export interface FoundryERC3525Config {
  name: string;
  symbol: string;
  valueDecimals: number;
  mintingEnabled: boolean;
  burningEnabled: boolean;
  transfersPaused: boolean;
  initialOwner: string;
  initialSlots: FoundryERC3525SlotInfo[];
  allocations: FoundryERC3525AllocationInfo[];
  royaltyFraction: number; // Basis points
  royaltyRecipient: string;
}

/**
 * ERC3525 Slot Information
 */
export interface FoundryERC3525SlotInfo {
  name: string;
  description: string;
  isActive: boolean;
  maxSupply: number; // 0 means no cap
  metadata: string; // Hex-encoded bytes
}

/**
 * ERC3525 Initial Allocation
 */
export interface FoundryERC3525AllocationInfo {
  slot: number;
  recipient: string;
  value: string; // Value in valueDecimals
  description: string;
}

/**
 * Union type for all Foundry token configurations
 */
export type FoundryTokenConfig = 
  | FoundryERC20Config 
  | FoundryERC721Config 
  | FoundryERC1155Config 
  | FoundryERC4626Config
  | FoundryERC3525Config;

/**
 * Enhanced deployment parameters for Foundry contracts
 */
export interface FoundryDeploymentParams {
  tokenType: 'ERC20' | 'ERC721' | 'ERC1155' | 'ERC4626' | 'ERC3525';
  config: FoundryTokenConfig;
  blockchain: string;
  environment: 'mainnet' | 'testnet';
  salt?: string; // For create2 deployment
  factoryAddress?: string; // Address of deployed factory contract
}

/**
 * Contract interaction interfaces
 */
export interface ContractFunction {
  name: string;
  inputs: ContractInput[];
  outputs: ContractOutput[];
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
}

export interface ContractInput {
  name: string;
  type: string;
  internalType?: string;
}

export interface ContractOutput {
  name: string;
  type: string;
  internalType?: string;
}

/**
 * Contract ABI interface
 */
export interface ContractABI {
  type: 'function' | 'constructor' | 'event' | 'error';
  name?: string;
  inputs: ContractInput[];
  outputs?: ContractOutput[];
  stateMutability?: 'pure' | 'view' | 'nonpayable' | 'payable';
  anonymous?: boolean;
}

/**
 * Deployed contract information
 */
export interface DeployedContract {
  address: string;
  tokenType: 'ERC20' | 'ERC721' | 'ERC1155' | 'ERC4626' | 'ERC3525';
  name: string;
  symbol: string;
  decimals?: number;
  valueDecimals?: number; // For ERC3525
  totalSupply?: string;
  blockchain: string;
  environment: string;
  deploymentTx: string;
  deploymentBlock: number;
  deploymentTimestamp: number;
  verified: boolean;
  abi: ContractABI[];
}

/**
 * Token factory interface
 */
export interface TokenFactory {
  address: string;
  blockchain: string;
  environment: string;
  version: string;
  supportedTokenTypes: string[];
}

/**
 * Deployment service interface for Foundry integration
 */
export interface FoundryDeploymentService {
  deployToken(params: FoundryDeploymentParams): Promise<DeployedContract>;
  verifyContract(contractAddress: string, blockchain: string, environment: string): Promise<boolean>;
  getContractInfo(contractAddress: string, blockchain: string): Promise<DeployedContract>;
  getFactoryAddress(blockchain: string, environment: string): Promise<string>;
  predictTokenAddress(params: FoundryDeploymentParams): Promise<string>;
}

/**
 * Token operation result
 */
export interface TokenOperationResult {
  success: boolean;
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  error?: string;
}

/**
 * Token event interface
 */
export interface TokenEvent {
  eventName: string;
  tokenAddress: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
  args: Record<string, any>;
  decoded: boolean;
}

/**
 * Token analytics data
 */
export interface TokenAnalytics {
  totalSupply: string;
  totalHolders: number;
  totalTransfers: number;
  volume24h: string;
  priceUSD?: string;
  marketCapUSD?: string;
  lastUpdate: number;
}
