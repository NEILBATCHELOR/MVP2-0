import { ethers } from "ethers";
import { 
  Transaction, 
  TransactionHandler, 
  TransactionResult, 
  TransactionStatus 
} from "../TransactionHandler";
import { JsonRpcProvider, Wallet, Contract, Interface, parseEther, parseUnits, formatEther, type TransactionRequest, type FeeData, type Provider } from 'ethers';

/**
 * Implementation of TransactionHandler for EVM-compatible blockchains
 * (Ethereum, Polygon, Avalanche, etc.)
 */
export class EVMTransactionHandler implements TransactionHandler {
  private provider: Provider;
  private chainName: string;
  private chainId: number;

  constructor(provider: Provider, chainName: string, chainId: number) {
    this.provider = provider;
    this.chainName = chainName;
    this.chainId = chainId;
  }

  getBlockchainName(): string {
    return this.chainName;
  }

  async buildTransferTransaction(
    from: string,
    to: string,
    amount: string,
    options?: any
  ): Promise<Transaction> {
    const nonce = await this.provider.getTransactionCount(from);
    
    // Use EIP-1559 fee structure if supported
    let feeData:  FeeData;
    try {
      feeData = await this.provider.getFeeData();
    } catch (error) {
      // Fallback to legacy gas pricing
      const gasPrice = (await this.provider.getFeeData()).gasPrice;
      feeData = {
        gasPrice,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
      } as FeeData;
    }

    const transaction: Transaction = {
      from,
      to,
      value:  parseEther(amount).toString(),
      nonce,
      chainId: this.chainId,
      gasLimit: options?.gasLimit || "21000", // Default for simple transfers
    };

    // Add fee data based on what's available
    if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
      transaction.maxFeePerGas = feeData.maxFeePerGas.toString();
      transaction.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas.toString();
    } else if (feeData.gasPrice) {
      transaction.gasPrice = feeData.gasPrice.toString();
    }

    return transaction;
  }

  async buildTokenTransferTransaction(
    from: string,
    to: string,
    tokenAddress: string,
    amount: string,
    options?: any
  ): Promise<Transaction> {
    const nonce = await this.provider.getTransactionCount(from);
    
    // Create token transfer data
    const erc20Interface = new  Interface([
      "function transfer(address to, uint256 amount) returns (bool)"
    ]);
    
    // Get token decimals
    const tokenContract = new Contract(
      tokenAddress,
      [
        "function decimals() view returns (uint8)"
      ],
      this.provider
    );
    
    let decimals = 18; // Default to 18 decimals
    try {
      decimals = await tokenContract.decimals();
    } catch (error) {
      console.warn("Could not get token decimals, using default of 18");
    }

    // Create the data field for the token transfer
    const data = erc20Interface.encodeFunctionData(
      "transfer", 
      [to,  parseUnits(amount, decimals)]
    );

    // Use EIP-1559 fee structure if supported
    let feeData:  FeeData;
    try {
      feeData = await this.provider.getFeeData();
    } catch (error) {
      // Fallback to legacy gas pricing
      const gasPrice = (await this.provider.getFeeData()).gasPrice;
      feeData = {
        gasPrice,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
      } as FeeData;
    }

    const transaction: Transaction = {
      from,
      to: tokenAddress,
      value: "0",
      data,
      nonce,
      chainId: this.chainId,
    };

    // Estimate gas limit if not provided
    if (!options?.gasLimit) {
      try {
        const gasLimit = await this.provider.estimateGas({
          from,
          to: tokenAddress,
          data,
        });
        transaction.gasLimit = gasLimit.toString();
      } catch (error) {
        transaction.gasLimit = "100000"; // Default fallback for token transfers
      }
    } else {
      transaction.gasLimit = options.gasLimit;
    }

    // Add fee data based on what's available
    if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
      transaction.maxFeePerGas = feeData.maxFeePerGas.toString();
      transaction.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas.toString();
    } else if (feeData.gasPrice) {
      transaction.gasPrice = feeData.gasPrice.toString();
    }

    return transaction;
  }

  async signTransaction(
    transaction: Transaction,
    privateKey: string
  ): Promise<string> {
    const wallet = new Wallet(privateKey);
    
    // Convert our transaction to ethers transaction format
    const tx:  TransactionRequest = {
      to: transaction.to,
      from: transaction.from,
      nonce: transaction.nonce,
      gasLimit: transaction.gasLimit,
      data: transaction.data,
      value: transaction.value,
      chainId: transaction.chainId,
    };

    // Add the appropriate fee data
    if (transaction.maxFeePerGas && transaction.maxPriorityFeePerGas) {
      tx.maxFeePerGas = transaction.maxFeePerGas;
      tx.maxPriorityFeePerGas = transaction.maxPriorityFeePerGas;
      tx.type = 2; // EIP-1559 transaction
    } else if (transaction.gasPrice) {
      tx.gasPrice = transaction.gasPrice;
    }

    // Sign the transaction
    const signedTx = await wallet.signTransaction(tx);
    return signedTx;
  }

  async sendSignedTransaction(
    signedTransaction: string
  ): Promise<TransactionResult> {
    const tx = await this.provider.broadcastTransaction(signedTransaction);
    
    return {
      hash: tx.hash,
      wait: async (): Promise<TransactionStatus> => {
        try {
          const receipt = await tx.wait();
          return {
            status: receipt.status === 1 ? 'confirmed' : 'failed',
            hash: receipt.hash,
            blockNumber: receipt.blockNumber,
            confirmations: Number((typeof receipt.confirmations === 'function'
              ? await receipt.confirmations()
              : (typeof receipt.confirmations === 'number' ? receipt.confirmations : 0))),
            receipt,
          };
        } catch (error) {
          return {
            status: 'failed',
            hash: tx.hash,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }
    };
  }

  async getTransactionStatus(
    transactionHash: string
  ): Promise<TransactionStatus> {
    try {
      // First check if the transaction is even in the mempool
      const tx = await this.provider.getTransaction(transactionHash);
      if (!tx) {
        return {
          status: 'pending',
          hash: transactionHash,
          error: 'Transaction not found',
        };
      }

      // If transaction has a blockNumber, it's been mined
      if (tx.blockNumber) {
        const receipt = await this.provider.getTransactionReceipt(transactionHash);
        
        return {
          status: receipt.status === 1 ? 'confirmed' : 'failed',
          hash: receipt.hash,
          blockNumber: receipt.blockNumber,
          confirmations: Number((typeof receipt.confirmations === 'function'
            ? await receipt.confirmations()
            : (typeof receipt.confirmations === 'number' ? receipt.confirmations : 0))),
          receipt,
        };
      } else {
        // Transaction is still pending
        return {
          status: 'pending',
          hash: transactionHash,
        };
      }
    } catch (error) {
      return {
        status: 'failed',
        hash: transactionHash,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async estimateFee(
    transaction: Transaction
  ): Promise<string> {
    try {
      // Convert our transaction to ethers format for estimation
      const tx:  TransactionRequest = {
        to: transaction.to,
        from: transaction.from,
        data: transaction.data,
        value: transaction.value,
      };

      // Estimate gas usage
      const gasLimit = await this.provider.estimateGas(tx);
      
      // Get fee data
      let feeData:  FeeData;
      try {
        feeData = await this.provider.getFeeData();
      } catch (error) {
        // Fallback to legacy gas pricing
        const gasPrice = (await this.provider.getFeeData()).gasPrice;
        feeData = { gasPrice, maxFeePerGas: null, maxPriorityFeePerGas: null } as FeeData;
      }

      // Calculate the fee
      let fee: bigint;
      if (feeData.maxFeePerGas) {
        fee = BigInt(gasLimit) * BigInt(feeData.maxFeePerGas);
      } else if (feeData.gasPrice) {
        fee = BigInt(gasLimit) * BigInt(feeData.gasPrice);
      } else {
        throw new Error("Could not determine fee structure");
      }

      // Return fee in ETH
      return  formatEther(fee);
    } catch (error) {
      throw new Error(`Failed to estimate fee: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}