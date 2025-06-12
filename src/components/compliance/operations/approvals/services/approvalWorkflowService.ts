import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/core/database';
import { 
  ApprovalWorkflow, 
  ApprovalLevel, 
  EntityType, 
  ApprovalStatus,
  Approver,
  ApproverRole,
  ApproverStatus,
  RiskLevel
} from '@/types/domain/compliance/compliance';
import type { ComplianceCheck } from '@/components/compliance/operations/types';

// Internal interface for database operations and processing
interface ApprovalWorkflowInternal {
  id: string;
  entityId: string;
  entityType: EntityType;
  entityName?: string;
  status: ApprovalStatus;
  requiredLevels: ApprovalLevel[];
  currentLevel: ApprovalLevel;
  approvers: Approver[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  escalationReason?: string;
  escalatedBy?: string;
  escalatedAt?: Date;
  riskLevel: RiskLevel;
  comment?: string;
  reason?: string;
  requiredApprovals?: number;
  currentApprovals?: number;
  updatedBy?: {
    id: string;
    name: string;
    role?: string;
  };
}

// Sample data for testing
const sampleWorkflows: ApprovalWorkflowInternal[] = [
  {
    id: '1234abcd-5678-efgh-9012-ijkl3456mnop',
    entityId: 'INV-12345',
    entityType: 'INVESTOR',
    entityName: 'John Smith',
    status: 'PENDING',
    createdAt: new Date('2023-05-15'),
    updatedAt: new Date('2023-05-15'),
    riskLevel: 'HIGH',
    requiredLevels: ['L1', 'L2'],
    currentLevel: 'L1',
    approvers: [],
    requiredApprovals: 2,
    currentApprovals: 0
  },
  {
    id: '7890abcd-1234-efgh-5678-ijkl9012mnop',
    entityId: 'INV-67890',
    entityType: 'INVESTOR',
    entityName: 'Jane Doe',
    status: 'APPROVED',
    createdAt: new Date('2023-05-10'),
    updatedAt: new Date('2023-05-12'),
    riskLevel: 'MEDIUM',
    requiredLevels: ['L1'],
    currentLevel: 'L1',
    approvers: [],
    updatedBy: {
      id: '1',
      name: 'Admin User',
      role: 'COMPLIANCE_OFFICER'
    },
    comment: 'All documents verified',
    requiredApprovals: 1,
    currentApprovals: 1
  },
  {
    id: '5678abcd-9012-efgh-3456-ijkl7890mnop',
    entityId: 'ISS-12345',
    entityType: 'ISSUER',
    entityName: 'Acme Capital',
    status: 'PENDING',
    createdAt: new Date('2023-05-14'),
    updatedAt: new Date('2023-05-14'),
    riskLevel: 'HIGH',
    requiredLevels: ['L1', 'L2', 'EXECUTIVE'],
    currentLevel: 'L1',
    approvers: [],
    requiredApprovals: 3,
    currentApprovals: 0
  },
];

export class ApprovalWorkflowService {
  private static instance: ApprovalWorkflowService;
  private supabase;
  private workflows: ApprovalWorkflowInternal[];

  private constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    // Initialize with sample data for testing
    this.workflows = [...sampleWorkflows];
  }

  // Utility method to convert internal workflow to standard format for external API
  private convertToExternalWorkflow(internal: ApprovalWorkflowInternal): ApprovalWorkflow {
    return {
      id: internal.id,
      entityId: internal.entityId,
      entityType: internal.entityType,
      entityName: internal.entityName,
      status: internal.status,
      createdAt: internal.createdAt,
      updatedAt: internal.updatedAt,
      riskLevel: internal.riskLevel,
      updatedBy: internal.updatedBy,
      comment: internal.comment,
      reason: internal.reason,
      requiredApprovals: internal.requiredApprovals || internal.requiredLevels.length,
      currentApprovals: internal.currentApprovals || 0,
      approvers: internal.approvers.map(approver => ({
        userId: approver.userId,
        status: approver.status,
        timestamp: approver.timestamp,
        comments: approver.comments
      }))
    };
  }

  public static getInstance(): ApprovalWorkflowService {
    if (!ApprovalWorkflowService.instance) {
      ApprovalWorkflowService.instance = new ApprovalWorkflowService();
    }
    return ApprovalWorkflowService.instance;
  }

  // Create a new approval workflow
  async createWorkflow(
    entityType: EntityType,
    entityId: string,
    riskLevel: RiskLevel,
    entityName?: string
  ): Promise<ApprovalWorkflow> {
    try {
      // Determine required approval levels based on risk level
      const requiredLevels = this.getRequiredLevelsForRisk(riskLevel);
      
      // Get approvers for each level
      const approvers = await this.getApproversForLevels(requiredLevels);
      
      const workflowData = {
        entityId,
        entityType,
        entityName,
        status: 'PENDING' as ApprovalStatus,
        riskLevel,
      };
      
      // Insert the workflow into the database
      const { data, error } = await this.supabase
        .from('approval_workflows')
        .insert({
          entity_id: workflowData.entityId,
          entity_type: workflowData.entityType,
          entity_name: workflowData.entityName,
          status: workflowData.status,
          required_levels: requiredLevels,
          current_level: requiredLevels[0],
          approvers: approvers,
          risk_level: workflowData.riskLevel,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Format the response for internal use
      const internalWorkflow: ApprovalWorkflowInternal = {
        id: data.id,
        entityId: data.entity_id,
        entityType: data.entity_type as EntityType,
        entityName: data.entity_name,
        status: data.status as ApprovalStatus,
        requiredLevels: data.required_levels as ApprovalLevel[],
        currentLevel: data.current_level as ApprovalLevel,
        approvers: data.approvers as Approver[],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
        escalationReason: data.escalation_reason,
        escalatedBy: data.escalated_by,
        escalatedAt: data.escalated_at ? new Date(data.escalated_at) : undefined,
        riskLevel: data.risk_level as RiskLevel,
        requiredApprovals: requiredLevels.length,
        currentApprovals: 0
      };
      
      this.workflows.push(internalWorkflow);
      
      // Return the external format
      return this.convertToExternalWorkflow(internalWorkflow);
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  // Get an approval workflow by ID
  async getWorkflowById(workflowId: string): Promise<ApprovalWorkflowInternal | null> {
    try {
      const { data, error } = await this.supabase
        .from('approval_workflows')
        .select('*')
        .eq('id', workflowId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      
      if (!data) return null;
      
      return {
        id: data.id,
        entityId: data.entity_id,
        entityType: data.entity_type as EntityType,
        entityName: data.entity_name,
        status: data.status as ApprovalStatus,
        requiredLevels: data.required_levels as ApprovalLevel[],
        currentLevel: data.current_level as ApprovalLevel,
        approvers: data.approvers as Approver[],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
        escalationReason: data.escalation_reason,
        escalatedBy: data.escalated_by,
        escalatedAt: data.escalated_at ? new Date(data.escalated_at) : undefined,
        riskLevel: data.risk_level as RiskLevel,
        requiredApprovals: data.required_levels.length,
        currentApprovals: data.approvers.filter((a: Approver) => a.status === 'APPROVED').length
      };
    } catch (error) {
      console.error('Error getting workflow:', error);
      throw error;
    }
  }

  // Get approval workflows for an entity
  async getWorkflowsForEntity(entityType: EntityType, entityId: string): Promise<ApprovalWorkflow[]> {
    // Get internal workflows that match the criteria
    const internalWorkflows = this.workflows.filter(
      workflow => workflow.entityType === entityType && workflow.entityId === entityId
    );
    
    // Convert to external format for API
    return internalWorkflows.map(workflow => this.convertToExternalWorkflow(workflow));
  }

  // Get workflows that need approval by a user
  async getWorkflowsForApprover(userId: string): Promise<ApprovalWorkflow[]> {
    try {
      const { data: activeWorkflows, error } = await this.supabase
        .from('approval_workflows')
        .select('*')
        .or(`status.eq.PENDING,status.eq.ESCALATED`);
      
      if (error) throw error;
      
      // Filter workflows where the user is an approver for the current level and hasn't acted yet
      const internalWorkflows: ApprovalWorkflowInternal[] = (activeWorkflows || [])
        .filter(workflow => {
          const approvers = workflow.approvers as Approver[];
          return approvers.some(
            approver => 
              approver.userId === userId && 
              approver.level === workflow.current_level && 
              approver.status === 'PENDING'
          );
        })
        .map(item => ({
          id: item.id,
          entityId: item.entity_id,
          entityType: item.entity_type as EntityType,
          entityName: item.entity_name,
          status: item.status as ApprovalStatus,
          requiredLevels: item.required_levels as ApprovalLevel[],
          currentLevel: item.current_level as ApprovalLevel,
          approvers: item.approvers as Approver[],
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
          completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
          escalationReason: item.escalation_reason,
          escalatedBy: item.escalated_by,
          escalatedAt: item.escalated_at ? new Date(item.escalated_at) : undefined,
          riskLevel: item.risk_level as RiskLevel,
          requiredApprovals: item.required_levels.length,
          currentApprovals: item.approvers.filter((a: any) => a.status === 'APPROVED').length
        }));
      
      // Convert to external format for API
      return internalWorkflows.map(workflow => this.convertToExternalWorkflow(workflow));
    } catch (error) {
      console.error('Error getting workflows for approver:', error);
      throw error;
    }
  }

  // Approve a workflow
  async approveWorkflow(
    workflowId: string,
    userId: string,
    comment?: string
  ): Promise<ApprovalWorkflow> {
    try {
      // Get the current workflow
      const workflow = await this.getWorkflowById(workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }
      
      if (workflow.status !== 'PENDING' && workflow.status !== 'ESCALATED') {
        throw new Error(`Workflow is not in an approvable state: ${workflow.status}`);
      }
      
      // Find the approver
      const approverIndex = workflow.approvers.findIndex(
        approver => approver.userId === userId && approver.level === workflow.currentLevel
      );
      
      if (approverIndex === -1) {
        throw new Error('User is not an approver for the current level');
      }
      
      const updatedApprovers = [...workflow.approvers];
      updatedApprovers[approverIndex] = {
        ...updatedApprovers[approverIndex],
        status: 'APPROVED' as ApproverStatus,
        timestamp: new Date(),
        comments: comment
      };
      
      // Check if all approvers at this level have approved
      const currentLevelApprovers = updatedApprovers.filter(
        approver => approver.level === workflow.currentLevel
      );
      
      const allApproved = currentLevelApprovers.every(
        approver => approver.status === 'APPROVED' || approver.status === 'RECUSED'
      );
      
      let newStatus: ApprovalStatus = workflow.status;
      let newCurrentLevel = workflow.currentLevel;
      let completedAt = workflow.completedAt;
      
      if (allApproved) {
        // Move to the next level or complete the workflow
        const currentLevelIndex = workflow.requiredLevels.indexOf(workflow.currentLevel);
        
        if (currentLevelIndex === workflow.requiredLevels.length - 1) {
          // All levels completed, workflow is approved
          newStatus = 'APPROVED';
          completedAt = new Date();
        } else {
          // Move to the next level
          newCurrentLevel = workflow.requiredLevels[currentLevelIndex + 1];
        }
      }
      
      // Update the workflow
      const { data, error } = await this.supabase
        .from('approval_workflows')
        .update({
          status: newStatus,
          current_level: newCurrentLevel,
          approvers: updatedApprovers,
          completed_at: completedAt,
          updated_at: new Date(),
          comment: comment
        })
        .eq('id', workflowId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Return the updated workflow
      const updatedWorkflow: ApprovalWorkflowInternal = {
        id: data.id,
        entityId: data.entity_id,
        entityType: data.entity_type as EntityType,
        entityName: data.entity_name,
        status: data.status as ApprovalStatus,
        requiredLevels: data.required_levels as ApprovalLevel[],
        currentLevel: data.current_level as ApprovalLevel,
        approvers: data.approvers as Approver[],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
        escalationReason: data.escalation_reason,
        escalatedBy: data.escalated_by,
        escalatedAt: data.escalated_at ? new Date(data.escalated_at) : undefined,
        riskLevel: data.risk_level as RiskLevel,
        comment: data.comment,
        reason: data.reason,
        requiredApprovals: data.required_levels.length,
        currentApprovals: data.approvers.filter((a: any) => a.status === 'APPROVED').length
      };
      
      const workflowIndex = this.workflows.findIndex(w => w.id === workflowId);
      if (workflowIndex !== -1) {
        this.workflows[workflowIndex] = updatedWorkflow;
      }
      
      return this.convertToExternalWorkflow(updatedWorkflow);
    } catch (error) {
      console.error('Error approving workflow:', error);
      throw error;
    }
  }

  // Reject a workflow
  async rejectWorkflow(
    workflowId: string,
    userId: string,
    reason: string
  ): Promise<ApprovalWorkflow> {
    try {
      // Get the current workflow
      const workflow = await this.getWorkflowById(workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }
      
      if (workflow.status !== 'PENDING' && workflow.status !== 'ESCALATED') {
        throw new Error(`Workflow is not in a rejectable state: ${workflow.status}`);
      }
      
      // Find the approver
      const approverIndex = workflow.approvers.findIndex(
        approver => approver.userId === userId && approver.level === workflow.currentLevel
      );
      
      if (approverIndex === -1) {
        throw new Error('User is not an approver for the current level');
      }
      
      const updatedApprovers = [...workflow.approvers];
      updatedApprovers[approverIndex] = {
        ...updatedApprovers[approverIndex],
        status: 'REJECTED' as ApproverStatus,
        timestamp: new Date(),
        comments: reason
      };
      
      // Update the workflow
      const { data, error } = await this.supabase
        .from('approval_workflows')
        .update({
          status: 'REJECTED' as ApprovalStatus,
          approvers: updatedApprovers,
          completed_at: new Date(),
          updated_at: new Date(),
          reason: reason
        })
        .eq('id', workflowId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Return the updated workflow
      const updatedWorkflow: ApprovalWorkflowInternal = {
        id: data.id,
        entityId: data.entity_id,
        entityType: data.entity_type as EntityType,
        entityName: data.entity_name,
        status: data.status as ApprovalStatus,
        requiredLevels: data.required_levels as ApprovalLevel[],
        currentLevel: data.current_level as ApprovalLevel,
        approvers: data.approvers as Approver[],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
        escalationReason: data.escalation_reason,
        escalatedBy: data.escalated_by,
        escalatedAt: data.escalated_at ? new Date(data.escalated_at) : undefined,
        riskLevel: data.risk_level as RiskLevel,
        comment: data.comment,
        reason: data.reason,
        requiredApprovals: data.required_levels.length,
        currentApprovals: data.approvers.filter((a: any) => a.status === 'APPROVED').length
      };
      
      const workflowIndex = this.workflows.findIndex(w => w.id === workflowId);
      if (workflowIndex !== -1) {
        this.workflows[workflowIndex] = updatedWorkflow;
      }
      
      return this.convertToExternalWorkflow(updatedWorkflow);
    } catch (error) {
      console.error('Error rejecting workflow:', error);
      throw error;
    }
  }

  // Escalate a workflow
  async escalateWorkflow(
    workflowId: string,
    userId: string,
    reason: string
  ): Promise<ApprovalWorkflow> {
    try {
      // Get the current workflow
      const workflow = await this.getWorkflowById(workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }
      
      if (workflow.status !== 'PENDING' && workflow.status !== 'ESCALATED') {
        throw new Error(`Workflow is not in an escalatable state: ${workflow.status}`);
      }
      
      // Find the approver
      const approverIndex = workflow.approvers.findIndex(
        approver => approver.userId === userId && approver.level === workflow.currentLevel
      );
      
      if (approverIndex === -1) {
        throw new Error('User is not an approver for the current level');
      }
      
      // Move directly to the highest level
      const highestLevel = workflow.requiredLevels[workflow.requiredLevels.length - 1];
      
      // Update the workflow
      const { data, error } = await this.supabase
        .from('approval_workflows')
        .update({
          status: 'ESCALATED' as ApprovalStatus,
          current_level: highestLevel,
          escalation_reason: reason,
          escalated_by: userId,
          escalated_at: new Date(),
          updated_at: new Date(),
          reason: reason
        })
        .eq('id', workflowId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Return the updated workflow
      const updatedWorkflow: ApprovalWorkflowInternal = {
        id: data.id,
        entityId: data.entity_id,
        entityType: data.entity_type as EntityType,
        entityName: data.entity_name,
        status: data.status as ApprovalStatus,
        requiredLevels: data.required_levels as ApprovalLevel[],
        currentLevel: data.current_level as ApprovalLevel,
        approvers: data.approvers as Approver[],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
        escalationReason: data.escalation_reason,
        escalatedBy: data.escalated_by,
        escalatedAt: data.escalated_at ? new Date(data.escalated_at) : undefined,
        riskLevel: data.risk_level as RiskLevel,
        comment: data.comment,
        reason: data.reason,
        requiredApprovals: data.required_levels.length,
        currentApprovals: data.approvers.filter((a: any) => a.status === 'APPROVED').length
      };
      
      const workflowIndex = this.workflows.findIndex(w => w.id === workflowId);
      if (workflowIndex !== -1) {
        this.workflows[workflowIndex] = updatedWorkflow;
      }
      
      return this.convertToExternalWorkflow(updatedWorkflow);
    } catch (error) {
      console.error('Error escalating workflow:', error);
      throw error;
    }
  }

  // Determine required approval levels based on risk level
  private getRequiredLevelsForRisk(riskLevel: RiskLevel): ApprovalLevel[] {
    switch (riskLevel) {
      case 'LOW':
        return ['L1'];
      case 'MEDIUM':
        return ['L1', 'L2'];
      case 'HIGH':
        return ['L1', 'L2', 'EXECUTIVE'];
      default:
        return ['L1'];
    }
  }

  // Get approvers for specified levels
  private async getApproversForLevels(levels: ApprovalLevel[]): Promise<Approver[]> {
    try {
      // This would normally fetch from a database table of users with their roles
      // For now, we'll return mock data
      const approvers: Approver[] = [];
      
      const mockUsers = {
        L1: [
          { userId: 'user_l1_1', role: 'COMPLIANCE_OFFICER' as ApproverRole },
          { userId: 'user_l1_2', role: 'COMPLIANCE_OFFICER' as ApproverRole }
        ],
        L2: [
          { userId: 'user_l2_1', role: 'MANAGER' as ApproverRole }
        ],
        EXECUTIVE: [
          { userId: 'user_ex_1', role: 'DIRECTOR' as ApproverRole },
          { userId: 'user_ex_2', role: 'EXECUTIVE' as ApproverRole }
        ]
      };
      
      for (const level of levels) {
        for (const user of mockUsers[level]) {
          approvers.push({
            userId: user.userId,
            level,
            role: user.role,
            status: 'PENDING' as ApproverStatus
          });
        }
      }
      
      return approvers;
    } catch (error) {
      console.error('Error getting approvers:', error);
      throw error;
    }
  }

  // Get all workflows
  async getAllWorkflows(entityType?: EntityType): Promise<ApprovalWorkflow[]> {
    let filteredWorkflows = this.workflows;
    
    if (entityType) {
      filteredWorkflows = this.workflows.filter(workflow => workflow.entityType === entityType);
    }
    
    // Convert internal workflows to external format
    return filteredWorkflows.map(workflow => this.convertToExternalWorkflow(workflow));
  }

  // Get a batch of workflows suitable for batch processing
  async getWorkflowsForBatch(
    entityType?: EntityType,
    statuses: ApprovalStatus[] = ['PENDING'],
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    workflows: ApprovalWorkflow[], 
    total: number
  }> {
    try {
      // Start building query
      let query = this.supabase
        .from('approval_workflows')
        .select('*', { count: 'exact' });
      
      // Add filters
      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      
      if (statuses && statuses.length > 0) {
        query = query.in('status', statuses);
      }
      
      // Add pagination
      query = query.range(offset, offset + limit - 1);
      
      // Execute query
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      // Format the response to match ApprovalWorkflow type
      const workflows = (data || []).map(item => ({
        id: item.id,
        entityId: item.entity_id,
        entityType: item.entity_type as EntityType,
        entityName: item.entity_name,
        status: item.status as ApprovalStatus,
        createdAt: new Date(item.created_at),
        updatedAt: item.updated_at ? new Date(item.updated_at) : undefined,
        riskLevel: item.risk_level as RiskLevel,
        updatedBy: item.updated_by ? {
          id: item.updated_by.id,
          name: item.updated_by.name,
          role: item.updated_by.role
        } : undefined,
        comment: item.comment,
        reason: item.rejection_reason || item.escalation_reason,
        requiredApprovals: item.required_levels?.length || 0,
        currentApprovals: item.approvers?.filter((a: any) => a.status === 'APPROVED').length || 0,
        approvers: (item.approvers || []).map((a: any) => ({
          userId: a.userId,
          status: a.status,
          timestamp: a.timestamp,
          comments: a.comments
        }))
      }));
      
      return { 
        workflows, 
        total: count || workflows.length 
      };
    } catch (error) {
      console.error('Error getting batch workflows:', error);
      throw error;
    }
  }
  
  // Process a batch of workflows (approve or reject)
  async processBatch(
    workflowIds: string[],
    action: 'approve' | 'reject',
    userId: string,
    comment?: string,
    rejectionReason?: string
  ): Promise<{ 
    successful: string[], 
    failed: { id: string, error: string }[] 
  }> {
    const successful: string[] = [];
    const failed: { id: string, error: string }[] = [];
    
    // Process each workflow sequentially to maintain data integrity
    for (const workflowId of workflowIds) {
      try {
        if (action === 'approve') {
          await this.approveWorkflow(workflowId, userId, comment);
        } else if (action === 'reject') {
          if (!rejectionReason) {
            throw new Error('Rejection reason is required');
          }
          await this.rejectWorkflow(workflowId, userId, rejectionReason);
        }
        successful.push(workflowId);
      } catch (error: any) {
        failed.push({
          id: workflowId,
          error: error.message || 'Unknown error occurred'
        });
      }
    }
    
    return { successful, failed };
  }
}