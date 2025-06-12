import { ethers } from "ethers";
import { Wallet, Contract, Interface, formatUnits, parseUnits, BigNumberish } from "ethers";
import type { Provider } from "ethers";
import { Token } from "@/components/wallet/components/swap/types";
import { BaseTokenAdapter } from "./TokenAdapter";
import { ERC3525_ABI } from "@/infrastructure/web3/TokenInterfaces";
import { NFTMetadata } from "./ERC721TokenAdapter";

// Extended token type with ERC3525 data
export interface SemiFungibleToken extends Token {
  tokenId: string;
  slot: string;
  value: string;
  valueDecimals: number;
  owner: string;
  metadata?: NFTMetadata;
}

/**
 * Adapter for ERC3525 Semi-Fungible Token Standard
 * 
 * ERC3525 combines properties of both NFTs and fungible tokens:
 * - Each token has a unique ID like an NFT
 * - Tokens belong to a "slot" (category)
 * - Tokens have a "value" that can be transferred between tokens of the same slot
 */
export class ERC3525TokenAdapter extends BaseTokenAdapter {
  private cache: Map<string, SemiFungibleToken> = new Map();
  
  constructor(provider:  Provider) {
    super(provider);
  }
  
  /**
   * Get basic token collection metadata
   */
  async getTokenMetadata(tokenAddress: string): Promise<Token> {
    const contract = new Contract(tokenAddress, ERC3525_ABI, this.provider);
    
    try {
      const [name, symbol, valueDecimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.valueDecimals()
      ]);
      
      return {
        address: tokenAddress,
        name,
        symbol,
        decimals: valueDecimals, // Use valueDecimals for the token value units
        logoURI: "",
        chainId: Number((await this.provider.getNetwork()).chainId)
      };
    } catch (error) {
      console.error("Error getting ERC3525 metadata:", error);
      throw new Error(`Failed to get metadata for token at ${tokenAddress}`);
    }
  }
  
  // Mock implementation for valueOf until the correct interface can be determined
  private async getTokenValue(contract: Contract, tokenId: string): Promise<bigint> {
    // Attempt to access the value with various approaches
    try {
      // Cast the contract to any to bypass TypeScript checks
      const contractAny = contract as any;
      
      // Try to get the value
      if (typeof contractAny.valueOf === 'function') {
        return await contractAny.valueOf(tokenId);
      }
      
      // Fallback to a mock value for testing
      console.warn(`valueOf function not available for token ${tokenId}, using mock value`);
      return 1000n; // Mock value for testing
    } catch (error) {
      console.error(`Error getting value for token ${tokenId}:`, error);
      return 0n;
    }
  }
  
  /**
   * Get detailed info for a specific token ID
   */
  async getTokenInfo(tokenAddress: string, tokenId: string): Promise<SemiFungibleToken> {
    const cacheKey = `${tokenAddress}_${tokenId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    const contract = new Contract(tokenAddress, ERC3525_ABI, this.provider);
    
    try {
      // Get collection metadata first
      const collectionMetadata = await this.getTokenMetadata(tokenAddress);
      
      // Get token-specific data
      const [owner, slot, tokenURI] = await Promise.all([
        contract.ownerOf(tokenId),
        contract.slotOf(tokenId),
        contract.tokenURI(tokenId).catch(() => "")
      ]);
      
      // Get token value
      const value = await this.getTokenValue(contract, tokenId);
      
      // Try to get token metadata from URI if available
      let metadata: NFTMetadata | undefined;
      if (tokenURI) {
        try {
          // Handle IPFS URIs
          const url = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");
          const response = await fetch(url);
          metadata = await response.json();
        } catch (error) {
          console.warn(`Failed to fetch metadata for token ${tokenId}:`, error);
        }
      }
      
      const tokenInfo: SemiFungibleToken = {
        ...collectionMetadata,
        tokenId,
        slot: slot.toString(),
        value: value.toString(),
        valueDecimals: collectionMetadata.decimals,
        owner,
        metadata
      };
      
      this.cache.set(cacheKey, tokenInfo);
      return tokenInfo;
    } catch (error) {
      console.error(`Error getting token info for #${tokenId}:`, error);
      throw new Error(`Failed to get token info for #${tokenId}`);
    }
  }
  
  /**
   * Get balance for a token ID
   * In ERC3525, each token ID has its own value
   */
  async getBalance(tokenAddress: string, ownerAddress: string, tokenId?: string): Promise<string> {
    const contract = new Contract(tokenAddress, ERC3525_ABI, this.provider);
    
    if (tokenId) {
      // Get the value of a specific token
      try {
        // First check if the owner matches
        const actualOwner = await contract.ownerOf(tokenId);
        if (actualOwner.toLowerCase() !== ownerAddress.toLowerCase()) {
          return "0"; // Not the owner of this token
        }
        
        // Get token value
        const value = await this.getTokenValue(contract, tokenId);
        return value.toString();
      } catch (error) {
        console.error(`Error getting value for token #${tokenId}:`, error);
        return "0";
      }
    } else {
      // Get all token values owned by this address
      try {
        // Get the token balance (number of NFTs owned)
        const balance = await contract.balanceOf(ownerAddress);
        let totalValue = 0n;
        
        // Sum up the values of all tokens
        for (let i = 0; i < balance.toNumber(); i++) {
          try {
            // Get token ID at index
            const tokenId = await contract.tokenOfOwnerByIndex(ownerAddress, i);
            
            // Get token value
            const value = await this.getTokenValue(contract, tokenId);
            
            // Add to the total
            totalValue = totalValue + BigInt(value);
          } catch (e) {
            // Skip tokens that have errors
            console.error(`Error getting value for token index ${i}:`, e);
          }
        }
        
        return totalValue.toString();
      } catch (error) {
        console.error(`Error getting total value for ${ownerAddress}:`, error);
        throw new Error(`Failed to get token balance for ${ownerAddress}`);
      }
    }
  }
  
  /**
   * Get all tokens owned by an address
   */
  async getTokensByOwner(tokenAddress: string, ownerAddress: string): Promise<SemiFungibleToken[]> {
    const contract = new Contract(tokenAddress, ERC3525_ABI, this.provider);
    
    try {
      // Get the token balance (number of NFTs owned)
      const balance = await contract.balanceOf(ownerAddress);
      const tokens: SemiFungibleToken[] = [];
      
      // Get metadata for each token
      for (let i = 0; i < balance.toNumber(); i++) {
        try {
          // Get token ID at index
          const tokenId = await contract.tokenOfOwnerByIndex(ownerAddress, i);
          
          // Get detailed token info
          const tokenInfo = await this.getTokenInfo(tokenAddress, tokenId.toString());
          tokens.push(tokenInfo);
        } catch (e) {
          // Skip tokens that can't be processed
          console.error("Error processing token:", e);
        }
      }
      
      return tokens;
    } catch (error) {
      console.error(`Error getting tokens owned by ${ownerAddress}:`, error);
      throw new Error(`Failed to get tokens owned by ${ownerAddress}`);
    }
  }
  
  /**
   * Get allowance for a token ID
   */
  async getAllowance(
    tokenAddress: string,
    tokenId: string,
    spenderAddress: string
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC3525_ABI, this.provider);
    
    try {
      const allowance = await contract.allowance(tokenId, spenderAddress);
      return allowance.toString();
    } catch (error) {
      console.error(`Error getting allowance for token #${tokenId}:`, error);
      throw new Error(`Failed to get allowance for token #${tokenId}`);
    }
  }
  
  /**
   * Approve token value spending by another address
   */
  async approve(
    tokenAddress: string,
    tokenId: string,
    spenderAddress: string,
    amount: string,
    privateKey: string
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC3525_ABI, this.provider);
    const wallet = new Wallet(privateKey, this.provider);
    
    try {
      // Connect contract with signer
      const contractWithSigner = contract.connect(wallet);
      
      // Get the owner of the token
      const tokenOwner = await contract.ownerOf(tokenId);
      
      // Check if the signer is the owner
      if (wallet.address.toLowerCase() !== tokenOwner.toLowerCase()) {
        throw new Error("Signer is not the owner of this token");
      }
      
      // Approve value
      const tx = await (contractWithSigner as any).approve(tokenId, spenderAddress, amount);
      const receipt = await tx.wait();
      
      return receipt.transactionHash;
    } catch (error) {
      console.error(`Error approving token #${tokenId}:`, error);
      throw new Error(`Failed to approve token #${tokenId}`);
    }
  }
  
  /**
   * Transfer value between tokens
   */
  async transferValue(
    tokenAddress: string,
    fromTokenId: string,
    toTokenId: string,
    amount: string,
    privateKey: string
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC3525_ABI, this.provider);
    const wallet = new Wallet(privateKey, this.provider);
    
    try {
      // Connect contract with signer
      const contractWithSigner = contract.connect(wallet);
      
      // Get the owner of the token
      const fromTokenOwner = await contract.ownerOf(fromTokenId);
      
      // Check if the signer is the owner
      if (wallet.address.toLowerCase() !== fromTokenOwner.toLowerCase()) {
        throw new Error("Signer is not the owner of the source token");
      }
      
      // Check if tokens are in the same slot
      const fromSlot = await contract.slotOf(fromTokenId);
      const toSlot = await contract.slotOf(toTokenId);
      
      if (fromSlot.toString() !== toSlot.toString()) {
        throw new Error("Cannot transfer value between tokens in different slots");
      }
      
      // Transfer value
      const tx = await (contractWithSigner as any).transferValue(fromTokenId, toTokenId, amount);
      const receipt = await tx.wait();
      
      return receipt.transactionHash;
    } catch (error) {
      console.error(`Error transferring value from token #${fromTokenId} to #${toTokenId}:`, error);
      throw new Error(`Failed to transfer value between tokens`);
    }
  }
  
  /**
   * Transfer token to another address (full NFT transfer)
   */
  async transfer(
    tokenAddress: string,
    fromAddress: string,
    toAddress: string,
    tokenId: string,
    privateKey: string
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC3525_ABI, this.provider);
    const wallet = new Wallet(privateKey, this.provider);
    
    try {
      // Connect contract with signer
      const contractWithSigner = contract.connect(wallet);
      
      // Verify ownership
      const owner = await contract.ownerOf(tokenId);
      if (owner.toLowerCase() !== fromAddress.toLowerCase()) {
        throw new Error("Sender is not the owner of this token");
      }
      
      // Verify signer
      if (wallet.address.toLowerCase() !== fromAddress.toLowerCase()) {
        throw new Error("Signer address does not match sender address");
      }
      
      // Transfer the token
      const tx = await (contractWithSigner as any).transferFrom(fromAddress, toAddress, tokenId);
      const receipt = await tx.wait();
      
      return receipt.transactionHash;
    } catch (error) {
      console.error(`Error transferring token #${tokenId}:`, error);
      throw new Error(`Failed to transfer token #${tokenId}`);
    }
  }
  
  /**
   * Estimate gas for value transfer
   */
  async estimateTransferValueGas(
    tokenAddress: string,
    fromTokenId: string,
    toTokenId: string,
    amount: string
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC3525_ABI, this.provider);
    
    try {
      // Check slots match
      const fromSlot = await contract.slotOf(fromTokenId);
      const toSlot = await contract.slotOf(toTokenId);
      
      if (fromSlot.toString() !== toSlot.toString()) {
        throw new Error("Cannot transfer value between tokens in different slots");
      }
      
      // Estimate gas
      const gasEstimate = await (contract as any).estimateGas.transferValue(
        fromTokenId,
        toTokenId,
        amount
      );
      
      // Add 10% buffer
      const bufferedEstimate = gasEstimate.mul(110).div(100);
      return bufferedEstimate.toString();
    } catch (error) {
      console.error("Error estimating gas for value transfer:", error);
      throw new Error(`Failed to estimate gas for value transfer`);
    }
  }
  
  /**
   * Estimate gas for token transfer
   */
  async estimateTransferGas(
    tokenAddress: string,
    fromAddress: string,
    toAddress: string,
    tokenId: string
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC3525_ABI, this.provider);
    
    try {
      const gasEstimate = await (contract as any).estimateGas.transferFrom(
        fromAddress,
        toAddress,
        tokenId
      );
      
      // Add 10% buffer
      const bufferedEstimate = gasEstimate.mul(110).div(100);
      return bufferedEstimate.toString();
    } catch (error) {
      console.error("Error estimating gas for token transfer:", error);
      throw new Error(`Failed to estimate gas for token transfer`);
    }
  }
  
  /**
   * Check if a token supports a specific interface
   */
  async supportsInterface(tokenAddress: string, interfaceId: string): Promise<boolean> {
    const erc165Interface = new  Interface([
      "function supportsInterface(bytes4 interfaceId) view returns (bool)"
    ]);
    
    try {
      const contract = new Contract(tokenAddress, erc165Interface, this.provider);
      return await contract.supportsInterface(interfaceId);
    } catch (error) {
      return false; // Contract doesn't implement ERC-165
    }
  }
  
  /**
   * Get supported token standards
   */
  getSupportedStandards(): string[] {
    return ["ERC3525", "ERC721"]; // ERC3525 extends ERC721
  }
}