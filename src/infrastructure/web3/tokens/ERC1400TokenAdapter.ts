import { Contract, type Provider, Interface, Wallet } from "ethers";
import { encodeBytes32String, decodeBytes32String } from "ethers";
import { Token } from "@/components/wallet/components/swap/types";
import { BaseTokenAdapter } from "./TokenAdapter";
import { ERC1400_ABI } from "@/infrastructure/web3/TokenInterfaces";

// Extended token type with ERC1400 data
export interface SecurityToken extends Token {
  partitions: string[];
  isIssuable: boolean;
  isControllable: boolean;
  documents: SecurityTokenDocument[];
  controllers: string[];
}

// Document information stored in the security token
export interface SecurityTokenDocument {
  name: string;
  uri: string;
  documentHash: string;
}

/**
 * Adapter for ERC1400 Security Token Standard
 */
export class ERC1400TokenAdapter extends BaseTokenAdapter {
  constructor(provider:  Provider) {
    super(provider);
  }
  
  /**
   * Get token metadata
   */
  async getTokenMetadata(tokenAddress: string): Promise<Token> {
    const contract = new Contract(tokenAddress, ERC1400_ABI, this.provider);
    
    try {
      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals()
      ]);
      
      return {
        address: tokenAddress,
        name,
        symbol,
        decimals,
        logoURI: "", // SecurityTokens typically don't have logos
        chainId: Number((await this.provider.getNetwork()).chainId)
      };
    } catch (error) {
      console.error("Error getting ERC1400 metadata:", error);
      throw new Error(`Failed to get metadata for token at ${tokenAddress}`);
    }
  }
  
  /**
   * Get extended security token information
   */
  async getSecurityTokenInfo(tokenAddress: string): Promise<SecurityToken> {
    const contract = new Contract(tokenAddress, ERC1400_ABI, this.provider);
    
    try {
      // Get basic metadata
      const basicTokenInfo = await this.getTokenMetadata(tokenAddress);
      
      // Get security token-specific info
      const [isIssuable, isControllable, partitions] = await Promise.all([
        contract.isIssuable().catch(() => false),
        contract.isControllable().catch(() => false),
        this.getPartitions(tokenAddress)
      ]);
      
      // Get controllers if the token is controllable
      let controllers: string[] = [];
      if (isControllable) {
        try {
          // Note: this is a non-standard extension, not all ERC1400 tokens expose this
          controllers = await contract.controllers().catch(() => []);
        } catch (e) {
          // Leave controllers empty if not available
        }
      }
      
      // Get documents - simplified approach
      const documents = await this.getDocuments(tokenAddress);
      
      return {
        ...basicTokenInfo,
        partitions,
        isIssuable,
        isControllable,
        documents,
        controllers
      };
    } catch (error) {
      console.error("Error getting security token info:", error);
      throw new Error(`Failed to get security token info for ${tokenAddress}`);
    }
  }
  
  /**
   * Get balance of tokens for an address
   * For security tokens, this returns the total balance across all partitions
   */
  async getBalance(tokenAddress: string, ownerAddress: string): Promise<string> {
    const contract = new Contract(tokenAddress, ERC1400_ABI, this.provider);
    
    try {
      const balance = await contract.balanceOf(ownerAddress);
      return balance.toString();
    } catch (error) {
      console.error("Error getting ERC1400 balance:", error);
      throw new Error(`Failed to get token balance for ${ownerAddress}`);
    }
  }
  
  /**
   * Get balance for a specific partition
   */
  async getBalanceByPartition(
    tokenAddress: string,
    partition: string,
    ownerAddress: string
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC1400_ABI, this.provider);
    
    try {
      const balance = await contract.balanceOfByPartition(partition, ownerAddress);
      return balance.toString();
    } catch (error) {
      console.error(`Error getting balance for partition ${partition}:`, error);
      throw new Error(`Failed to get partition balance for ${ownerAddress}`);
    }
  }
  
  /**
   * Get all partitions for a token
   */
  async getPartitions(tokenAddress: string): Promise<string[]> {
    const contract = new Contract(tokenAddress, ERC1400_ABI, this.provider);
    
    try {
      const partitionBytes = await contract.totalPartitions();
      return partitionBytes.map((p: string) => decodeBytes32String(p));
    } catch (error) {
      console.error("Error getting partitions:", error);
      return []; // Return empty array if partitions are not retrievable
    }
  }
  
  /**
   * Get partitions for a specific token holder
   */
  async getPartitionsOf(tokenAddress: string, ownerAddress: string): Promise<string[]> {
    const contract = new Contract(tokenAddress, ERC1400_ABI, this.provider);
    
    try {
      const partitionBytes = await contract.partitionsOf(ownerAddress);
      return partitionBytes.map((p: string) => decodeBytes32String(p));
    } catch (error) {
      console.error(`Error getting partitions for ${ownerAddress}:`, error);
      return []; // Return empty array if partitions are not retrievable
    }
  }
  
  /**
   * Get all documents registered with the token
   */
  async getDocuments(tokenAddress: string): Promise<SecurityTokenDocument[]> {
    const contract = new Contract(tokenAddress, ERC1400_ABI, this.provider);
    const documents: SecurityTokenDocument[] = [];
    
    try {
      // This is a very simplified approach
      // In a real implementation, you would need to know the document names in advance
      // or retrieve them from events
      
      // Try some common document names
      const commonDocNames = [
         "whitepaper",
         "prospectus",
         "legal",
         "disclaimer",
         "issuer"
      ];
      
      for (const docName of commonDocNames) {
        try {
          const [uri, documentHash] = await contract.getDocument(docName);
          if (uri) {
            documents.push({
              name:  docName,
              uri,
              documentHash
            });
          }
        } catch (e) {
          // Skip documents that don't exist
        }
      }
      
      return documents;
    } catch (error) {
      console.error("Error getting documents:", error);
      return []; // Return empty array if documents are not retrievable
    }
  }
  
  /**
   * Check if a transfer is valid
   */
  async canTransfer(
    tokenAddress: string,
    to: string,
    value: string,
    data: string = "0x"
  ): Promise<{code: number, reason: string}> {
    const contract = new Contract(tokenAddress, ERC1400_ABI, this.provider);
    
    try {
      // Check if transferable
      const [code, reason] = await contract.canTransfer(to, value, data);
      
      return {
        code: parseInt(code),
        reason:  decodeBytes32String(reason)
      };
    } catch (error) {
      console.error("Error checking transfer validity:", error);
      throw new Error(`Failed to check transfer validity`);
    }
  }
  
  /**
   * Check if a transfer is valid for a specific partition
   */
  async canTransferByPartition(
    tokenAddress: string,
    partition: string,
    from: string,
    to: string,
    value: string,
    data: string = "0x"
  ): Promise<{code: number, reason: string, partition: string}> {
    const contract = new Contract(tokenAddress, ERC1400_ABI, this.provider);
    
    try {
      // Check if transferable by partition
      const [code, reason, actualPartition] = await contract.canTransferByPartition(
        partition, 
        from, 
        to, 
        value, 
        data
      );
      
      return {
        code: parseInt(code),
        reason:  decodeBytes32String(reason),
        partition: decodeBytes32String(actualPartition)
      };
    } catch (error) {
      console.error(`Error checking transfer validity for partition ${partition}:`, error);
      throw new Error(`Failed to check transfer validity for partition`);
    }
  }
  
  /**
   * Transfer tokens by partition
   */
  async transferByPartition(
    tokenAddress: string,
    partition: string,
    fromAddress: string,
    toAddress: string,
    amount: string,
    privateKey: string,
    data: string = "0x"
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC1400_ABI, this.provider);
    const wallet = new Wallet(privateKey, this.provider);
    
    try {
      // Connect contract with signer
      const contractWithSigner = contract.connect(wallet);
      
      // Verify the signer address matches the from address
      if (wallet.address.toLowerCase() !== fromAddress.toLowerCase()) {
        throw new Error("Signer address does not match from address");
      }
      
      // First check if the transfer is valid
      const validation = await this.canTransferByPartition(
        tokenAddress,
        partition,
        fromAddress,
        toAddress,
        amount,
        data
      );
      
      if (validation.code !== 1) { // 1 is the success code in ERC1400
        throw new Error(`Transfer not allowed: ${validation.reason}`);
      }
      
      // Transfer the tokens
      const tx = await (contractWithSigner as any).transferByPartition(
        partition,
        toAddress,
        amount,
        data
      );
      const receipt = await tx.wait();
      
      return receipt.transactionHash;
    } catch (error) {
      console.error("Error transferring ERC1400 tokens:", error);
      throw new Error(`Failed to transfer tokens to ${toAddress}`);
    }
  }
  
  /**
   * Regular transfer (from default partition)
   */
  async transfer(
    tokenAddress: string,
    fromAddress: string,
    toAddress: string,
    amount: string,
    privateKey: string,
    data: string = "0x"
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC1400_ABI, this.provider);
    const wallet = new Wallet(privateKey, this.provider);
    
    try {
      // Connect contract with signer
      const contractWithSigner = contract.connect(wallet);
      
      // Verify the signer address matches the from address
      if (wallet.address.toLowerCase() !== fromAddress.toLowerCase()) {
        throw new Error("Signer address does not match from address");
      }
      
      // First check if the transfer is valid
      const validation = await this.canTransfer(
        tokenAddress,
        toAddress,
        amount,
        data
      );
      
      if (validation.code !== 1) { // 1 is the success code in ERC1400
        throw new Error(`Transfer not allowed: ${validation.reason}`);
      }
      
      // Transfer the tokens (standard ERC20 transfer)
      const tx = await (contractWithSigner as any).transfer(toAddress, amount);
      const receipt = await tx.wait();
      
      return receipt.transactionHash;
    } catch (error) {
      console.error("Error transferring ERC1400 tokens:", error);
      throw new Error(`Failed to transfer tokens to ${toAddress}`);
    }
  }
  
  /**
   * Estimate gas for token transfer
   */
  async estimateTransferGas(
    tokenAddress: string,
    fromAddress: string,
    toAddress: string,
    amount: string,
    data: string = "0x"
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC1400_ABI, this.provider);
    
    try {
      // First check if the transfer is valid
      const validation = await this.canTransfer(
        tokenAddress,
        toAddress,
        amount,
        data
      );
      
      if (validation.code !== 1) { // 1 is the success code in ERC1400
        throw new Error(`Transfer not allowed: ${validation.reason}`);
      }
      
      // Estimate gas for transfer
      const gasEstimate = await (contract as any).estimateGas.transfer(toAddress, amount);
      
      // Add 20% buffer for security tokens due to compliance checks
      const bufferedEstimate = gasEstimate.mul(120).div(100);
      return bufferedEstimate.toString();
    } catch (error) {
      console.error("Error estimating gas for ERC1400 transfer:", error);
      throw new Error(`Failed to estimate gas for token transfer`);
    }
  }
  
  /**
   * Estimate gas for partition transfer
   */
  async estimateTransferByPartitionGas(
    tokenAddress: string,
    partition: string,
    fromAddress: string,
    toAddress: string,
    amount: string,
    data: string = "0x"
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC1400_ABI, this.provider);
    
    try {
      // First check if the transfer is valid
      const validation = await this.canTransferByPartition(
        tokenAddress,
        partition,
        fromAddress,
        toAddress,
        amount,
        data
      );
      
      if (validation.code !== 1) { // 1 is the success code in ERC1400
        throw new Error(`Transfer not allowed: ${validation.reason}`);
      }
      
      // Estimate gas for transfer by partition
      const gasEstimate = await (contract as any).estimateGas.transferByPartition(
        partition,
        toAddress,
        amount,
        data
      );
      
      // Add 20% buffer for security tokens due to compliance checks
      const bufferedEstimate = gasEstimate.mul(120).div(100);
      return bufferedEstimate.toString();
    } catch (error) {
      console.error("Error estimating gas for ERC1400 partition transfer:", error);
      throw new Error(`Failed to estimate gas for partition token transfer`);
    }
  }
  
  /**
   * Check if a token supports a specific interface
   */
  async supportsInterface(tokenAddress: string, interfaceId: string): Promise<boolean> {
    // ERC1400 doesn't necessarily implement ERC165's supportsInterface
    // We'll check for key ERC1400 methods instead
    
    const contract = new Contract(tokenAddress, ERC1400_ABI, this.provider);
    
    try {
      // Check if this is an ERC1400 token by testing key methods
      const [issuable, totalPartitions] = await Promise.all([
        contract.isIssuable().catch(() => null),
        contract.totalPartitions().catch(() => null)
      ]);
      
      // If we can successfully call these methods, it likely supports ERC1400
      return issuable !== null && totalPartitions !== null;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get supported token standards
   */
  getSupportedStandards(): string[] {
    return ["ERC1400", "ERC20"]; // ERC1400 is backward compatible with ERC20
  }
}