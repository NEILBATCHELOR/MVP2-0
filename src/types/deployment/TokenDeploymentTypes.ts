import { TokenStandard, TokenType } from '@/types/core/centralModels';

/**
 * Complete interface for token deployment parameters
 */
export interface TokenDeploymentParams {
  // Base parameters for all tokens
  name: string;
  symbol: string;
  description?: string;
  configurationLevel?: 'min' | 'max' | 'basic' | 'advanced';
  standard: TokenStandard;
  projectId: string;
  userId: string;
  environment?: 'testnet' | 'mainnet';
  blockchain?: string;
  
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
  contractURI?: string;
  royaltyReceiver?: string;
  royaltyPercentage?: number;
  maxSupply?: string;
  supportsEnumeration?: boolean;
  
  // ERC1155 specific parameters
  uri?: string;
  dynamicUris?: boolean;
  batchMinting?: boolean;
  batchTransfers?: boolean;
  transferRestrictions?: boolean;
  hasRoyalty?: boolean;
  royaltyFraction?: number;
  
  // ERC3525 specific parameters
  valueDecimals?: number;
  slotConfiguration?: {
    initialSlots?: number[];
    slotURIs?: string[];
  };
  valueTransfersEnabled?: boolean;
  
  // ERC4626 specific parameters
  assetTokenAddress?: string;
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
  
  // Extension/module support
  extensions?: string[];
  modules?: Record<string, any>;
  
  // Access control parameters
  adminAddress?: string;
  ownerAddress?: string;
  
  // Deployment parameters
  tokenContract?: string;
  constructorParams?: any[];
  
  // Implementation contracts (for proxy patterns)
  implementationAddress?: string;
  proxyType?: 'transparent' | 'uups' | 'beacon';
  
  // Gas and transaction parameters
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  
  // Metadata
  metadata?: Record<string, any>;
}

/**
 * Mapping from TokenStandard to TokenType
 * This is used to convert between the two enum types in different parts of the system
 */
export const tokenStandardToTokenType: Record<TokenStandard, TokenType> = {
  [TokenStandard.ERC20]: TokenType.ERC20,
  [TokenStandard.ERC721]: TokenType.ERC721,
  [TokenStandard.ERC1155]: TokenType.ERC1155,
  [TokenStandard.ERC1400]: TokenType.ERC1400,
  [TokenStandard.ERC3525]: TokenType.ERC3525,
  [TokenStandard.ERC4626]: TokenType.ERC4626
};

/**
 * Mapping from TokenType to TokenStandard
 * This is used for the reverse conversion
 */
export const tokenTypeToTokenStandard = {
  'native': TokenStandard.ERC20, // Map NATIVE to ERC20 as default
  'erc20': TokenStandard.ERC20,
  'erc721': TokenStandard.ERC721,
  'erc1155': TokenStandard.ERC1155,
  'erc1400': TokenStandard.ERC1400,
  'erc3525': TokenStandard.ERC3525,
  'erc4626': TokenStandard.ERC4626
};

/**
 * Interface for deployment-specific parameters
 */
export interface DeploymentParams {
  // Basic token parameters
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: string;
  
  // Deployment parameters
  blockchain: string;
  environment: string;
  tokenStandard: TokenStandard;
  
  // Common features
  isMintable?: boolean;
  isBurnable?: boolean;
  isPausable?: boolean;
  isUpgradeable?: boolean;
  
  // Access control
  accessControl?: 'ownable' | 'roles' | 'custom';
  ownerAddress?: string;
  adminAddress?: string;
  
  // Additional parameters by token standard
  [key: string]: any;
}

/**
 * Deployment status types
 * Used to track the status of a token deployment
 */
export enum DeploymentStatus {
  PENDING = 'PENDING',
  DEPLOYING = 'DEPLOYING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  ABORTED = 'ABORTED',
  VERIFYING = 'VERIFYING',
  VERIFIED = 'VERIFIED',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED'
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