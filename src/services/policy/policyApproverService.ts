import { supabase } from '@/infrastructure/database/client';
import { PolicyRuleApproverTable } from '@/types/core/database';
import { AuditEventType, AuditLogService } from '@/services/audit/auditLogService';

/**
 * Status values for policy approvals
 */
export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/**
 * Interface for policy approver records in our database
 * (Extended version of the PolicyRuleApproverTable to include additional fields)
 */
export interface PolicyApprover extends Omit<PolicyRuleApproverTable, 'policy_rule_id'> {
  approver_id: string;
  template_id: string;
  role?: string;
  comments?: string;
  updated_by?: string;
  updated_at?: string;
}

/**
 * Service for managing policy approvers
 */
export class PolicyApproverService {
  private auditLogService: AuditLogService;

  constructor() {
    this.auditLogService = new AuditLogService();
  }

  /**
   * Add an approver to a policy
   * 
   * @param templateId - The policy template ID
   * @param userId - The approver's user ID
   * @param role - The approver's role
   * @param requestedBy - User who requested the approval
   * @returns The created approver record or null if creation failed
   */
  async addApprover(
    templateId: string,
    userId: string,
    role: string,
    requestedBy: string
  ): Promise<PolicyApprover | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('policy_rule_approvers')
        .insert({
          template_id: templateId,
          user_id: userId,
          role: role,
          status: ApprovalStatus.PENDING,
          created_by: requestedBy,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding policy approver:', error);
        throw error;
      }

      // Log the approval request
      await this.auditLogService.createLog(
        AuditEventType.APPROVAL_REQUESTED,
        requestedBy,
        templateId,
        'approval',
        { approver: userId, role }
      );

      return data as PolicyApprover;
    } catch (error) {
      console.error('Failed to add policy approver:', error);
      return null;
    }
  }

  /**
   * Update an approver's status
   * 
   * @param approverId - The approver record ID
   * @param status - The new approval status
   * @param comments - Optional comments
   * @param updatedBy - User who updated the status
   * @returns The updated approver record or null if update failed
   */
  async updateApprovalStatus(
    approverId: string,
    status: ApprovalStatus,
    comments: string,
    updatedBy: string
  ): Promise<PolicyApprover | null> {
    try {
      // Get the current approver record to get the template ID
      const { data: currentRecord, error: fetchError } = await (supabase as any)
        .from('policy_rule_approvers')
        .select('*')
        .eq('approver_id', approverId)
        .single();

      if (fetchError) {
        console.error('Error fetching approver record:', fetchError);
        throw fetchError;
      }

      // Update the status
      const { data, error } = await (supabase as any)
        .from('policy_rule_approvers')
        .update({
          status: status,
          comments: comments,
          updated_by: updatedBy,
          updated_at: new Date().toISOString(),
        })
        .eq('approver_id', approverId)
        .select()
        .single();

      if (error) {
        console.error('Error updating approval status:', error);
        throw error;
      }

      // Log the approval action
      const eventType = status === ApprovalStatus.APPROVED 
        ? AuditEventType.APPROVAL_GRANTED 
        : AuditEventType.APPROVAL_REJECTED;

      await this.auditLogService.createLog(
        eventType,
        updatedBy,
        (currentRecord as PolicyApprover).template_id,
        'approval',
        { 
          approverId, 
          status, 
          comments,
          previousStatus: currentRecord.status 
        }
      );

      return data as PolicyApprover;
    } catch (error) {
      console.error('Failed to update approval status:', error);
      return null;
    }
  }

  /**
   * Get all approvers for a policy template
   * 
   * @param templateId - The policy template ID
   * @returns Array of policy approvers
   */
  async getApprovers(templateId: string): Promise<PolicyApprover[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('policy_rule_approvers')
        .select('*')
        .eq('template_id', templateId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching policy approvers:', error);
        throw error;
      }

      return (data || []) as PolicyApprover[];
    } catch (error) {
      console.error('Failed to fetch policy approvers:', error);
      return [];
    }
  }

  /**
   * Remove an approver from a policy
   * 
   * @param approverId - The approver record ID
   * @param removedBy - User who removed the approver
   * @returns True if removed successfully, false otherwise
   */
  async removeApprover(approverId: string, removedBy: string): Promise<boolean> {
    try {
      // Get the current approver record to get the template ID
      const { data: currentRecord, error: fetchError } = await (supabase as any)
        .from('policy_rule_approvers')
        .select('*')
        .eq('approver_id', approverId)
        .single();

      if (fetchError) {
        console.error('Error fetching approver record:', fetchError);
        throw fetchError;
      }

      // Delete the approver
      const { error } = await (supabase as any)
        .from('policy_rule_approvers')
        .delete()
        .eq('approver_id', approverId);

      if (error) {
        console.error('Error removing policy approver:', error);
        throw error;
      }

      // Log the removal
      await this.auditLogService.createLog(
        AuditEventType.APPROVAL_REJECTED,
        removedBy,
        (currentRecord as PolicyApprover).template_id,
        'approval',
        { 
          approver: currentRecord.user_id, 
          role: (currentRecord as PolicyApprover).role,
          reason: 'Approver removed from policy'
        }
      );

      return true;
    } catch (error) {
      console.error('Failed to remove policy approver:', error);
      return false;
    }
  }

  /**
   * Check if a policy has all required approvals
   * 
   * @param templateId - The policy template ID
   * @returns True if all approvers have approved, false otherwise
   */
  async areAllApprovalsComplete(templateId: string): Promise<boolean> {
    try {
      const { data, error } = await (supabase as any)
        .from('policy_rule_approvers')
        .select('status')
        .eq('template_id', templateId);

      if (error) {
        console.error('Error checking policy approvals:', error);
        throw error;
      }

      // If there are no approvers, return true
      if (data.length === 0) {
        return true;
      }

      // Check if all approvals are granted
      return data.every(record => record.status === ApprovalStatus.APPROVED);
    } catch (error) {
      console.error('Failed to check policy approvals:', error);
      return false;
    }
  }
}