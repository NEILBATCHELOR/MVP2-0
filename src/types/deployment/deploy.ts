import { TokenType } from '@/types/core/centralModels';

/**
 * Enum for deployment statuses
 */
export enum DeploymentStatus {
  PENDING = 'pending',
  DEPLOYING = 'deploying',
  SUCCESS = 'success',
  FAILED = 'failed',
  ABORTED = 'aborted',
  VERIFYING = 'verifying',
  VERIFIED = 'verified',
  VERIFICATION_FAILED = 'verification_failed'
}

/**
 * Interface for deployment result
 */
export interface DeploymentResult {
  status: DeploymentStatus;
  tokenAddress?: string;
  transactionHash?: string;
  error?: string;
  blockNumber?: number;
  timestamp?: number;
  explorerUrl?: string;
  gasUsed?: string;
  effectiveGasPrice?: string;
}

/**
 * Interface for token deployment parameters
 */
export interface TokenDeploymentParams {
  // Base parameters for all tokens
  name: string;
  symbol: string;
  description: string;
  configurationLevel: 'min' | 'max';
  
  // ERC20 specific parameters
  decimals?: number;
  initialSupply?: string;
  cap?: string;
  isMintable?: boolean;
  isBurnable?: boolean;
  isPausable?: boolean;
  
  // ERC20 detailed parameters
  accessControl?: string;
  allowanceManagement?: boolean;
  permit?: boolean;
  snapshot?: boolean;
  feeOnTransfer?: boolean;
  feePercentage?: number;
  feeRecipient?: string;
  rebasing?: boolean;
  rebasingMode?: string;
  targetSupply?: string;
  
  // ERC721 specific parameters
  baseURI?: string;
  royaltyRecipient?: string;
  royaltyPercentage?: number;
  
  // ERC1155 specific parameters
  uri?: string;
  dynamicUris?: boolean;
  batchMinting?: boolean;
  batchTransfers?: boolean;
  transferRestrictions?: boolean;
  
  // ERC3525 specific parameters
  feeStructure?: {
    transferFee?: number;
    mintFee?: number;
    slotCreationFee?: number;
  };
  slotConfiguration?: {
    initialSlots?: number[];
    slotURIs?: string[];
  };
  
  // ERC4626 specific parameters
  assetAddress?: string;
  assetName?: string;
  assetSymbol?: string;
  assetDecimals?: number;
  vaultType?: string;
  vaultStrategy?: string;
  strategyController?: string;
  depositLimit?: string;
  withdrawalLimit?: string;
  minDeposit?: string;
  maxDeposit?: string;
  minWithdrawal?: string;
  maxWithdrawal?: string;
  liquidityReserve?: string;
  maxSlippage?: number;
  
  // ERC1400 specific parameters
  controllers?: string[];
  partitions?: string[];
  isIssuable?: boolean;
  isControllable?: boolean;
  isDocumentable?: boolean;
}

/**
 * Interface for token deployment event
 */
export interface TokenDeploymentEvent {
  tokenId: string;
  projectId: string;
  status: DeploymentStatus;
  result?: DeploymentResult;
  error?: string;
  timestamp: number;
}

/**
 * Interface for contract compilation params
 */
export interface ContractCompilationParams {
  contractName: string;
  contractPath: string;
  solcVersion: string;
  optimizationEnabled: boolean;
  optimizationRuns: number;
  evmVersion?: string;
}

/**
 * Interface for contract verification params
 */
export interface ContractVerificationParams {
  tokenAddress: string;
  tokenType: TokenType;
  contractName: string;
  deploymentParams: TokenDeploymentParams;
  blockchain: string;
  constructorArguments: any[];
  compilerVersion?: string;
  optimizationUsed?: boolean;
  optimizationRuns?: number;
  contractSourceCode?: string;
  apiKey?: string;
}

export * from '../../infrastructure/web3/factories/TokenContractFactory';
export * from '../../infrastructure/web3/services/DeploymentService';