import { ethers } from "ethers";
import { TokenAdapter, TokenAdapterFactory as ITokenAdapterFactory, detectTokenStandard } from "./TokenAdapter";
import { ERC20TokenAdapter } from "./ERC20TokenAdapter";
import { ERC721TokenAdapter } from "./ERC721TokenAdapter";
import { ERC1155TokenAdapter } from "./ERC1155TokenAdapter";
import { ERC1400TokenAdapter } from "./ERC1400TokenAdapter";
import { ERC3525TokenAdapter } from "./ERC3525TokenAdapter";
import { ERC4626TokenAdapter } from "./ERC4626TokenAdapter";
import { type Provider } from 'ethers';

/**
 * Factory for creating the appropriate token adapter based on token standard
 */
export class TokenAdapterFactory implements ITokenAdapterFactory {
  private adapters: Map<string, new (provider:  Provider) => TokenAdapter> = new Map();
  
  constructor() {
    // Register default adapters
    this.registerAdapter("ERC20", ERC20TokenAdapter);
    this.registerAdapter("ERC721", ERC721TokenAdapter);
    this.registerAdapter("ERC1155", ERC1155TokenAdapter);
    this.registerAdapter("ERC1400", ERC1400TokenAdapter);
    this.registerAdapter("ERC3525", ERC3525TokenAdapter);
    this.registerAdapter("ERC4626", ERC4626TokenAdapter);
  }
  
  /**
   * Register a new token adapter
   */
  registerAdapter(
    standard: string, 
    adapter: new (provider:  Provider) => TokenAdapter
  ): void {
    this.adapters.set(standard, adapter);
  }
  
  /**
   * Create the appropriate token adapter for a given token address
   */
  async createAdapter(tokenAddress: string, provider:  Provider): Promise<TokenAdapter> {
    // Detect the token standard
    const standard = await detectTokenStandard(tokenAddress, provider);
    
    // Get the appropriate adapter class
    const AdapterClass = this.adapters.get(standard);
    
    if (!AdapterClass) {
      if (standard === "UNKNOWN") {
        throw new Error(`Could not detect token standard for ${tokenAddress}`);
      } else {
        throw new Error(`No adapter registered for token standard ${standard}`);
      }
    }
    
    // Create an instance of the adapter
    return new AdapterClass(provider);
  }
  
  /**
   * Create an adapter for a specific token standard regardless of detection
   */
  createAdapterForStandard(standard: string, provider:  Provider): TokenAdapter {
    const AdapterClass = this.adapters.get(standard);
    
    if (!AdapterClass) {
      throw new Error(`No adapter registered for token standard ${standard}`);
    }
    
    return new AdapterClass(provider);
  }
  
  /**
   * Get a list of supported token standards
   */
  getSupportedStandards(): string[] {
    return Array.from(this.adapters.keys());
  }
}

// Singleton instance of the factory
export const tokenAdapterFactory = new TokenAdapterFactory();