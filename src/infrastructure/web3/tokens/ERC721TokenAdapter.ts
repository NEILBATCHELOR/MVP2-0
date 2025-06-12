import { ethers } from "ethers";
import { Token } from "@/components/wallet/components/swap/types";
import { BaseTokenAdapter } from "./TokenAdapter";
import { ERC721_ABI } from "@/infrastructure/web3/TokenInterfaces";
import { type Provider, Contract, Wallet, Interface, type BigNumberish } from 'ethers';

// Metadata extension for NFTs
export interface NFTMetadata {
  id: string;
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  [key: string]: any;
}

// Extended token type with NFT data
export interface NFTToken extends Token {
  tokenId: string;
  owner: string;
  metadata?: NFTMetadata;
  isApprovedForAll?: boolean;
}

/**
 * Adapter for ERC721 Non-Fungible Tokens (NFTs)
 */
export class ERC721TokenAdapter extends BaseTokenAdapter {
  private cache: Map<string, NFTToken> = new Map();
  
  constructor(provider:  Provider) {
    super(provider);
  }
  
  /**
   * Get basic token metadata - for NFTs this is collection-level metadata
   */
  async getTokenMetadata(tokenAddress: string): Promise<Token> {
    const contract = new Contract(tokenAddress, ERC721_ABI, this.provider);
    
    try {
      const [name, symbol] = await Promise.all([
        contract.name(),
        contract.symbol()
      ]);
      
      return {
        address: tokenAddress,
        name,
        symbol,
        decimals: 0, // NFTs don't have decimals
        logoURI: "", // Will be populated with collection image if available
        chainId: Number((await this.provider.getNetwork()).chainId)
      };
    } catch (error) {
      console.error("Error getting ERC721 metadata:", error);
      throw new Error(`Failed to get metadata for NFT at ${tokenAddress}`);
    }
  }
  
  /**
   * Get NFT balance for an address
   */
  async getBalance(tokenAddress: string, ownerAddress: string): Promise<string> {
    const contract = new Contract(tokenAddress, ERC721_ABI, this.provider);
    
    try {
      const balance = await contract.balanceOf(ownerAddress);
      return balance.toString();
    } catch (error) {
      console.error("Error getting ERC721 balance:", error);
      throw new Error(`Failed to get NFT balance for ${ownerAddress}`);
    }
  }
  
  /**
   * Transfer an NFT to another address
   */
  async transfer(
    tokenAddress: string,
    fromAddress: string,
    toAddress: string,
    tokenId: string,
    privateKey: string
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC721_ABI, this.provider);
    const wallet = new Wallet(privateKey, this.provider);
    
    try {
      // Connect contract with signer
      const contractWithSigner = contract.connect(wallet);
      
      // Check if signer is owner of the token
      const tokenOwner = await contract.ownerOf(tokenId);
      if (tokenOwner.toLowerCase() !== fromAddress.toLowerCase()) {
        throw new Error("Not the owner of this NFT");
      }
      
      // Transfer the NFT
      const tx = await (contractWithSigner as any).transferFrom(fromAddress, toAddress, tokenId);
      const receipt = await tx.wait();
      
      return receipt.transactionHash;
    } catch (error) {
      console.error("Error transferring ERC721:", error);
      throw new Error(`Failed to transfer NFT #${tokenId} to ${toAddress}`);
    }
  }
  
  /**
   * Estimate gas for NFT transfer
   */
  async estimateTransferGas(
    tokenAddress: string,
    fromAddress: string,
    toAddress: string,
    tokenId: string
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC721_ABI, this.provider);
    
    try {
      const gasEstimate = await (contract.estimateGas as any).transferFrom(
        fromAddress,
        toAddress,
        tokenId
      );
      
      // Add 10% buffer for gas price fluctuations
      const bufferedEstimate = gasEstimate.mul(110).div(100);
      return bufferedEstimate.toString();
    } catch (error) {
      console.error("Error estimating gas for ERC721 transfer:", error);
      throw new Error(`Failed to estimate gas for NFT #${tokenId} transfer`);
    }
  }
  
  /**
   * Get an NFT by token ID
   */
  async getNFT(tokenAddress: string, tokenId: string): Promise<NFTToken> {
    const cacheKey = `${tokenAddress}_${tokenId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    const contract = new Contract(tokenAddress, ERC721_ABI, this.provider);
    
    try {
      // Get basic collection metadata
      const [name, symbol, owner, tokenURI] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.ownerOf(tokenId),
        contract.tokenURI(tokenId)
      ]);
      
      // Fetch metadata from tokenURI
      let metadata: NFTMetadata | undefined;
      try {
        // Handle IPFS URIs
        const url = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");
        const response = await fetch(url);
        metadata = await response.json();
      } catch (error) {
        console.warn(`Failed to fetch metadata for token ${tokenId}:`, error);
      }
      
      const nft: NFTToken = {
        address: tokenAddress,
        name,
        symbol,
        decimals: 0,
        logoURI: metadata?.image || "",
        tokenId,
        owner,
        metadata,
        chainId: Number((await this.provider.getNetwork()).chainId)
      };
      
      this.cache.set(cacheKey, nft);
      return nft;
    } catch (error) {
      console.error(`Error getting NFT #${tokenId}:`, error);
      throw new Error(`Failed to get NFT #${tokenId}`);
    }
  }
  
  /**
   * Get all NFTs owned by an address for a specific collection
   */
  async getNFTsByOwner(tokenAddress: string, ownerAddress: string): Promise<NFTToken[]> {
    const contract = new Contract(tokenAddress, ERC721_ABI, this.provider);
    
    try {
      // Get the balance first
      const balance = await contract.balanceOf(ownerAddress);
      const tokenCount = balance.toNumber();
      
      // For ERC721 Enumerable collections, we can get tokens by index
      const tokens: NFTToken[] = [];
      const hasEnumerableExtension = await this.supportsInterface(
        tokenAddress, 
        "0x780e9d63" // ERC721Enumerable interface ID
      );
      
      if (hasEnumerableExtension) {
        // Get token IDs using enumerable extension
        const tokenIdPromises: Promise<string>[] = [];
        for (let i = 0; i < tokenCount; i++) {
          tokenIdPromises.push(
            contract.tokenOfOwnerByIndex(ownerAddress, i).then((id: any) => id.toString())
          );
        }
        
        const tokenIds = await Promise.all(tokenIdPromises);
        
        // Get full NFT details for each token ID
        const nftPromises = tokenIds.map(id => this.getNFT(tokenAddress, id));
        tokens.push(...await Promise.all(nftPromises));
      } else {
        // For non-enumerable collections, we need to check transfer events
        // This is a simplified approach - in production, you'd use an indexer or subgraph
        console.warn("Collection does not support enumeration - token list may be incomplete");
        
        // Get Transfer events where the recipient is the owner address
        const filter = contract.filters.Transfer(null, ownerAddress, null);
        const events = await contract.queryFilter(filter, -10000); // Last 10000 blocks
        
        // Get unique token IDs from events
        const tokenIdSet = new Set<string>();
        for (const event of events) {
          const tokenId = (event as any).args?.tokenId.toString();
          if (tokenId) tokenIdSet.add(tokenId);
        }
        
        // Verify current ownership for each token
        for (const tokenId of tokenIdSet) {
          try {
            const currentOwner = await contract.ownerOf(tokenId);
            if (currentOwner.toLowerCase() === ownerAddress.toLowerCase()) {
              const nft = await this.getNFT(tokenAddress, tokenId);
              tokens.push(nft);
            }
          } catch (e) {
            // Skip tokens that can't be verified
          }
        }
      }
      
      return tokens;
    } catch (error) {
      console.error("Error getting NFTs by owner:", error);
      throw new Error(`Failed to get NFTs owned by ${ownerAddress}`);
    }
  }
  
  /**
   * Check if an address is approved to transfer all NFTs from an owner
   */
  async isApprovedForAll(
    tokenAddress: string,
    ownerAddress: string,
    operatorAddress: string
  ): Promise<boolean> {
    const contract = new Contract(tokenAddress, ERC721_ABI, this.provider);
    
    try {
      return await contract.isApprovedForAll(ownerAddress, operatorAddress);
    } catch (error) {
      console.error("Error checking approval status:", error);
      throw new Error(`Failed to check approval status for ${operatorAddress}`);
    }
  }
  
  /**
   * Set approval for all NFTs
   */
  async setApprovalForAll(
    tokenAddress: string,
    ownerAddress: string,
    operatorAddress: string,
    approved: boolean,
    privateKey: string
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC721_ABI, this.provider);
    const wallet = new Wallet(privateKey, this.provider);
    
    try {
      // Connect contract with signer
      const contractWithSigner = contract.connect(wallet);
      
      // Validate the signer address matches the owner
      if (wallet.address.toLowerCase() !== ownerAddress.toLowerCase()) {
        throw new Error("Signer address does not match owner address");
      }
      
      // Set approval for all
      const tx = await (contractWithSigner as any).setApprovalForAll(operatorAddress, approved);
      const receipt = await tx.wait();
      
      return receipt.transactionHash;
    } catch (error) {
      console.error("Error setting approval for all:", error);
      throw new Error(`Failed to set approval for operator ${operatorAddress}`);
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
    return ["ERC721"];
  }
}