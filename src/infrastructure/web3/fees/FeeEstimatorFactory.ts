/**
 * Clean, simplified Fee Estimator Factory
 * Provides blockchain-agnostic fee estimation
 */

import { TransactionFeeEstimate } from '../transactions/TransactionBuilder';

export enum FeePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface FeeEstimate {
  fee: string;
  time: number; // estimated time in seconds
  gasLimit?: string;
  gasPrice?: string;
  blockchain: string;
  nativeToken: string;
}

export interface UnifiedFeeEstimate {
  low: FeeEstimate;
  medium: FeeEstimate;
  high: FeeEstimate;
  urgent: FeeEstimate;
  blockchain: string;
  nativeToken: string;
}

/**
 * Generic fee estimator interface
 */
export interface IFeeEstimator {
  estimateTransferFee(
    from: string,
    to: string,
    amount: string,
    priority?: FeePriority
  ): Promise<FeeEstimate>;
  
  getNetworkFeeRecommendations(): Promise<UnifiedFeeEstimate>;
  
  formatFeeEstimate(estimate: FeeEstimate): string;
}

/**
 * EVM Fee Estimator for Ethereum-compatible chains
 */
export class EVMFeeEstimator implements IFeeEstimator {
  private provider: any;
  private blockchain: string;
  
  constructor(provider: any, blockchain: string) {
    this.provider = provider;
    this.blockchain = blockchain;
  }
  
  async estimateTransferFee(
    from: string,
    to: string,
    amount: string,
    priority: FeePriority = FeePriority.MEDIUM
  ): Promise<FeeEstimate> {
    try {
      // Simple gas estimation for transfer
      const gasLimit = '21000'; // Standard ETH transfer
      const gasPrice = await this.getGasPrice(priority);
      
      // Calculate fee in ETH
      const feeInWei = BigInt(gasLimit) * BigInt(gasPrice);
      const feeInEth = this.formatEther(feeInWei.toString());
      
      return {
        fee: feeInEth,
        time: this.getEstimatedTime(priority),
        gasLimit,
        gasPrice,
        blockchain: this.blockchain,
        nativeToken: this.getNativeToken()
      };
    } catch (error) {
      throw new Error(`EVM fee estimation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async getNetworkFeeRecommendations(): Promise<UnifiedFeeEstimate> {
    const sampleFrom = '0x0000000000000000000000000000000000000000';
    const sampleTo = '0x0000000000000000000000000000000000000001';
    const sampleAmount = '0.001';
    
    const [low, medium, high, urgent] = await Promise.all([
      this.estimateTransferFee(sampleFrom, sampleTo, sampleAmount, FeePriority.LOW),
      this.estimateTransferFee(sampleFrom, sampleTo, sampleAmount, FeePriority.MEDIUM),
      this.estimateTransferFee(sampleFrom, sampleTo, sampleAmount, FeePriority.HIGH),
      this.estimateTransferFee(sampleFrom, sampleTo, sampleAmount, FeePriority.URGENT),
    ]);
    
    return {
      low,
      medium,
      high,
      urgent,
      blockchain: this.blockchain,
      nativeToken: this.getNativeToken()
    };
  }
  
  formatFeeEstimate(estimate: FeeEstimate): string {
    return `${estimate.fee} ${estimate.nativeToken}`;
  }
  
  private async getGasPrice(priority: FeePriority): Promise<string> {
    try {
      // Get base gas price
      const feeData = await this.provider.getFeeData();
      const baseGasPrice = feeData.gasPrice || BigInt('20000000000'); // 20 gwei fallback
      
      const multipliers = {
        [FeePriority.LOW]: 0.8,
        [FeePriority.MEDIUM]: 1.0,
        [FeePriority.HIGH]: 1.5,
        [FeePriority.URGENT]: 2.0
      };
      
      const multiplier = multipliers[priority];
      const adjustedPrice = baseGasPrice * BigInt(Math.floor(multiplier * 100)) / BigInt(100);
      
      return adjustedPrice.toString();
    } catch (error) {
      // Fallback gas prices (in wei)
      const fallbackPrices = {
        [FeePriority.LOW]: '16000000000',    // 16 gwei
        [FeePriority.MEDIUM]: '20000000000', // 20 gwei
        [FeePriority.HIGH]: '30000000000',   // 30 gwei
        [FeePriority.URGENT]: '40000000000'  // 40 gwei
      };
      
      return fallbackPrices[priority];
    }
  }
  
  private getEstimatedTime(priority: FeePriority): number {
    const times = {
      [FeePriority.LOW]: 300,    // 5 minutes
      [FeePriority.MEDIUM]: 180, // 3 minutes
      [FeePriority.HIGH]: 60,    // 1 minute
      [FeePriority.URGENT]: 30   // 30 seconds
    };
    
    return times[priority];
  }
  
  private formatEther(weiValue: string): string {
    const wei = BigInt(weiValue);
    const eth = Number(wei) / 1e18;
    return eth.toFixed(6);
  }
  
  private getNativeToken(): string {
    const tokens: Record<string, string> = {
      'ethereum': 'ETH',
      'polygon': 'MATIC',
      'avalanche': 'AVAX',
      'optimism': 'ETH',
      'arbitrum': 'ETH',
      'base': 'ETH'
    };
    
    return tokens[this.blockchain.toLowerCase()] || 'ETH';
  }
}

/**
 * Simplified fee estimator factory
 */
export class FeeEstimatorFactory {
  private static estimators = new Map<string, IFeeEstimator>();
  
  static createEstimator(blockchain: string, provider: any): IFeeEstimator {
    const key = blockchain.toLowerCase();
    
    // Check cache
    if (this.estimators.has(key)) {
      return this.estimators.get(key)!;
    }
    
    let estimator: IFeeEstimator;
    
    switch (key) {
      case 'ethereum':
      case 'polygon':
      case 'avalanche':
      case 'optimism':
      case 'arbitrum':
      case 'base':
        estimator = new EVMFeeEstimator(provider, blockchain);
        break;
      
      case 'solana':
        estimator = new SolanaFeeEstimator(provider, blockchain);
        break;
      
      case 'near':
        estimator = new NEARFeeEstimator(provider, blockchain);
        break;
      
      default:
        throw new Error(`Fee estimator not implemented for blockchain: ${blockchain}`);
    }
    
    this.estimators.set(key, estimator);
    return estimator;
  }
  
  static clearCache(): void {
    this.estimators.clear();
  }
  
  static getSupportedBlockchains(): string[] {
    return ['ethereum', 'polygon', 'avalanche', 'optimism', 'arbitrum', 'base', 'solana', 'near'];
  }
}

/**
 * Solana Fee Estimator
 */
export class SolanaFeeEstimator implements IFeeEstimator {
  private connection: any;
  private blockchain: string;
  
  constructor(connection: any, blockchain: string) {
    this.connection = connection;
    this.blockchain = blockchain;
  }
  
  async estimateTransferFee(
    from: string,
    to: string,
    amount: string,
    priority: FeePriority = FeePriority.MEDIUM
  ): Promise<FeeEstimate> {
    try {
      // Solana fee calculation
      const baseFee = 0.000005; // 5000 lamports = 0.000005 SOL
      
      const multipliers = {
        [FeePriority.LOW]: 1.0,
        [FeePriority.MEDIUM]: 1.2,
        [FeePriority.HIGH]: 1.5,
        [FeePriority.URGENT]: 2.0
      };
      
      const fee = baseFee * multipliers[priority];
      
      return {
        fee: fee.toString(),
        time: this.getEstimatedTime(priority),
        blockchain: this.blockchain,
        nativeToken: 'SOL'
      };
    } catch (error) {
      throw new Error(`Solana fee estimation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async getNetworkFeeRecommendations(): Promise<UnifiedFeeEstimate> {
    const sampleFrom = 'So11111111111111111111111111111111111111112';
    const sampleTo = 'So11111111111111111111111111111111111111112';
    const sampleAmount = '0.001';
    
    const [low, medium, high, urgent] = await Promise.all([
      this.estimateTransferFee(sampleFrom, sampleTo, sampleAmount, FeePriority.LOW),
      this.estimateTransferFee(sampleFrom, sampleTo, sampleAmount, FeePriority.MEDIUM),
      this.estimateTransferFee(sampleFrom, sampleTo, sampleAmount, FeePriority.HIGH),
      this.estimateTransferFee(sampleFrom, sampleTo, sampleAmount, FeePriority.URGENT),
    ]);
    
    return { low, medium, high, urgent, blockchain: this.blockchain, nativeToken: 'SOL' };
  }
  
  formatFeeEstimate(estimate: FeeEstimate): string {
    return `${estimate.fee} SOL`;
  }
  
  private getEstimatedTime(priority: FeePriority): number {
    const times = {
      [FeePriority.LOW]: 60,     // 1 minute
      [FeePriority.MEDIUM]: 30,  // 30 seconds
      [FeePriority.HIGH]: 15,    // 15 seconds
      [FeePriority.URGENT]: 10   // 10 seconds
    };
    
    return times[priority];
  }
}

/**
 * NEAR Fee Estimator
 */
export class NEARFeeEstimator implements IFeeEstimator {
  private provider: any;
  private blockchain: string;
  
  constructor(provider: any, blockchain: string) {
    this.provider = provider;
    this.blockchain = blockchain;
  }
  
  async estimateTransferFee(
    from: string,
    to: string,
    amount: string,
    priority: FeePriority = FeePriority.MEDIUM
  ): Promise<FeeEstimate> {
    try {
      // NEAR transfer fee calculation
      const baseFee = 0.0001; // ~0.0001 NEAR for transfer
      
      const multipliers = {
        [FeePriority.LOW]: 0.8,
        [FeePriority.MEDIUM]: 1.0,
        [FeePriority.HIGH]: 1.5,
        [FeePriority.URGENT]: 2.0
      };
      
      const fee = baseFee * multipliers[priority];
      
      return {
        fee: fee.toString(),
        time: this.getEstimatedTime(priority),
        blockchain: this.blockchain,
        nativeToken: 'NEAR'
      };
    } catch (error) {
      throw new Error(`NEAR fee estimation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async getNetworkFeeRecommendations(): Promise<UnifiedFeeEstimate> {
    const sampleFrom = 'sample.near';
    const sampleTo = 'sample2.near';
    const sampleAmount = '1';
    
    const [low, medium, high, urgent] = await Promise.all([
      this.estimateTransferFee(sampleFrom, sampleTo, sampleAmount, FeePriority.LOW),
      this.estimateTransferFee(sampleFrom, sampleTo, sampleAmount, FeePriority.MEDIUM),
      this.estimateTransferFee(sampleFrom, sampleTo, sampleAmount, FeePriority.HIGH),
      this.estimateTransferFee(sampleFrom, sampleTo, sampleAmount, FeePriority.URGENT),
    ]);
    
    return { low, medium, high, urgent, blockchain: this.blockchain, nativeToken: 'NEAR' };
  }
  
  formatFeeEstimate(estimate: FeeEstimate): string {
    return `${estimate.fee} NEAR`;
  }
  
  private getEstimatedTime(priority: FeePriority): number {
    const times = {
      [FeePriority.LOW]: 10,     // 10 seconds
      [FeePriority.MEDIUM]: 5,   // 5 seconds
      [FeePriority.HIGH]: 3,     // 3 seconds
      [FeePriority.URGENT]: 2    // 2 seconds
    };
    
    return times[priority];
  }
}
