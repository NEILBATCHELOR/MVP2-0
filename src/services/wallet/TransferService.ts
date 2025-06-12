import { ethers, parseUnits, formatUnits, isAddress } from 'ethers';
import { BlockchainFactory } from '@/infrastructure/web3/BlockchainFactory';
import { providerManager, NetworkEnvironment } from '@/infrastructure/web3/ProviderManager';
import type { SupportedChain } from '@/infrastructure/web3/adapters/IBlockchainAdapter';
import { supabase } from '@/infrastructure/database/client';
import { v4 as uuidv4 } from 'uuid';

export interface TransferParams {
  fromWallet: string;
  toAddress: string;
  amount: string;
  asset: string;
  blockchain: string;
  gasOption: 'slow' | 'standard' | 'fast';
  memo?: string;
}

export interface TransferResult {
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed?: string;
  blockNumber?: number;
  confirmations?: number;
}

export interface TransferEstimate {
  gasFee: string;
  gasFeeUsd: string;
  totalAmount: string;
  estimatedConfirmationTime: string;
  networkCongestion: 'low' | 'medium' | 'high';
}

export interface TransferHistory {
  id: string;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  asset: string;
  blockchain: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  gasFee?: string;
  blockNumber?: number;
  memo?: string;
}

/**
 * Service for handling real blockchain transfers across multiple networks
 */
export class TransferService {
  private blockchainFactory: BlockchainFactory;

  constructor() {
    this.blockchainFactory = new BlockchainFactory();
  }

  /**
   * Estimate transfer costs and details
   */
  async estimateTransfer(params: TransferParams): Promise<TransferEstimate> {
    const { blockchain, amount, asset, gasOption } = params;

    try {
      // Get blockchain adapter
      const adapter = BlockchainFactory.getAdapter(blockchain as SupportedChain);
      const provider = providerManager.getProvider(blockchain as SupportedChain);

      // Estimate gas for the transaction
      let gasEstimate: bigint;
      let gasPrice: bigint;

      if (blockchain === 'ethereum' || this.isEVMChain(blockchain)) {
        // EVM chain gas estimation
        const feeData = await provider.getFeeData();
        gasPrice = feeData.gasPrice || parseUnits('20', 'gwei');
        
        // Adjust gas price based on option
        const multiplier = gasOption === 'fast' ? 1.5 : gasOption === 'slow' ? 0.8 : 1.0;
        gasPrice = BigInt(Math.floor(Number(gasPrice) * multiplier));
        
        // Estimate gas limit based on transfer type
        if (asset === 'ETH' || asset === 'MATIC' || asset === 'AVAX') {
          gasEstimate = BigInt(21000); // Standard ETH transfer
        } else {
          gasEstimate = BigInt(65000); // ERC20 token transfer
        }
      } else {
        // Non-EVM chain estimation
        gasEstimate = await this.estimateNonEVMGas(blockchain, amount, asset);
        gasPrice = await this.getNonEVMGasPrice(blockchain, gasOption);
      }

      const gasFee = formatUnits(gasEstimate * gasPrice, 18);
      const gasFeeUsd = await this.convertToUsd(gasFee, blockchain);
      const totalAmount = (parseFloat(amount) + parseFloat(gasFee)).toString();

      // Get network congestion
      const networkCongestion = await this.getNetworkCongestion(blockchain);
      
      // Estimate confirmation time
      const estimatedConfirmationTime = this.getEstimatedConfirmationTime(
        blockchain, 
        gasOption, 
        networkCongestion
      );

      return {
        gasFee,
        gasFeeUsd,
        totalAmount,
        estimatedConfirmationTime,
        networkCongestion,
      };
    } catch (error) {
      console.error('Error estimating transfer:', error);
      throw new Error(`Failed to estimate transfer: ${error.message}`);
    }
  }

  /**
   * Execute a blockchain transfer
   */
  async executeTransfer(params: TransferParams): Promise<TransferResult> {
    const { fromWallet, toAddress, amount, asset, blockchain, memo } = params;

    try {
      // Validate inputs
      await this.validateTransferParams(params);

      // Get blockchain adapter
      const adapter = BlockchainFactory.getAdapter(blockchain as SupportedChain);
      
      // Check if it's a native token transfer or token transfer
      let txHash: string;
      
      if (asset === 'ETH' || asset === 'MATIC' || asset === 'SOL' || asset === 'AVAX') {
        // Native token transfer
        txHash = await this.executeNativeTransfer(adapter, fromWallet, toAddress, amount, blockchain);
      } else {
        // Token transfer (ERC20, SPL, etc.)
        txHash = await this.executeTokenTransfer(adapter, fromWallet, toAddress, amount, asset, blockchain);
      }

      // Store transaction in database
      await this.storeTransaction({
        txHash,
        fromAddress: fromWallet,
        toAddress,
        amount,
        asset,
        blockchain,
        memo,
      });

      return {
        txHash,
        status: 'pending',
      };
    } catch (error) {
      console.error('Error executing transfer:', error);
      throw new Error(`Transfer failed: ${error.message}`);
    }
  }

  /**
   * Get transfer status
   */
  async getTransferStatus(txHash: string, blockchain: string): Promise<TransferResult> {
    try {
      const adapter = BlockchainFactory.getAdapter(blockchain as SupportedChain);
      const provider = providerManager.getProvider(blockchain as SupportedChain);

      if (this.isEVMChain(blockchain)) {
        const receipt = await provider.getTransactionReceipt(txHash);
        
        if (!receipt) {
          return { txHash, status: 'pending' };
        }

        return {
          txHash,
          status: receipt.status === 1 ? 'confirmed' : 'failed',
          gasUsed: receipt.gasUsed.toString(),
          blockNumber: receipt.blockNumber,
          confirmations: await provider.getBlockNumber() - receipt.blockNumber,
        };
      } else {
        // Handle non-EVM chains
        return await this.getNonEVMTransferStatus(txHash, blockchain);
      }
    } catch (error) {
      console.error('Error getting transfer status:', error);
      throw new Error(`Failed to get transfer status: ${error.message}`);
    }
  }

  /**
   * Get transfer history for a wallet
   */
  async getTransferHistory(
    walletAddress: string, 
    blockchain?: string,
    limit: number = 50
  ): Promise<TransferHistory[]> {
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .or(`from_address.eq.${walletAddress},to_address.eq.${walletAddress}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (blockchain) {
        query = query.eq('blockchain', blockchain);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(tx => ({
        id: tx.id,
        txHash: tx.transaction_hash,
        fromAddress: tx.from_address,
        toAddress: tx.to_address,
        amount: tx.value ? String(tx.value) : '0',
        asset: tx.token_symbol || 'ETH',
        blockchain: tx.blockchain,
        status: tx.status as 'pending' | 'confirmed' | 'failed',
        timestamp: tx.created_at,
        gasFee: tx.gas_used ? String(tx.gas_used) : undefined,
        blockNumber: tx.block_number,
        memo: tx.memo || (tx as any).data,
      }));
    } catch (error) {
      console.error('Error getting transfer history:', error);
      throw new Error(`Failed to get transfer history: ${error.message}`);
    }
  }

  /**
   * Validate transfer parameters
   */
  private async validateTransferParams(params: TransferParams): Promise<void> {
    const { fromWallet, toAddress, amount, blockchain } = params;

    // Check if addresses are valid
    if (!this.isValidAddress(toAddress, blockchain)) {
      throw new Error('Invalid destination address');
    }

    // Check if amount is valid
    if (parseFloat(amount) <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Check wallet balance
    const balance = await this.getWalletBalance(fromWallet, params.asset, blockchain);
    if (parseFloat(String(balance)) < parseFloat(amount)) {
      throw new Error('Insufficient balance');
    }
  }

  /**
   * Execute native token transfer
   */
  private async executeNativeTransfer(
    adapter: any,
    fromWallet: string,
    toAddress: string,
    amount: string,
    blockchain: string
  ): Promise<string> {
    // This would use the adapter's transfer methods
    // For now, we'll simulate the call
    const txData = await adapter.proposeTransaction(fromWallet, toAddress, amount);
    
    // Sign and execute transaction
    // Note: In a real implementation, you'd need the private key or use a wallet connector
    const signedTx = await adapter.signTransaction(txData, 'PRIVATE_KEY_HERE');
    const txHash = await adapter.executeTransaction(fromWallet, signedTx, []);
    
    return txHash;
  }

  /**
   * Execute token transfer
   */
  private async executeTokenTransfer(
    adapter: any,
    fromWallet: string,
    toAddress: string,
    amount: string,
    tokenAddress: string,
    blockchain: string
  ): Promise<string> {
    // For ERC20 transfers, we need to call the transfer function
    if (this.isEVMChain(blockchain)) {
      const transferData = this.encodeERC20Transfer(toAddress, amount);
      const txData = await adapter.proposeTransaction(fromWallet, tokenAddress, '0', transferData);
      const signedTx = await adapter.signTransaction(txData, 'PRIVATE_KEY_HERE');
      return await adapter.executeTransaction(fromWallet, signedTx, []);
    } else {
      // Handle non-EVM token transfers
      return await this.executeNonEVMTokenTransfer(adapter, fromWallet, toAddress, amount, tokenAddress, blockchain);
    }
  }

  /**
   * Store transaction in database
   */
  private async storeTransaction(tx: {
    txHash: string;
    fromAddress: string;
    toAddress: string;
    amount: string;
    asset: string;
    blockchain: string;
    memo?: string;
  }): Promise<void> {
    const { error } = await supabase.from('transactions').insert({
      id: uuidv4(),
      transaction_hash: tx.txHash,
      from_address: tx.fromAddress,
      to_address: tx.toAddress,
      value: parseFloat(tx.amount),
      token_symbol: tx.asset,
      blockchain: tx.blockchain,
      status: 'pending',
      type: 'transfer',
      memo: tx.memo,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error storing transaction:', error);
    }
  }

  // Helper methods
  private isEVMChain(blockchain: string): boolean {
    return ['ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'base'].includes(blockchain);
  }

  private isValidAddress(address: string, blockchain: string): boolean {
    if (this.isEVMChain(blockchain)) {
      return isAddress(address);
    }
    // Add validation for other blockchain address formats
    return true; // Simplified for now
  }

  private async getWalletBalance(address: string, asset: string, blockchain: string): Promise<string> {
    const adapter = BlockchainFactory.getAdapter(blockchain as SupportedChain);
    
    if (asset === 'ETH' || asset === 'MATIC' || asset === 'SOL') {
      const balance = await adapter.getBalance(address);
      return String(balance);
    } else {
      const balance = await adapter.getTokenBalance(address, asset);
      return String(balance);
    }
  }

  private encodeERC20Transfer(to: string, amount: string): string {
    // Encode ERC20 transfer function call
    const iface = new ethers.Interface([
      'function transfer(address to, uint256 amount) returns (bool)'
    ]);
    return iface.encodeFunctionData('transfer', [to, parseUnits(amount, 18)]);
  }

  private async estimateNonEVMGas(blockchain: string, amount: string, asset: string): Promise<bigint> {
    // Simplified gas estimation for non-EVM chains
    switch (blockchain) {
      case 'solana':
        return BigInt(5000); // ~0.000005 SOL
      case 'near':
        return parseUnits('0.0001', 24); // 0.0001 NEAR
      default:
        return BigInt(1000000);
    }
  }

  private async getNonEVMGasPrice(blockchain: string, gasOption: string): Promise<bigint> {
    // Simplified gas price for non-EVM chains
    const multiplier = gasOption === 'fast' ? 1.5 : gasOption === 'slow' ? 0.8 : 1.0;
    
    switch (blockchain) {
      case 'solana':
        return BigInt(Math.floor(5000 * multiplier));
      case 'near':
        return parseUnits((0.0001 * multiplier).toString(), 24);
      default:
        return BigInt(1000000);
    }
  }

  private async convertToUsd(amount: string, blockchain: string): Promise<string> {
    // Mock USD conversion - in real implementation, use price API
    const prices = {
      ethereum: 3500,
      polygon: 0.8,
      solana: 100,
      near: 5,
    };
    
    const price = prices[blockchain] || 1;
    return (parseFloat(amount) * price).toFixed(2);
  }

  private async getNetworkCongestion(blockchain: string): Promise<'low' | 'medium' | 'high'> {
    // Simplified network congestion check
    try {
      const provider = providerManager.getProvider(blockchain as SupportedChain);
      
      if (this.isEVMChain(blockchain)) {
        const feeData = await provider.getFeeData();
        const gasPrice = Number(feeData.gasPrice) / 1e9; // Convert to Gwei
        
        if (gasPrice < 20) return 'low';
        if (gasPrice < 50) return 'medium';
        return 'high';
      }
      
      return 'medium'; // Default for non-EVM chains
    } catch (error) {
      return 'medium';
    }
  }

  private getEstimatedConfirmationTime(
    blockchain: string, 
    gasOption: string, 
    congestion: string
  ): string {
    const baseTimes = {
      ethereum: { fast: 1, standard: 3, slow: 10 },
      polygon: { fast: 0.5, standard: 1, slow: 3 },
      solana: { fast: 0.1, standard: 0.5, slow: 1 },
      near: { fast: 1, standard: 2, slow: 5 },
    };
    
    const baseTime = baseTimes[blockchain]?.[gasOption] || 2;
    const congestionMultiplier = congestion === 'high' ? 2 : congestion === 'medium' ? 1.5 : 1;
    const estimatedMinutes = Math.ceil(baseTime * congestionMultiplier);
    
    return `${estimatedMinutes} minute${estimatedMinutes > 1 ? 's' : ''}`;
  }

  private async getNonEVMTransferStatus(txHash: string, blockchain: string): Promise<TransferResult> {
    // Simplified status check for non-EVM chains
    switch (blockchain) {
      case 'solana':
        // Would use Solana RPC to check transaction status
        return { txHash, status: 'pending' };
      case 'near':
        // Would use NEAR RPC to check transaction status
        return { txHash, status: 'pending' };
      default:
        return { txHash, status: 'pending' };
    }
  }

  private async executeNonEVMTokenTransfer(
    adapter: any,
    fromWallet: string,
    toAddress: string,
    amount: string,
    tokenAddress: string,
    blockchain: string
  ): Promise<string> {
    // Handle non-EVM token transfers
    switch (blockchain) {
      case 'solana':
        // SPL token transfer
        return await this.executeSPLTransfer(adapter, fromWallet, toAddress, amount, tokenAddress);
      case 'near':
        // NEAR token transfer
        return await this.executeNEARTokenTransfer(adapter, fromWallet, toAddress, amount, tokenAddress);
      default:
        throw new Error(`Token transfers not implemented for ${blockchain}`);
    }
  }

  private async executeSPLTransfer(
    adapter: any,
    fromWallet: string,
    toAddress: string,
    amount: string,
    tokenMint: string
  ): Promise<string> {
    // Implementation for SPL token transfer
    // This would use Solana's SPL token program
    throw new Error('SPL token transfers not yet implemented');
  }

  private async executeNEARTokenTransfer(
    adapter: any,
    fromWallet: string,
    toAddress: string,
    amount: string,
    tokenContract: string
  ): Promise<string> {
    // Implementation for NEAR token transfer
    // This would call the ft_transfer method on the token contract
    throw new Error('NEAR token transfers not yet implemented');
  }
}

export const transferService = new TransferService();
