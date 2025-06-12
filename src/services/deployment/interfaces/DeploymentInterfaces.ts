import { DeploymentStatus, DeploymentResult } from '@/types/deployment/TokenDeploymentTypes';
import { TokenStandard } from '@/types/core/centralModels';

/**
 * Interface for deployment transaction events
 */
export interface DeploymentTransactionEvent {
  tokenId: string;
  projectId: string;
  status: DeploymentStatus;
  result?: DeploymentResult;
  error?: string;
  timestamp: number;
  // Additional properties for direct access
  tokenAddress?: string;
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  effectiveGasPrice?: string;
  explorerUrl?: string;
}

/**
 * Interface for token contract events
 */
export interface TokenContractEvent {
  tokenId: string;
  tokenAddress: string;
  eventName: string;
  data: any;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

/**
 * Type for deployment event handlers
 */
export type DeploymentEventHandler = (event: DeploymentTransactionEvent) => void;

/**
 * Type for token contract event handlers
 */
export type TokenContractEventHandler = (event: TokenContractEvent) => void;

/**
 * Interface for token deployment parameters
 */
export interface TokenDeploymentParameters {
  // Required parameters
  tokenId: string;
  projectId: string;
  name: string;
  symbol: string;
  standard: TokenStandard;
  environment: 'mainnet' | 'testnet';
  blockchain: string;
  
  // Optional parameters with defaults
  decimals?: number;
  initialSupply?: string;
  cap?: string;
  baseURI?: string;
  contractURI?: string;
  
  // Feature flags
  isMintable?: boolean;
  isBurnable?: boolean;
  isPausable?: boolean;
  hasRoyalty?: boolean;
  
  // Royalty configuration
  royaltyFraction?: number;
  royaltyRecipient?: string;
  
  // Access control
  accessControl?: 'ownable' | 'roles' | 'none';
  ownerAddress?: string;
  adminAddress?: string;
  
  // Token-specific configuration
  // ERC-721
  isEnumerable?: boolean;
  
  // ERC-1155
  uri?: string;
  
  // ERC-3525
  valueDecimals?: number;
  valueTransfersEnabled?: boolean;
  
  // ERC-4626
  assetTokenAddress?: string;
  
  // ERC-1400
  controllers?: string[];
  
  // Deployment-specific configuration
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  
  // Configuration generation method
  configurationMode?: 'min' | 'max' | 'basic' | 'advanced';
}

/**
 * Interface for DeploymentMonitor
 */
export interface IDeploymentMonitor {
  addDeploymentEventHandler(handler: DeploymentEventHandler): void;
  removeDeploymentEventHandler(handler: DeploymentEventHandler): void;
  addTokenContractEventHandler(handler: TokenContractEventHandler): void;
  removeTokenContractEventHandler(handler: TokenContractEventHandler): void;
  monitorDeployment(
    txHash: string,
    tokenId: string,
    projectId: string,
    blockchain: string
  ): void;
  monitorTokenEvents(
    tokenAddress: string,
    tokenId: string,
    blockchain: string,
    standard: TokenStandard
  ): void;
  stopMonitoring(tokenId: string): void;
  dispose(): void;
}

/**
 * Legacy interface for deployment events (for backward compatibility)
 */
export interface DeploymentEvent {
  tokenId: string;
  status: DeploymentStatus;
  transactionHash?: string;
  tokenAddress?: string;
  error?: string;
  timestamp: string;
}

/**
 * Legacy interface for token events (for backward compatibility)
 */
export interface TokenEvent {
  contractAddress: string;
  eventName: string;
  data: any;
  blockchain: string;
  environment: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: string;
}
