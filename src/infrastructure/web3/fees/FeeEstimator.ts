import { Provider, Contract, formatUnits, parseUnits, BigNumberish, FeeData, JsonRpcProvider } from "ethers";

/**
 * Fee priority level
 */
export enum FeePriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

/**
 * Network congestion level
 */
export enum NetworkCongestion {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  VERY_HIGH = "very_high",
}

/**
 * Fee suggestion with multiple priority levels
 */
export interface FeeSuggestion {
  blockchain: string;
  baseFee?: string;
  priorityFee?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gasPriceWei?: string;
  maxFeePerGasWei?: string;
  maxPriorityFeePerGasWei?: string;
  estimatedTimeSeconds?: number;
  networkCongestion: NetworkCongestion;
  suggestedPriority: FeePriority;
  timestamp: number;
}

/**
 * Fee estimation options
 */
export interface FeeEstimationOptions {
  priority?: FeePriority;
  maxWaitTimeSeconds?: number;
}

/**
 * Service for estimating transaction fees with network congestion awareness
 */
export abstract class FeeEstimator {
  protected provider:  Provider;
  protected blockchain: string;
  protected historicalFees: Map<number, bigint> = new Map();
  protected maxHistoricalBlocks: number = 20;
  
  constructor(provider:  Provider, blockchain: string) {
    this.provider = provider;
    this.blockchain = blockchain;
  }
  
  /**
   * Get a fee suggestion based on current network conditions
   * @param options Fee estimation options
   * @returns Fee suggestion
   */
  abstract estimateFee(options?: FeeEstimationOptions): Promise<FeeSuggestion>;
  
  /**
   * Get the network congestion level
   * @returns Network congestion level
   */
  abstract getNetworkCongestion(): Promise<NetworkCongestion>;
}

/**
 * Fee estimator for EVM chains
 */
export class EVMFeeEstimator extends FeeEstimator {
  constructor(provider:  Provider, blockchain: string) {
    super(provider, blockchain);
  }
  
  async estimateFee(options?: FeeEstimationOptions): Promise<FeeSuggestion> {
    const priority = options?.priority || FeePriority.MEDIUM;
    
    try {
      // Track network congestion
      const congestion = await this.getNetworkCongestion();
      
      // Try to get EIP-1559 fee data first
      let feeData:  FeeData;
      try {
        feeData = await this.provider.getFeeData();
      } catch (error) {
        // Fallback to legacy gas pricing
        const feeDataFallback = await this.provider.getFeeData();
        const gasPrice = feeDataFallback.gasPrice;
        feeData = {
          gasPrice,
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          toJSON: () => ({})
        };
      }
      
      // Update historical fees
      this.updateHistoricalFees(feeData);
      
      // Calculate fee based on priority and network congestion
      const suggestion: FeeSuggestion = {
        blockchain: this.blockchain,
        networkCongestion: congestion,
        suggestedPriority: priority,
        timestamp: Date.now(),
      };
      
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        // EIP-1559 fee structure
        const baseFee = BigInt(feeData.maxFeePerGas) - BigInt(feeData.maxPriorityFeePerGas);
        
        suggestion.baseFee =  formatUnits(baseFee.toString(), "gwei");
        suggestion.priorityFee =  formatUnits(feeData.maxPriorityFeePerGas.toString(), "gwei");
        
        // Apply priority multipliers
        const priorityMultiplier = this.getPriorityMultiplier(priority, congestion);
        const adjustedPriorityFee = (BigInt(feeData.maxPriorityFeePerGas) * BigInt(priorityMultiplier)) / 10n;
        
        suggestion.maxPriorityFeePerGas =  formatUnits(adjustedPriorityFee.toString(), "gwei");
        suggestion.maxPriorityFeePerGasWei = adjustedPriorityFee.toString();
        
        // Max fee = base fee + priority fee with some buffer
        const maxFeeMultiplier = this.getMaxFeeMultiplier(congestion);
        const adjustedMaxFee = (baseFee * BigInt(maxFeeMultiplier)) / 10n + adjustedPriorityFee;
        
        suggestion.maxFeePerGas =  formatUnits(adjustedMaxFee.toString(), "gwei");
        suggestion.maxFeePerGasWei = adjustedMaxFee.toString();
      } else if (feeData.gasPrice) {
        // Legacy fee structure
        suggestion.gasPrice =  formatUnits(feeData.gasPrice.toString(), "gwei");
        suggestion.gasPriceWei = feeData.gasPrice.toString();
        
        // Apply priority multiplier
        const multiplier = this.getPriorityMultiplier(priority, congestion);
        const adjustedGasPrice = (BigInt(feeData.gasPrice) * BigInt(multiplier)) / 10n;
        
        suggestion.gasPrice =  formatUnits(adjustedGasPrice.toString(), "gwei");
        suggestion.gasPriceWei = adjustedGasPrice.toString();
      }
      
      // Estimate time based on priority and congestion
      suggestion.estimatedTimeSeconds = this.estimateTimeToConfirmation(priority, congestion);
      
      return suggestion;
    } catch (error) {
      throw new Error(`Failed to estimate fee: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async getNetworkCongestion(): Promise<NetworkCongestion> {
    try {
      // Get the latest block
      const latestBlock = await this.provider.getBlock("latest");
      
      if (!latestBlock) {
        return NetworkCongestion.MEDIUM;
      }
      
      // For EIP-1559 chains, the baseFeePerGas is a good indicator of congestion
      if (latestBlock.baseFeePerGas) {
        // Thresholds in gwei
        const lowThreshold =  parseUnits("20", "gwei");
        const mediumThreshold =  parseUnits("100", "gwei");
        const highThreshold =  parseUnits("200", "gwei");
        
        if (BigInt(latestBlock.baseFeePerGas) < BigInt(lowThreshold)) {
          return NetworkCongestion.LOW;
        } else if (BigInt(latestBlock.baseFeePerGas) < BigInt(mediumThreshold)) {
          return NetworkCongestion.MEDIUM;
        } else if (BigInt(latestBlock.baseFeePerGas) < BigInt(highThreshold)) {
          return NetworkCongestion.HIGH;
        } else {
          return NetworkCongestion.VERY_HIGH;
        }
      } else {
        // For non-EIP-1559 chains, we use gas usage relative to gas limit
        const gasUsageRatio = Number((BigInt(latestBlock.gasUsed) * 100n) / BigInt(latestBlock.gasLimit));
        
        if (gasUsageRatio < 50) {
          return NetworkCongestion.LOW;
        } else if (gasUsageRatio < 70) {
          return NetworkCongestion.MEDIUM;
        } else if (gasUsageRatio < 90) {
          return NetworkCongestion.HIGH;
        } else {
          return NetworkCongestion.VERY_HIGH;
        }
      }
    } catch (error) {
      console.error("Error determining network congestion:", error);
      return NetworkCongestion.MEDIUM; // Default to medium congestion on error
    }
  }
  
  /**
   * Update the historical fees with the latest fee data
   * @param feeData Latest fee data
   */
  private updateHistoricalFees(feeData:  FeeData): void {
    // Get current block number
    this.provider.getBlockNumber().then((blockNumber) => {
      // Store the fee data
      if (feeData.maxFeePerGas) {
        this.historicalFees.set(blockNumber, feeData.maxFeePerGas);
      } else if (feeData.gasPrice) {
        this.historicalFees.set(blockNumber, feeData.gasPrice);
      }
      
      // Prune old data
      if (this.historicalFees.size > this.maxHistoricalBlocks) {
        // Sort block numbers
        const blockNumbers = Array.from(this.historicalFees.keys()).sort();
        
        // Remove oldest
        for (let i = 0; i < blockNumbers.length - this.maxHistoricalBlocks; i++) {
          this.historicalFees.delete(blockNumbers[i]);
        }
      }
    });
  }
  
  /**
   * Get a multiplier for the priority fee based on priority and congestion
   * @param priority Fee priority
   * @param congestion Network congestion
   * @returns Multiplier (in tenths, so 10 = 1x, 15 = 1.5x, etc.)
   */
  private getPriorityMultiplier(
    priority: FeePriority,
    congestion: NetworkCongestion
  ): number {
    // Base multipliers by priority
    const baseMultipliers: Record<FeePriority, number> = {
      [FeePriority.LOW]: 8, // 0.8x
      [FeePriority.MEDIUM]: 10, // 1.0x
      [FeePriority.HIGH]: 15, // 1.5x
      [FeePriority.URGENT]: 20, // 2.0x
    };
    
    // Congestion adjustment
    const congestionAdjustments: Record<NetworkCongestion, number> = {
      [NetworkCongestion.LOW]: 0, // No adjustment
      [NetworkCongestion.MEDIUM]: 2, // +0.2x
      [NetworkCongestion.HIGH]: 5, // +0.5x
      [NetworkCongestion.VERY_HIGH]: 10, // +1.0x
    };
    
    return baseMultipliers[priority] + congestionAdjustments[congestion];
  }
  
  /**
   * Get a multiplier for max fee based on network congestion
   * @param congestion Network congestion
   * @returns Multiplier (in tenths, so 10 = 1x, 15 = 1.5x, etc.)
   */
  private getMaxFeeMultiplier(congestion: NetworkCongestion): number {
    // Base is 1.2x to allow for base fee increases
    const baseFeeBuffer = 12;
    
    // Additional buffer based on congestion
    const congestionBuffers: Record<NetworkCongestion, number> = {
      [NetworkCongestion.LOW]: 0, // No additional buffer
      [NetworkCongestion.MEDIUM]: 3, // +0.3x
      [NetworkCongestion.HIGH]: 8, // +0.8x
      [NetworkCongestion.VERY_HIGH]: 15, // +1.5x
    };
    
    return baseFeeBuffer + congestionBuffers[congestion];
  }
  
  /**
   * Estimate the time to confirmation based on priority and congestion
   * @param priority Fee priority
   * @param congestion Network congestion
   * @returns Estimated time in seconds
   */
  private estimateTimeToConfirmation(
    priority: FeePriority,
    congestion: NetworkCongestion
  ): number {
    // Base times by priority (in seconds)
    const baseTimes: Record<FeePriority, number> = {
      [FeePriority.LOW]: 60, // 1 minute
      [FeePriority.MEDIUM]: 30, // 30 seconds
      [FeePriority.HIGH]: 15, // 15 seconds
      [FeePriority.URGENT]: 5, // 5 seconds
    };
    
    // Congestion multipliers
    const congestionMultipliers: Record<NetworkCongestion, number> = {
      [NetworkCongestion.LOW]: 1, // No adjustment
      [NetworkCongestion.MEDIUM]: 2, // 2x longer
      [NetworkCongestion.HIGH]: 4, // 4x longer
      [NetworkCongestion.VERY_HIGH]: 8, // 8x longer
    };
    
    return baseTimes[priority] * congestionMultipliers[congestion];
  }
}

/**
 * Factory for creating fee estimators for different blockchains
 */
export class FeeEstimatorFactory {
  private static estimators: Map<string, FeeEstimator> = new Map();

  /**
   * Get a fee estimator for a specific blockchain
   * @param blockchain The blockchain to get an estimator for
   * @param provider The provider to use
   * @returns A fee estimator
   */
  static getEstimator(
    blockchain: string,
    provider:  Provider
  ): FeeEstimator {
    // Use provider._network.chainId or similar instead of connection.url which doesn't exist
    const networkInfo = provider.getNetwork ? 
      provider.getNetwork().then(n => n.chainId.toString()) : 
      'unknown';
    const key = `${blockchain}-${networkInfo}`;
    
    if (!this.estimators.has(key)) {
      // Create the appropriate estimator based on the blockchain
      let estimator: FeeEstimator;
      
      switch (blockchain.toLowerCase()) {
        // For now, all chains use EVMFeeEstimator
        // In the future, we might add specialized estimators for specific chains
        default:
          estimator = new EVMFeeEstimator(provider, blockchain);
          break;
      }
      
      this.estimators.set(key, estimator);
    }
    
    return this.estimators.get(key)!;
  }
}