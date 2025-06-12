/**
 * Deployment-related type definitions
 * Contains enums, interfaces, and types related to token deployments
 */

/**
 * Enum representing the possible states of a deployment
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
 * Interface for deployment transaction details
 */
export interface DeploymentTransaction {
  tokenId: string;
  projectId: string;
  blockchain: string;
  environment: string;
  transactionHash: string;
  status: DeploymentStatus;
  timestamp: string;
  contractAddress?: string;
  blockNumber?: number;
  gasUsed?: string;
  error?: string;
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
  timestamp?: string;
  explorerUrl?: string;
  gasUsed?: string;
  effectiveGasPrice?: string;
}

/**
 * Interface for deployment configuration
 */
export interface DeploymentConfig {
  blockchain: string;
  environment: string;
  gasLimit?: number;
  gasPrice?: string;
  nonce?: number;
  deployerAddress?: string;
  deployerPrivateKey?: string;
  providerUrl?: string;
  timeout?: number;
}

/**
 * Type for deployment status update events
 */
export type DeploymentStatusUpdate = {
  tokenId: string;
  status: DeploymentStatus;
  message: string;
  timestamp: string;
  details?: Record<string, any>;
}; 