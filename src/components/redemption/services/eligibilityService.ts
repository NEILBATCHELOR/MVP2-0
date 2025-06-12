// Eligibility service for validating redemption requests
// Handles lock-up periods, interval windows, and compliance checks

import { supabase } from '@/infrastructure/supabaseClient';
import type { 
  EligibilityResult, 
  RedemptionWindowInfo, 
  Distribution,
  RedemptionRule
} from '../types';

export interface EligibilityCheckParams {
  investorId: string;
  distributionId: string;
  requestedAmount: number;
  tokenType: string;
  redemptionType: 'standard' | 'interval';
}

export class EligibilityService {
  /**
   * Resolve investor ID from user ID by finding investor record via email match
   */
  async resolveInvestorId(userIdOrInvestorId: string): Promise<string | null> {
    try {
      // First try to find by investor_id directly
      const { data: directInvestor, error: directError } = await supabase
        .from('investors')
        .select('investor_id')
        .eq('investor_id', userIdOrInvestorId)
        .single();
      
      if (directInvestor && !directError) {
        return directInvestor.investor_id;
      }
      
      // If that fails, try to find investor by user email
      // First get the user's email from the auth.users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userIdOrInvestorId)
        .single();
        
      if (userData && !userError && userData.email) {
        // Now find the investor by email
        const { data: emailInvestor, error: emailError } = await supabase
          .from('investors')
          .select('investor_id')
          .eq('email', userData.email)
          .single();
          
        if (emailInvestor && !emailError) {
          return emailInvestor.investor_id;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error resolving investor ID:', error);
      return null;
    }
  }
  /**
   * Main eligibility check for redemption requests
   */
  async checkRedemptionEligibility(params: EligibilityCheckParams): Promise<EligibilityResult> {
    try {
      // Resolve the actual investor ID if a user ID was passed
      const actualInvestorId = await this.resolveInvestorId(params.investorId);
      if (!actualInvestorId) {
        return {
          eligible: false,
          reason: 'Investor record not found for this user'
        };
      }
      
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
        return {
          eligible: false,
          reason: 'No redemption rules configured for this token type'
        };
      }

      // Check lock-up periods
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

      // Check geographic restrictions
      const geoCheck = await this.checkGeographicRestrictions(actualInvestorId);
      if (!geoCheck.eligible) {
        return geoCheck;
      }

      // Check compliance status
      const complianceCheck = await this.checkComplianceStatus(actualInvestorId);
      if (!complianceCheck.eligible) {
        return complianceCheck;
      }

      // All checks passed
      return {
        eligible: true,
        windowInfo: params.redemptionType === 'interval' ? 
          await this.getRedemptionWindowInfo(rules) : undefined
      };

    } catch (error) {
      console.error('Error checking redemption eligibility:', error);
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
   * Check lock-up period constraints
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
   * Check geographic restrictions for investor
   */
  async checkGeographicRestrictions(investorId: string): Promise<EligibilityResult> {
    try {
      // For now, assume all investors are geographically eligible
      // This can be enhanced later with actual geographic restriction checks
      return { eligible: true };
    } catch (error) {
      console.error('Error checking geographic restrictions:', error);
      return {
        eligible: false,
        reason: 'Error checking geographic restrictions'
      };
    }
  }

  /**
   * Check investor compliance status (KYC/AML)
   */
  async checkComplianceStatus(investorId: string): Promise<EligibilityResult> {
    try {
      // Handle the case where investorId might be a user ID instead of investor_id
      let investor;
      let error;
      
      // First try to find by investor_id directly
      const { data: directInvestor, error: directError } = await supabase
        .from('investors')
        .select('kyc_status, investor_status, accreditation_status')
        .eq('investor_id', investorId)
        .single();
      
      if (directInvestor && !directError) {
        investor = directInvestor;
      } else {
        // If that fails, try to find investor by user email
        // First get the user's email from the auth.users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('id', investorId)
          .single();
          
        if (userData && !userError && userData.email) {
          // Now find the investor by email
          const { data: emailInvestor, error: emailError } = await supabase
            .from('investors')
            .select('kyc_status, investor_status, accreditation_status')
            .eq('email', userData.email)
            .single();
            
          if (emailInvestor && !emailError) {
            investor = emailInvestor;
          } else {
            error = emailError;
          }
        } else {
          error = userError || new Error('User not found');
        }
      }

      if (error || !investor) {
        console.error('Error finding investor:', error);
        return {
          eligible: false,
          reason: 'Unable to verify investor compliance status'
        };
      }

      // Check KYC status
      if (investor.kyc_status !== 'approved') {
        return {
          eligible: false,
          reason: `KYC status is ${investor.kyc_status}. Approved KYC required for redemptions.`
        };
      }

      // Check investor status
      if (investor.investor_status === 'suspended' || investor.investor_status === 'blocked') {
        return {
          eligible: false,
          reason: `Investor account is ${investor.investor_status}. Contact support for assistance.`
        };
      }

      return { eligible: true };
    } catch (error) {
      console.error('Error checking compliance status:', error);
      return {
        eligible: false,
        reason: 'Error checking compliance status'
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

      // For now, assume interval fund windows are always open
      // This can be enhanced later with actual window logic
      return { 
        isOpen: true,
        openDate: new Date(),
        nextWindow: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      };
    } catch (error) {
      console.error('Error fetching redemption window info:', error);
      return { isOpen: false };
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
   */
  private async getApplicableRules(tokenType: string, redemptionType: string): Promise<RedemptionRule[]> {
    try {
      // For now, return a default rule that allows redemptions
      // This can be enhanced later when redemption rules are fully implemented
      const defaultRule: RedemptionRule = {
        id: 'default',
        tokenType,
        redemptionType: redemptionType as 'standard' | 'interval',
        lockUpPeriod: 0, // No lock-up by default
        allowRedemption: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return [defaultRule];
    } catch (error) {
      console.error('Error fetching redemption rules:', error);
      return [];
    }
  }

  /**
   * Validate redemption amount constraints
   */
  async validateRedemptionAmount(params: {
    tokenType: string;
    redemptionType: 'standard' | 'interval';
    requestedAmount: number;
    availableAmount: number;
  }): Promise<EligibilityResult> {
    try {
      // Check minimum redemption amount
      const rules = await this.getApplicableRules(params.tokenType, params.redemptionType);
      const relevantRule = rules.find(rule => rule.redemptionType === params.redemptionType);

      // Add minimum amount validation logic here if rules support it
      // For now, just check basic constraints

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

      return { eligible: true };
    } catch (error) {
      console.error('Error validating redemption amount:', error);
      return {
        eligible: false,
        reason: 'Error validating redemption amount'
      };
    }
  }

  /**
   * Check if investor has any pending redemption requests that might conflict
   */
  async checkPendingRedemptions(investorId: string, distributionId: string): Promise<EligibilityResult> {
    try {
      // Resolve actual investor ID
      const actualInvestorId = await this.resolveInvestorId(investorId);
      if (!actualInvestorId) {
        return {
          eligible: false,
          reason: 'Investor record not found'
        };
      }
      
      const { data: pendingRequests, error } = await supabase
        .from('redemption_requests')
        .select('id, status, token_amount')
        .eq('investor_id', actualInvestorId)
        .in('status', ['pending', 'processing', 'approved']);
      
      if (error) {
        throw error;
      }

      if (pendingRequests && pendingRequests.length > 0) {
        return {
          eligible: false,
          reason: 'There are pending redemption requests for this investor. Please wait for them to complete or cancel them first.'
        };
      }

      return { eligible: true };
    } catch (error) {
      console.error('Error checking pending redemptions:', error);
      return {
        eligible: false,
        reason: 'Error checking pending redemptions'
      };
    }
  }
}

// Export singleton instance
export const eligibilityService = new EligibilityService();
