import { ethers } from 'ethers';

// Define wallet metadata interface
export interface WalletMetadata {
  type: string;
  chainId: number;
  standard: string;
  [key: string]: any; // Allow for additional properties
}

// Define wallet interface
export interface Wallet {
  address: string;
  privateKey: string;
  publicKey?: string;
  metadata: WalletMetadata;
}

// Define wallet generation options
export interface WalletGenerationOptions {
  chainId?: number;
  entropy?: string;
  [key: string]: any; // Allow for additional properties
}

// Define the wallet generator interface
export interface WalletGenerator {
  /**
   * Generate a new wallet
   * @param options Optional wallet generation options
   * @returns Generated wallet
   */
  generateWallet(options?: WalletGenerationOptions): Promise<Wallet>;
  
  /**
   * Get metadata for this wallet generator
   * @returns Wallet metadata
   */
  getMetadata(): WalletMetadata;
  
  /**
   * Validate a wallet address
   * @param address Address to validate
   * @returns Whether the address is valid
   */
  validateAddress(address: string): boolean;
}