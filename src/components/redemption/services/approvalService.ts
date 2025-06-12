// Approval service for managing multi-signature approval workflows
// Handles approval requests, approver management, and approval status tracking
// Uses Supabase for direct database access

import { supabase } from '@/infrastructure/supabaseClient';
import type { 
  ApprovalRequest,
  ApprovalRecord,
  ApprovalDecision,
  ApprovalDecisionType,
  SubmitApprovalInput,
  ApprovalResponse,
  ApprovalQueueResponse,
  ApproverDashboardMetrics,
  ApprovalAction,
  ApprovalQueueItem
} from '../types';

// Database row types matching current schema
interface RedemptionApproverRow {
  id: string;
  redemption_id: string;
  name: string;
  role: string;
  avatar_url?: string;
  approved: boolean;
  approved_at?: string;
  created_at: string;
}

interface RedemptionRequestRow {
  id: string;
  token_amount: number;
  token_type: string;
  redemption_type: string;
  status: string;
  source_wallet_address: string;
  destination_wallet_address: string;
  conversion_rate: number;
  investor_name?: string;
  investor_id?: string;
  required_approvals: number;
  is_bulk_redemption?: boolean;
  investor_count?: number;
  rejection_reason?: string;
  rejected_by?: string;
  rejection_timestamp?: string;
  created_at: string;
  updated_at: string;
}

export class ApprovalService {
  private readonly approvalsTable = 'redemption_approvers';
  private readonly requestsTable = 'redemption_requests';

  /**
   * Map database approver row to ApprovalRecord
   */
  private mapApproverRowToRecord(row: RedemptionApproverRow): ApprovalRecord {
    return {
      id: row.id,
      approverId: row.id, // Using id as approverId for now
      approverName: row.name,
      approverRole: row.role,
      avatarUrl: row.avatar_url,
      decision: row.approved ? 'approved' : 'pending',
      status: row.approved ? 'approved' : 'pending',
      timestamp: row.approved_at ? new Date(row.approved_at) : new Date(row.created_at),
      comments: undefined // Not available in current schema
    };
  }

  /**
   * Map redemption request with approval data to ApprovalQueueItem
   */
  private mapToApprovalQueueItem(redemptionRow: RedemptionRequestRow, approvals: RedemptionApproverRow[] = []): ApprovalQueueItem {
    return {
      id: redemptionRow.id,
      redemptionRequestId: redemptionRow.id,
      requestorName: redemptionRow.investor_name || 'Unknown',
      investorName: redemptionRow.investor_name,
      investorId: redemptionRow.investor_id,
      tokenAmount: redemptionRow.token_amount,
      tokenType: redemptionRow.token_type,
      redemptionType: redemptionRow.redemption_type as 'standard' | 'interval',
      priority: this.calculatePriority(redemptionRow),
      submittedAt: new Date(redemptionRow.created_at),
      deadline: undefined, // Not implemented in current schema
      estimatedValue: redemptionRow.token_amount * redemptionRow.conversion_rate,
      usdcAmount: redemptionRow.token_amount * redemptionRow.conversion_rate,
      riskScore: undefined, // Not implemented
      tags: [],
      approvalId: approvals[0]?.id,
      status: redemptionRow.status as any,
      assignedApprovers: approvals.map(a => a.name)
    };
  }

  /**
   * Calculate priority based on redemption data
   */
  private calculatePriority(redemptionRow: RedemptionRequestRow): 'low' | 'medium' | 'high' | 'urgent' {
    const amount = redemptionRow.token_amount;
    const daysSinceSubmission = Math.floor(
      (Date.now() - new Date(redemptionRow.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceSubmission > 3) return 'urgent';
    if (amount > 100000) return 'high';
    if (amount > 10000) return 'medium';
    return 'low';
  }

  /**
   * Create approval request for redemption
   */
  async createApprovalRequest(
    redemptionId: string, 
    requiredApprovers: string[]
  ): Promise<{ success: boolean; data?: ApprovalRequest; error?: string }> {
    try {
      // Create approval records for each required approver
      const approvalRecords = requiredApprovers.map((approverName, index) => ({
        redemption_id: redemptionId,
        approver_id: `${redemptionId}-${index}`, // Generate unique approver_id
        name: approverName,
        role: 'approver', // Default role
        approved: false
      }));

      const { data, error } = await supabase
        .from(this.approvalsTable)
        .insert(approvalRecords)
        .select();

      if (error) {
        throw error;
      }

      // Create ApprovalRequest for compatibility
      const approvalRequest: ApprovalRequest = {
        id: redemptionId,
        redemptionRequestId: redemptionId,
        requiredApprovals: requiredApprovers.length,
        currentApprovals: 0,
        status: 'pending',
        approvers: (data || []).map(row => this.mapApproverRowToRecord(row)),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return { success: true, data: approvalRequest };
    } catch (error) {
      console.error('Error creating approval request:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Process an approval decision (approve/reject)
   */
  async processApproval(
    redemptionId: string,
    approverId: string,
    decision: ApprovalDecisionType,
    comments?: string
  ): Promise<ApprovalResponse> {
    try {
      // Update the approval record
      const { data: approvalData, error: approvalError } = await supabase
        .from(this.approvalsTable)
        .update({
          approved: decision === 'approved',
          approved_at: decision === 'approved' ? new Date().toISOString() : null
        })
        .eq('redemption_id', redemptionId)
        .eq('id', approverId) // Using id since we don't have approver_id
        .select()
        .single();

      if (approvalError) {
        throw approvalError;
      }

      // Check if all approvals are complete
      const { data: allApprovals, error: checkError } = await supabase
        .from(this.approvalsTable)
        .select('approved')
        .eq('redemption_id', redemptionId);

      if (checkError) {
        throw checkError;
      }

      const isComplete = allApprovals?.every(approval => approval.approved) || false;

      // If complete, update redemption request status
      if (isComplete) {
        await supabase
          .from(this.requestsTable)
          .update({ 
            status: 'approved',
            updated_at: new Date().toISOString()
          })
          .eq('id', redemptionId);
      }

      const approvalRecord: ApprovalRecord = this.mapApproverRowToRecord(approvalData);
      
      return { 
        success: true, 
        data: {
          approvalRecord,
          updatedRequest: {} as ApprovalRequest,
          isComplete
        }
      };
    } catch (error) {
      console.error('Error processing approval:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get approval request by redemption ID
   */
  async getApprovalRequest(redemptionId: string): Promise<{
    success: boolean;
    data?: ApprovalRequest;
    error?: string;
  }> {
    try {
      // Get approval records for this redemption
      const { data: approvals, error } = await supabase
        .from(this.approvalsTable)
        .select('*')
        .eq('redemption_id', redemptionId);

      if (error) {
        throw error;
      }

      if (!approvals || approvals.length === 0) {
        return {
          success: false,
          error: 'No approval request found for this redemption ID'
        };
      }

      // Create ApprovalRequest from approval records
      const currentApprovals = approvals.filter(a => a.approved).length;
      const approvalRequest: ApprovalRequest = {
        id: redemptionId,
        redemptionRequestId: redemptionId,
        requiredApprovals: approvals.length,
        currentApprovals,
        status: currentApprovals === approvals.length ? 'approved' : 'pending',
        approvers: approvals.map(row => this.mapApproverRowToRecord(row)),
        createdAt: new Date(approvals[0].created_at),
        updatedAt: new Date(Math.max(...approvals.map(a => new Date(a.approved_at || a.created_at).getTime())))
      };

      return { success: true, data: approvalRequest };
    } catch (error) {
      console.error('Error fetching approval request:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get approval queue for specific approver
   */
  async getApprovalQueue(
    approverId: string, 
    filters?: {
      status?: string;
      priority?: string;
      page?: number;
      limit?: number;
      isSuperAdmin?: boolean;
    }
  ): Promise<ApprovalQueueResponse> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 50;
      const offset = (page - 1) * limit;
      const isSuperAdmin = filters?.isSuperAdmin || false;

      // Get redemption requests that need approval
      let query = supabase
        .from(this.requestsTable)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // For Super Admin, show all requests regardless of status
      // For regular users, filter by status and their assigned approvals
      if (isSuperAdmin) {
        console.log('🔧 [ApprovalService] Super Admin access - showing all redemption requests');
        // Super Admin sees all requests, optionally filtered by status
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
      } else {
        // Regular users see only pending requests assigned to them
        if (filters?.status) {
          query = query.eq('status', filters.status);
        } else {
          query = query.eq('status', 'pending');
        }
      }

      const { data: redemptionData, error: redemptionError, count } = await query;

      if (redemptionError) {
        throw redemptionError;
      }

      // Get associated approvals for each redemption (only if not Super Admin or for UI completeness)
      const redemptionIds = (redemptionData || []).map(r => r.id);
      const { data: approvalData } = await supabase
        .from(this.approvalsTable)
        .select('*')
        .in('redemption_id', redemptionIds);

      // Group approvals by redemption ID
      const approvalsByRedemption = (approvalData || []).reduce((acc, approval) => {
        if (!acc[approval.redemption_id]) {
          acc[approval.redemption_id] = [];
        }
        acc[approval.redemption_id].push(approval);
        return acc;
      }, {} as Record<string, RedemptionApproverRow[]>);

      // Map to approval queue items
      const queueItems = (redemptionData || []).map(row => {
        const approvals = approvalsByRedemption[row.id] || [];
        const item = this.mapToApprovalQueueItem(row, approvals);
        
        // For Super Admin, ensure they can see and approve everything
        if (isSuperAdmin) {
          item.assignedApprovers = [approverId, ...item.assignedApprovers];
        }
        
        return item;
      });
      
      // Filter by priority if specified
      const filteredItems = filters?.priority 
        ? queueItems.filter(item => item.priority === filters.priority)
        : queueItems;

      // Calculate metrics
      const totalPending = filteredItems.filter(item => item.status === 'pending').length;
      const totalApproved = 0; // Would need historical query
      const totalRejected = 0; // Would need historical query
      const avgApprovalTime = 24; // Placeholder - would calculate from historical data
      const pendingOlderThan24h = filteredItems.filter(item => {
        const ageHours = (Date.now() - item.submittedAt.getTime()) / (1000 * 60 * 60);
        return item.status === 'pending' && ageHours > 24;
      }).length;

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / limit);

      return { 
        success: true, 
        data: {
          items: filteredItems,
          queue: filteredItems, // Alias for backward compatibility
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages
          },
          metrics: {
            pendingApprovals: totalPending,
            approvedToday: totalApproved,
            rejectedToday: totalRejected,
            avgApprovalTime,
            overdueApprovals: pendingOlderThan24h,
            delegatedApprovals: 0
          },
          avgApprovalTime
        }
      };
    } catch (error) {
      console.error('Error fetching approval queue:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get approver dashboard metrics
   */
  async getApproverMetrics(approverId: string): Promise<{
    success: boolean;
    data?: ApproverDashboardMetrics;
    error?: string;
  }> {
    try {
      // Get approval statistics for this approver
      const { data: approvals, error } = await supabase
        .from(this.approvalsTable)
        .select('*')
        .eq('name', approverId); // Using name since we don't have approver_id

      if (error) {
        throw error;
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const todayApprovals = approvals?.filter(a => {
        const approvedAt = a.approved_at ? new Date(a.approved_at) : null;
        return approvedAt && approvedAt >= today;
      }) || [];

      const metrics: ApproverDashboardMetrics = {
        pendingApprovals: approvals?.filter(a => !a.approved).length || 0,
        approvedToday: todayApprovals.filter(a => a.approved).length,
        rejectedToday: 0, // Can't distinguish rejected from pending in current schema
        avgApprovalTime: 24, // Placeholder - would calculate from historical data
        overdueApprovals: approvals?.filter(a => {
          const createdAt = new Date(a.created_at);
          const ageHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          return !a.approved && ageHours > 24;
        }).length || 0,
        delegatedApprovals: 0 // Not implemented in current schema
      };

      return { success: true, data: metrics };
    } catch (error) {
      console.error('Error fetching approver metrics:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Submit approval action with additional data
   */
  async submitApprovalAction(input: SubmitApprovalInput & {
    action?: ApprovalAction;
  }): Promise<ApprovalResponse> {
    try {
      // Use the existing submitApproval method
      return await this.submitApproval(input);
    } catch (error) {
      console.error('Error submitting approval action:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get approval history for a redemption request
   */
  async getApprovalHistory(redemptionId: string): Promise<{
    success: boolean;
    data?: ApprovalRecord[];
    error?: string;
  }> {
    try {
      const { data: approvals, error } = await supabase
        .from(this.approvalsTable)
        .select('*')
        .eq('redemption_id', redemptionId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      const approvalRecords: ApprovalRecord[] = (approvals || []).map(approval => 
        this.mapApproverRowToRecord(approval)
      );

      return { success: true, data: approvalRecords };
    } catch (error) {
      console.error('Error fetching approval history:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Check if approval threshold has been met
   */
  async checkApprovalThreshold(redemptionId: string): Promise<{
    success: boolean;
    data?: {
      isComplete: boolean;
      currentApprovals: number;
      requiredApprovals: number;
      remainingApprovals: number;
      approvers: ApprovalRecord[];
    };
    error?: string;
  }> {
    try {
      const { data: approvals, error } = await supabase
        .from(this.approvalsTable)
        .select('*')
        .eq('redemption_id', redemptionId);

      if (error) {
        throw error;
      }

      if (!approvals || approvals.length === 0) {
        return {
          success: false,
          error: 'No approval records found for this redemption ID'
        };
      }

      const currentApprovals = approvals.filter(a => a.approved).length;
      const requiredApprovals = approvals.length; // Assuming all must approve
      const remainingApprovals = Math.max(0, requiredApprovals - currentApprovals);
      const isComplete = remainingApprovals === 0;

      const approvalRecords: ApprovalRecord[] = approvals.map(approval => 
        this.mapApproverRowToRecord(approval)
      );

      return { 
        success: true, 
        data: {
          isComplete,
          currentApprovals,
          requiredApprovals,
          remainingApprovals,
          approvers: approvalRecords
        }
      };
    } catch (error) {
      console.error('Error checking approval threshold:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Notify approvers about pending approvals
   */
  async notifyApprovers(redemptionId: string, message?: string): Promise<{
    success: boolean;
    data?: { notificationsSent: number; failures: string[] };
    error?: string;
  }> {
    try {
      // Get pending approvals for this redemption
      const { data: pendingApprovals, error } = await supabase
        .from(this.approvalsTable)
        .select('name')
        .eq('redemption_id', redemptionId)
        .eq('approved', false);

      if (error) {
        throw error;
      }

      // In a real implementation, this would send notifications
      // For now, we'll just log and return success
      const approverNames = pendingApprovals?.map(a => a.name) || [];
      console.log(`Would notify approvers: ${approverNames.join(', ')} about redemption ${redemptionId}`);
      if (message) {
        console.log(`Message: ${message}`);
      }

      return { 
        success: true, 
        data: {
          notificationsSent: approverNames.length,
          failures: []
        }
      };
    } catch (error) {
      console.error('Error notifying approvers:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Escalate approval request to higher authority
   */
  async escalateApproval(redemptionId: string, reason: string, escalateTo?: string[]): Promise<{
    success: boolean;
    data?: ApprovalRequest;
    error?: string;
  }> {
    try {
      // If escalateTo is provided, add new approvers
      if (escalateTo && escalateTo.length > 0) {
        const escalationRecords = escalateTo.map((approverName, index) => ({
          redemption_id: redemptionId,
          approver_id: `${redemptionId}-escalated-${index}`, // Generate unique approver_id
          name: approverName,
          role: 'escalated_approver',
          approved: false
        }));

        const { error } = await supabase
          .from(this.approvalsTable)
          .insert(escalationRecords);

        if (error) {
          throw error;
        }
      }

      // Return the updated approval request
      return this.getApprovalRequest(redemptionId);
    } catch (error) {
      console.error('Error escalating approval:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Configure auto-approval rules
   */
  async configureAutoApproval(config: {
    tokenType?: string;
    maxAmount?: number;
    conditions?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    enabled: boolean;
  }): Promise<{
    success: boolean;
    data?: { ruleId: string };
    error?: string;
  }> {
    try {
      // This would typically be stored in a rules configuration table
      // For now, we'll just log the configuration and return success
      console.log('Auto-approval rule configured:', config);
      
      const ruleId = `rule-${Date.now()}`;
      
      return { 
        success: true, 
        data: { ruleId }
      };
    } catch (error) {
      console.error('Error configuring auto-approval:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Batch process multiple approvals
   */
  async batchProcessApprovals(approvals: Array<{
    redemptionId: string;
    decision: ApprovalDecisionType;
    comments?: string;
  }>): Promise<{
    success: boolean;
    data?: {
      processed: number;
      failed: number;
      results: Array<{
        redemptionId: string;
        success: boolean;
        error?: string;
      }>;
    };
    error?: string;
  }> {
    try {
      const results: Array<{
        redemptionId: string;
        success: boolean;
        error?: string;
      }> = [];

      let processed = 0;
      let failed = 0;

      // Process each approval individually
      for (const approval of approvals) {
        try {
          const result = await this.submitApproval({
            approvalRequestId: approval.redemptionId,
            decision: approval.decision,
            comments: approval.comments
          });

          if (result.success) {
            processed++;
            results.push({
              redemptionId: approval.redemptionId,
              success: true
            });
          } else {
            failed++;
            results.push({
              redemptionId: approval.redemptionId,
              success: false,
              error: result.error
            });
          }
        } catch (error) {
          failed++;
          results.push({
            redemptionId: approval.redemptionId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          });
        }
      }

      return { 
        success: true, 
        data: {
          processed,
          failed,
          results
        }
      };
    } catch (error) {
      console.error('Error batch processing approvals:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Alias methods for component compatibility
  async getApprovals(filters?: {
    approverId?: string;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
    isSuperAdmin?: boolean;
  }): Promise<ApprovalQueueResponse> {
    return this.getApprovalQueue(filters?.approverId || '', filters);
  }

  async submitApproval(input: SubmitApprovalInput): Promise<ApprovalResponse> {
    try {
      const redemptionId = input.approvalRequestId;
      
      // First, check if approval records exist for this redemption
      const { data: existingApprovals, error: checkError } = await supabase
        .from(this.approvalsTable)
        .select('*')
        .eq('redemption_id', redemptionId);

      if (checkError) {
        throw checkError;
      }

      // If no approval records exist, create them for the current user
      if (!existingApprovals || existingApprovals.length === 0) {
        console.log('🔧 Creating approval record for redemption:', redemptionId);
        
        const { data: createdApproval, error: createError } = await supabase
          .from(this.approvalsTable)
          .insert({
            redemption_id: redemptionId,
            name: 'Current User', // In production, get from auth context
            role: 'admin',
            approved: input.decision === 'approved',
            approved_at: input.decision === 'approved' ? new Date().toISOString() : null,
            approver_id: '00000000-0000-0000-0000-000000000000' // Use actual user ID in production
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }
      } else {
        // Update existing approval record
        const { error: updateError } = await supabase
          .from(this.approvalsTable)
          .update({
            approved: input.decision === 'approved',
            approved_at: input.decision === 'approved' ? new Date().toISOString() : null
          })
          .eq('redemption_id', redemptionId)
          .eq('id', existingApprovals[0].id);

        if (updateError) {
          throw updateError;
        }
      }

      // Now update the redemption request status
      const { data, error } = await supabase
        .from(this.requestsTable)
        .update({ 
          status: input.decision === 'approved' ? 'approved' : 'rejected',
          rejection_reason: input.decision === 'rejected' ? input.comments : null,
          rejected_by: input.decision === 'rejected' ? 'Current User' : null,
          rejection_timestamp: input.decision === 'rejected' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', redemptionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('✅ Successfully updated redemption status to:', input.decision);

      return {
        success: true,
        data: {
          approvalRecord: {
            id: 'current-approval',
            approverId: 'current-user',
            approverName: 'Current User',
            approverRole: 'admin',
            decision: input.decision,
            status: input.decision === 'approved' ? 'approved' : input.decision === 'rejected' ? 'rejected' : 'pending',
            timestamp: new Date(),
            comments: input.comments
          } as ApprovalRecord,
          updatedRequest: {} as ApprovalRequest,
          isComplete: true
        }
      };
    } catch (error) {
      console.error('❌ Error submitting approval:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async requestApproval(redemptionId: string, requiredApprovers: string[]): Promise<{ success: boolean; data?: ApprovalRequest; error?: string }> {
    return this.createApprovalRequest(redemptionId, requiredApprovers);
  }

  async delegateApproval(redemptionId: string, reason: string, delegateTo?: string[]): Promise<{
    success: boolean;
    data?: ApprovalRequest;
    error?: string;
  }> {
    return this.escalateApproval(redemptionId, reason, delegateTo);
  }

  async getApprovalStatus(redemptionId: string): Promise<{
    success: boolean;
    data?: ApprovalRequest;
    error?: string;
  }> {
    return this.getApprovalRequest(redemptionId);
  }
}

// Export singleton instance
export const approvalService = new ApprovalService();
