// Global redemption service for open access to redemption functionality
// Bypasses investor-specific checks while maintaining core redemption logic

import { supabase } from '@/infrastructure/supabaseClient';
import { globalEligibilityService } from './globalEligibilityService';
import type { 
  RedemptionRequest, 
  CreateRedemptionRequestInput,
  RedemptionRequestResponse,
  RedemptionListResponse,
  Distribution,
  EnrichedDistribution,
  EnrichedDistributionResponse,
  DistributionRedemption
} from '../types';

export interface GlobalCreateRedemptionRequestInput {
  tokenAmount: number;
  tokenType: string;
  redemptionType: 'standard' | 'interval';
  sourceWallet: string;
  destinationWallet: string;
  conversionRate: number;
  // Optional investor details (can be provided by user or auto-generated)
  investorName?: string;
  investorId?: string;
  distributionId?: string;
  // Notes for tracking purposes
  notes?: string;
}

export class GlobalRedemptionService {
  private readonly tableName = 'redemption_requests';

  /**
   * Map database row (snake_case) to RedemptionRequest (camelCase)
   */
  private mapDbToRedemptionRequest(row: any): RedemptionRequest {
    return {
      id: row.id,
      tokenAmount: typeof row.token_amount === 'number' ? row.token_amount : parseFloat(String(row.token_amount || '0')),
      tokenType: row.token_type,
      redemptionType: row.redemption_type,
      status: row.status,
      sourceWallet: row.source_wallet_address,
      destinationWallet: row.destination_wallet_address,
      sourceWalletAddress: row.source_wallet_address, // Backward compatibility
      destinationWalletAddress: row.destination_wallet_address, // Backward compatibility
      conversionRate: typeof row.conversion_rate === 'number' ? row.conversion_rate : parseFloat(String(row.conversion_rate || '1')),
      usdcAmount: (typeof row.token_amount === 'number' ? row.token_amount : parseFloat(String(row.token_amount || '0'))) * (typeof row.conversion_rate === 'number' ? row.conversion_rate : parseFloat(String(row.conversion_rate || '1'))), // Calculated field
      investorName: row.investor_name || 'Anonymous User',
      investorId: row.investor_id || 'global-user',
      requiredApprovals: row.required_approvals || 1, // Reduced for global access
      isBulkRedemption: row.is_bulk_redemption || false,
      investorCount: row.investor_count || 1,
      rejectionReason: row.rejection_reason,
      rejectedBy: row.rejected_by,
      rejectionTimestamp: row.rejection_timestamp ? new Date(row.rejection_timestamp) : undefined,
      notes: row.notes || '',
      submittedAt: new Date(row.created_at),
      approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
      settledAt: row.status === 'settled' && row.updated_at ? new Date(row.updated_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  /**
   * Create a global redemption request with relaxed validation
   */
  async createGlobalRedemptionRequest(input: GlobalCreateRedemptionRequestInput): Promise<RedemptionRequestResponse> {
    try {
      // Initialize values - will be updated based on distribution lookup
      let investorId = input.investorId;
      let investorName = input.investorName;

      // If no distribution ID is provided, try to find a suitable distribution
      let distributionId = input.distributionId;
      if (!distributionId) {
        const distributionsResult = await this.findSuitableDistribution(input.tokenType, input.tokenAmount);
        if (!distributionsResult.success || !distributionsResult.data || distributionsResult.data.length === 0) {
          return {
            success: false,
            error: 'No suitable distribution found for this token type and amount'
          };
        }
        distributionId = distributionsResult.data[0].id;
      }

      // ALWAYS fetch investor details from distribution if distributionId is available
      if (distributionId) {
        console.log('🔍 [GlobalService] Fetching investor details from distribution:', distributionId);
        
        // Fetch distribution to get the actual investor_id
        const { data: distribution, error: distError } = await supabase
          .from('distributions')
          .select('investor_id')
          .eq('id', distributionId)
          .single();
          
        console.log('📊 [GlobalService] Distribution query result:', { distribution, error: distError });
          
        if (distribution && !distError) {
          // Use the investor_id from the distribution
          investorId = distribution.investor_id;
          console.log('✅ [GlobalService] Updated investor_id from distribution:', investorId);
          
          // Fetch investor name using the investor_id from distribution
          const { data: investor, error: invError } = await supabase
            .from('investors')
            .select('name')
            .eq('investor_id', distribution.investor_id)
            .single();
            
          console.log('👤 [GlobalService] Investor query result:', { investor, error: invError });
            
          if (investor && !invError) {
            investorName = investor.name;
            console.log('✅ [GlobalService] Updated investor_name from investor:', investorName);
          }
        } else {
          console.warn('⚠️ [GlobalService] Could not fetch distribution details:', distError);
        }
      }

      // Fallback to default values if still not available
      if (!investorId) {
        investorId = `global-${Date.now()}`;
        console.log('🔄 [GlobalService] Using fallback investor_id:', investorId);
      }
      if (!investorName) {
        investorName = 'Global User';
        console.log('🔄 [GlobalService] Using fallback investor_name:', investorName);
      }

      console.log('📝 [GlobalService] Final investor details:', { investorId, investorName });

      // Check global eligibility
      const eligibilityResult = await globalEligibilityService.checkRedemptionEligibility({
        distributionId,
        requestedAmount: input.tokenAmount,
        tokenType: input.tokenType,
        redemptionType: input.redemptionType,
        investorId,
        investorName
      });

      if (!eligibilityResult.eligible) {
        return {
          success: false,
          error: eligibilityResult.reason
        };
      }

      // Map input to database format
      const dbInput = {
        token_amount: input.tokenAmount,
        token_type: input.tokenType,
        redemption_type: input.redemptionType,
        status: 'pending',
        source_wallet_address: input.sourceWallet,
        destination_wallet_address: input.destinationWallet,
        conversion_rate: input.conversionRate,
        investor_name: investorName,
        investor_id: investorId,
        required_approvals: 1, // Reduced approval requirement for global access
        is_bulk_redemption: false,
        investor_count: 1,
        notes: input.notes || 'Global access redemption'
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(dbInput)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Create distribution redemption link
      if (distributionId) {
        await this.createDistributionRedemption(distributionId, data.id, input.tokenAmount);
      }

      // Convert snake_case response to camelCase
      const redemptionRequest = this.mapDbToRedemptionRequest(data);
      return { success: true, data: redemptionRequest };
    } catch (error) {
      console.error('Error creating global redemption request:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Find suitable distribution for redemption
   */
  private async findSuitableDistribution(tokenType: string, requestedAmount: number): Promise<{
    success: boolean;
    data?: Distribution[];
    error?: string;
  }> {
    try {
      const { data: distributions, error } = await supabase
        .from('distributions')
        .select('*')
        .eq('token_type', tokenType)
        .eq('fully_redeemed', false)
        .gte('remaining_amount', requestedAmount)
        .order('distribution_date', { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }

      if (!distributions || distributions.length === 0) {
        return {
          success: false,
          error: `No distributions found with sufficient balance for ${requestedAmount} ${tokenType} tokens`
        };
      }

      // Map database rows to Distribution type
      const distributionList: Distribution[] = distributions.map(row => ({
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
      console.error('Error finding suitable distribution:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get all redemption requests globally (no investor filtering)
   */
  async getAllRedemptionRequests(params?: {
    page?: number;
    limit?: number;
    status?: string;
    tokenType?: string;
    redemptionType?: 'standard' | 'interval';
  }): Promise<RedemptionListResponse> {
    try {
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const offset = (page - 1) * limit;

      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters (no investor filter)
      if (params?.status) {
        query = query.eq('status', params.status);
      }
      if (params?.tokenType) {
        query = query.eq('token_type', params.tokenType);
      }
      if (params?.redemptionType) {
        query = query.eq('redemption_type', params.redemptionType);
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      // Map database results to RedemptionRequest objects
      const redemptionRequests = (data || []).map(row => this.mapDbToRedemptionRequest(row));
      
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / limit);

      return { 
        success: true, 
        data: redemptionRequests,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages
        },
        totalCount,
        hasMore: page < totalPages
      };
    } catch (error) {
      console.error('Error listing global redemption requests:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get all available distributions globally
   */
  async getAllAvailableDistributions(): Promise<{
    success: boolean;
    data?: Distribution[];
    error?: string;
  }> {
    return globalEligibilityService.getAllAvailableDistributions();
  }

  /**
   * Get enriched distributions globally (not filtered by investor)
   */
  async getAllEnrichedDistributions(): Promise<EnrichedDistributionResponse> {
    try {
      const query = supabase
        .from('distributions')
        .select(`
          *,
          investors!distributions_investor_fkey (
            investor_id,
            name,
            email,
            type,
            company,
            wallet_address,
            kyc_status,
            investor_status,
            investor_type,
            onboarding_completed,
            accreditation_status
          ),
          subscriptions!distributions_subscription_fkey (
            id,
            subscription_id,
            fiat_amount,
            currency,
            confirmed,
            allocated,
            distributed,
            notes,
            subscription_date
          )
        `)
        .eq('fully_redeemed', false)
        .gt('remaining_amount', 0)
        .order('distribution_date', { ascending: false });

      const { data: distributions, error } = await query;

      if (error) {
        throw error;
      }

      // Map database rows to EnrichedDistribution type
      const enrichedDistributions: EnrichedDistribution[] = (distributions || []).map(row => ({
        // Base distribution properties
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
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
        // Related data
        investor: row.investors ? {
          investor_id: row.investors.investor_id,
          name: row.investors.name,
          email: row.investors.email,
          type: row.investors.type,
          company: row.investors.company,
          wallet_address: row.investors.wallet_address,
          kyc_status: row.investors.kyc_status,
          investor_status: row.investors.investor_status,
          investor_type: row.investors.investor_type,
          onboarding_completed: row.investors.onboarding_completed,
          accreditation_status: row.investors.accreditation_status
        } : undefined,
        subscription: row.subscriptions ? {
          id: row.subscriptions.id,
          subscription_id: row.subscriptions.subscription_id,
          fiat_amount: row.subscriptions.fiat_amount,
          currency: row.subscriptions.currency,
          confirmed: row.subscriptions.confirmed,
          allocated: row.subscriptions.allocated,
          distributed: row.subscriptions.distributed,
          notes: row.subscriptions.notes,
          subscription_date: row.subscriptions.subscription_date
        } : undefined,
        // Token allocation will be fetched separately if needed
        tokenAllocation: undefined
      }));

      return { success: true, data: enrichedDistributions };
    } catch (error) {
      console.error('Error fetching global enriched distributions:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Create distribution redemption link
   */
  async createDistributionRedemption(distributionId: string, redemptionRequestId: string, amountRedeemed: number): Promise<{
    success: boolean;
    data?: DistributionRedemption;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('distribution_redemptions')
        .insert({
          distribution_id: distributionId,
          redemption_request_id: redemptionRequestId,
          amount_redeemed: amountRedeemed,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update the distribution's remaining amount
      const { data: currentDist, error: fetchError } = await supabase
        .from('distributions')
        .select('remaining_amount')
        .eq('id', distributionId)
        .single();
      
      if (!fetchError && currentDist) {
        const newRemainingAmount = parseFloat(String(currentDist.remaining_amount || '0')) - amountRedeemed;
        await supabase
          .from('distributions')
          .update({
            remaining_amount: newRemainingAmount,
            fully_redeemed: newRemainingAmount <= 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', distributionId);
      }

      const distributionRedemption: DistributionRedemption = {
        id: data.id,
        distributionId: data.distribution_id,
        redemptionRequestId: data.redemption_request_id,
        amountRedeemed: typeof data.amount_redeemed === 'number' ? data.amount_redeemed : parseFloat(String(data.amount_redeemed)),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      return { success: true, data: distributionRedemption };
    } catch (error) {
      console.error('Error creating distribution redemption:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Auto-approve redemption for global access
   */
  async autoApproveRedemption(id: string): Promise<RedemptionRequestResponse> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const redemptionRequest = this.mapDbToRedemptionRequest(data);
      return { success: true, data: redemptionRequest };
    } catch (error) {
      console.error('Error auto-approving redemption:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get global redemption metrics
   */
  async getGlobalRedemptionMetrics(params?: {
    startDate?: string;
    endDate?: string;
    tokenType?: string;
    redemptionType?: 'standard' | 'interval';
  }): Promise<{
    success: boolean;
    data?: {
      totalRedemptions: number;
      totalVolume: number;
      pendingRedemptions: number;
      completedRedemptions: number;
      rejectedRedemptions: number;
      avgProcessingTime: number;
      successRate: number;
      uniqueTokenTypes: number;
      globalDistributions: number;
    };
    error?: string;
  }> {
    try {
      let query = supabase.from(this.tableName).select('*');

      // Apply date filters
      if (params?.startDate) {
        query = query.gte('created_at', params.startDate);
      }
      if (params?.endDate) {
        query = query.lte('created_at', params.endDate);
      }
      if (params?.tokenType) {
        query = query.eq('token_type', params.tokenType);
      }
      if (params?.redemptionType) {
        query = query.eq('redemption_type', params.redemptionType);
      }

      const [redemptionsResult, distributionsResult] = await Promise.all([
        query,
        supabase.from('distributions').select('*').eq('fully_redeemed', false)
      ]);

      const { data: redemptions, error: redemptionsError } = redemptionsResult;
      const { data: distributions, error: distributionsError } = distributionsResult;

      if (redemptionsError) {
        throw redemptionsError;
      }

      const totalRedemptions = redemptions?.length || 0;
      const totalVolume = redemptions?.reduce((sum, r) => sum + parseFloat(String(r.token_amount || '0')), 0) || 0;
      const pendingRedemptions = redemptions?.filter(r => r.status === 'pending').length || 0;
      const completedRedemptions = redemptions?.filter(r => r.status === 'settled').length || 0;
      const rejectedRedemptions = redemptions?.filter(r => r.status === 'rejected').length || 0;
      
      // Calculate average processing time for completed redemptions
      const completedWithTimes = redemptions?.filter(r => r.status === 'settled' && r.updated_at) || [];
      const avgProcessingTime = completedWithTimes.length > 0 ?
        completedWithTimes.reduce((sum, r) => {
          const created = new Date(r.created_at).getTime();
          const settled = new Date(r.updated_at).getTime();
          return sum + (settled - created);
        }, 0) / completedWithTimes.length / (1000 * 60 * 60) : 0; // Convert to hours

      const successRate = totalRedemptions > 0 ? (completedRedemptions / totalRedemptions) * 100 : 0;
      
      // Calculate unique token types
      const uniqueTokenTypes = new Set(redemptions?.map(r => r.token_type) || []).size;
      
      // Global distributions count
      const globalDistributions = distributions?.length || 0;

      return {
        success: true,
        data: {
          totalRedemptions,
          totalVolume,
          pendingRedemptions,
          completedRedemptions,
          rejectedRedemptions,
          avgProcessingTime: Math.round(avgProcessingTime * 100) / 100, // Round to 2 decimal places
          successRate: Math.round(successRate * 100) / 100,
          uniqueTokenTypes,
          globalDistributions
        }
      };
    } catch (error) {
      console.error('Error fetching global redemption metrics:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Convenience aliases for component compatibility
  async getRedemptions(params?: any): Promise<RedemptionListResponse> {
    return this.getAllRedemptionRequests(params);
  }

  async getAllEnrichedDistributions_alias(): Promise<EnrichedDistributionResponse> {
    return this.getAllEnrichedDistributions();
  }

  async createRedemptionRequest(input: CreateRedemptionRequestInput): Promise<RedemptionRequestResponse> {
    // Convert CreateRedemptionRequestInput to GlobalCreateRedemptionRequestInput
    const globalInput: GlobalCreateRedemptionRequestInput = {
      tokenAmount: input.tokenAmount,
      tokenType: input.tokenType,
      redemptionType: input.redemptionType,
      sourceWallet: input.sourceWallet || input.sourceWalletAddress,
      destinationWallet: input.destinationWallet || input.destinationWalletAddress,
      conversionRate: input.conversionRate,
      investorName: input.investorName,
      investorId: input.investorId,
      notes: input.notes
    };

    return this.createGlobalRedemptionRequest(globalInput);
  }
}

// Export singleton instance
export const globalRedemptionService = new GlobalRedemptionService();
