/**
 * JSONB Configuration Mapper
 * Handles JSONB configuration fields ↔ typed objects
 */

import { BaseMapper, ValidationResult } from '../shared/baseMapper';

/**
 * Common JSONB configuration interfaces
 */
export interface TransferConfig {
  enabled: boolean;
  restrictions?: {
    maxTransferAmount?: string;
    minTransferAmount?: string;
    transferCooldown?: number;
    requireApproval?: boolean;
  };
  whitelist?: {
    enabled: boolean;
    addresses: string[];
  };
  blacklist?: {
    enabled: boolean;
    addresses: string[];
  };
}

export interface GasConfig {
  optimization: 'standard' | 'aggressive' | 'minimal';
  gasLimit?: string;
  gasPriceMultiplier?: number;
  estimateGas?: boolean;
}

export interface ComplianceConfig {
  kycRequired: boolean;
  amlChecks: boolean;
  accreditedOnly?: boolean;
  maxHolders?: number;
  geographicRestrictions?: {
    allowedCountries?: string[];
    blockedCountries?: string[];
    defaultPolicy: 'allow' | 'deny';
  };
}

export interface WhitelistConfig {
  enabled: boolean;
  addresses: string[];
  merkleRoot?: string;
  requireProof?: boolean;
  autoApprove?: boolean;
}

export interface GovernanceConfig {
  enabled: boolean;
  votingPower?: 'token' | 'wallet' | 'custom';
  quorumPercentage?: string;
  proposalThreshold?: string;
  votingDelay?: number;
  votingPeriod?: number;
  timelockDelay?: number;
}

export interface VestingConfig {
  enabled: boolean;
  schedules?: Array<{
    recipient: string;
    amount: string;
    startTime: string;
    cliffPeriod?: number;
    vestingPeriod: number;
    releaseFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  }>;
}

export interface SalesConfig {
  enabled: boolean;
  price?: string;
  currency?: string;
  maxPurchase?: string;
  minPurchase?: string;
  startTime?: string;
  endTime?: string;
  phases?: Array<{
    name: string;
    price: string;
    maxSupply: string;
    startTime: string;
    endTime: string;
  }>;
}

export interface RoyaltyConfig {
  enabled: boolean;
  percentage: string;
  receiver: string;
  marketplaces?: string[];
}

/**
 * Advanced JSONB configurations for token standards
 */
export interface DynamicUriConfig {
  enabled: boolean;
  basePattern?: string;
  variables?: string[];
  updateFrequency?: 'manual' | 'hourly' | 'daily' | 'weekly';
}

export interface BatchMintingConfig {
  enabled: boolean;
  maxBatchSize?: number;
  gasPriceMultiplier?: number;
  retryOnFailure?: boolean;
  delayBetweenBatches?: number;
}

/**
 * JSONB Configuration Mapper
 */
export class JsonbConfigMapper {
  
  /**
   * Map transfer configuration
   */
  static mapTransferConfig(data: any): TransferConfig | null {
    if (!data) return null;
    
    try {
      const config = typeof data === 'string' ? JSON.parse(data) : data;
      
      return {
        enabled: Boolean(config.enabled),
        restrictions: config.restrictions ? {
          maxTransferAmount: config.restrictions.maxTransferAmount,
          minTransferAmount: config.restrictions.minTransferAmount,
          transferCooldown: Number(config.restrictions.transferCooldown) || 0,
          requireApproval: Boolean(config.restrictions.requireApproval),
        } : undefined,
        whitelist: config.whitelist ? {
          enabled: Boolean(config.whitelist.enabled),
          addresses: Array.isArray(config.whitelist.addresses) ? config.whitelist.addresses : [],
        } : undefined,
        blacklist: config.blacklist ? {
          enabled: Boolean(config.blacklist.enabled),
          addresses: Array.isArray(config.blacklist.addresses) ? config.blacklist.addresses : [],
        } : undefined,
      };
    } catch {
      return null;
    }
  }

  /**
   * Map gas configuration
   */
  static mapGasConfig(data: any): GasConfig | null {
    if (!data) return null;
    
    try {
      const config = typeof data === 'string' ? JSON.parse(data) : data;
      
      return {
        optimization: config.optimization || 'standard',
        gasLimit: config.gasLimit,
        gasPriceMultiplier: Number(config.gasPriceMultiplier) || 1.0,
        estimateGas: Boolean(config.estimateGas),
      };
    } catch {
      return null;
    }
  }

  /**
   * Map compliance configuration
   */
  static mapComplianceConfig(data: any): ComplianceConfig | null {
    if (!data) return null;
    
    try {
      const config = typeof data === 'string' ? JSON.parse(data) : data;
      
      return {
        kycRequired: Boolean(config.kycRequired),
        amlChecks: Boolean(config.amlChecks),
        accreditedOnly: Boolean(config.accreditedOnly),
        maxHolders: config.maxHolders ? Number(config.maxHolders) : undefined,
        geographicRestrictions: config.geographicRestrictions ? {
          allowedCountries: Array.isArray(config.geographicRestrictions.allowedCountries) 
            ? config.geographicRestrictions.allowedCountries : [],
          blockedCountries: Array.isArray(config.geographicRestrictions.blockedCountries) 
            ? config.geographicRestrictions.blockedCountries : [],
          defaultPolicy: config.geographicRestrictions.defaultPolicy || 'allow',
        } : undefined,
      };
    } catch {
      return null;
    }
  }

  /**
   * Map whitelist configuration
   */
  static mapWhitelistConfig(data: any): WhitelistConfig | null {
    if (!data) return null;
    
    try {
      const config = typeof data === 'string' ? JSON.parse(data) : data;
      
      return {
        enabled: Boolean(config.enabled),
        addresses: Array.isArray(config.addresses) ? config.addresses : [],
        merkleRoot: config.merkleRoot,
        requireProof: Boolean(config.requireProof),
        autoApprove: Boolean(config.autoApprove),
      };
    } catch {
      return null;
    }
  }

  /**
   * Map governance configuration
   */
  static mapGovernanceConfig(data: any): GovernanceConfig | null {
    if (!data) return null;
    
    try {
      const config = typeof data === 'string' ? JSON.parse(data) : data;
      
      return {
        enabled: Boolean(config.enabled),
        votingPower: config.votingPower || 'token',
        quorumPercentage: config.quorumPercentage,
        proposalThreshold: config.proposalThreshold,
        votingDelay: Number(config.votingDelay) || 0,
        votingPeriod: Number(config.votingPeriod) || 0,
        timelockDelay: Number(config.timelockDelay) || 0,
      };
    } catch {
      return null;
    }
  }

  /**
   * Map vesting configuration
   */
  static mapVestingConfig(data: any): VestingConfig | null {
    if (!data) return null;
    
    try {
      const config = typeof data === 'string' ? JSON.parse(data) : data;
      
      return {
        enabled: Boolean(config.enabled),
        schedules: Array.isArray(config.schedules) ? config.schedules.map((schedule: any) => ({
          recipient: schedule.recipient,
          amount: schedule.amount,
          startTime: schedule.startTime,
          cliffPeriod: Number(schedule.cliffPeriod) || 0,
          vestingPeriod: Number(schedule.vestingPeriod) || 0,
          releaseFrequency: schedule.releaseFrequency || 'monthly',
        })) : undefined,
      };
    } catch {
      return null;
    }
  }

  /**
   * Map sales configuration
   */
  static mapSalesConfig(data: any): SalesConfig | null {
    if (!data) return null;
    
    try {
      const config = typeof data === 'string' ? JSON.parse(data) : data;
      
      return {
        enabled: Boolean(config.enabled),
        price: config.price,
        currency: config.currency || 'ETH',
        maxPurchase: config.maxPurchase,
        minPurchase: config.minPurchase,
        startTime: config.startTime,
        endTime: config.endTime,
        phases: Array.isArray(config.phases) ? config.phases.map((phase: any) => ({
          name: phase.name,
          price: phase.price,
          maxSupply: phase.maxSupply,
          startTime: phase.startTime,
          endTime: phase.endTime,
        })) : undefined,
      };
    } catch {
      return null;
    }
  }

  /**
   * Map royalty configuration
   */
  static mapRoyaltyConfig(data: any): RoyaltyConfig | null {
    if (!data) return null;
    
    try {
      const config = typeof data === 'string' ? JSON.parse(data) : data;
      
      return {
        enabled: Boolean(config.enabled),
        percentage: config.percentage || '0',
        receiver: config.receiver,
        marketplaces: Array.isArray(config.marketplaces) ? config.marketplaces : [],
      };
    } catch {
      return null;
    }
  }

  /**
   * Prepare configuration for database storage
   */
  static prepareForDatabase(config: any): string | null {
    if (!config) return null;
    
    try {
      return JSON.stringify(config);
    } catch {
      return null;
    }
  }

  /**
   * Validate transfer configuration
   */
  static validateTransferConfig(config: TransferConfig): ValidationResult {
    const errors: string[] = [];

    if (config.restrictions?.maxTransferAmount && config.restrictions?.minTransferAmount) {
      const max = parseFloat(config.restrictions.maxTransferAmount);
      const min = parseFloat(config.restrictions.minTransferAmount);
      
      if (max <= min) {
        errors.push('Max transfer amount must be greater than min transfer amount');
      }
    }

    if (config.restrictions?.transferCooldown && config.restrictions.transferCooldown < 0) {
      errors.push('Transfer cooldown must be non-negative');
    }

    if (config.whitelist?.addresses) {
      for (const address of config.whitelist.addresses) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
          errors.push(`Invalid whitelist address: ${address}`);
        }
      }
    }

    if (config.blacklist?.addresses) {
      for (const address of config.blacklist.addresses) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
          errors.push(`Invalid blacklist address: ${address}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate governance configuration
   */
  static validateGovernanceConfig(config: GovernanceConfig): ValidationResult {
    const errors: string[] = [];

    if (config.quorumPercentage) {
      const quorum = parseFloat(config.quorumPercentage);
      if (quorum < 0 || quorum > 100) {
        errors.push('Quorum percentage must be between 0 and 100');
      }
    }

    if (config.votingDelay && config.votingDelay < 0) {
      errors.push('Voting delay must be non-negative');
    }

    if (config.votingPeriod && config.votingPeriod <= 0) {
      errors.push('Voting period must be positive');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate royalty configuration
   */
  static validateRoyaltyConfig(config: RoyaltyConfig): ValidationResult {
    const errors: string[] = [];

    if (config.percentage) {
      const percentage = parseFloat(config.percentage);
      if (percentage < 0 || percentage > 100) {
        errors.push('Royalty percentage must be between 0 and 100');
      }
    }

    if (config.receiver && !/^0x[a-fA-F0-9]{40}$/.test(config.receiver)) {
      errors.push('Invalid royalty receiver address');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create default configurations
   */
  static createDefaultSalesConfig(): SalesConfig {
    return {
      enabled: false,
      price: '0',
      currency: 'ETH',
      maxPurchase: '1',
      minPurchase: '1',
    };
  }

  static createDefaultDynamicUriConfig(): DynamicUriConfig {
    return {
      enabled: false,
      basePattern: '',
      variables: [],
      updateFrequency: 'manual',
    };
  }

  static createDefaultBatchMintingConfig(): BatchMintingConfig {
    return {
      enabled: false,
      maxBatchSize: 100,
      gasPriceMultiplier: 1.0,
      retryOnFailure: false,
      delayBetweenBatches: 0,
    };
  }
  static createDefaultTransferConfig(): TransferConfig {
    return {
      enabled: false,
      restrictions: {
        requireApproval: false,
      },
      whitelist: {
        enabled: false,
        addresses: [],
      },
      blacklist: {
        enabled: false,
        addresses: [],
      },
    };
  }

  static createDefaultGasConfig(): GasConfig {
    return {
      optimization: 'standard',
      gasPriceMultiplier: 1.0,
      estimateGas: true,
    };
  }

  static createDefaultComplianceConfig(): ComplianceConfig {
    return {
      kycRequired: false,
      amlChecks: false,
      accreditedOnly: false,
      geographicRestrictions: {
        defaultPolicy: 'allow',
        allowedCountries: [],
        blockedCountries: [],
      },
    };
  }

  static createDefaultWhitelistConfig(): WhitelistConfig {
    return {
      enabled: false,
      addresses: [],
      requireProof: false,
      autoApprove: false,
    };
  }

  static createDefaultGovernanceConfig(): GovernanceConfig {
    return {
      enabled: false,
      votingPower: 'token',
      quorumPercentage: '50',
      proposalThreshold: '1',
      votingDelay: 86400, // 1 day
      votingPeriod: 604800, // 1 week
      timelockDelay: 172800, // 2 days
    };
  }

  static createDefaultRoyaltyConfig(): RoyaltyConfig {
    return {
      enabled: false,
      percentage: '0',
      receiver: '',
      marketplaces: [],
    };
  }
}
