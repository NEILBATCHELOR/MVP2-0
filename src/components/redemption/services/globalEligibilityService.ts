// Global eligibility service for open redemption access
// Bypasses investor-specific checks while maintaining core validation logic

import { supabase } from '@/infrastructure/supabaseClient';
import type { 
  EligibilityResult, 
  RedemptionWindowInfo, 
  Distribution,
  RedemptionRule
} from '../types';

export interface GlobalEligibilityCheckParams {
  distributionId: string;
  requestedAmount: number;
  tokenType: string;
  redemptionType: 'standard' | 'interval';
  // Optional investor details for logging purposes only
  investorId?: string;
  investorName?: string;
}

export class GlobalEligibilityService {
  /**
   * Global eligibility check for redemption requests
   * Bypasses investor-specific validation for open access
   */
  async checkRedemptionEligibility(params: GlobalEligibilityCheckParams): Promise<EligibilityResult> {
    try {
      // Get distribution details
      const distribution = await this.getDistribution(params.distributionId);
      if (!distribution) {
        return {
          eligible: false,
          reason: 'Distribution not found'
        };
      }

      // Check if distribution has sufficient remaining amount
      if (distribution.remainingAmount < params.requestedAmount) {
        return {
          eligible: false,
          reason: `Insufficient balance. Available: ${distribution.remainingAmount}, Requested: ${params.requestedAmount}`
        };
      }

      // Check if distribution is fully redeemed
      if (distribution.fullyRedeemed) {
        return {
          eligible: false,
          reason: 'Distribution has been fully redeemed'
        };
      }

      // Get applicable redemption rules
      const rules = await this.getApplicableRules(params.tokenType, params.redemptionType);
      if (!rules || rules.length === 0) {
        // For global access, create permissive default rule if none exists
        console.log('No redemption rules found, allowing redemption with default settings');
        return {
          eligible: true,
          reason: 'No specific rules configured, redemption allowed'
        };
      }

      // Check lock-up periods (distribution-based, not investor-based)
      const lockupCheck = await this.checkLockupPeriod(distribution, rules);
      if (!lockupCheck.eligible) {
        return lockupCheck;
      }

      // Check interval fund windows (if applicable)
      if (params.redemptionType === 'interval') {
        const windowCheck = await this.checkRedemptionWindow(rules);
        if (!windowCheck.eligible) {
          return windowCheck;
        }
      }

      // Skip geographic restrictions for global access
      console.log('Geographic restrictions bypassed for global access');

      // Skip compliance status checks for global access
      console.log('Compliance checks bypassed for global access');

      // Skip pending redemption checks for global access
      console.log('Pending redemption checks bypassed for global access');

      // All checks passed
      return {
        eligible: true,
        windowInfo: params.redemptionType === 'interval' ? 
          await this.getRedemptionWindowInfo(rules) : undefined,
        reason: 'Global redemption eligibility confirmed'
      };

    } catch (error) {
      console.error('Error checking global redemption eligibility:', error);
      return {
        eligible: false,
        reason: 'Error validating eligibility. Please try again.'
      };
    }
  }

  /**
   * Check if redemption is within allowed window for interval funds
   */
  async checkRedemptionWindow(rules: RedemptionRule[]): Promise<EligibilityResult> {
    try {
      const intervalRule = rules.find(rule => rule.redemptionType === 'interval');
      if (!intervalRule) {
        return { eligible: true };
      }

      const windowInfo = await this.getRedemptionWindowInfo([intervalRule]);
      
      if (!windowInfo.isOpen) {
        return {
          eligible: false,
          reason: `Redemption window is closed. Next window opens: ${windowInfo.nextWindow?.toLocaleDateString()}`,
          windowInfo
        };
      }

      return { eligible: true, windowInfo };
    } catch (error) {
      console.error('Error checking redemption window:', error);
      return {
        eligible: false,
        reason: 'Error checking redemption window'
      };
    }
  }

  /**
   * Check lock-up period constraints (distribution-based only)
   */
  async checkLockupPeriod(distribution: Distribution, rules: RedemptionRule[]): Promise<EligibilityResult> {
    try {
      const relevantRule = rules.find(rule => 
        rule.lockUpPeriod && rule.lockUpPeriod > 0
      );

      if (!relevantRule || !relevantRule.lockUpPeriod) {
        return { eligible: true };
      }

      const lockupEndDate = new Date(distribution.distributionDate);
      lockupEndDate.setDate(lockupEndDate.getDate() + relevantRule.lockUpPeriod);

      const now = new Date();
      if (now < lockupEndDate) {
        return {
          eligible: false,
          reason: `Tokens are locked until ${lockupEndDate.toLocaleDateString()}`,
          lockupExpiry: lockupEndDate
        };
      }

      return { eligible: true };
    } catch (error) {
      console.error('Error checking lockup period:', error);
      return {
        eligible: false,
        reason: 'Error checking lock-up period'
      };
    }
  }

  /**
   * Get current redemption window information for interval funds
   */
  async getRedemptionWindowInfo(rules: RedemptionRule[]): Promise<RedemptionWindowInfo> {
    try {
      const intervalRule = rules.find(rule => rule.redemptionType === 'interval');
      if (!intervalRule) {
        return { isOpen: true };
      }

      // For global access, assume interval fund windows are always open unless specifically configured
      // This can be enhanced later with actual window logic
      return { 
        isOpen: true,
        currentWindow: new Date(),
        nextWindow: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        reason: 'Global access - window checks relaxed'
      };
    } catch (error) {
      console.error('Error fetching redemption window info:', error);
      return { isOpen: true }; // Default to open for global access
    }
  }

  /**
   * Get distribution by ID
   */
  private async getDistribution(distributionId: string): Promise<Distribution | null> {
    try {
      const { data, error } = await supabase
        .from('distributions')
        .select('*')
        .eq('id', distributionId)
        .single();
      
      if (error || !data) {
        console.error('Error fetching distribution:', error);
        return null;
      }

      // Map database row to Distribution type
      const distribution: Distribution = {
        id: data.id,
        tokenAllocationId: data.token_allocation_id,
        investorId: data.investor_id,
        subscriptionId: data.subscription_id,
        projectId: data.project_id,
        tokenType: data.token_type,
        tokenAmount: typeof data.token_amount === 'number' ? data.token_amount : parseFloat(String(data.token_amount || '0')),
        distributionDate: new Date(data.distribution_date),
        distributionTxHash: data.distribution_tx_hash,
        walletId: data.wallet_id,
        blockchain: data.blockchain,
        tokenAddress: data.token_address,
        tokenSymbol: data.token_symbol,
        toAddress: data.to_address,
        status: data.status,
        notes: data.notes,
        remainingAmount: typeof data.remaining_amount === 'number' ? data.remaining_amount : parseFloat(String(data.remaining_amount || '0')),
        fullyRedeemed: data.fully_redeemed,
        standard: data.standard,
        createdAt: new Date(data.created_at),
        updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
      };

      return distribution;
    } catch (error) {
      console.error('Error fetching distribution:', error);
      return null;
    }
  }

  /**
   * Get applicable redemption rules for token type
   * For global access, use permissive defaults if no rules exist
   */
  private async getApplicableRules(tokenType: string, redemptionType: string): Promise<RedemptionRule[]> {
    try {
      // Try to fetch actual rules first
      const { data: rules, error } = await (supabase as any)
        .from('redemption_rules')
        .select('*')
        .eq('redemption_type', redemptionType);

      if (!error && rules && rules.length > 0) {
        return rules.map(rule => ({
          id: rule.id,
          tokenType: tokenType, // Use the parameter since the field doesn't exist in DB
          redemptionType: rule.redemption_type as 'standard' | 'interval',
          lockUpPeriod: rule.lock_up_period || 0,
          allowRedemption: true, // Default to true for global access since field doesn't exist
          createdAt: new Date(rule.created_at),
          updatedAt: new Date(rule.updated_at)
        }));
      }

      // Return permissive default rule for global access
      const defaultRule: RedemptionRule = {
        id: 'global-default',
        tokenType,
        redemptionType: redemptionType as 'standard' | 'interval',
        lockUpPeriod: 0, // No lock-up by default for global access
        allowRedemption: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return [defaultRule];
    } catch (error) {
      console.error('Error fetching redemption rules:', error);
      // Return permissive default even on error
      return [{
        id: 'global-fallback',
        tokenType,
        redemptionType: redemptionType as 'standard' | 'interval',
        lockUpPeriod: 0,
        allowRedemption: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }];
    }
  }

  /**
   * Validate redemption amount constraints (global version)
   */
  async validateRedemptionAmount(params: {
    tokenType: string;
    redemptionType: 'standard' | 'interval';
    requestedAmount: number;
    availableAmount: number;
  }): Promise<EligibilityResult> {
    try {
      // Basic validation regardless of rules
      if (params.requestedAmount <= 0) {
        return {
          eligible: false,
          reason: 'Redemption amount must be greater than zero'
        };
      }

      if (params.requestedAmount > params.availableAmount) {
        return {
          eligible: false,
          reason: `Requested amount (${params.requestedAmount}) exceeds available balance (${params.availableAmount})`
        };
      }

      // For global access, skip minimum amount restrictions unless explicitly configured
      return { eligible: true, reason: 'Amount validation passed' };
    } catch (error) {
      console.error('Error validating redemption amount:', error);
      return {
        eligible: false,
        reason: 'Error validating redemption amount'
      };
    }
  }

  /**
   * Global version - skip pending redemption checks
   */
  async checkPendingRedemptions(investorId?: string, distributionId?: string): Promise<EligibilityResult> {
    // For global access, always allow multiple pending redemptions
    console.log('Pending redemption checks bypassed for global access');
    return { 
      eligible: true, 
      reason: 'Pending redemption checks bypassed for global access'
    };
  }

  /**
   * Get all available distributions globally (not filtered by investor)
   */
  async getAllAvailableDistributions(): Promise<{
    success: boolean;
    data?: Distribution[];
    error?: string;
  }> {
    try {
      const { data: distributions, error } = await supabase
        .from('distributions')
        .select('*')
        .eq('fully_redeemed', false)
        .gt('remaining_amount', 0)
        .order('distribution_date', { ascending: false });

      if (error) {
        throw error;
      }

      // Map database rows to Distribution type
      const distributionList: Distribution[] = (distributions || []).map(row => ({
        id: row.id,
        tokenAllocationId: row.token_allocation_id,
        investorId: row.investor_id,
        subscriptionId: row.subscription_id,
        projectId: row.project_id,
        tokenType: row.token_type,
        tokenAmount: typeof row.token_amount === 'number' ? row.token_amount : parseFloat(String(row.token_amount || '0')),
        distributionDate: new Date(row.distribution_date),
        distributionTxHash: row.distribution_tx_hash,
        walletId: row.wallet_id,
        blockchain: row.blockchain,
        tokenAddress: row.token_address,
        tokenSymbol: row.token_symbol,
        toAddress: row.to_address,
        status: row.status,
        notes: row.notes,
        remainingAmount: typeof row.remaining_amount === 'number' ? row.remaining_amount : parseFloat(String(row.remaining_amount || '0')),
        fullyRedeemed: row.fully_redeemed,
        standard: row.standard,
        createdAt: new Date(row.created_at),
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
      }));

      return { success: true, data: distributionList };
    } catch (error) {
      console.error('Error fetching all available distributions:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
}

// Export singleton instance
export const globalEligibilityService = new GlobalEligibilityService();
