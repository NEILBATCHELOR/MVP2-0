import { type Provider, Contract, Wallet, Interface, formatUnits, parseUnits, formatEther, parseEther, type BigNumberish } from "ethers";
import { Token } from "@/components/wallet/components/swap/types";
import { BaseTokenAdapter } from "./TokenAdapter";
import { ERC4626_ABI } from "@/infrastructure/web3/TokenInterfaces";

// Extended token type with ERC4626 vault data
export interface VaultToken extends Token {
  assetAddress: string;
  assetSymbol?: string;
  assetDecimals?: number;
  totalAssets: string;
  totalShares: string;
  sharePrice: string; // Asset per share
  apy?: string; // Annualized yield if available
}

/**
 * Adapter for ERC4626 Tokenized Vault Standard
 * 
 * ERC4626 is a standard for tokenized yield-bearing vaults:
 * - Users deposit underlying assets and receive vault shares
 * - Vault shares represent ownership of the underlying assets plus yield
 * - Users can redeem shares for assets at any time
 */
export class ERC4626TokenAdapter extends BaseTokenAdapter {
  constructor(provider:  Provider) {
    super(provider);
  }
  
  /**
   * Get vault token metadata
   */
  async getTokenMetadata(tokenAddress: string): Promise<Token> {
    const contract = new Contract(tokenAddress, ERC4626_ABI, this.provider);
    
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
        logoURI: "", // Vaults typically don't have logos
        chainId: Number((await this.provider.getNetwork()).chainId)
      };
    } catch (error) {
      console.error("Error getting ERC4626 metadata:", error);
      throw new Error(`Failed to get metadata for vault at ${tokenAddress}`);
    }
  }
  
  /**
   * Get extended vault token information
   */
  async getVaultInfo(tokenAddress: string): Promise<VaultToken> {
    const contract = new Contract(tokenAddress, ERC4626_ABI, this.provider);
    
    try {
      // Get basic metadata
      const basicTokenInfo = await this.getTokenMetadata(tokenAddress);
      
      // Get vault-specific info
      const [assetAddress, totalAssets, totalSupply] = await Promise.all([
        contract.asset(),
        contract.totalAssets(),
        contract.totalSupply()
      ]);
      
      // Get asset token info
      const erc20Interface = new  Interface([
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)"
      ]);
      
      const assetContract = new Contract(assetAddress, erc20Interface, this.provider);
      const [assetSymbol, assetDecimals] = await Promise.all([
        assetContract.symbol().catch(() => "UNKNOWN"),
        assetContract.decimals().catch(() => 18)
      ]);
      
      // Calculate share price (assets per share)
      let sharePrice = "0";
      if (BigInt(totalSupply) > 0n) {
        // Convert to same decimal precision
        sharePrice = (BigInt(totalAssets) * 10n ** BigInt(basicTokenInfo.decimals) / BigInt(totalSupply)).toString();
      }
      
      // Try to calculate APY if historical data is available
      // This is a simplified placeholder - actual APY calculation would need historical data
      let apy: string | undefined;
      try {
        // Check if the contract has an APY method (non-standard extension)
        const apyInterface = new  Interface([
          "function getAPY() view returns (uint256)"
        ]);
        
        const apyContract = new Contract(tokenAddress, apyInterface, this.provider);
        const rawApy = await apyContract.getAPY();
        apy =  formatUnits(rawApy, 4) + "%"; // Assuming 4 decimal places for percentage
      } catch (e) {
        // APY method not available - this is normal as it's not part of the standard
      }
      
      return {
        ...basicTokenInfo,
        assetAddress,
        assetSymbol,
        assetDecimals,
        totalAssets: totalAssets.toString(),
        totalShares: totalSupply.toString(),
        sharePrice,
        apy
      };
    } catch (error) {
      console.error("Error getting vault info:", error);
      throw new Error(`Failed to get vault info for ${tokenAddress}`);
    }
  }
  
  /**
   * Get balance of vault shares
   */
  async getBalance(tokenAddress: string, ownerAddress: string): Promise<string> {
    const contract = new Contract(tokenAddress, ERC4626_ABI, this.provider);
    
    try {
      const balance = await contract.balanceOf(ownerAddress);
      return balance.toString();
    } catch (error) {
      console.error("Error getting ERC4626 balance:", error);
      throw new Error(`Failed to get vault share balance for ${ownerAddress}`);
    }
  }
  
  /**
   * Get balance of underlying assets
   */
  async getAssetBalance(tokenAddress: string, ownerAddress: string): Promise<string> {
    const contract = new Contract(tokenAddress, ERC4626_ABI, this.provider);
    
    try {
      // Get share balance
      const shareBalance = await contract.balanceOf(ownerAddress);
      
      if (shareBalance.eq(0)) {
        return "0";
      }
      
      // Convert shares to assets
      const assetBalance = await contract.convertToAssets(shareBalance);
      return assetBalance.toString();
    } catch (error) {
      console.error("Error getting underlying asset balance:", error);
      throw new Error(`Failed to get underlying asset balance for ${ownerAddress}`);
    }
  }
  
  /**
   * Deposit underlying assets into the vault
   */
  async deposit(
    tokenAddress: string,
    ownerAddress: string,
    assetAmount: string,
    privateKey: string
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC4626_ABI, this.provider);
    const wallet = new Wallet(privateKey, this.provider);
    
    try {
      // Connect contract with signer
      const contractWithSigner = contract.connect(wallet);
      
      // Verify the signer address matches the owner
      if (wallet.address.toLowerCase() !== ownerAddress.toLowerCase()) {
        throw new Error("Signer address does not match owner address");
      }
      
      // Get the underlying asset address
      const assetAddress = await contract.asset();
      
      // Approve spending of the asset by the vault
      const erc20Interface = new  Interface([
        "function approve(address spender, uint256 amount) returns (bool)"
      ]);
      
      const assetContract = new Contract(assetAddress, erc20Interface, wallet);
      const approveTx = await assetContract.approve(tokenAddress, assetAmount);
      await approveTx.wait();
      
      // Deposit assets into the vault
      const tx = await (contractWithSigner as any).deposit(assetAmount, ownerAddress);
      const receipt = await tx.wait();
      
      return receipt.transactionHash;
    } catch (error) {
      console.error("Error depositing into vault:", error);
      throw new Error(`Failed to deposit assets into the vault`);
    }
  }
  
  /**
   * Mint vault shares by depositing exact amount of assets
   */
  async mint(
    tokenAddress: string,
    ownerAddress: string,
    shareAmount: string,
    privateKey: string
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC4626_ABI, this.provider);
    const wallet = new Wallet(privateKey, this.provider);
    
    try {
      // Connect contract with signer
      const contractWithSigner = contract.connect(wallet);
      
      // Verify the signer address matches the owner
      if (wallet.address.toLowerCase() !== ownerAddress.toLowerCase()) {
        throw new Error("Signer address does not match owner address");
      }
      
      // Get the underlying asset address
      const assetAddress = await contract.asset();
      
      // Calculate how many assets are needed for the desired shares
      const assetAmount = await contract.previewMint(shareAmount);
      
      // Approve spending of the asset by the vault
      const erc20Interface = new  Interface([
        "function approve(address spender, uint256 amount) returns (bool)"
      ]);
      
      const assetContract = new Contract(assetAddress, erc20Interface, wallet);
      const approveTx = await assetContract.approve(tokenAddress, assetAmount);
      await approveTx.wait();
      
      // Mint shares
      const tx = await (contractWithSigner as any).mint(shareAmount, ownerAddress);
      const receipt = await tx.wait();
      
      return receipt.transactionHash;
    } catch (error) {
      console.error("Error minting vault shares:", error);
      throw new Error(`Failed to mint vault shares`);
    }
  }
  
  /**
   * Withdraw underlying assets from the vault
   */
  async withdraw(
    tokenAddress: string,
    ownerAddress: string,
    assetAmount: string,
    receiverAddress: string,
    privateKey: string
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC4626_ABI, this.provider);
    const wallet = new Wallet(privateKey, this.provider);
    
    try {
      // Connect contract with signer
      const contractWithSigner = contract.connect(wallet);
      
      // Verify the signer address matches the owner
      if (wallet.address.toLowerCase() !== ownerAddress.toLowerCase()) {
        throw new Error("Signer address does not match owner address");
      }
      
      // Withdraw assets from the vault
      const tx = await (contractWithSigner as any).withdraw(
        assetAmount,
        receiverAddress,
        ownerAddress
      );
      const receipt = await tx.wait();
      
      return receipt.transactionHash;
    } catch (error) {
      console.error("Error withdrawing from vault:", error);
      throw new Error(`Failed to withdraw assets from the vault`);
    }
  }
  
  /**
   * Redeem shares for underlying assets
   */
  async redeem(
    tokenAddress: string,
    ownerAddress: string,
    shareAmount: string,
    receiverAddress: string,
    privateKey: string
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC4626_ABI, this.provider);
    const wallet = new Wallet(privateKey, this.provider);
    
    try {
      // Connect contract with signer
      const contractWithSigner = contract.connect(wallet);
      
      // Verify the signer address matches the owner
      if (wallet.address.toLowerCase() !== ownerAddress.toLowerCase()) {
        throw new Error("Signer address does not match owner address");
      }
      
      // Redeem shares from the vault
      const tx = await (contractWithSigner as any).redeem(
        shareAmount,
        receiverAddress,
        ownerAddress
      );
      const receipt = await tx.wait();
      
      return receipt.transactionHash;
    } catch (error) {
      console.error("Error redeeming vault shares:", error);
      throw new Error(`Failed to redeem shares from the vault`);
    }
  }
  
  /**
   * Transfer shares to another address (standard ERC20 transfer)
   */
  async transfer(
    tokenAddress: string,
    fromAddress: string,
    toAddress: string,
    amount: string,
    privateKey: string
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC4626_ABI, this.provider);
    const wallet = new Wallet(privateKey, this.provider);
    
    try {
      // Connect contract with signer
      const contractWithSigner = contract.connect(wallet);
      
      // Verify the signer address matches the from address
      if (wallet.address.toLowerCase() !== fromAddress.toLowerCase()) {
        throw new Error("Signer address does not match from address");
      }
      
      // Transfer the tokens
      const tx = await (contractWithSigner as any).transfer(toAddress, amount);
      const receipt = await tx.wait();
      
      return receipt.transactionHash;
    } catch (error) {
      console.error("Error transferring ERC4626 shares:", error);
      throw new Error(`Failed to transfer vault shares to ${toAddress}`);
    }
  }
  
  /**
   * Estimate gas for token transfer
   */
  async estimateTransferGas(
    tokenAddress: string,
    fromAddress: string,
    toAddress: string,
    amount: string
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC4626_ABI, this.provider);
    
    try {
      const gasEstimate = await (contract.estimateGas as any).transfer(toAddress, amount, { from: fromAddress });
      
      // Add 10% buffer
      const bufferedEstimate = gasEstimate.mul(110).div(100);
      return bufferedEstimate.toString();
    } catch (error) {
      console.error("Error estimating gas for ERC4626 transfer:", error);
      throw new Error(`Failed to estimate gas for vault share transfer`);
    }
  }
  
  /**
   * Estimate gas for deposit
   */
  async estimateDepositGas(
    tokenAddress: string,
    ownerAddress: string,
    assetAmount: string
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC4626_ABI, this.provider);
    
    try {
      // Check if deposit limit is exceeded
      const maxDeposit = await contract.maxDeposit(ownerAddress);
      if (BigInt(assetAmount) > BigInt(maxDeposit)) {
        throw new Error(`Deposit amount exceeds maximum allowed (${maxDeposit.toString()})`);
      }
      
      const gasEstimate = await (contract.estimateGas as any).deposit(assetAmount, ownerAddress, { from: ownerAddress });
      
      // Add 15% buffer for deposits due to potential price changes
      const bufferedEstimate = gasEstimate.mul(115).div(100);
      return bufferedEstimate.toString();
    } catch (error) {
      console.error("Error estimating gas for deposit:", error);
      throw new Error(`Failed to estimate gas for deposit`);
    }
  }
  
  /**
   * Estimate gas for withdrawal
   */
  async estimateWithdrawGas(
    tokenAddress: string,
    ownerAddress: string,
    assetAmount: string,
    receiverAddress: string
  ): Promise<string> {
    const contract = new Contract(tokenAddress, ERC4626_ABI, this.provider);
    
    try {
      // Check if withdrawal limit is exceeded
      const maxWithdraw = await contract.maxWithdraw(ownerAddress);
      if (BigInt(assetAmount) > BigInt(maxWithdraw)) {
        throw new Error(`Withdrawal amount exceeds maximum allowed (${maxWithdraw.toString()})`);
      }
      
      const gasEstimate = await (contract.estimateGas as any).withdraw(
        assetAmount,
        receiverAddress,
        ownerAddress,
        { from: ownerAddress }
      );
      
      // Add 15% buffer for withdrawals due to potential price changes
      const bufferedEstimate = gasEstimate.mul(115).div(100);
      return bufferedEstimate.toString();
    } catch (error) {
      console.error("Error estimating gas for withdrawal:", error);
      throw new Error(`Failed to estimate gas for withdrawal`);
    }
  }
  
  /**
   * Convert asset amount to corresponding share amount
   */
  async convertToShares(tokenAddress: string, assetAmount: string): Promise<string> {
    const contract = new Contract(tokenAddress, ERC4626_ABI, this.provider);
    
    try {
      const shares = await contract.convertToShares(assetAmount);
      return shares.toString();
    } catch (error) {
      console.error("Error converting assets to shares:", error);
      throw new Error(`Failed to convert assets to shares`);
    }
  }
  
  /**
   * Convert share amount to corresponding asset amount
   */
  async convertToAssets(tokenAddress: string, shareAmount: string): Promise<string> {
    const contract = new Contract(tokenAddress, ERC4626_ABI, this.provider);
    
    try {
      const assets = await contract.convertToAssets(shareAmount);
      return assets.toString();
    } catch (error) {
      console.error("Error converting shares to assets:", error);
      throw new Error(`Failed to convert shares to assets`);
    }
  }
  
  /**
   * Check if a token supports a specific interface
   */
  async supportsInterface(tokenAddress: string, interfaceId: string): Promise<boolean> {
    // ERC4626 doesn't necessarily implement ERC165's supportsInterface
    // We'll check for key ERC4626 methods instead
    
    const contract = new Contract(tokenAddress, ERC4626_ABI, this.provider);
    
    try {
      // Check if this is an ERC4626 token by testing key methods
      const [asset, totalAssets] = await Promise.all([
        contract.asset().catch(() => null),
        contract.totalAssets().catch(() => null)
      ]);
      
      // If we can successfully call these methods, it likely supports ERC4626
      return asset !== null && totalAssets !== null;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get supported token standards
   */
  getSupportedStandards(): string[] {
    return ["ERC4626", "ERC20"]; // ERC4626 extends ERC20
  }
}