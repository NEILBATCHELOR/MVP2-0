/**
 * NEAR Protocol Fee Estimator
 * Simple, clean implementation without complex dependencies
 */

export enum NEARFeePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface NEARFeeEstimate {
  gasUnits: string;
  gasPrice: string;
  totalFee: string;
  feeInNEAR: string;
  estimatedTime: number;
  transactionType: string;
}

/**
 * Simplified NEAR fee estimator
 * Note: The main implementation is now in FeeEstimatorFactory.ts
 * This file is kept for backward compatibility
 */
export class NEARFeeEstimator {
  private nearConnection: any;
  
  constructor(nearConnection: any) {
    this.nearConnection = nearConnection;
  }

  async estimateNEARTransferFee(
    from: string,
    to: string,
    amount: string,
    priority: NEARFeePriority = NEARFeePriority.MEDIUM
  ): Promise<NEARFeeEstimate> {
    const baseFee = '100000000000000000000000'; // 0.0001 NEAR in yoctoNEAR
    const gasUnits = '450000000000'; // 450 TGas
    
    const multipliers = {
      [NEARFeePriority.LOW]: 0.8,
      [NEARFeePriority.MEDIUM]: 1.0,
      [NEARFeePriority.HIGH]: 1.5,
      [NEARFeePriority.URGENT]: 2.0
    };
    
    const multiplier = multipliers[priority];
    const adjustedFee = BigInt(baseFee) * BigInt(Math.floor(multiplier * 100)) / BigInt(100);
    const feeInNEAR = this.formatNearAmount(adjustedFee.toString());
    
    return {
      gasUnits,
      gasPrice: baseFee,
      totalFee: adjustedFee.toString(),
      feeInNEAR,
      estimatedTime: this.getEstimatedTime(priority),
      transactionType: 'transfer'
    };
  }

  async getNetworkFeeRecommendations(): Promise<{
    low: NEARFeeEstimate;
    medium: NEARFeeEstimate;
    high: NEARFeeEstimate;
    urgent: NEARFeeEstimate;
  }> {
    const sampleFrom = 'sample.near';
    const sampleTo = 'sample2.near';
    const sampleAmount = '1';

    const [low, medium, high, urgent] = await Promise.all([
      this.estimateNEARTransferFee(sampleFrom, sampleTo, sampleAmount, NEARFeePriority.LOW),
      this.estimateNEARTransferFee(sampleFrom, sampleTo, sampleAmount, NEARFeePriority.MEDIUM),
      this.estimateNEARTransferFee(sampleFrom, sampleTo, sampleAmount, NEARFeePriority.HIGH),
      this.estimateNEARTransferFee(sampleFrom, sampleTo, sampleAmount, NEARFeePriority.URGENT),
    ]);

    return { low, medium, high, urgent };
  }

  formatFeeEstimate(estimate: NEARFeeEstimate): string {
    return `${estimate.feeInNEAR} NEAR`;
  }

  private formatNearAmount(yoctoNear: string): string {
    const nearAmount = Number(yoctoNear) / 1e24;
    return nearAmount.toFixed(6);
  }

  private getEstimatedTime(priority: NEARFeePriority): number {
    const times = {
      [NEARFeePriority.LOW]: 10,
      [NEARFeePriority.MEDIUM]: 5,
      [NEARFeePriority.HIGH]: 3,
      [NEARFeePriority.URGENT]: 2
    };
    
    return times[priority];
  }
}
