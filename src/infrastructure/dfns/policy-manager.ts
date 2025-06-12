/**
 * DFNS Policy Manager - Enhanced policy engine management for DFNS integration
 * 
 * This service manages DFNS policies including:
 * - Policy creation and configuration
 * - Policy rule management (amount limits, velocity controls, whitelists)
 * - Approval workflow management
 * - Policy assignments and enforcement
 * - Compliance and AML/KYT integration
 */

import type { DfnsClientConfig } from '@/types/dfns';
import { DfnsAuthenticator } from './auth';
import { DFNS_CONFIG, DFNS_ENDPOINTS } from './config';

// ===== Policy Management Types =====

export interface PolicyConfig {
  id?: string;
  name: string;
  description?: string;
  rule: PolicyRule;
  activityKind: ActivityKind;
  status: PolicyStatus;
  externalId?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface PolicyRule {
  kind: PolicyRuleKind;
  configuration: PolicyRuleConfiguration;
}

export interface PolicyRuleConfiguration {
  // Common configurations
  enabled?: boolean;
  
  // Amount limit configurations
  amount?: string;
  currency?: string;
  timeWindow?: TimeWindow;
  
  // Velocity configurations
  maxAmount?: string;
  maxCount?: number;
  timeWindowDuration?: number;
  timeWindowUnit?: TimeUnit;
  
  // Whitelist configurations
  addresses?: string[];
  allowedNetworks?: string[];
  
  // Chainalysis configurations
  riskLevel?: RiskLevel;
  sanctionsScreening?: boolean;
  amlChecking?: boolean;
  categoryFilters?: string[];
  
  // Approval configurations
  approvers?: string[];
  requiredApprovals?: number;
  approvalTimeout?: number;
}

export interface PolicyApproval {
  id: string;
  activityId: string;
  policyId: string;
  status: PolicyApprovalStatus;
  requiredApprovals: number;
  currentApprovals: number;
  approvers: PolicyApprover[];
  reason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface PolicyApprover {
  id: string;
  userId: string;
  username?: string;
  email?: string;
  status: ApproverStatus;
  approvedAt?: string;
  rejectedAt?: string;
  reason?: string;
}

export interface PolicyAssignment {
  id: string;
  policyId: string;
  targetType: PolicyTargetType;
  targetId: string;
  assignedBy: string;
  assignedAt: string;
  status: PolicyAssignmentStatus;
}

export enum PolicyStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Draft = 'Draft'
}

export enum PolicyRuleKind {
  AlwaysActivated = 'AlwaysActivated',
  TransactionAmountLimit = 'TransactionAmountLimit',
  TransactionAmountVelocity = 'TransactionAmountVelocity',
  TransactionCountVelocity = 'TransactionCountVelocity',
  TransactionRecipientWhitelist = 'TransactionRecipientWhitelist',
  ChainalysisTransactionPrescreening = 'ChainalysisTransactionPrescreening',
  ChainalysisTransactionScreening = 'ChainalysisTransactionScreening',
  MultiPartyApproval = 'MultiPartyApproval',
  TimeBasedApproval = 'TimeBasedApproval',
  GeographicRestriction = 'GeographicRestriction'
}

export enum ActivityKind {
  WalletCreation = 'Wallets:Create',
  WalletReading = 'Wallets:Read',
  WalletUpdate = 'Wallets:Update',
  WalletDelegate = 'Wallets:Delegate',
  WalletExport = 'Wallets:Export',
  WalletImport = 'Wallets:Import',
  TransferAsset = 'Wallets:TransferAsset',
  BroadcastTransaction = 'Wallets:BroadcastTransaction',
  KeyCreation = 'Keys:Create',
  KeyReading = 'Keys:Read',
  KeyDelegate = 'Keys:Delegate',
  KeyExport = 'Keys:Export',
  KeyImport = 'Keys:Import',
  KeyGenerateSignature = 'Keys:GenerateSignature'
}

export enum PolicyApprovalStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Failed = 'Failed',
  Expired = 'Expired'
}

export enum ApproverStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected'
}

export enum PolicyTargetType {
  User = 'User',
  ServiceAccount = 'ServiceAccount',
  Wallet = 'Wallet',
  Organization = 'Organization'
}

export enum PolicyAssignmentStatus {
  Active = 'Active',
  Inactive = 'Inactive'
}

export enum TimeWindow {
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly'
}

export enum TimeUnit {
  Minutes = 'minutes',
  Hours = 'hours',
  Days = 'days'
}

export enum RiskLevel {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Severe = 'Severe'
}

// ===== DFNS Policy Manager Class =====

export class DfnsPolicyManager {
  private config: DfnsClientConfig;
  private authenticator: DfnsAuthenticator;

  constructor(config: DfnsClientConfig, authenticator?: DfnsAuthenticator) {
    this.config = config;
    this.authenticator = authenticator || new DfnsAuthenticator(config);
  }

  // ===== Policy Management =====

  /**
   * Create a new policy
   */
  async createPolicy(policyConfig: Omit<PolicyConfig, 'id'>): Promise<PolicyConfig> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to create policies');
      }

      // Validate policy configuration
      this.validatePolicyConfig(policyConfig);

      // Get user action signature for policy creation
      const userActionSignature = await this.authenticator.signUserAction(
        'POST',
        DFNS_ENDPOINTS.policies.create,
        policyConfig
      );

      const response = await fetch(`${this.config.baseUrl}${DFNS_ENDPOINTS.policies.create}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        },
        body: JSON.stringify(policyConfig)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Policy creation failed: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to create policy: ${(error as Error).message}`);
    }
  }

  /**
   * List all policies
   */
  async listPolicies(options: {
    status?: PolicyStatus;
    activityKind?: ActivityKind;
    ruleKind?: PolicyRuleKind;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ policies: PolicyConfig[]; total: number }> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to list policies');
      }

      const queryParams = new URLSearchParams();
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });

      const url = `${this.config.baseUrl}${DFNS_ENDPOINTS.policies.list}?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list policies: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        policies: data.policies || [],
        total: data.total || 0
      };
    } catch (error) {
      throw new Error(`Failed to list policies: ${(error as Error).message}`);
    }
  }

  /**
   * Get policy details
   */
  async getPolicy(policyId: string): Promise<PolicyConfig> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to get policy');
      }

      const response = await fetch(`${this.config.baseUrl}${DFNS_ENDPOINTS.policies.get(policyId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get policy: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get policy: ${(error as Error).message}`);
    }
  }

  /**
   * Update policy
   */
  async updatePolicy(
    policyId: string,
    updates: Partial<Omit<PolicyConfig, 'id'>>
  ): Promise<PolicyConfig> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to update policy');
      }

      const userActionSignature = await this.authenticator.signUserAction(
        'PUT',
        DFNS_ENDPOINTS.policies.update(policyId),
        updates
      );

      const response = await fetch(`${this.config.baseUrl}${DFNS_ENDPOINTS.policies.update(policyId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed to update policy: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to update policy: ${(error as Error).message}`);
    }
  }

  /**
   * Archive a policy
   */
  async archivePolicy(policyId: string): Promise<void> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to archive policy');
      }

      const userActionSignature = await this.authenticator.signUserAction(
        'PUT',
        DFNS_ENDPOINTS.policies.archive(policyId)
      );

      const response = await fetch(`${this.config.baseUrl}${DFNS_ENDPOINTS.policies.archive(policyId)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to archive policy: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Failed to archive policy: ${(error as Error).message}`);
    }
  }

  // ===== Policy Rule Builders =====

  /**
   * Create an amount limit policy rule
   */
  createAmountLimitRule(
    amount: string,
    currency: string = 'USD',
    timeWindow: TimeWindow = TimeWindow.Daily
  ): PolicyRule {
    return {
      kind: PolicyRuleKind.TransactionAmountLimit,
      configuration: {
        enabled: true,
        amount,
        currency,
        timeWindow
      }
    };
  }

  /**
   * Create a velocity control policy rule
   */
  createVelocityRule(
    maxAmount: string,
    maxCount: number,
    timeWindowDuration: number,
    timeWindowUnit: TimeUnit
  ): PolicyRule {
    return {
      kind: PolicyRuleKind.TransactionAmountVelocity,
      configuration: {
        enabled: true,
        maxAmount,
        maxCount,
        timeWindowDuration,
        timeWindowUnit
      }
    };
  }

  /**
   * Create a whitelist policy rule
   */
  createWhitelistRule(
    addresses: string[],
    allowedNetworks?: string[]
  ): PolicyRule {
    return {
      kind: PolicyRuleKind.TransactionRecipientWhitelist,
      configuration: {
        enabled: true,
        addresses,
        allowedNetworks
      }
    };
  }

  /**
   * Create a Chainalysis screening policy rule
   */
  createChainalysisRule(
    riskLevel: RiskLevel = RiskLevel.Medium,
    sanctionsScreening: boolean = true,
    amlChecking: boolean = true,
    categoryFilters?: string[]
  ): PolicyRule {
    return {
      kind: PolicyRuleKind.ChainalysisTransactionScreening,
      configuration: {
        enabled: true,
        riskLevel,
        sanctionsScreening,
        amlChecking,
        categoryFilters
      }
    };
  }

  /**
   * Create a multi-party approval policy rule
   */
  createMultiPartyApprovalRule(
    approvers: string[],
    requiredApprovals: number,
    approvalTimeout?: number
  ): PolicyRule {
    return {
      kind: PolicyRuleKind.MultiPartyApproval,
      configuration: {
        enabled: true,
        approvers,
        requiredApprovals,
        approvalTimeout
      }
    };
  }

  // ===== Policy Assignments =====

  /**
   * Assign policy to target
   */
  async assignPolicy(
    policyId: string,
    targetType: PolicyTargetType,
    targetId: string
  ): Promise<PolicyAssignment> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to assign policy');
      }

      const assignmentRequest = {
        policyId,
        targetType,
        targetId
      };

      const userActionSignature = await this.authenticator.signUserAction(
        'POST',
        '/policies/assignments',
        assignmentRequest
      );

      const response = await fetch(`${this.config.baseUrl}/policies/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        },
        body: JSON.stringify(assignmentRequest)
      });

      if (!response.ok) {
        throw new Error(`Failed to assign policy: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to assign policy: ${(error as Error).message}`);
    }
  }

  /**
   * Remove policy assignment
   */
  async removePolicy(
    policyId: string,
    targetType: PolicyTargetType,
    targetId: string
  ): Promise<void> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to remove policy');
      }

      // First get the assignment ID
      const assignments = await this.listPolicyAssignments(targetType, targetId);
      const assignment = assignments.find(a => a.policyId === policyId);
      
      if (!assignment) {
        throw new Error('Policy assignment not found');
      }

      const userActionSignature = await this.authenticator.signUserAction(
        'DELETE',
        `/policies/assignments/${assignment.id}`
      );

      const response = await fetch(`${this.config.baseUrl}/policies/assignments/${assignment.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to remove policy: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Failed to remove policy: ${(error as Error).message}`);
    }
  }

  /**
   * List policy assignments for target
   */
  async listPolicyAssignments(
    targetType: PolicyTargetType,
    targetId: string
  ): Promise<PolicyAssignment[]> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to list policy assignments');
      }

      const queryParams = new URLSearchParams();
      queryParams.append('targetType', targetType);
      queryParams.append('targetId', targetId);

      const url = `${this.config.baseUrl}/policies/assignments?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list policy assignments: ${response.statusText}`);
      }

      const data = await response.json();
      return data.assignments || [];
    } catch (error) {
      throw new Error(`Failed to list policy assignments: ${(error as Error).message}`);
    }
  }

  // ===== Approval Management =====

  /**
   * List pending approvals
   */
  async listPendingApprovals(options: {
    userId?: string;
    policyId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ approvals: PolicyApproval[]; total: number }> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to list approvals');
      }

      const queryParams = new URLSearchParams();
      queryParams.append('status', PolicyApprovalStatus.Pending);
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });

      const url = `${this.config.baseUrl}${DFNS_ENDPOINTS.policies.approvals}?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list pending approvals: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        approvals: data.approvals || [],
        total: data.total || 0
      };
    } catch (error) {
      throw new Error(`Failed to list pending approvals: ${(error as Error).message}`);
    }
  }

  /**
   * Get approval details
   */
  async getApproval(approvalId: string): Promise<PolicyApproval> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to get approval');
      }

      const response = await fetch(`${this.config.baseUrl}${DFNS_ENDPOINTS.policies.approval(approvalId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get approval: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get approval: ${(error as Error).message}`);
    }
  }

  /**
   * Approve a pending policy approval
   */
  async approveDecision(approvalId: string, reason?: string): Promise<PolicyApproval> {
    return this.makeApprovalDecision(approvalId, 'approve', reason);
  }

  /**
   * Reject a pending policy approval
   */
  async rejectDecision(approvalId: string, reason?: string): Promise<PolicyApproval> {
    return this.makeApprovalDecision(approvalId, 'reject', reason);
  }

  /**
   * Make approval decision
   */
  private async makeApprovalDecision(
    approvalId: string,
    decision: 'approve' | 'reject',
    reason?: string
  ): Promise<PolicyApproval> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to make approval decision');
      }

      const decisionRequest = {
        decision,
        reason
      };

      const userActionSignature = await this.authenticator.signUserAction(
        'PUT',
        DFNS_ENDPOINTS.policies.decision(approvalId),
        decisionRequest
      );

      const response = await fetch(`${this.config.baseUrl}${DFNS_ENDPOINTS.policies.decision(approvalId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        },
        body: JSON.stringify(decisionRequest)
      });

      if (!response.ok) {
        throw new Error(`Failed to make approval decision: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to make approval decision: ${(error as Error).message}`);
    }
  }

  // ===== Policy Templates =====

  /**
   * Create common policy templates
   */
  createStandardPolicyTemplates(): Record<string, Omit<PolicyConfig, 'id'>> {
    return {
      // Basic transaction limits
      dailyTransactionLimit: {
        name: 'Daily Transaction Limit',
        description: 'Limit daily transaction amounts to $10,000',
        rule: this.createAmountLimitRule('10000', 'USD', TimeWindow.Daily),
        activityKind: ActivityKind.TransferAsset,
        status: PolicyStatus.Active
      },

      // High-value approval
      highValueApproval: {
        name: 'High Value Approval',
        description: 'Require approval for transactions over $50,000',
        rule: this.createAmountLimitRule('50000', 'USD', TimeWindow.Daily),
        activityKind: ActivityKind.TransferAsset,
        status: PolicyStatus.Active
      },

      // Velocity control
      velocityControl: {
        name: 'Transaction Velocity Control',
        description: 'Limit to 10 transactions per hour, max $100,000',
        rule: this.createVelocityRule('100000', 10, 1, TimeUnit.Hours),
        activityKind: ActivityKind.TransferAsset,
        status: PolicyStatus.Active
      },

      // AML screening
      amlScreening: {
        name: 'AML/KYT Screening',
        description: 'Screen all transactions for sanctions and high-risk addresses',
        rule: this.createChainalysisRule(RiskLevel.Medium, true, true),
        activityKind: ActivityKind.TransferAsset,
        status: PolicyStatus.Active
      },

      // Multi-party approval for wallet creation
      walletCreationApproval: {
        name: 'Wallet Creation Approval',
        description: 'Require 2-of-3 approval for new wallet creation',
        rule: this.createMultiPartyApprovalRule([], 2, 24 * 60 * 60), // 24 hours
        activityKind: ActivityKind.WalletCreation,
        status: PolicyStatus.Active
      },

      // Key export approval
      keyExportApproval: {
        name: 'Key Export Approval',
        description: 'Require approval for key exports',
        rule: this.createMultiPartyApprovalRule([], 1, 4 * 60 * 60), // 4 hours
        activityKind: ActivityKind.KeyExport,
        status: PolicyStatus.Active
      }
    };
  }

  // ===== Utility Methods =====

  /**
   * Validate policy configuration
   */
  private validatePolicyConfig(config: Omit<PolicyConfig, 'id'>): void {
    if (!config.name.trim()) {
      throw new Error('Policy name is required');
    }

    if (!config.rule) {
      throw new Error('Policy rule is required');
    }

    if (!config.activityKind) {
      throw new Error('Activity kind is required');
    }

    if (!Object.values(PolicyRuleKind).includes(config.rule.kind)) {
      throw new Error(`Invalid policy rule kind: ${config.rule.kind}`);
    }

    if (!Object.values(ActivityKind).includes(config.activityKind)) {
      throw new Error(`Invalid activity kind: ${config.activityKind}`);
    }

    // Validate rule configuration based on kind
    this.validateRuleConfiguration(config.rule);
  }

  /**
   * Validate rule configuration
   */
  private validateRuleConfiguration(rule: PolicyRule): void {
    const { kind, configuration } = rule;

    switch (kind) {
      case PolicyRuleKind.TransactionAmountLimit:
        if (!configuration.amount) {
          throw new Error('Amount is required for amount limit rule');
        }
        break;

      case PolicyRuleKind.TransactionAmountVelocity:
      case PolicyRuleKind.TransactionCountVelocity:
        if (!configuration.timeWindowDuration || !configuration.timeWindowUnit) {
          throw new Error('Time window configuration is required for velocity rule');
        }
        break;

      case PolicyRuleKind.TransactionRecipientWhitelist:
        if (!configuration.addresses || configuration.addresses.length === 0) {
          throw new Error('At least one address is required for whitelist rule');
        }
        break;

      case PolicyRuleKind.MultiPartyApproval:
        if (!configuration.requiredApprovals || configuration.requiredApprovals < 1) {
          throw new Error('Required approvals must be at least 1');
        }
        break;
    }
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

export default DfnsPolicyManager;
