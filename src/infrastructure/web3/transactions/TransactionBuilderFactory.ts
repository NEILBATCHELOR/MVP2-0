import { EthereumTransactionBuilder } from './EthereumTransactionBuilder';
import { SolanaTransactionBuilder } from './SolanaTransactionBuilder';
import { RippleTransactionBuilder } from './RippleTransactionBuilder';
import { NEARTransactionBuilder } from './NEARTransactionBuilder';
import { TransactionBuilder } from './TransactionBuilder';
import { BaseTransactionBuilder } from "./TransactionBuilder";

/**
 * Enum defining supported blockchain types
 */
export enum BlockchainType {
  ETHEREUM = 'ethereum',
  POLYGON = 'polygon',
  AVALANCHE = 'avalanche',
  OPTIMISM = 'optimism',
  ARBITRUM = 'arbitrum',
  BASE = 'base',
  ZKSYNC = 'zksync',
  MANTLE = 'mantle',
  SOLANA = 'solana',
  RIPPLE = 'ripple',
  NEAR = 'near',
}

/**
 * Factory class for creating blockchain-specific transaction builders
 */
export class TransactionBuilderFactory {
  private static instance: TransactionBuilderFactory;
  private builders: Map<string, any> = new Map();
  
  private constructor() {
    // Register default builders
    this.registerBuilder("ethereum", EthereumTransactionBuilder);
    this.registerBuilder("solana", SolanaTransactionBuilder);
  }
  
  /**
   * Get the singleton instance of the factory
   */
  static getInstance(): TransactionBuilderFactory {
    if (!TransactionBuilderFactory.instance) {
      TransactionBuilderFactory.instance = new TransactionBuilderFactory();
    }
    return TransactionBuilderFactory.instance;
  }
  
  /**
   * Register a transaction builder for a blockchain
   */
  registerBuilder(blockchain: string, builder: any): void {
    this.builders.set(blockchain.toLowerCase(), builder);
  }
  
  /**
   * Create a transaction builder for a specific blockchain
   */
  createBuilder(blockchain: string, provider: any): BaseTransactionBuilder {
    const BuilderClass = this.builders.get(blockchain.toLowerCase());
    
    if (!BuilderClass) {
      throw new Error(`No transaction builder registered for blockchain: ${blockchain}`);
    }
    
    return new BuilderClass(provider, blockchain);
  }
  
  /**
   * Get a list of supported blockchains
   */
  getSupportedBlockchains(): string[] {
    return Array.from(this.builders.keys());
  }

  /**
   * Get a list of all EVM-compatible blockchains
   * @returns Array of EVM-compatible blockchain types
   */
  static getEVMBlockchains(): string[] {
    return [
      BlockchainType.ETHEREUM,
      BlockchainType.POLYGON,
      BlockchainType.AVALANCHE,
      BlockchainType.OPTIMISM,
      BlockchainType.ARBITRUM,
      BlockchainType.BASE,
      BlockchainType.ZKSYNC,
      BlockchainType.MANTLE
    ];
  }

  /**
   * Get a list of all non-EVM blockchains
   * @returns Array of non-EVM blockchain types
   */
  static getNonEVMBlockchains(): string[] {
    return [
      BlockchainType.SOLANA,
      BlockchainType.RIPPLE,
      BlockchainType.NEAR
    ];
  }
}