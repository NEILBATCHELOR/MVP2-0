/**
 * DFNS Policy Adapter - Policy engine and approval workflow functionality
 * 
 * This adapter provides functionality for DFNS policy operations including:
 * - Policy creation and management
 * - Approval workflows
 * - Policy rule configuration
 * - Activity monitoring
 */

import type {
  DfnsResponse,
  DfnsPaginatedResponse,
  Policy,
  PolicyApproval,
  PolicyRule,
  DfnsPolicyApprovalStatus
} from '@/types/dfns';
import { DfnsActivityKind, DfnsPolicyStatus } from '@/types/dfns';
import { DfnsApiClient } from '../client';
import { DFNS_ENDPOINTS } from '../config';

// ===== Policy Creation Types =====

export interface PolicyCreationRequest {
  name: string;
  description?: string;
  rule: PolicyRule;
  activityKind: DfnsActivityKind;
  status?: DfnsPolicyStatus;
  externalId?: string;
}

export interface PolicyUpdateRequest {
  name?: string;
  description?: string;
  rule?: PolicyRule;
  status?: DfnsPolicyStatus;
}

export interface ApprovalDecisionRequest {
  decision: 'Approve' | 'Reject';
  reason?: string;
}

// ===== Policy Adapter =====

export class DfnsPolicyAdapter {
  private client: DfnsApiClient;

  constructor(client: DfnsApiClient) {
    this.client = client;
  }

  // ===== Policy Management =====

  /**
   * Create a new policy
   */
  async createPolicy(request: PolicyCreationRequest): Promise<DfnsResponse<Policy>> {
    try {
      const payload = {
        name: request.name,
        description: request.description,
        rule: request.rule,
        activityKind: request.activityKind,
        status: request.status || DfnsPolicyStatus.Active,
        externalId: request.externalId
      };

      const response = await this.client.post<any>(
        DFNS_ENDPOINTS.policies.create,
        payload
      );

      if (response.error) {
        return response;
      }

      const policy: Policy = {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        rule: response.data.rule,
        activityKind: response.data.activityKind,
        status: response.data.status,
        externalId: response.data.externalId,
        createdAt: response.data.dateCreated || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return {
        kind: 'success',
        data: policy
      };
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'POLICY_CREATION_FAILED',
          message: `Failed to create policy: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * Get policy by ID
   */
  async getPolicy(policyId: string): Promise<DfnsResponse<Policy>> {
    try {
      const response = await this.client.get<any>(
        DFNS_ENDPOINTS.policies.get(policyId)
      );

      if (response.error) {
        return response;
      }

      const policy: Policy = {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        rule: response.data.rule,
        activityKind: response.data.activityKind,
        status: response.data.status,
        externalId: response.data.externalId,
        createdAt: response.data.dateCreated,
        updatedAt: response.data.dateModified || response.data.dateCreated
      };

      return {
        kind: 'success',
        data: policy
      };
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'POLICY_FETCH_FAILED',
          message: `Failed to fetch policy: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * List policies with pagination
   */
  async listPolicies(params?: {
    limit?: number;
    paginationToken?: string;
    status?: DfnsPolicyStatus;
    activityKind?: DfnsActivityKind;
  }): Promise<DfnsPaginatedResponse<Policy>> {
    try {
      const response = await this.client.get<{ items: any[]; nextPageToken?: string }>(
        DFNS_ENDPOINTS.policies.list,
        params
      );

      if (response.error) {
        return {
          kind: 'error',
          error: response.error,
          data: [],
          pagination: {}
        };
      }

      const policies = response.data!.items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        rule: item.rule,
        activityKind: item.activityKind,
        status: item.status,
        externalId: item.externalId,
        createdAt: item.dateCreated,
        updatedAt: item.dateModified || item.dateCreated
      }));

      return {
        kind: 'success',
        data: policies,
        pagination: {
          nextPageToken: response.data!.nextPageToken,
          limit: params?.limit
        }
      };
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'POLICIES_LIST_FAILED',
          message: `Failed to list policies: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * Update policy
   */
  async updatePolicy(
    policyId: string,
    updates: PolicyUpdateRequest
  ): Promise<DfnsResponse<Policy>> {
    try {
      const response = await this.client.put<any>(
        DFNS_ENDPOINTS.policies.update(policyId),
        updates
      );

      if (response.error) {
        return response;
      }

      const policy: Policy = {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        rule: response.data.rule,
        activityKind: response.data.activityKind,
        status: response.data.status,
        externalId: response.data.externalId,
        createdAt: response.data.dateCreated,
        updatedAt: response.data.dateModified || new Date().toISOString()
      };

      return {
        kind: 'success',
        data: policy
      };
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'POLICY_UPDATE_FAILED',
          message: `Failed to update policy: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * Archive policy
   */
  async archivePolicy(policyId: string): Promise<DfnsResponse<{ success: boolean }>> {
    try {
      const response = await this.client.put<any>(
        DFNS_ENDPOINTS.policies.archive(policyId),
        {}
      );

      if (response.error) {
        return response;
      }

      return {
        kind: 'success',
        data: { success: true }
      };
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'POLICY_ARCHIVE_FAILED',
          message: `Failed to archive policy: ${(error as Error).message}`
        }
      };
    }
  }

  // ===== Approval Management =====

  /**
   * List policy approvals
   */
  async listApprovals(params?: {
    limit?: number;
    paginationToken?: string;
    status?: DfnsPolicyApprovalStatus;
    policyId?: string;
    activityId?: string;
  }): Promise<DfnsPaginatedResponse<PolicyApproval>> {
    try {
      const response = await this.client.get<{ items: any[]; nextPageToken?: string }>(
        DFNS_ENDPOINTS.policies.approvals,
        params
      );

      if (response.error) {
        return {
          kind: 'error',
          error: response.error,
          data: [],
          pagination: {}
        };
      }

      const approvals = response.data!.items.map(item => ({
        id: item.id,
        activityId: item.activityId,
        policyId: item.policyId,
        status: item.status,
        reason: item.reason,
        approvedBy: item.approvedBy,
        approvedAt: item.approvedAt,
        rejectedBy: item.rejectedBy,
        rejectedAt: item.rejectedAt,
        metadata: item.metadata,
        createdAt: item.dateCreated,
        updatedAt: item.dateModified || item.dateCreated,
        // UI helper properties
        policyName: item.policy?.name,
        activityDescription: item.activity?.description,
        timeElapsed: this.calculateTimeElapsed(item.dateCreated),
        canApprove: this.canUserApprove(item),
        canReject: this.canUserReject(item)
      }));

      return {
        kind: 'success',
        data: approvals,
        pagination: {
          nextPageToken: response.data!.nextPageToken,
          limit: params?.limit
        }
      };
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'APPROVALS_LIST_FAILED',
          message: `Failed to list approvals: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * Get specific approval
   */
  async getApproval(approvalId: string): Promise<DfnsResponse<PolicyApproval>> {
    try {
      const response = await this.client.get<any>(
        DFNS_ENDPOINTS.policies.approval(approvalId)
      );

      if (response.error) {
        return response;
      }

      const approval: PolicyApproval = {
        id: response.data.id,
        activityId: response.data.activityId,
        policyId: response.data.policyId,
        status: response.data.status,
        reason: response.data.reason,
        approvedBy: response.data.approvedBy,
        approvedAt: response.data.approvedAt,
        rejectedBy: response.data.rejectedBy,
        rejectedAt: response.data.rejectedAt,
        metadata: response.data.metadata,
        createdAt: response.data.dateCreated,
        updatedAt: response.data.dateModified || response.data.dateCreated,
        // UI helper properties
        policyName: response.data.policy?.name,
        activityDescription: response.data.activity?.description,
        timeElapsed: this.calculateTimeElapsed(response.data.dateCreated),
        canApprove: this.canUserApprove(response.data),
        canReject: this.canUserReject(response.data)
      };

      return {
        kind: 'success',
        data: approval
      };
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'APPROVAL_FETCH_FAILED',
          message: `Failed to fetch approval: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * Make approval decision
   */
  async createApprovalDecision(
    approvalId: string,
    decision: ApprovalDecisionRequest
  ): Promise<DfnsResponse<PolicyApproval>> {
    try {
      const payload = {
        action: decision.decision,
        reason: decision.reason
      };

      const response = await this.client.post<any>(
        DFNS_ENDPOINTS.policies.decision(approvalId),
        payload
      );

      if (response.error) {
        return response;
      }

      const approval: PolicyApproval = {
        id: response.data.id,
        activityId: response.data.activityId,
        policyId: response.data.policyId,
        status: response.data.status,
        reason: response.data.reason,
        approvedBy: response.data.approvedBy,
        approvedAt: response.data.approvedAt,
        rejectedBy: response.data.rejectedBy,
        rejectedAt: response.data.rejectedAt,
        metadata: response.data.metadata,
        createdAt: response.data.dateCreated,
        updatedAt: response.data.dateModified || new Date().toISOString()
      };

      return {
        kind: 'success',
        data: approval
      };
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code: 'APPROVAL_DECISION_FAILED',
          message: `Failed to create approval decision: ${(error as Error).message}`
        }
      };
    }
  }

  // ===== Policy Rule Builders =====

  /**
   * Create transaction amount limit rule
   */
  createTransactionAmountLimitRule(
    currencySymbol: string,
    maxAmount: string
  ): PolicyRule {
    return {
      kind: 'TransactionAmountLimit',
      configuration: {
        currency: currencySymbol,
        limit: maxAmount
      },
      description: `Transaction amount limit: ${maxAmount} ${currencySymbol}`,
      priority: 1
    };
  }

  /**
   * Create transaction velocity rule
   */
  createTransactionVelocityRule(
    currencySymbol: string,
    maxAmount: string,
    timeWindow: string // e.g., "1h", "1d", "1w"
  ): PolicyRule {
    return {
      kind: 'TransactionAmountVelocity',
      configuration: {
        currency: currencySymbol,
        limit: maxAmount,
        timeWindow
      },
      description: `Transaction velocity limit: ${maxAmount} ${currencySymbol} per ${timeWindow}`,
      priority: 2
    };
  }

  /**
   * Create transaction count velocity rule
   */
  createTransactionCountVelocityRule(
    maxCount: number,
    timeWindow: string
  ): PolicyRule {
    return {
      kind: 'TransactionCountVelocity',
      configuration: {
        limit: maxCount,
        timeWindow
      },
      description: `Transaction count limit: ${maxCount} transactions per ${timeWindow}`,
      priority: 3
    };
  }

  /**
   * Create recipient whitelist rule
   */
  createRecipientWhitelistRule(addresses: string[]): PolicyRule {
    return {
      kind: 'TransactionRecipientWhitelist',
      configuration: {
        addresses
      },
      description: `Recipient whitelist: ${addresses.length} approved addresses`,
      priority: 4
    };
  }

  /**
   * Create always activated rule (requires approval for all activities)
   */
  createAlwaysActivatedRule(): PolicyRule {
    return {
      kind: 'AlwaysActivated',
      configuration: {},
      description: 'Always requires approval',
      priority: 10
    };
  }

  /**
   * Create Chainalysis transaction screening rule
   */
  createChainalysisScreeningRule(
    riskLevel: 'Low' | 'Medium' | 'High' = 'Medium'
  ): PolicyRule {
    return {
      kind: 'ChainalysisTransactionScreening',
      configuration: {
        riskLevel
      },
      description: `Chainalysis screening with ${riskLevel} risk threshold`,
      priority: 5
    };
  }

  // ===== Policy Templates =====

  /**
   * Create basic security policy template
   */
  createBasicSecurityPolicy(
    name: string,
    activityKind: DfnsActivityKind,
    maxAmount?: string
  ): PolicyCreationRequest {
    const rules: PolicyRule[] = [];

    // Add amount limit if specified
    if (maxAmount) {
      rules.push(this.createTransactionAmountLimitRule('USD', maxAmount));
    }

    // Add basic velocity limits
    rules.push(this.createTransactionVelocityRule('USD', '10000', '1d'));
    rules.push(this.createTransactionCountVelocityRule(10, '1h'));

    // Combine rules (simplified - in reality would use proper rule combination)
    const combinedRule = rules[0] || this.createAlwaysActivatedRule();

    return {
      name,
      description: `Basic security policy for ${activityKind}`,
      rule: combinedRule,
      activityKind,
      status: DfnsPolicyStatus.Active
    };
  }

  /**
   * Create high security policy template
   */
  createHighSecurityPolicy(
    name: string,
    activityKind: DfnsActivityKind,
    whitelistedAddresses: string[] = []
  ): PolicyCreationRequest {
    const rules: PolicyRule[] = [];

    // Add strict limits
    rules.push(this.createTransactionAmountLimitRule('USD', '1000'));
    rules.push(this.createTransactionVelocityRule('USD', '5000', '1d'));
    rules.push(this.createTransactionCountVelocityRule(5, '1h'));

    // Add whitelist if provided
    if (whitelistedAddresses.length > 0) {
      rules.push(this.createRecipientWhitelistRule(whitelistedAddresses));
    }

    // Add Chainalysis screening
    rules.push(this.createChainalysisScreeningRule('Low'));

    // Use always activated as the main rule
    const combinedRule = this.createAlwaysActivatedRule();

    return {
      name,
      description: `High security policy for ${activityKind} with strict limits`,
      rule: combinedRule,
      activityKind,
      status: DfnsPolicyStatus.Active
    };
  }

  // ===== Utility Methods =====

  /**
   * Calculate time elapsed since creation
   */
  private calculateTimeElapsed(dateCreated: string): string {
    const created = new Date(dateCreated);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m ago`;
    } else {
      return `${diffMinutes}m ago`;
    }
  }

  /**
   * Check if current user can approve
   */
  private canUserApprove(approval: any): boolean {
    // Simplified logic - in reality would check user permissions
    return approval.status === 'Pending';
  }

  /**
   * Check if current user can reject
   */
  private canUserReject(approval: any): boolean {
    // Simplified logic - in reality would check user permissions
    return approval.status === 'Pending';
  }

  /**
   * Get supported activity kinds
   */
  getSupportedActivityKinds(): DfnsActivityKind[] {
    return [
      DfnsActivityKind.WalletCreation,
      DfnsActivityKind.WalletReading,
      DfnsActivityKind.WalletUpdate,
      DfnsActivityKind.WalletDelegate,
      DfnsActivityKind.WalletExport,
      DfnsActivityKind.WalletImport,
      DfnsActivityKind.TransferAsset,
      DfnsActivityKind.BroadcastTransaction,
      DfnsActivityKind.KeyCreation,
      DfnsActivityKind.KeyReading,
      DfnsActivityKind.KeyDelegate,
      DfnsActivityKind.KeyExport,
      DfnsActivityKind.KeyImport,
      DfnsActivityKind.KeyGenerateSignature
    ];
  }

  /**
   * Validate policy rule configuration
   */
  validatePolicyRule(rule: PolicyRule): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rule.kind) {
      errors.push('Rule kind is required');
    }

    if (!rule.configuration || typeof rule.configuration !== 'object') {
      errors.push('Rule configuration is required and must be an object');
    }

    // Add specific validation based on rule kind
    switch (rule.kind) {
      case 'TransactionAmountLimit':
        if (!rule.configuration.currency || !rule.configuration.limit) {
          errors.push('TransactionAmountLimit requires currency and limit');
        }
        break;
      case 'TransactionAmountVelocity':
        if (!rule.configuration.currency || !rule.configuration.limit || !rule.configuration.timeWindow) {
          errors.push('TransactionAmountVelocity requires currency, limit, and timeWindow');
        }
        break;
      case 'TransactionRecipientWhitelist':
        if (!Array.isArray(rule.configuration.addresses) || rule.configuration.addresses.length === 0) {
          errors.push('TransactionRecipientWhitelist requires non-empty addresses array');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// ===== Export =====

export default DfnsPolicyAdapter;
