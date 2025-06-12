import { Wallet, Contract, Interface, formatUnits, parseUnits, BigNumberish } from "ethers";
import type { Provider, EventLog } from "ethers";
import { Token } from "@/components/wallet/components/swap/types";
import { BaseTokenAdapter } from "./TokenAdapter";
import { ERC1155_ABI } from "@/infrastructure/web3/TokenInterfaces";
import { NFTMetadata } from "./ERC721TokenAdapter";

// Extended token type with ERC1155 data
export interface ERC1155Token extends Token {
  tokenId: string;
  balance: string;
  metadata?: NFTMetadata;
  isApprovedForAll?: boolean;
}

/**
 * Adapter for ERC1155 Multi-Token Standard
 */
export class ERC1155TokenAdapter extends BaseTokenAdapter {
  private cache: Map<string, NFTMetadata> = new Map();
  
  constructor(provider:  Provider) {
    super(provider);
  }
  
  /**
   * Get basic token collection metadata
   * Note: ERC1155 doesn't require name and symbol, so this may be empty
   */
  async getTokenMetadata(tokenAddress: string): Promise<Token> {
    // Try to get name and symbol if available (non-standard extension)
    const nameSymbolInterface = new  Interface([
      "function name() view returns (string)",
      "function symbol() view returns (string)"
    ]);
    
    try {
      const contract = new Contract(tokenAddress, nameSymbolInterface, this.provider);
      const [name, symbol] = await Promise.all([
        contract.name().catch(() => "ERC1155 Collection"),
        contract.symbol().catch(() => "ERC1155")
      ]);
      
      return {
        address: tokenAddress,
        name,
        symbol,
        decimals: 0, // ERC1155 tokens don't have decimals
        logoURI: "", // Will be populated with collection image if available
        chainId: Number((await this.provider.getNetwork()).chainId)
      };
    } catch (error) {
      // Return default values if methods are not available
      return {
        address: tokenAddress,
        name: "ERC1155 Collection",
        symbol: "ERC1155",
        decimals: 0,
        logoURI: "",
        chainId: Number((await this.provider.getNetwork()).chainId)
      };
    }
  }
  
  /**
   * Get balance of a specific token ID for an address
   */
  async getBalance(
    tokenAddress: string, 
    ownerAddress: string, 
    tokenId?: string
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC1155_ABI, this.provider);
    
    try {
      if (tokenId) {
        // Get balance for a specific token ID
        const balance = await contract.balanceOf(ownerAddress, tokenId);
        return balance.toString();
      } else {
        throw new Error("Token ID is required for ERC1155 balance checks");
      }
    } catch (error) {
      console.error("Error getting ERC1155 balance:", error);
      throw new Error(`Failed to get token balance for ${ownerAddress}`);
    }
  }
  
  /**
   * Get balances for multiple token IDs in a batch
   */
  async getBalanceBatch(
    tokenAddress: string,
    ownerAddress: string,
    tokenIds: string[]
  ): Promise<Record<string, string>> {
    const contract = new Contract(tokenAddress, ERC1155_ABI, this.provider);
    
    try {
      // Create arrays of addresses (one for each token ID)
      const addresses = new Array(tokenIds.length).fill(ownerAddress);
      
      // Get balances in a batch request
      const balances = await contract.balanceOfBatch(addresses, tokenIds);
      
      // Create a record of token ID to balance
      const result: Record<string, string> = {};
      tokenIds.forEach((id, index) => {
        result[id] = balances[index].toString();
      });
      
      return result;
    } catch (error) {
      console.error("Error getting ERC1155 batch balances:", error);
      throw new Error(`Failed to get batch balances for ${ownerAddress}`);
    }
  }
  
  /**
   * Transfer tokens to another address
   * 
   * This overloaded method supports the ERC1155 standard by accepting tokenId and data parameters
   */
  async transfer(
    tokenAddress: string,
    fromAddress: string,
    toAddress: string,
    amount: string,
    privateKey: string,
    tokenId?: string,
    data: string = "0x"
  ): Promise<string> {
    if (!tokenId) {
      throw new Error("Token ID is required for ERC1155 transfers");
    }
    
    const contract = new Contract(tokenAddress, ERC1155_ABI, this.provider);
    const wallet = new Wallet(privateKey, this.provider);
    
    try {
      // Connect contract with signer
      const contractWithSigner = contract.connect(wallet);
      
      // Verify the signer address matches the from address
      if (wallet.address.toLowerCase() !== fromAddress.toLowerCase()) {
        throw new Error("Signer address does not match from address");
      }
      
      // Transfer the tokens
      const tx = await (contractWithSigner as any).safeTransferFrom(
        fromAddress,
        toAddress,
        tokenId,
        amount,
        data
      );
      const receipt = await tx.wait();
      
      return receipt.transactionHash;
    } catch (error) {
      console.error("Error transferring ERC1155:", error);
      throw new Error(`Failed to transfer token #${tokenId} to ${toAddress}`);
    }
  }
  
  /**
   * Transfer multiple tokens in a batch
   */
  async batchTransfer(
    tokenAddress: string,
    fromAddress: string,
    toAddress: string,
    tokenIds: string[],
    amounts: string[],
    privateKey: string,
    data: string = "0x"
  ): Promise<string> {
    if (tokenIds.length !== amounts.length) {
      throw new Error("Token IDs and amounts arrays must have the same length");
    }
    
    const contract = new Contract(tokenAddress, ERC1155_ABI, this.provider);
    const wallet = new Wallet(privateKey, this.provider);
    
    try {
      // Connect contract with signer
      const contractWithSigner = contract.connect(wallet);
      
      // Verify the signer address matches the from address
      if (wallet.address.toLowerCase() !== fromAddress.toLowerCase()) {
        throw new Error("Signer address does not match from address");
      }
      
      // Transfer the tokens in a batch
      const tx = await (contractWithSigner as any).safeBatchTransferFrom(
        fromAddress,
        toAddress,
        tokenIds,
        amounts,
        data
      );
      const receipt = await tx.wait();
      
      return receipt.transactionHash;
    } catch (error) {
      console.error("Error batch transferring ERC1155:", error);
      throw new Error(`Failed to batch transfer tokens to ${toAddress}`);
    }
  }
  
  /**
   * Estimate gas for token transfer
   * 
   * This overloaded method supports the ERC1155 standard by accepting tokenId and data parameters
   */
  async estimateTransferGas(
    tokenAddress: string,
    fromAddress: string,
    toAddress: string,
    amount: string,
    tokenId?: string,
    data: string = "0x"
  ): Promise<string> {
    if (!tokenId) {
      throw new Error("Token ID is required for ERC1155 transfers");
    }
    
    const contract = new Contract(tokenAddress, ERC1155_ABI, this.provider);
    
    try {
      const gasEstimate = await (contract as any).estimateGas.safeTransferFrom(
        fromAddress,
        toAddress,
        tokenId,
        amount,
        data
      );
      
      // Add 10% buffer for gas price fluctuations
      const bufferedEstimate = gasEstimate.mul(110).div(100);
      return bufferedEstimate.toString();
    } catch (error) {
      console.error("Error estimating gas for ERC1155 transfer:", error);
      throw new Error(`Failed to estimate gas for token #${tokenId} transfer`);
    }
  }
  
  /**
   * Check if an address is approved to transfer all tokens from an owner
   */
  async isApprovedForAll(
    tokenAddress: string,
    ownerAddress: string,
    operatorAddress: string
  ): Promise<boolean> {
    const contract = new Contract(tokenAddress, ERC1155_ABI, this.provider);
    
    try {
      return await contract.isApprovedForAll(ownerAddress, operatorAddress);
    } catch (error) {
      console.error("Error checking approval status:", error);
      throw new Error(`Failed to check approval status for ${operatorAddress}`);
    }
  }
  
  /**
   * Set approval for all tokens
   */
  async setApprovalForAll(
    tokenAddress: string,
    ownerAddress: string,
    operatorAddress: string,
    approved: boolean,
    privateKey: string
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC1155_ABI, this.provider);
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
   * Get metadata for a specific token ID
   */
  async getTokenURI(tokenAddress: string, tokenId: string): Promise<string> {
    const contract = new Contract(tokenAddress, ERC1155_ABI, this.provider);
    
    try {
      return await contract.uri(tokenId);
    } catch (error) {
      console.error(`Error getting URI for token #${tokenId}:`, error);
      throw new Error(`Failed to get URI for token #${tokenId}`);
    }
  }
  
  /**
   * Get full token metadata for a specific token ID
   */
  async getTokenMetadataById(tokenAddress: string, tokenId: string): Promise<NFTMetadata> {
    const cacheKey = `${tokenAddress}_${tokenId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    try {
      // Get the token URI
      const tokenURI = await this.getTokenURI(tokenAddress, tokenId);
      
      // Process the URI - handle different formats (ipfs://, http://, etc.)
      let uri = tokenURI;
      
      // Replace {id} with the actual token ID in hex format
      if (uri.includes("{id}")) {
        // Convert tokenId to hex and pad to 64 characters
        const hexId = BigInt(tokenId).toString(16).padStart(64, "0");
        uri = uri.replace("{id}", hexId);
      }
      
      // Handle IPFS URIs
      uri = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
      
      // Fetch the metadata
      const response = await fetch(uri);
      const metadata = await response.json();
      
      this.cache.set(cacheKey, metadata);
      return metadata;
    } catch (error) {
      console.error(`Error getting metadata for token #${tokenId}:`, error);
      
      // Return minimal metadata if the fetch fails
      const fallbackMetadata: NFTMetadata = {
        id: tokenId,
        name: `Token #${tokenId}`,
        description: "Metadata unavailable",
        image: "",
        attributes: []
      };
      
      return fallbackMetadata;
    }
  }
  
  /**
   * Get all tokens owned by an address
   */
  async getTokensByOwner(
    tokenAddress: string,
    ownerAddress: string
  ): Promise<ERC1155Token[]> {
    // This is a complex operation for ERC1155 since there's no standard enumeration
    // We'll use Transfer events to find tokens that might be owned by the address
    
    const contract = new Contract(tokenAddress, ERC1155_ABI, this.provider);
    
    try {
      // Get TransferSingle events where the recipient is the owner
      const singleFilter = contract.filters.TransferSingle(null, null, ownerAddress, null, null);
      const singleEvents = await contract.queryFilter(singleFilter, -10000); // Last 10000 blocks
      
      // Get TransferBatch events where the recipient is the owner
      const batchFilter = contract.filters.TransferBatch(null, null, ownerAddress, null, null);
      const batchEvents = await contract.queryFilter(batchFilter, -10000); // Last 10000 blocks
      
      // Extract unique token IDs from events
      const tokenIdSet = new Set<string>();
      
      // Process single transfers
      for (const event of singleEvents) {
        const log = event as EventLog;
        const tokenId = log.args?.id?.toString();
        if (tokenId) tokenIdSet.add(tokenId);
      }
      
      // Process batch transfers
      for (const event of batchEvents) {
        const log = event as EventLog;
        const tokenIds = log.args?.ids;
        if (tokenIds) {
          for (const id of tokenIds) {
            tokenIdSet.add(id.toString());
          }
        }
      }
      
      // Convert to array
      const tokenIds = Array.from(tokenIdSet);
      
      // Get balances for all token IDs
      const balances = await this.getBalanceBatch(tokenAddress, ownerAddress, tokenIds);
      
      // Get collection metadata
      const collectionMetadata = await this.getTokenMetadata(tokenAddress);
      
      // Build the token list with balances > 0
      const tokens: ERC1155Token[] = [];
      
      for (const tokenId of tokenIds) {
        const balance = balances[tokenId];
        
        // Only include tokens with positive balance
        if (balance && BigInt(balance) > 0n) {
          // Try to get token-specific metadata
          let metadata: NFTMetadata | undefined;
          try {
            metadata = await this.getTokenMetadataById(tokenAddress, tokenId);
          } catch (e) {
            // Skip metadata if unavailable
          }
          
          tokens.push({
            ...collectionMetadata,
            tokenId,
            balance,
            metadata
          });
        }
      }
      
      return tokens;
    } catch (error) {
      console.error("Error getting ERC1155 tokens by owner:", error);
      throw new Error(`Failed to get tokens owned by ${ownerAddress}`);
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
    return ["ERC1155"];
  }
}