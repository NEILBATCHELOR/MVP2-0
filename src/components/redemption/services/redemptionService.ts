// Core redemption service for managing redemption requests
// Handles CRUD operations and basic redemption lifecycle
// Uses Supabase for direct database access

import { supabase } from '@/infrastructure/supabaseClient';
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

export class RedemptionService {
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
      investorName: row.investor_name,
      investorId: row.investor_id,
      requiredApprovals: row.required_approvals || 2,
      isBulkRedemption: row.is_bulk_redemption || false,
      investorCount: row.investor_count || 1,
      rejectionReason: row.rejection_reason,
      rejectedBy: row.rejected_by,
      rejectionTimestamp: row.rejection_timestamp ? new Date(row.rejection_timestamp) : undefined,
      notes: '', // Not in current schema
      submittedAt: new Date(row.created_at),
      approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
      settledAt: row.status === 'settled' && row.updated_at ? new Date(row.updated_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  /**
   * Create a new redemption request
   */
  async createRedemptionRequest(input: CreateRedemptionRequestInput): Promise<RedemptionRequestResponse> {
    try {
      // Auto-populate investor details if distributionId is provided
      let investorName = input.investorName;
      let investorId = input.investorId;
      
      // ALWAYS fetch investor_id from distribution if distributionId is provided
      // This is critical to ensure we use the correct investor_id instead of placeholder values
      if (input.distributionId) {
        console.log('🔍 Fetching investor details from distribution:', input.distributionId);
        
        // Fetch distribution to get the actual investor_id
        const { data: distribution, error: distError } = await supabase
          .from('distributions')
          .select('investor_id')
          .eq('id', input.distributionId)
          .single();
          
        console.log('📊 Distribution query result:', { distribution, error: distError });
          
        if (distribution && !distError) {
          // CRITICAL FIX: Always use the investor_id from the distribution
          investorId = distribution.investor_id;
          console.log('✅ Updated investor_id from distribution:', investorId);
          
          // Fetch investor name using the investor_id from distribution
          const { data: investor, error: invError } = await supabase
            .from('investors')
            .select('name')
            .eq('investor_id', distribution.investor_id)
            .single();
            
          console.log('👤 Investor query result:', { investor, error: invError });
            
          if (investor && !invError) {
            investorName = investor.name;
            console.log('✅ Updated investor_name from investor:', investorName);
          }
        } else {
          console.error('❌ Failed to fetch distribution:', distError);
          // Don't proceed if we can't fetch the distribution when distributionId is provided
          return {
            success: false,
            error: `Failed to fetch distribution details: ${distError?.message || 'Unknown error'}`
          };
        }
      }
      
      // Final validation: Ensure we don't create requests with placeholder values
      if (investorId === 'current-user' || investorId === 'current-investor') {
        console.error('❌ Still using placeholder investor_id:', investorId);
        return {
          success: false,
          error: 'Could not determine actual investor ID. Please ensure distribution is properly linked.'
        };
      }
      
      console.log('📝 Final investor details:', { investorId, investorName });

      // Map camelCase input to snake_case database columns
      const dbInput = {
        token_amount: input.tokenAmount,
        token_type: input.tokenType,
        redemption_type: input.redemptionType,
        status: 'pending',
        source_wallet_address: input.sourceWallet || input.sourceWalletAddress,
        destination_wallet_address: input.destinationWallet || input.destinationWalletAddress,
        conversion_rate: input.conversionRate,
        investor_name: investorName, // Now properly populated
        investor_id: investorId, // Now properly populated
        required_approvals: 2, // Default to 2-of-3 approval
        is_bulk_redemption: false,
        investor_count: 1
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(dbInput)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update distribution redemption_status to "processing" if distributionId is provided
      if (input.distributionId) {
        const { error: updateError } = await supabase
          .from('distributions')
          .update({
            redemption_status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', input.distributionId);

        if (updateError) {
          console.warn('Failed to update distribution redemption_status:', updateError);
          // Don't fail the entire request, just log the warning
        }
      }

      // Convert snake_case response to camelCase
      const redemptionRequest = this.mapDbToRedemptionRequest(data);
      return { success: true, data: redemptionRequest };
    } catch (error) {
      console.error('Error creating redemption request:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get redemption request by ID
   */
  async getRedemptionRequest(id: string): Promise<RedemptionRequestResponse> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Redemption request not found'
          };
        }
        throw error;
      }

      const redemptionRequest = this.mapDbToRedemptionRequest(data);
      return { success: true, data: redemptionRequest };
    } catch (error) {
      console.error('Error fetching redemption request:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * List redemption requests with pagination and filtering
   */
  async listRedemptionRequests(params?: {
    page?: number;
    limit?: number;
    status?: string;
    investorId?: string;
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

      // Apply filters
      if (params?.status) {
        query = query.eq('status', params.status);
      }
      if (params?.investorId) {
        query = query.eq('investor_id', params.investorId);
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
      console.error('Error listing redemption requests:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Update redemption request status
   */
  async updateRedemptionStatus(id: string, status: string, reason?: string): Promise<RedemptionRequestResponse> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Add rejection data if status is rejected
      if (status === 'rejected' && reason) {
        updateData.rejection_reason = reason;
        updateData.rejection_timestamp = new Date().toISOString();
      }

      // Add approved timestamp
      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
      }
      // Note: settled timestamp is tracked via updated_at when status changes to 'settled'

      const { data, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const redemptionRequest = this.mapDbToRedemptionRequest(data);
      return { success: true, data: redemptionRequest };
    } catch (error) {
      console.error('Error updating redemption status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Cancel redemption request
   */
  async cancelRedemptionRequest(id: string, reason?: string): Promise<RedemptionRequestResponse> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          status: 'cancelled',
          rejection_reason: reason || 'Cancelled by user',
          rejection_timestamp: new Date().toISOString(),
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
      console.error('Error cancelling redemption request:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get available distributions for redemption by investor
   */
  async getAvailableDistributions(investorId: string): Promise<{
    success: boolean;
    data?: Distribution[];
    error?: string;
  }> {
    try {
      const { data: distributions, error } = await supabase
        .from('distributions')
        .select('*')
        .eq('investor_id', investorId)
        .eq('fully_redeemed', false)
        .gt('remaining_amount', 0);

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
      console.error('Error fetching available distributions:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get ALL distributions globally (not filtered by investor)
   */
  async getAllDistributions(): Promise<{
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
      console.error('Error fetching all distributions:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get enriched distributions with related investor, subscription, and token allocation data
   * Optionally filter by investor ID
   */
  async getEnrichedDistributions(investorId?: string): Promise<EnrichedDistributionResponse> {
    try {
      let query = supabase
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

      // Apply investor filter if provided and it's not a placeholder value
      if (investorId && investorId !== 'current-user' && investorId !== 'current-investor') {
        query = query.eq('investor_id', investorId);
      }

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
          fiat_amount: typeof row.subscriptions.fiat_amount === 'number' ? row.subscriptions.fiat_amount : parseFloat(String(row.subscriptions.fiat_amount || '0')),
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
      console.error('Error fetching enriched distributions:', error);
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
      // Note: Update distribution remaining amount directly
      const { data: currentDist, error: fetchError } = await supabase
        .from('distributions')
        .select('remaining_amount')
        .eq('id', distributionId)
        .single();
      
      const updateError = fetchError;
      
      if (updateError) {
        console.warn('Could not fetch distribution for update:', updateError);
      } else if (currentDist) {
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
   * Get redemption metrics and statistics
   */
  async getRedemptionMetrics(params?: {
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

      const { data: redemptions, error } = await query;

      if (error) {
        throw error;
      }

      if (!redemptions) {
        return {
          success: true,
          data: {
            totalRedemptions: 0,
            totalVolume: 0,
            pendingRedemptions: 0,
            completedRedemptions: 0,
            rejectedRedemptions: 0,
            avgProcessingTime: 0,
            successRate: 0
          }
        };
      }

      const totalRedemptions = redemptions.length;
      const totalVolume = redemptions.reduce((sum, r) => sum + parseFloat(String(r.token_amount || '0')), 0);
      const pendingRedemptions = redemptions.filter(r => r.status === 'pending').length;
      const completedRedemptions = redemptions.filter(r => r.status === 'settled').length;
      const rejectedRedemptions = redemptions.filter(r => r.status === 'rejected').length;
      
      // Calculate average processing time for completed redemptions
      const completedWithTimes = redemptions.filter(r => r.status === 'settled' && r.updated_at);
      const avgProcessingTime = completedWithTimes.length > 0 ?
        completedWithTimes.reduce((sum, r) => {
          const created = new Date(r.created_at).getTime();
          const settled = new Date(r.updated_at).getTime();
          return sum + (settled - created);
        }, 0) / completedWithTimes.length / (1000 * 60 * 60) : 0; // Convert to hours

      const successRate = totalRedemptions > 0 ? (completedRedemptions / totalRedemptions) * 100 : 0;

      return {
        success: true,
        data: {
          totalRedemptions,
          totalVolume,
          pendingRedemptions,
          completedRedemptions,
          rejectedRedemptions,
          avgProcessingTime: Math.round(avgProcessingTime * 100) / 100, // Round to 2 decimal places
          successRate: Math.round(successRate * 100) / 100
        }
      };
    } catch (error) {
      console.error('Error fetching redemption metrics:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Submit bulk redemption request
   */
  async createBulkRedemptionRequest(requests: CreateRedemptionRequestInput[]): Promise<{
    success: boolean;
    data?: {
      batchId: string;
      requests: RedemptionRequest[];
      successCount: number;
      failureCount: number;
      failures: Array<{ index: number; error: string; }>;
    };
    error?: string;
  }> {
    try {
      const batchId = `batch-${Date.now()}`;
      const successfulRequests: RedemptionRequest[] = [];
      const failures: Array<{ index: number; error: string; }> = [];
      let successCount = 0;
      let failureCount = 0;

      // Process each request individually
      for (let i = 0; i < requests.length; i++) {
        try {
          const result = await this.createRedemptionRequest({
            ...requests[i],
            // Mark as bulk redemption
            tokenType: requests[i].tokenType || 'bulk'
          });

          if (result.success && result.data) {
            successfulRequests.push(result.data);
            successCount++;
          } else {
            failures.push({
              index: i,
              error: result.error || 'Unknown error'
            });
            failureCount++;
          }
        } catch (error) {
          failures.push({
            index: i,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          });
          failureCount++;
        }
      }

      return {
        success: true,
        data: {
          batchId,
          requests: successfulRequests,
          successCount,
          failureCount,
          failures
        }
      };
    } catch (error) {
      console.error('Error creating bulk redemption request:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Alias methods for component compatibility
  async getRedemptions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    investorId?: string;
    tokenType?: string;
    redemptionType?: 'standard' | 'interval';
  }): Promise<RedemptionListResponse> {
    return this.listRedemptionRequests(params);
  }

  async getEnrichedDistributionsForInvestor(investorId: string): Promise<EnrichedDistributionResponse> {
    // If investorId is a placeholder, get all distributions
    if (investorId === 'current-user' || investorId === 'current-investor') {
      return this.getEnrichedDistributions();
    }
    return this.getEnrichedDistributions(investorId);
  }

  async getAllEnrichedDistributions(): Promise<EnrichedDistributionResponse> {
    return this.getEnrichedDistributions();
  }

  async createBulkRedemption(requests: CreateRedemptionRequestInput[]): Promise<{
    success: boolean;
    data?: {
      batchId: string;
      requests: RedemptionRequest[];
      successCount: number;
      failureCount: number;
      failures: Array<{ index: number; error: string; }>;
    };
    error?: string;
  }> {
    return this.createBulkRedemptionRequest(requests);
  }

  async updateRedemptionRequest(id: string, updates: Partial<RedemptionRequest>): Promise<RedemptionRequestResponse> {
    return this.updateRedemptionStatus(id, updates.status || '', updates.rejectionReason);
  }
}

// Export singleton instance
export const redemptionService = new RedemptionService();
