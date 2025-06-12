import { Contract, Interface, type Provider } from "ethers";
import { Token } from "@/components/wallet/components/swap/types";

// Base interface for all token adapters
export interface TokenAdapter {
  /**
   * Get token metadata (name, symbol, etc.)
   */
  getTokenMetadata(tokenAddress: string): Promise<Token>;

  /**
   * Get balance of tokens for an address
   */
  getBalance(tokenAddress: string, ownerAddress: string): Promise<string>;

  /**
   * Transfer tokens to a recipient
   */
  transfer(
    tokenAddress: string, 
    fromAddress: string, 
    toAddress: string, 
    amount: string,
    privateKey: string
  ): Promise<string>;

  /**
   * Estimate gas for a transfer
   */
  estimateTransferGas(
    tokenAddress: string, 
    fromAddress: string, 
    toAddress: string, 
    amount: string
  ): Promise<string>;

  /**
   * Get token allowance
   */
  getAllowance?(
    tokenAddress: string, 
    ownerAddress: string, 
    spenderAddress: string
  ): Promise<string>;

  /**
   * Approve tokens for a spender
   */
  approve?(
    tokenAddress: string, 
    ownerAddress: string, 
    spenderAddress: string, 
    amount: string,
    privateKey: string
  ): Promise<string>;

  /**
   * Check if a token supports a specific interface
   */
  supportsInterface(tokenAddress: string, interfaceId: string): Promise<boolean>;

  /**
   * Get supported token standards
   */
  getSupportedStandards(): string[];
}

// Factory interface for creating token adapters
export interface TokenAdapterFactory {
  /**
   * Create the appropriate token adapter for a given token address
   */
  createAdapter(tokenAddress: string, provider:  Provider): Promise<TokenAdapter>;
  
  /**
   * Register a new token adapter
   */
  registerAdapter(standard: string, adapter: new (provider:  Provider) => TokenAdapter): void;
}

// Base class for token adapters
export abstract class BaseTokenAdapter implements TokenAdapter {
  protected provider:  Provider;
  
  constructor(provider:  Provider) {
    this.provider = provider;
  }
  
  abstract getTokenMetadata(tokenAddress: string): Promise<Token>;
  abstract getBalance(tokenAddress: string, ownerAddress: string): Promise<string>;
  abstract transfer(
    tokenAddress: string, 
    fromAddress: string, 
    toAddress: string, 
    amount: string,
    privateKey: string
  ): Promise<string>;
  abstract estimateTransferGas(
    tokenAddress: string, 
    fromAddress: string, 
    toAddress: string, 
    amount: string
  ): Promise<string>;
  abstract supportsInterface(tokenAddress: string, interfaceId: string): Promise<boolean>;
  abstract getSupportedStandards(): string[];
}

// Helper function to detect token standard from address
export async function detectTokenStandard(
  tokenAddress: string, 
  provider:  Provider
): Promise<string> {
  // Interface IDs (ERC-165)
  const ERC721_INTERFACE_ID = "0x80ac58cd";
  const ERC1155_INTERFACE_ID = "0xd9b67a26";
  const ERC3525_INTERFACE_ID = "0xd5f40819";
  
  // Try to detect using ERC-165 supportsInterface
  try {
    const erc165Interface = new  Interface([
      "function supportsInterface(bytes4 interfaceId) view returns (bool)"
    ]);
    
    const contract = new Contract(tokenAddress, erc165Interface, provider);
    
    // Check for ERC-721
    try {
      const supportsERC721 = await contract.supportsInterface(ERC721_INTERFACE_ID);
      if (supportsERC721) return "ERC721";
    } catch (e) {
      // Not ERC-721
    }
    
    // Check for ERC-1155
    try {
      const supportsERC1155 = await contract.supportsInterface(ERC1155_INTERFACE_ID);
      if (supportsERC1155) return "ERC1155";
    } catch (e) {
      // Not ERC-1155
    }
    
    // Check for ERC-3525
    try {
      const supportsERC3525 = await contract.supportsInterface(ERC3525_INTERFACE_ID);
      if (supportsERC3525) return "ERC3525";
    } catch (e) {
      // Not ERC-3525
    }
  } catch (e) {
    // Contract doesn't implement ERC-165
  }
  
  // Try to detect ERC-20 (doesn't use ERC-165)
  try {
    const erc20Interface = new  Interface([
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
      "function totalSupply() view returns (uint256)",
      "function balanceOf(address owner) view returns (uint256)"
    ]);
    
    const contract = new Contract(tokenAddress, erc20Interface, provider);
    await contract.name();
    await contract.symbol();
    await contract.decimals();
    
    // Check if it might be ERC-4626 (Tokenized Vault)
    try {
      const erc4626Interface = new  Interface([
        "function asset() view returns (address)",
        "function totalAssets() view returns (uint256)"
      ]);
      
      const vaultContract = new Contract(tokenAddress, erc4626Interface, provider);
      await vaultContract.asset();
      await vaultContract.totalAssets();
      
      return "ERC4626";
    } catch (e) {
      // Not ERC-4626
    }
    
    // Check if it might be ERC-1400 (Security Token)
    try {
      const erc1400Interface = new  Interface([
        "function getDocument(bytes32 name) view returns (string, bytes32)",
        "function isControllable() view returns (bool)"
      ]);
      
      const securityTokenContract = new Contract(tokenAddress, erc1400Interface, provider);
      await securityTokenContract.isControllable();
      
      return "ERC1400";
    } catch (e) {
      // Not ERC-1400
    }
    
    return "ERC20";
  } catch (e) {
    // Not ERC-20
  }
  
  // Default fallback
  return "UNKNOWN";
}