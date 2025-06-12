/**
 * Fee estimation service for blockchain transactions
 */

export enum FeePriority {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NetworkCongestion {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high', 
  VERY_HIGH = 'very_high'
}

export interface FeeData {
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  estimatedTimeSeconds: number;
  networkCongestion: NetworkCongestion;
  priority: FeePriority;
}

export interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  totalCost: string;
  totalCostUSD?: string;
}

export class FeeEstimator {
  private static instance: FeeEstimator;
  
  public static getInstance(): FeeEstimator {
    if (!FeeEstimator.instance) {
      FeeEstimator.instance = new FeeEstimator();
    }
    return FeeEstimator.instance;
  }

  private constructor() {}

  /**
   * Get optimal fee data for a given blockchain and priority
   */
  async getOptimalFeeData(blockchain: string, priority: FeePriority): Promise<FeeData> {
    // Mock implementation for now - in production, this would connect to actual fee estimation APIs
    const baseFee = this.getBaseFeeForChain(blockchain);
    const multiplier = this.getPriorityMultiplier(priority);
    
    const gasPrice = Math.round(baseFee * multiplier).toString();
    const maxFeePerGas = Math.round(baseFee * multiplier * 1.2).toString();
    const maxPriorityFeePerGas = Math.round(baseFee * 0.1 * multiplier).toString();
    
    return {
      gasPrice,
      maxFeePerGas,
      maxPriorityFeePerGas,
      estimatedTimeSeconds: this.getEstimatedTime(priority),
      networkCongestion: this.getNetworkCongestion(blockchain),
      priority
    };
  }

  /**
   * Estimate gas for a specific transaction
   */
  async estimateGas(
    blockchain: string,
    to: string,
    data?: string,
    value?: string
  ): Promise<GasEstimate> {
    // Mock implementation
    const baseGasLimit = data ? 100000 : 21000;
    const feeData = await this.getOptimalFeeData(blockchain, FeePriority.MEDIUM);
    
    const gasLimit = baseGasLimit.toString();
    const totalCost = (baseGasLimit * parseInt(feeData.gasPrice || '0')).toString();
    
    return {
      gasLimit,
      gasPrice: feeData.gasPrice || '0',
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      totalCost,
      totalCostUSD: '0.00' // Would calculate based on token price
    };
  }

  /**
   * Get current network congestion
   */
  private getNetworkCongestion(blockchain: string): NetworkCongestion {
    // Mock implementation - would use real network data
    const congestionMap: Record<string, NetworkCongestion> = {
      ethereum: NetworkCongestion.HIGH,
      polygon: NetworkCongestion.MEDIUM,
      arbitrum: NetworkCongestion.LOW,
      optimism: NetworkCongestion.LOW,
      avalanche: NetworkCongestion.MEDIUM,
      bsc: NetworkCongestion.MEDIUM
    };
    
    return congestionMap[blockchain] || NetworkCongestion.MEDIUM;
  }

  /**
   * Get base fee for blockchain (in wei)
   */
  private getBaseFeeForChain(blockchain: string): number {
    const baseFees: Record<string, number> = {
      ethereum: 20000000000, // 20 gwei
      polygon: 30000000000,  // 30 gwei
      arbitrum: 100000000,   // 0.1 gwei
      optimism: 1000000000,  // 1 gwei
      avalanche: 25000000000, // 25 gwei
      bsc: 5000000000        // 5 gwei
    };
    
    return baseFees[blockchain] || 20000000000;
  }

  /**
   * Get priority multiplier
   */
  private getPriorityMultiplier(priority: FeePriority): number {
    const multipliers: Record<FeePriority, number> = {
      [FeePriority.LOW]: 0.8,
      [FeePriority.MEDIUM]: 1.0,
      [FeePriority.HIGH]: 1.3,
      [FeePriority.URGENT]: 1.8
    };
    
    return multipliers[priority];
  }

  /**
   * Get estimated confirmation time in seconds
   */
  private getEstimatedTime(priority: FeePriority): number {
    const times: Record<FeePriority, number> = {
      [FeePriority.LOW]: 300,     // 5 minutes
      [FeePriority.MEDIUM]: 120,  // 2 minutes  
      [FeePriority.HIGH]: 60,     // 1 minute
      [FeePriority.URGENT]: 30    // 30 seconds
    };
    
    return times[priority];
  }
}

// Export singleton instance
export const feeEstimator = FeeEstimator.getInstance();

// Default export
export default FeeEstimator;
