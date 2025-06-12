import { ethers } from 'ethers';
import type { InterfaceAbi } from 'ethers';

// Re-export multi-chain types from infrastructure
export type {
  SupportedChain,
  NetworkType,
  IBlockchainAdapter,
  TransactionParams,
  TransactionResult,
  TransactionStatus,
  AccountInfo,
  TokenBalance as ChainTokenBalance,
  ConnectionConfig,
  HealthStatus
} from '@/infrastructure/web3';

// Asset validation types
export type AssetType = 'security-token' | 'utility-token' | 'nft' | 'defi-protocol' | 'stablecoin';

export type ValidationLevel = 'basic' | 'standard' | 'enhanced' | 'compliance' | 'oracle';

export type ValidationStatus = 'pending' | 'success' | 'warning' | 'failed';

export interface ValidationResult {
  assetId: string;
  timestamp: Date;
  status: ValidationStatus;
  details?: Record<string, any>;
  error?: string;
  validationType: ValidationLevel | string;
  source: string;
  metadata?: {
    networkId?: string;
    blockNumber?: number;
    transactionHash?: string;
    contractAddress?: string;
  };
}

// Blockchain connection types
export interface ProviderConfig {
  url: string;
  networkId: number;
  apiKey?: string;
}

// Oracle service types
export interface OracleInfo {
  id: string;
  name: string;
  providerAddress: string;
  supportedAssetTypes: AssetType[];
  description: string;
}

export type EventCallback = (event: any) => void;

export interface BlockchainEventListener {
  subscribe(
    contractAddress: string,
    abi: InterfaceAbi,
    eventName: string,
    callback: EventCallback
  ): Promise<string>;
  
  unsubscribe(subscriptionId: string): boolean;
  
  getActiveSubscriptions(): string[];
  
  subscribeToValidationEvents(
    validationContractAddress: string,
    abi: InterfaceAbi,
    assetId: string,
    callback: EventCallback
  ): Promise<string>;
  
  dispose(): void;
} 