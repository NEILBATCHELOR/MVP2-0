import { WalletGenerator } from '../WalletGenerator';
import { ETHWalletGenerator } from './ETHWalletGenerator';
import { BTCWalletGenerator } from './BTCWalletGenerator';
import { XRPWalletGenerator } from './XRPWalletGenerator';
import { PolygonWalletGenerator } from './PolygonWalletGenerator';
import { SolanaWalletGenerator } from './SolanaWalletGenerator';
import { AptosWalletGenerator } from './AptosWalletGenerator';
import { SuiWalletGenerator } from './SuiWalletGenerator';
import { NEARWalletGenerator } from './NEARWalletGenerator';
import { StellarWalletGenerator } from './StellarWalletGenerator';

/**
 * Factory to create the appropriate wallet generator for a blockchain
 */
export class WalletGeneratorFactory {
  private static generators: Record<string, WalletGenerator> = {};

  /**
   * Get the appropriate wallet generator for a blockchain
   * @param blockchain The blockchain to get the generator for
   * @returns The wallet generator for the blockchain
   */
  public static getGenerator(blockchain: string): WalletGenerator {
    if (!this.generators[blockchain]) {
      this.generators[blockchain] = this.createGenerator(blockchain);
    }
    return this.generators[blockchain];
  }

  /**
   * Create a new wallet generator for a blockchain
   * @param blockchain The blockchain to create the generator for
   * @returns The created wallet generator
   */
  private static createGenerator(blockchain: string): WalletGenerator {
    switch (blockchain.toLowerCase()) {
      case 'ethereum':
        return new ETHWalletGenerator();
      case 'bitcoin':
        return new BTCWalletGenerator();
      case 'ripple':
      case 'xrp':
        return new XRPWalletGenerator();
      case 'polygon':
        return new PolygonWalletGenerator();
      case 'solana':
        return new SolanaWalletGenerator();
      case 'aptos':
        return new AptosWalletGenerator();
      case 'sui':
        return new SuiWalletGenerator();
      case 'near':
        return new NEARWalletGenerator();
      case 'stellar':
        return new StellarWalletGenerator();
      // Add other blockchains as needed
      case 'avalanche':
      case 'optimism':
      case 'base':
      case 'zksync':
      case 'arbitrum':
      case 'mantle':
      case 'hedera':
        // For all EVM-compatible chains, we can use the ETHWalletGenerator
        // In a real implementation, we might want to have separate generators for each chain
        return new ETHWalletGenerator();
      default:
        throw new Error(`Unsupported blockchain: ${blockchain}`);
    }
  }

  /**
   * Get the list of all supported blockchains
   * @returns The list of supported blockchains
   */
  public static getSupportedBlockchains(): string[] {
    return [
      'ethereum',
      'polygon',
      'avalanche',
      'optimism',
      'solana',
      'bitcoin',
      'ripple',
      'aptos',
      'sui',
      'mantle',
      'stellar',
      'hedera',
      'base',
      'zksync',
      'arbitrum',
      'near'
    ];
  }
}