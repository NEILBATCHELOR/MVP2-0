// Define blockchain networks supported by the platform
export type BlockchainNetwork = 
  | 'ethereum' 
  | 'polygon' 
  | 'arbitrum' 
  | 'optimism' 
  | 'base' 
  | 'avalanche' 
  | 'bsc' 
  | 'fantom' 
  | 'gnosis';

export interface WalletInfo {
  address: string;
  chainId: number;
  blockchain?: BlockchainNetwork;
  balance?: string;
  type?: 'eoa' | 'multisig';
  isConnected?: boolean;
}

export interface WalletUpdate {
  address: string;
  chainId?: number;
  balance?: string;
  type?: 'connected' | 'disconnected' | 'changed';
}

export interface WalletError {
  code: number;
  message: string;
  data?: any;
}

export interface WalletCredentials {
  id: string;
  type: string;
  key: string;
  secret?: string;
  metadata?: Record<string, any>;
}

export interface WalletEventMap {
  connect: { account: string; chainId: number };
  disconnect: void;
  change: { account?: string; chain?: { id: number; unsupported: boolean } };
  error: { error: Error | WalletError };
}

export type WalletEventHandler<T extends keyof WalletEventMap> = (
  event: WalletEventMap[T]
) => void;

export interface WalletService {
  connect(chainId?: number): Promise<WalletInfo>;
  disconnect(): Promise<void>;
  getAccount(): Promise<string>;
  getChainId(): Promise<number>;
  signMessage(message: string): Promise<string>;
  signTransaction(transaction: any): Promise<string>;
  switchChain(chainId: number): Promise<{ id: number; unsupported: boolean }>;
  on<T extends keyof WalletEventMap>(
    event: T,
    handler: WalletEventHandler<T>
  ): void;
  off<T extends keyof WalletEventMap>(
    event: T,
    handler: WalletEventHandler<T>
  ): void;
} 