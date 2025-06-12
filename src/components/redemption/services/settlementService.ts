// Settlement service for managing token burning and fund transfers
// Handles the final settlement process of approved redemptions
// Uses Supabase for direct database access

import { supabase } from '@/infrastructure/supabaseClient';
import { withAuth } from './authUtils';
import type { 
  SettlementRequest,
  SettlementResponse,
  SettlementStatusResponse,
  SettlementListResponse,
  InitiateSettlementInput,
  TokenBurnOperation,
  FundTransferOperation,
  SettlementConfirmation,
  SettlementMetrics,
  SettlementUpdate,
  SettlementStatus,
  BurnStatus,
  TransferStatus,
  TransferMethod
} from '../types';
import { 
  isSettlementStatus,
  isBurnStatus,
  isTransferStatus
} from '../types';

export class SettlementService {
  private readonly tableName = 'redemption_settlements';
  private readonly metricsTableName = 'settlement_metrics';

  /**
   * Map database row (snake_case) to Settlement object (camelCase)
   */
  private mapDbToSettlement(row: any): any {
    return {
      id: row.id,
      redemptionRequestId: row.redemption_request_id,
      settlementType: row.settlement_type,
      status: row.status,
      tokenContractAddress: row.token_contract_address,
      tokenAmount: typeof row.token_amount === 'number' ? row.token_amount : parseFloat(String(row.token_amount || '0')),
      burnTransactionHash: row.burn_transaction_hash,
      burnGasUsed: row.burn_gas_used,
      burnGasPrice: typeof row.burn_gas_price === 'number' ? row.burn_gas_price : parseFloat(String(row.burn_gas_price || '0')),
      burnStatus: row.burn_status,
      burnConfirmedAt: row.burn_confirmed_at ? new Date(row.burn_confirmed_at) : undefined,
      transferAmount: typeof row.transfer_amount === 'number' ? row.transfer_amount : parseFloat(String(row.transfer_amount || '0')),
      transferCurrency: row.transfer_currency,
      transferToAddress: row.transfer_to_address,
      transferTransactionHash: row.transfer_transaction_hash,
      transferGasUsed: row.transfer_gas_used,
      transferGasPrice: typeof row.transfer_gas_price === 'number' ? row.transfer_gas_price : parseFloat(String(row.transfer_gas_price || '0')),
      transferStatus: row.transfer_status,
      transferConfirmedAt: row.transfer_confirmed_at ? new Date(row.transfer_confirmed_at) : undefined,
      navUsed: typeof row.nav_used === 'number' ? row.nav_used : parseFloat(String(row.nav_used || '0')),
      exchangeRate: typeof row.exchange_rate === 'number' ? row.exchange_rate : parseFloat(String(row.exchange_rate || '1')),
      settlementFee: typeof row.settlement_fee === 'number' ? row.settlement_fee : parseFloat(String(row.settlement_fee || '0')),
      gasEstimate: typeof row.gas_estimate === 'number' ? row.gas_estimate : parseFloat(String(row.gas_estimate || '0')),
      estimatedCompletion: row.estimated_completion ? new Date(row.estimated_completion) : undefined,
      actualCompletion: row.actual_completion ? new Date(row.actual_completion) : undefined,
      errorMessage: row.error_message,
      retryCount: row.retry_count || 0,
      lastRetryAt: row.last_retry_at ? new Date(row.last_retry_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
      createdBy: row.created_by
    };
  }

  /**
   * Initiate settlement process for approved redemption
   */
  async initiateSettlement(input: InitiateSettlementInput): Promise<SettlementResponse> {
    try {
      // Get redemption request details
      const { data: redemptionRequest, error: reqError } = await supabase
        .from('redemption_requests')
        .select('*')
        .eq('id', input.redemptionRequestId)
        .single();

      if (reqError || !redemptionRequest) {
        return {
          success: false,
          error: `Redemption request not found: ${reqError?.message || 'Unknown error'}`
        };
      }

      if (redemptionRequest.status !== 'approved') {
        return {
          success: false,
          error: 'Redemption request must be approved before settlement can be initiated'
        };
      }

      // Create settlement record
      const settlementData = {
        redemption_request_id: input.redemptionRequestId,
        settlement_type: 'standard',
        status: 'pending',
        token_contract_address: input.tokenAddress,
        token_amount: input.tokenAmount,
        burn_status: 'pending',
        transfer_amount: redemptionRequest.token_amount * (redemptionRequest.conversion_rate || 1),
        transfer_currency: 'USD',
        transfer_to_address: redemptionRequest.destination_wallet_address,
        transfer_status: 'pending',
        exchange_rate: redemptionRequest.conversion_rate || 1,
        settlement_fee: 0, // TODO: Calculate actual settlement fee
        gas_estimate: input.gasPrice || 0.002,
        estimated_completion: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: input.investorId // Using investorId as creator for now
      };

      const { data: settlement, error } = await withAuth(async () =>
        await supabase
          .from(this.tableName)
          .insert(settlementData)
          .select()
          .single()
      );

      if (error) {
        throw error;
      }

      // Update redemption request status to 'processing'
      await supabase
        .from('redemption_requests')
        .update({
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', input.redemptionRequestId);

      const mappedSettlement = this.mapDbToSettlement(settlement);
      
      return { 
        success: true, 
        data: {
          id: settlement.id,
          redemptionRequestId: settlement.redemption_request_id,
          status: (isSettlementStatus(settlement.status) ? settlement.status : 'pending'),
          tokenAmount: settlement.token_amount,
          tokenAddress: settlement.token_contract_address,
          usdcAmount: settlement.transfer_amount,
          conversionRate: settlement.exchange_rate || 1,
          sourceWallet: '',
          destinationWallet: settlement.transfer_to_address,
          blockchain: 'ethereum',
          priority: 'normal',
          retryCount: settlement.retry_count || 0,
          maxRetries: 3,
          createdAt: new Date(settlement.created_at),
          updatedAt: settlement.updated_at ? new Date(settlement.updated_at) : undefined,
          metadata: {}
        }
      };
    } catch (error) {
      console.error('Error initiating settlement:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get settlement status and progress
   */
  async getSettlementStatus(settlementId: string): Promise<SettlementStatusResponse> {
    try {
      const { data: settlement, error } = await withAuth(async () => 
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('id', settlementId)
          .single()
      );

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Settlement not found'
          };
        }
        throw error;
      }

      const mappedSettlement = this.mapDbToSettlement(settlement);
      
      // Calculate progress based on status
      let progress = 0;
      let currentStep = 'validate';
      
      if (settlement.status === 'pending') {
        progress = 0;
        currentStep = 'validate';
      } else if (settlement.burn_status === 'pending' || settlement.burn_status === 'processing') {
        progress = 25;
        currentStep = 'burn_tokens';
      } else if (settlement.burn_status === 'completed' && settlement.transfer_status === 'pending') {
        progress = 50;
        currentStep = 'transfer_funds';
      } else if (settlement.transfer_status === 'completed') {
        progress = 90;
        currentStep = 'confirm';
      } else if (settlement.status === 'completed') {
        progress = 100;
        currentStep = 'completed';
      }

      return { 
        success: true, 
        data: {
          settlement: mappedSettlement,
          tokenBurn: {
            id: `burn_${settlementId}`,
            settlementRequestId: settlementId,
            tokenAmount: settlement.token_amount || 0,
            tokenAddress: settlement.token_contract_address || '',
            status: (isBurnStatus(settlement.burn_status) ? settlement.burn_status : 'pending') as typeof BurnStatus[keyof typeof BurnStatus],
            transactionHash: settlement.burn_transaction_hash,
            gasUsed: settlement.burn_gas_used,
            gasFee: mappedSettlement.burnGasPrice,
            completedAt: mappedSettlement.burnConfirmedAt,
            retryCount: 0
          },
          fundTransfer: {
            id: `transfer_${settlementId}`,
            settlementRequestId: settlementId,
            amount: mappedSettlement.transferAmount,
            currency: settlement.transfer_currency,
            fromAddress: settlement.token_contract_address || '',
            toAddress: settlement.transfer_to_address || '',
            transferMethod: 'bank_transfer' as TransferMethod,
            status: (isTransferStatus(settlement.transfer_status) ? settlement.transfer_status : 'pending') as typeof TransferStatus[keyof typeof TransferStatus],
            method: 'bank_transfer',
            estimatedCompletion: mappedSettlement.estimatedCompletion,
            retryCount: 0
          },
          confirmation: {
            id: `conf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            settlementRequestId: settlementId,
            tokenBurnConfirmed: settlement.burn_status === 'completed',
            fundTransferConfirmed: settlement.transfer_status === 'completed',
            finalBalance: 0,
            capTableUpdated: false,
            distributionUpdated: false,
            confirmedAt: new Date(),
            status: settlement.status === 'completed' ? 'confirmed' : 'pending'
          },
          currentStep,
          progress,
          estimatedTimeRemaining: settlement.status === 'completed' ? 0 : 15 * 60 // 15 minutes in seconds
        }
      };
    } catch (error) {
      console.error('Error fetching settlement status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * List settlements with pagination and filtering
   */
  async listSettlements(params?: {
    page?: number;
    limit?: number;
    status?: string;
    redemptionRequestId?: string;
    priority?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<SettlementListResponse> {
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
      if (params?.redemptionRequestId) {
        query = query.eq('redemption_request_id', params.redemptionRequestId);
      }
      if (params?.startDate) {
        query = query.gte('created_at', params.startDate);
      }
      if (params?.endDate) {
        query = query.lte('created_at', params.endDate);
      }

      const { data: settlements, error, count } = await withAuth(async () => await query);

      if (error) {
        throw error;
      }

      // Map database results to Settlement objects
      const settlementList = (settlements || []).map(row => this.mapDbToSettlement(row));
      
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / limit);

      // Calculate metrics from current data
      const totalSettlements = settlements?.length || 0;
      const pendingSettlements = settlements?.filter(s => s.status === 'pending').length || 0;
      const completedSettlements = settlements?.filter(s => s.status === 'completed').length || 0;
      const failedSettlements = settlements?.filter(s => s.status === 'failed').length || 0;

      const metrics: SettlementMetrics = {
        totalSettlements,
        pendingSettlements,
        completedSettlements,
        failedSettlements,
        avgSettlementTime: 25.5, // TODO: Calculate from actual data
        avgGasFee: 0.002,
        totalVolumeSettled: 0,
        successRate: settlements?.length ? 
          (settlements.filter(s => s.status === 'completed').length / settlements.length) : 0,
        currentQueueDepth: settlements?.filter(s => s.status === 'pending').length || 0,
        estimatedProcessingTime: 15,
        averageProcessingTime: 25.5,
        pending: settlements?.filter(s => s.status === 'pending').length || 0,
        inProgress: settlements?.filter(s => s.status === 'processing').length || 0,
        completed: settlements?.filter(s => s.status === 'completed').length || 0,
        failed: settlements?.filter(s => s.status === 'failed').length || 0
      };

      return { 
        success: true, 
        data: {
          settlements: settlementList,
          pagination: {
            page,
            currentPage: page,
            limit,
            total: totalCount,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
          },
          metrics
        }
      };
    } catch (error) {
      console.error('Error listing settlements:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Execute token burning operation
   */
  async executeTokenBurn(settlementId: string, params?: {
    gasPrice?: number;
    gasLimit?: number;
  }): Promise<{
    success: boolean;
    data?: TokenBurnOperation;
    error?: string;
  }> {
    try {
      // TODO: Implement actual blockchain token burning logic
      // For now, simulate the process by updating the database
      
      const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      const gasUsed = params?.gasLimit || 21000;
      const gasFee = params?.gasPrice || 0.002;

      const { data: settlement, error } = await supabase
        .from(this.tableName)
        .update({
          burn_status: 'completed',
          burn_transaction_hash: transactionHash,
          burn_gas_used: gasUsed,
          burn_gas_price: gasFee,
          burn_confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', settlementId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const tokenBurnOperation: TokenBurnOperation = {
        id: `burn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        settlementRequestId: settlementId,
        tokenAmount: settlement.token_amount,
        tokenAddress: settlement.token_contract_address || '',
        transactionHash,
        gasUsed,
        gasFee,
        status: 'completed' as typeof BurnStatus[keyof typeof BurnStatus],
        timestamp: new Date(),
        tokensBurned: settlement.token_amount,
        confirmations: 1,
        retryCount: 0
      };

      return { success: true, data: tokenBurnOperation };
    } catch (error) {
      console.error('Error executing token burn:', error);
      
      // Update settlement with error
      await supabase
        .from(this.tableName)
        .update({
          burn_status: 'failed',
          error_message: error instanceof Error ? error.message : 'Token burn failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', settlementId);

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Execute fund transfer operation
   */
  async executeFundTransfer(settlementId: string, params?: {
    transferMethod?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }): Promise<{
    success: boolean;
    data?: FundTransferOperation;
    error?: string;
  }> {
    try {
      // TODO: Implement actual fund transfer logic
      // For now, simulate the process by updating the database
      
      const transferId = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const estimatedMinutes = params?.priority === 'urgent' ? 5 : 
                             params?.priority === 'high' ? 15 : 30;

      const { data: settlement, error } = await supabase
        .from(this.tableName)
        .update({
          transfer_status: 'completed',
          transfer_transaction_hash: transferId,
          transfer_confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', settlementId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const fundTransferOperation: FundTransferOperation = {
        id: `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        settlementRequestId: settlementId,
        transferId,
        method: params?.transferMethod || 'bank_transfer',
        transferMethod: (params?.transferMethod as TransferMethod) || 'bank_transfer',
        amount: settlement.transfer_amount,
        currency: settlement.transfer_currency,
        fromAddress: '',
        toAddress: settlement.transfer_to_address || '',
        status: 'completed' as typeof TransferStatus[keyof typeof TransferStatus],
        estimatedCompletion: new Date(Date.now() + estimatedMinutes * 60 * 1000),
        reference: `REF_${Math.random().toString(36).substr(2, 12).toUpperCase()}`,
        timestamp: new Date(),
        retryCount: 0
      };

      return { success: true, data: fundTransferOperation };
    } catch (error) {
      console.error('Error executing fund transfer:', error);
      
      // Update settlement with error
      await supabase
        .from(this.tableName)
        .update({
          transfer_status: 'failed',
          error_message: error instanceof Error ? error.message : 'Fund transfer failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', settlementId);

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Confirm settlement completion
   */
  async confirmSettlement(settlementId: string, confirmation: {
    auditor?: string;
    auditNotes?: string;
  }): Promise<{
    success: boolean;
    data?: SettlementConfirmation;
    error?: string;
  }> {
    try {
      const { data: settlement, error } = await supabase
        .from(this.tableName)
        .update({
          status: 'completed',
          actual_completion: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', settlementId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update redemption request status to 'settled'
      await supabase
        .from('redemption_requests')
        .update({
          status: 'settled',
          updated_at: new Date().toISOString()
        })
        .eq('id', settlement.redemption_request_id);

      const settlementConfirmation: SettlementConfirmation = {
        id: `conf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        settlementRequestId: settlementId,
        confirmationId: `conf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'confirmed',
        tokenBurnConfirmed: true,
        fundTransferConfirmed: true,
        finalBalance: 0,
        auditor: confirmation.auditor || 'system',
        auditNotes: confirmation.auditNotes || 'Settlement completed successfully',
        timestamp: new Date(),
        finalStatus: 'completed',
        capTableUpdated: true,
        complianceChecked: true,
        confirmedAt: new Date(),
        distributionUpdated: true
      };

      return { success: true, data: settlementConfirmation };
    } catch (error) {
      console.error('Error confirming settlement:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Retry failed settlement
   */
  async retrySettlement(settlementId: string, options?: {
    retryBurn?: boolean;
    retryTransfer?: boolean;
    increasedGasPrice?: number;
  }): Promise<SettlementResponse> {
    try {
      const updateData: any = {
        status: 'pending',
        retry_count: 1, // Simple increment instead of SQL function
        last_retry_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        error_message: null
      };

      if (options?.retryBurn) {
        updateData.burn_status = 'pending';
        updateData.burn_transaction_hash = null;
        updateData.burn_confirmed_at = null;
      }

      if (options?.retryTransfer) {
        updateData.transfer_status = 'pending';
        updateData.transfer_transaction_hash = null;
        updateData.transfer_confirmed_at = null;
      }

      if (options?.increasedGasPrice) {
        updateData.gas_estimate = options.increasedGasPrice;
      }

      const { data: settlement, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', settlementId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { 
        success: true, 
        retryId: `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalSettlementId: settlementId,
        status: 'retrying',
        timestamp: new Date(),
        estimatedCompletion: new Date(Date.now() + 20 * 60 * 1000)
      };
    } catch (error) {
      console.error('Error retrying settlement:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Cancel pending settlement
   */
  async cancelSettlement(settlementId: string, reason: string): Promise<SettlementResponse> {
    try {
      const { data: settlement, error } = await supabase
        .from(this.tableName)
        .update({
          status: 'cancelled',
          error_message: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', settlementId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update redemption request status back to 'approved'
      await supabase
        .from('redemption_requests')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', settlement.redemption_request_id);

      return { 
        success: true, 
        cancellationId: `cancel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        settlementId,
        status: 'cancelled',
        reason,
        timestamp: new Date(),
        refundIssued: false,
        tokensRestored: true
      };
    } catch (error) {
      console.error('Error cancelling settlement:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get settlement metrics and statistics
   */
  async getSettlementMetrics(params?: {
    startDate?: string;
    endDate?: string;
    tokenType?: string;
    blockchain?: string;
  }): Promise<{
    success: boolean;
    data?: SettlementMetrics;
    error?: string;
  }> {
    try {
      let query = supabase.from(this.tableName).select('*');

      // Apply filters
      if (params?.startDate) {
        query = query.gte('created_at', params.startDate);
      }
      if (params?.endDate) {
        query = query.lte('created_at', params.endDate);
      }

      const { data: settlements, error } = await query;

      if (error) {
        throw error;
      }

      if (!settlements) {
        return {
          success: true,
          data: {
            totalSettlements: 0,
            completedSettlements: 0,
            failedSettlements: 0,
            pendingSettlements: 0,
            avgSettlementTime: 0,
            avgGasFee: 0,
            totalVolumeSettled: 0,
            successRate: 0,
            currentQueueDepth: 0,
            estimatedProcessingTime: 0,
            averageProcessingTime: 0,
            totalValueProcessed: 0,
            gasFeesPaid: 0,
            pending: 0,
            inProgress: 0,
            completed: 0,
            failed: 0,
            byStatus: { pending: 0, in_progress: 0, completed: 0, failed: 0 },
            byPriority: { low: 0, normal: 0, high: 0, urgent: 0 },
            byBlockchain: {},
            timeMetrics: { averageBurnTime: 0, averageTransferTime: 0, averageConfirmationTime: 0 },
            dailyStats: []
          }
        };
      }

      const totalSettlements = settlements.length;
      const completedSettlements = settlements.filter(s => s.status === 'completed').length;
      const failedSettlements = settlements.filter(s => s.status === 'failed').length;
      const pendingSettlements = settlements.filter(s => s.status === 'pending').length;
      const successRate = totalSettlements > 0 ? completedSettlements / totalSettlements : 0;
      
      const totalValueProcessed = settlements.reduce((sum, s) => 
        sum + parseFloat(String(s.transfer_amount || '0')), 0);
      
      const gasFeesPaid = settlements.reduce((sum, s) => 
        sum + parseFloat(String(s.burn_gas_price || '0')) + parseFloat(String(s.transfer_gas_price || '0')), 0);

      // Calculate average processing time for completed settlements
      const completedWithTimes = settlements.filter(s => s.status === 'completed' && s.actual_completion);
      const averageProcessingTime = completedWithTimes.length > 0 ?
        completedWithTimes.reduce((sum, s) => {
          const created = new Date(s.created_at).getTime();
          const completed = new Date(s.actual_completion).getTime();
          return sum + (completed - created);
        }, 0) / completedWithTimes.length / (1000 * 60) : 0; // Convert to minutes

      const metrics: SettlementMetrics = {
        totalSettlements,
        completedSettlements,
        failedSettlements,
        pendingSettlements,
        avgSettlementTime: Math.round(averageProcessingTime * 100) / 100,
        avgGasFee: gasFeesPaid / totalSettlements || 0,
        totalVolumeSettled: totalValueProcessed,
        successRate,
        currentQueueDepth: pendingSettlements,
        estimatedProcessingTime: Math.round(averageProcessingTime * 100) / 100,
        averageProcessingTime: Math.round(averageProcessingTime * 100) / 100,
        totalValueProcessed,
        gasFeesPaid,
        pending: pendingSettlements,
        inProgress: settlements.filter(s => s.status === 'processing').length,
        completed: completedSettlements,
        failed: failedSettlements,
        byStatus: {
          pending: settlements.filter(s => s.status === 'pending').length,
          in_progress: settlements.filter(s => s.status === 'processing').length,
          completed: completedSettlements,
          failed: failedSettlements
        },
        byPriority: {
          low: 0, // TODO: Add priority field to settlements table
          normal: totalSettlements,
          high: 0,
          urgent: 0
        },
        byBlockchain: {
          ethereum: totalSettlements // TODO: Add blockchain tracking
        },
        timeMetrics: {
          averageBurnTime: averageProcessingTime * 0.5,
          averageTransferTime: averageProcessingTime * 0.4,
          averageConfirmationTime: averageProcessingTime * 0.1
        },
        dailyStats: [] // TODO: Implement daily statistics aggregation
      };

      return { success: true, data: metrics };
    } catch (error) {
      console.error('Error fetching settlement metrics:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Estimate gas fees for settlement
   */
  async estimateGasFees(params: {
    tokenAddress: string;
    tokenAmount: number;
    blockchain: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }): Promise<{
    success: boolean;
    data?: {
      burnGasFee: number;
      transferGasFee: number;
      totalGasFee: number;
      estimatedTime: number;
      gasPrice: number;
    };
    error?: string;
  }> {
    try {
      // TODO: Implement actual gas estimation using blockchain APIs
      // For now, return estimates based on blockchain and priority
      const baseGasFee = params.blockchain === 'ethereum' ? 0.002 : 
                        params.blockchain === 'polygon' ? 0.0001 : 0.0005;
      
      const priorityMultiplier = {
        low: 0.8,
        normal: 1.0,
        high: 1.5,
        urgent: 2.0
      }[params.priority || 'normal'];

      const estimate = {
        burnGasFee: baseGasFee * priorityMultiplier,
        transferGasFee: baseGasFee * 0.5 * priorityMultiplier,
        totalGasFee: baseGasFee * 1.5 * priorityMultiplier,
        estimatedTime: params.priority === 'urgent' ? 5 : 
                       params.priority === 'high' ? 10 : 
                       params.priority === 'normal' ? 15 : 30,
        gasPrice: Math.floor(20 * priorityMultiplier)
      };

      return { success: true, data: estimate };
    } catch (error) {
      console.error('Error estimating gas fees:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Subscribe to settlement updates using Supabase real-time
   */
  subscribeToSettlementUpdates(
    settlementId: string, 
    callback: (update: SettlementUpdate) => void
  ): () => void {
    const subscription = supabase
      .channel(`settlement_${settlementId}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: this.tableName,
          filter: `id=eq.${settlementId}`
        }, 
        (payload) => {
          const settlement = this.mapDbToSettlement(payload.new);
          const update: SettlementUpdate = {
            type: 'status_update',
            settlementRequestId: settlementId,
            status: settlement.status,
            progress: settlement.status === 'completed' ? 100 : 
                     settlement.transferStatus === 'completed' ? 90 :
                     settlement.burnStatus === 'completed' ? 50 : 25,
            timestamp: new Date(),
            message: `Settlement ${settlement.status}`,
            details: settlement
          };
          callback(update);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Batch process multiple settlements
   */
  async batchProcessSettlements(settlementIds: string[], options?: {
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    gasPrice?: number;
  }): Promise<{
    success: boolean;
    data?: {
      batchId: string;
      processed: number;
      failed: number;
      results: Array<{
        settlementId: string;
        success: boolean;
        error?: string;
      }>;
    };
    error?: string;
  }> {
    try {
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const results: Array<{ settlementId: string; success: boolean; error?: string; }> = [];
      let processed = 0;
      let failed = 0;

      for (const settlementId of settlementIds) {
        try {
          // Execute token burn for each settlement
          const burnResult = await this.executeTokenBurn(settlementId, {
            gasPrice: options?.gasPrice
          });

          if (burnResult.success) {
            // Execute fund transfer
            const transferResult = await this.executeFundTransfer(settlementId, {
              priority: options?.priority
            });

            if (transferResult.success) {
              // Confirm settlement
              await this.confirmSettlement(settlementId, {
                auditor: 'batch_processor',
                auditNotes: `Batch processed with ID: ${batchId}`
              });

              results.push({ settlementId, success: true });
              processed++;
            } else {
              results.push({ 
                settlementId, 
                success: false, 
                error: transferResult.error 
              });
              failed++;
            }
          } else {
            results.push({ 
              settlementId, 
              success: false, 
              error: burnResult.error 
            });
            failed++;
          }
        } catch (error) {
          results.push({ 
            settlementId, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
          failed++;
        }
      }

      return {
        success: true,
        data: {
          batchId,
          processed,
          failed,
          results
        }
      };
    } catch (error) {
      console.error('Error batch processing settlements:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Update cap table after settlement
   */
  async updateCapTable(settlementId: string): Promise<{
    success: boolean;
    data?: {
      updated: boolean;
      changes: Array<{
        investorId: string;
        tokenId: string;
        previousBalance: number;
        newBalance: number;
        amountRedeemed: number;
      }>;
    };
    error?: string;
  }> {
    try {
      // Get settlement and redemption request details
      const { data: settlement, error: settlementError } = await supabase
        .from(this.tableName)
        .select(`
          *,
          redemption_requests (
            investor_id,
            token_type,
            token_amount
          )
        `)
        .eq('id', settlementId)
        .single();

      if (settlementError || !settlement) {
        return {
          success: false,
          error: 'Settlement not found'
        };
      }

      // TODO: Implement actual cap table update logic
      // This would involve updating investor balances in the cap table
      
      const changes = [{
        investorId: settlement.redemption_requests.investor_id,
        tokenId: settlement.redemption_requests.token_type,
        previousBalance: 5000, // TODO: Get from actual cap table
        newBalance: 5000 - settlement.token_amount,
        amountRedeemed: settlement.token_amount
      }];

      return {
        success: true,
        data: {
          updated: true,
          changes
        }
      };
    } catch (error) {
      console.error('Error updating cap table:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
}

// Export singleton instance
export const settlementService = new SettlementService();
