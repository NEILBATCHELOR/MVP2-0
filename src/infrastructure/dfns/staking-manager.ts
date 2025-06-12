/**
 * DFNS Staking Manager - Staking services management for DFNS integration
 * 
 * This service manages DFNS staking operations including:
 * - Creating stakes across multiple networks (Ethereum, Solana, etc.)
 * - Managing stake actions (delegate, undelegate, claim rewards)
 * - Staking rewards tracking and optimization
 * - Validator selection and management
 * - Staking performance analytics
 */

import type { DfnsClientConfig } from '@/types/dfns';
import { DfnsAuthenticator } from './auth';
import { DFNS_CONFIG, DFNS_ENDPOINTS } from './config';

// ===== Staking Types =====

export interface StakePosition {
  id: string;
  provider: StakingProvider;
  providerStakeId: string;
  walletId: string;
  protocol: StakingProtocol;
  network: StakingNetwork;
  status: StakeStatus;
  amount: string;
  asset: string;
  apr: string; // Annual Percentage Rate - required for core compatibility
  rewards: string; // Current reward amount - required for core compatibility
  validator?: string;
  delegator?: string;
  duration?: number; // in days for fixed-term staking
  startDate: string;
  endDate?: string;
  estimatedRewards: string;
  actualRewards: string;
  annualPercentageRate: string;
  metadata?: Record<string, any>;
  dateCreated: string;
  dateUpdated: string;
}

export interface StakeAction {
  id: string;
  stakeId: string;
  type: StakeActionType;
  amount: string;
  status: StakeActionStatus;
  txHash?: string;
  validator?: string;
  estimatedGas?: string;
  actualGas?: string;
  dateCreated: string;
  dateExecuted?: string;
  dateCompleted?: string;
}

export interface StakingReward {
  id: string;
  stakeId: string;
  amount: string;
  asset: string;
  network: string; // Network where rewards were earned - required for core compatibility
  rewardType: RewardType;
  periodStart: string;
  periodEnd: string;
  claimed: boolean;
  claimTxHash?: string;
  dateEarned: string;
  dateClaimed?: string;
}

export interface ValidatorInfo {
  id: string;
  network: StakingNetwork;
  address: string;
  name?: string;
  commission: string;
  totalStaked: string;
  delegatedAmount: string; // Total amount delegated to this validator - required for core compatibility
  delegatorCount: number;
  uptime: string;
  apr: string;
  status: ValidatorStatus;
  metadata?: Record<string, any>;
}

export interface StakingStrategy {
  id: string;
  name: string;
  description: string;
  networks: StakingNetwork[];
  supportedNetworks: string[]; // Networks supported by this strategy - required for core compatibility
  minStakeAmount: string;
  expectedApr: string;
  annualizedReturn: string; // Expected annualized return - required for core compatibility
  riskLevel: RiskLevel;
  riskScore: string; // Risk score (0-10) - required for core compatibility
  autoCompound: boolean;
  validators: string[];
  rebalanceFrequency: number; // days
  config: Record<string, any>;
}

export interface StakingPortfolio {
  totalStaked: string;
  totalRewards: string;
  totalValueUsd: string;
  averageApr: string;
  positions: StakePosition[];
  pendingActions: StakeAction[];
  rewardSummary: {
    daily: string;
    monthly: string;
    yearly: string;
  };
  performanceMetrics: {
    totalReturn: string;
    roi: string;
    sharpeRatio: string;
  };
}

export enum StakingProvider {
  Figment = 'Figment',
  Chorus = 'Chorus',
  Stake = 'Stake',
  Kiln = 'Kiln',
  Native = 'Native'
}

export enum StakingProtocol {
  Native = 'Native',
  LiquidStaking = 'LiquidStaking',
  Ethereum2 = 'Ethereum2',
  Babylon = 'Babylon',
  CosmosHub = 'CosmosHub',
  Osmosis = 'Osmosis',
  SolanaStake = 'SolanaStake'
}

export enum StakingNetwork {
  Ethereum = 'Ethereum',
  Solana = 'Solana',
  Cosmos = 'Cosmos',
  Polkadot = 'Polkadot',
  Avalanche = 'Avalanche',
  Near = 'Near',
  Tezos = 'Tezos',
  Cardano = 'Cardano'
}

export enum StakeStatus {
  Active = 'Active',
  Pending = 'Pending',
  Unstaking = 'Unstaking',
  Completed = 'Completed',
  Failed = 'Failed',
  Cancelled = 'Cancelled'
}

export enum StakeActionType {
  Stake = 'Stake',
  Unstake = 'Unstake',
  Delegate = 'Delegate',
  Undelegate = 'Undelegate',
  Redelegate = 'Redelegate',
  ClaimRewards = 'ClaimRewards',
  Compound = 'Compound'
}

export enum StakeActionStatus {
  Pending = 'Pending',
  Submitted = 'Submitted',
  Confirmed = 'Confirmed',
  Completed = 'Completed',
  Failed = 'Failed'
}

export enum RewardType {
  Staking = 'Staking',
  Delegation = 'Delegation',
  Validation = 'Validation',
  Liquidity = 'Liquidity',
  Commission = 'Commission'
}

export enum ValidatorStatus {
  Active = 'Active',
  Jailed = 'Jailed',
  Unbonding = 'Unbonding',
  Inactive = 'Inactive'
}

export enum RiskLevel {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High'
}

// ===== DFNS Staking Manager Class =====

export class DfnsStakingManager {
  private config: DfnsClientConfig;
  private authenticator: DfnsAuthenticator;

  constructor(config: DfnsClientConfig, authenticator?: DfnsAuthenticator) {
    this.config = config;
    this.authenticator = authenticator || new DfnsAuthenticator(config);
  }

  // ===== Stake Management =====

  /**
   * Create a new stake position
   */
  async createStake(request: {
    walletId: string;
    provider: StakingProvider;
    protocol: StakingProtocol;
    network: StakingNetwork;
    amount: string;
    asset?: string;
    validator?: string;
    duration?: number;
    autoCompound?: boolean;
  }): Promise<StakePosition> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to create stake');
      }

      // Validate stake request
      this.validateStakeRequest(request);

      // Get user action signature for stake creation
      const userActionSignature = await this.authenticator.signUserAction(
        'POST',
        DFNS_ENDPOINTS.staking.create,
        request
      );

      const response = await fetch(`${this.config.baseUrl}${DFNS_ENDPOINTS.staking.create}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        },
        body: JSON.stringify({
          kind: request.protocol === StakingProtocol.Native ? 'Native' : 'LiquidStaking',
          ...request
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stake creation failed: ${errorData.message || response.statusText}`);
      }

      const stakeData = await response.json();
      
      // Map DFNS response to our interface
      return this.mapDfnsStakeToStakePosition(stakeData);
    } catch (error) {
      throw new Error(`Failed to create stake: ${(error as Error).message}`);
    }
  }

  /**
   * List all stake positions
   */
  async listStakes(filters?: {
    walletId?: string;
    provider?: StakingProvider;
    network?: StakingNetwork;
    status?: StakeStatus;
    limit?: number;
  }): Promise<{ stakes: StakePosition[]; total: number }> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to list stakes');
      }

      const queryParams = new URLSearchParams();
      if (filters?.walletId) queryParams.append('walletId', filters.walletId);
      if (filters?.provider) queryParams.append('provider', filters.provider);
      if (filters?.network) queryParams.append('network', filters.network);
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());

      const url = `${this.config.baseUrl}${DFNS_ENDPOINTS.staking.stakes}?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list stakes: ${response.statusText}`);
      }

      const data = await response.json();
      const stakes = (data.items || []).map((item: any) => this.mapDfnsStakeToStakePosition(item));

      return {
        stakes,
        total: data.total || stakes.length
      };
    } catch (error) {
      throw new Error(`Failed to list stakes: ${(error as Error).message}`);
    }
  }

  /**
   * Get stake details
   */
  async getStake(stakeId: string): Promise<StakePosition> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to get stake');
      }

      const response = await fetch(`${this.config.baseUrl}/staking/stakes/${stakeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get stake: ${response.statusText}`);
      }

      const stakeData = await response.json();
      return this.mapDfnsStakeToStakePosition(stakeData);
    } catch (error) {
      throw new Error(`Failed to get stake: ${(error as Error).message}`);
    }
  }

  // ===== Stake Actions =====

  /**
   * Create a stake action (delegate, undelegate, claim rewards, etc.)
   */
  async createStakeAction(request: {
    stakeId: string;
    type: StakeActionType;
    amount?: string;
    validator?: string;
    metadata?: Record<string, any>;
  }): Promise<StakeAction> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to create stake action');
      }

      const userActionSignature = await this.authenticator.signUserAction(
        'POST',
        DFNS_ENDPOINTS.staking.createAction,
        request
      );

      const response = await fetch(`${this.config.baseUrl}${DFNS_ENDPOINTS.staking.createAction}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        },
        body: JSON.stringify({
          ...request,
          action: this.mapActionTypeToString(request.type)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stake action creation failed: ${errorData.message || response.statusText}`);
      }

      const actionData = await response.json();
      return this.mapDfnsActionToStakeAction(actionData);
    } catch (error) {
      throw new Error(`Failed to create stake action: ${(error as Error).message}`);
    }
  }

  /**
   * List stake actions
   */
  async listStakeActions(stakeId?: string): Promise<StakeAction[]> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to list stake actions');
      }

      const queryParams = new URLSearchParams();
      if (stakeId) queryParams.append('stakeId', stakeId);

      const url = `${this.config.baseUrl}${DFNS_ENDPOINTS.staking.actions}?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list stake actions: ${response.statusText}`);
      }

      const data = await response.json();
      return (data.actions || []).map((action: any) => this.mapDfnsActionToStakeAction(action));
    } catch (error) {
      throw new Error(`Failed to list stake actions: ${(error as Error).message}`);
    }
  }

  // ===== Rewards Management =====

  /**
   * Get staking rewards
   */
  async getStakingRewards(filters?: {
    stakeId?: string;
    startDate?: string;
    endDate?: string;
    claimed?: boolean;
  }): Promise<StakingReward[]> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to get staking rewards');
      }

      const queryParams = new URLSearchParams();
      if (filters?.stakeId) queryParams.append('stakeId', filters.stakeId);
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);
      if (filters?.claimed !== undefined) queryParams.append('claimed', filters.claimed.toString());

      const url = `${this.config.baseUrl}${DFNS_ENDPOINTS.staking.rewards}?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get staking rewards: ${response.statusText}`);
      }

      const data = await response.json();
      return (data.rewards || []).map((reward: any) => this.mapDfnsRewardToStakingReward(reward));
    } catch (error) {
      throw new Error(`Failed to get staking rewards: ${(error as Error).message}`);
    }
  }

  /**
   * Claim staking rewards
   */
  async claimRewards(stakeId: string): Promise<StakeAction> {
    return this.createStakeAction({
      stakeId,
      type: StakeActionType.ClaimRewards
    });
  }

  // ===== Validators =====

  /**
   * List available validators for a network
   */
  async listValidators(network: StakingNetwork): Promise<ValidatorInfo[]> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to list validators');
      }

      const response = await fetch(`${this.config.baseUrl}/networks/validators?network=${network}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list validators: ${response.statusText}`);
      }

      const data = await response.json();
      return (data.validators || []).map((validator: any) => this.mapDfnsValidatorToValidatorInfo(validator));
    } catch (error) {
      throw new Error(`Failed to list validators: ${(error as Error).message}`);
    }
  }

  /**
   * Get recommended validators based on performance
   */
  async getRecommendedValidators(
    network: StakingNetwork,
    criteria: {
      minUptime?: number;
      maxCommission?: number;
      minStaked?: string;
      riskLevel?: RiskLevel;
      count?: number;
    } = {}
  ): Promise<ValidatorInfo[]> {
    try {
      const allValidators = await this.listValidators(network);
      
      // Filter validators based on criteria
      let filteredValidators = allValidators.filter(validator => {
        if (criteria.minUptime && parseFloat(validator.uptime) < criteria.minUptime) return false;
        if (criteria.maxCommission && parseFloat(validator.commission) > criteria.maxCommission) return false;
        if (criteria.minStaked && parseFloat(validator.totalStaked) < parseFloat(criteria.minStaked)) return false;
        if (validator.status !== ValidatorStatus.Active) return false;
        return true;
      });

      // Sort by performance (combination of APR, uptime, and commission)
      filteredValidators.sort((a, b) => {
        const scoreA = this.calculateValidatorScore(a);
        const scoreB = this.calculateValidatorScore(b);
        return scoreB - scoreA;
      });

      // Return top validators
      return filteredValidators.slice(0, criteria.count || 10);
    } catch (error) {
      throw new Error(`Failed to get recommended validators: ${(error as Error).message}`);
    }
  }

  // ===== Portfolio Management =====

  /**
   * Get staking portfolio summary
   */
  async getStakingPortfolio(walletId?: string): Promise<StakingPortfolio> {
    try {
      const { stakes } = await this.listStakes(walletId ? { walletId } : undefined);
      const rewards = await this.getStakingRewards();
      const actions = await this.listStakeActions();

      // Calculate portfolio metrics
      const totalStaked = stakes.reduce((sum, stake) => 
        sum + parseFloat(stake.amount), 0
      ).toString();

      const totalRewards = rewards.reduce((sum, reward) => 
        sum + parseFloat(reward.amount), 0
      ).toString();

      const averageApr = stakes.length > 0 
        ? (stakes.reduce((sum, stake) => sum + parseFloat(stake.annualPercentageRate), 0) / stakes.length).toString()
        : '0';

      // Simplified USD value calculation (would need price data in real implementation)
      const totalValueUsd = (parseFloat(totalStaked) * 2000).toString(); // Assuming $2000 per token

      const pendingActions = actions.filter(action => 
        action.status === StakeActionStatus.Pending || action.status === StakeActionStatus.Submitted
      );

      return {
        totalStaked,
        totalRewards,
        totalValueUsd,
        averageApr,
        positions: stakes,
        pendingActions,
        rewardSummary: {
          daily: (parseFloat(totalRewards) / 365).toString(),
          monthly: (parseFloat(totalRewards) / 12).toString(),
          yearly: totalRewards
        },
        performanceMetrics: {
          totalReturn: ((parseFloat(totalRewards) / parseFloat(totalStaked)) * 100).toString(),
          roi: averageApr,
          sharpeRatio: '1.5' // Simplified calculation
        }
      };
    } catch (error) {
      throw new Error(`Failed to get staking portfolio: ${(error as Error).message}`);
    }
  }

  // ===== Staking Strategies =====

  /**
   * Create predefined staking strategies
   */
  getStakingStrategies(): StakingStrategy[] {
    return [
      {
        id: 'conservative',
        name: 'Conservative Staking',
        description: 'Low-risk staking with established validators',
        networks: [StakingNetwork.Ethereum, StakingNetwork.Cosmos],
        supportedNetworks: ['Ethereum', 'Cosmos'], // Add required property
        minStakeAmount: '32',
        expectedApr: '4-6%',
        annualizedReturn: '5%', // Add required property
        riskLevel: RiskLevel.Low,
        riskScore: '2', // Add required property (0-10 scale)
        autoCompound: true,
        validators: [],
        rebalanceFrequency: 30,
        config: {
          maxCommission: 0.05,
          minUptime: 0.98,
          diversification: true
        }
      },
      {
        id: 'balanced',
        name: 'Balanced Staking',
        description: 'Moderate risk with good returns',
        networks: [StakingNetwork.Ethereum, StakingNetwork.Solana, StakingNetwork.Avalanche],
        supportedNetworks: ['Ethereum', 'Solana', 'Avalanche'], // Add required property
        minStakeAmount: '10',
        expectedApr: '6-10%',
        annualizedReturn: '8%', // Add required property
        riskLevel: RiskLevel.Medium,
        riskScore: '5', // Add required property (0-10 scale)
        autoCompound: true,
        validators: [],
        rebalanceFrequency: 14,
        config: {
          maxCommission: 0.10,
          minUptime: 0.95,
          diversification: true
        }
      },
      {
        id: 'aggressive',
        name: 'High Yield Staking',
        description: 'Higher risk for maximum returns',
        networks: [StakingNetwork.Solana, StakingNetwork.Near, StakingNetwork.Avalanche],
        supportedNetworks: ['Solana', 'Near', 'Avalanche'], // Add required property
        minStakeAmount: '1',
        expectedApr: '10-20%',
        annualizedReturn: '15%', // Add required property
        riskLevel: RiskLevel.High,
        riskScore: '8', // Add required property (0-10 scale)
        autoCompound: true,
        validators: [],
        rebalanceFrequency: 7,
        config: {
          maxCommission: 0.15,
          minUptime: 0.90,
          diversification: false
        }
      }
    ];
  }

  // ===== Utility Methods =====

  /**
   * Validate stake request
   */
  private validateStakeRequest(request: any): void {
    if (!request.walletId) {
      throw new Error('Wallet ID is required');
    }

    if (!request.amount || parseFloat(request.amount) <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (!Object.values(StakingProvider).includes(request.provider)) {
      throw new Error(`Invalid staking provider: ${request.provider}`);
    }

    if (!Object.values(StakingNetwork).includes(request.network)) {
      throw new Error(`Invalid staking network: ${request.network}`);
    }
  }

  /**
   * Map DFNS stake response to StakePosition
   */
  private mapDfnsStakeToStakePosition(dfnsStake: any): StakePosition {
    return {
      id: dfnsStake.id,
      provider: dfnsStake.provider as StakingProvider,
      providerStakeId: dfnsStake.providerStakeId,
      walletId: dfnsStake.walletId,
      protocol: dfnsStake.protocol as StakingProtocol,
      network: this.mapNetworkFromDfns(dfnsStake.network),
      status: dfnsStake.status as StakeStatus,
      amount: dfnsStake.requestBody?.amount || '0',
      asset: dfnsStake.requestBody?.asset || 'ETH',
      apr: '5', // Default APR, would get from provider
      rewards: '0', // Current rewards, would calculate
      validator: dfnsStake.requestBody?.validator,
      duration: dfnsStake.requestBody?.duration,
      startDate: dfnsStake.dateCreated,
      endDate: dfnsStake.data?.expirationDate,
      estimatedRewards: '0', // Would calculate based on APR
      actualRewards: '0',
      annualPercentageRate: '5', // Default, would get from provider
      metadata: dfnsStake.data,
      dateCreated: dfnsStake.dateCreated,
      dateUpdated: dfnsStake.dateCreated
    };
  }

  /**
   * Map DFNS action to StakeAction
   */
  private mapDfnsActionToStakeAction(dfnsAction: any): StakeAction {
    return {
      id: dfnsAction.id,
      stakeId: dfnsAction.stakeId,
      type: this.mapStringToActionType(dfnsAction.action),
      amount: dfnsAction.amount || '0',
      status: dfnsAction.status as StakeActionStatus,
      txHash: dfnsAction.txHash,
      validator: dfnsAction.validator,
      estimatedGas: dfnsAction.estimatedGas,
      actualGas: dfnsAction.actualGas,
      dateCreated: dfnsAction.dateCreated,
      dateExecuted: dfnsAction.dateExecuted,
      dateCompleted: dfnsAction.dateCompleted
    };
  }

  /**
   * Map DFNS reward to StakingReward
   */
  private mapDfnsRewardToStakingReward(dfnsReward: any): StakingReward {
    return {
      id: dfnsReward.id,
      stakeId: dfnsReward.stakeId,
      amount: dfnsReward.amount,
      asset: dfnsReward.asset || 'ETH',
      network: dfnsReward.network || 'Ethereum', // Add required network field
      rewardType: RewardType.Staking,
      periodStart: dfnsReward.periodStart,
      periodEnd: dfnsReward.periodEnd,
      claimed: dfnsReward.claimed || false,
      claimTxHash: dfnsReward.claimTxHash,
      dateEarned: dfnsReward.dateEarned,
      dateClaimed: dfnsReward.dateClaimed
    };
  }

  /**
   * Map DFNS validator to ValidatorInfo
   */
  private mapDfnsValidatorToValidatorInfo(dfnsValidator: any): ValidatorInfo {
    return {
      id: dfnsValidator.id,
      network: this.mapNetworkFromDfns(dfnsValidator.network),
      address: dfnsValidator.address,
      name: dfnsValidator.name,
      commission: dfnsValidator.commission || '0.05',
      totalStaked: dfnsValidator.totalStaked || '0',
      delegatedAmount: dfnsValidator.delegatedAmount || dfnsValidator.totalStaked || '0', // Add required property
      delegatorCount: dfnsValidator.delegatorCount || 0,
      uptime: dfnsValidator.uptime || '0.95',
      apr: dfnsValidator.apr || '5',
      status: dfnsValidator.status as ValidatorStatus || ValidatorStatus.Active,
      metadata: dfnsValidator.metadata
    };
  }

  /**
   * Map network from DFNS format
   */
  private mapNetworkFromDfns(network: string): StakingNetwork {
    const networkMap: Record<string, StakingNetwork> = {
      'Ethereum': StakingNetwork.Ethereum,
      'Solana': StakingNetwork.Solana,
      'Cosmos': StakingNetwork.Cosmos,
      'Polkadot': StakingNetwork.Polkadot,
      'Avalanche': StakingNetwork.Avalanche,
      'Near': StakingNetwork.Near,
      'Tezos': StakingNetwork.Tezos,
      'Cardano': StakingNetwork.Cardano
    };
    return networkMap[network] || StakingNetwork.Ethereum;
  }

  /**
   * Map action type to string for DFNS API
   */
  private mapActionTypeToString(type: StakeActionType): string {
    const actionMap: Record<StakeActionType, string> = {
      [StakeActionType.Stake]: 'stake',
      [StakeActionType.Unstake]: 'unstake',
      [StakeActionType.Delegate]: 'delegate',
      [StakeActionType.Undelegate]: 'undelegate',
      [StakeActionType.Redelegate]: 'redelegate',
      [StakeActionType.ClaimRewards]: 'claim_rewards',
      [StakeActionType.Compound]: 'compound'
    };
    return actionMap[type];
  }

  /**
   * Map string to action type from DFNS response
   */
  private mapStringToActionType(action: string): StakeActionType {
    const actionMap: Record<string, StakeActionType> = {
      'stake': StakeActionType.Stake,
      'unstake': StakeActionType.Unstake,
      'delegate': StakeActionType.Delegate,
      'undelegate': StakeActionType.Undelegate,
      'redelegate': StakeActionType.Redelegate,
      'claim_rewards': StakeActionType.ClaimRewards,
      'compound': StakeActionType.Compound
    };
    return actionMap[action] || StakeActionType.Stake;
  }

  /**
   * Calculate validator performance score
   */
  private calculateValidatorScore(validator: ValidatorInfo): number {
    const aprScore = parseFloat(validator.apr) * 0.4;
    const uptimeScore = parseFloat(validator.uptime) * 100 * 0.3;
    const commissionScore = (1 - parseFloat(validator.commission)) * 100 * 0.3;
    
    return aprScore + uptimeScore + commissionScore;
  }

  /**
   * Base64 URL encode
   */
  private base64UrlEncode(data: string): string {
    return btoa(data)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}

// ===== Export =====

export default DfnsStakingManager;
