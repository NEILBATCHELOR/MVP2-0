import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/core/database';

export interface ApprovalStep {
  role: string;
  order: number;
  isRequired: boolean;
  timeoutHours?: number;
}

export interface ApprovalWorkflow {
  id: string;
  investorId: string;
  type: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'expired';
  currentStep: number;
  steps: ApprovalStep[];
  approvals: Array<{
    step: number;
    role: string;
    approvedBy: string;
    approvedAt: string;
    comments?: string;
  }>;
  rejections: Array<{
    step: number;
    role: string;
    rejectedBy: string;
    rejectedAt: string;
    reason: string;
  }>;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export class ApprovalWorkflowService {
  private static instance: ApprovalWorkflowService;
  private supabase;

  private constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  public static getInstance(): ApprovalWorkflowService {
    if (!ApprovalWorkflowService.instance) {
      ApprovalWorkflowService.instance = new ApprovalWorkflowService();
    }
    return ApprovalWorkflowService.instance;
  }

  // Workflow Templates
  private readonly workflowTemplates = {
    high_risk_investor: [
      { role: 'compliance_officer', order: 1, isRequired: true },
      { role: 'risk_manager', order: 2, isRequired: true },
      { role: 'compliance_director', order: 3, isRequired: true }
    ],
    extreme_risk_investor: [
      { role: 'compliance_officer', order: 1, isRequired: true },
      { role: 'risk_manager', order: 2, isRequired: true },
      { role: 'compliance_director', order: 3, isRequired: true },
      { role: 'board_member', order: 4, isRequired: true }
    ],
    large_transaction: [
      { role: 'compliance_officer', order: 1, isRequired: true },
      { role: 'risk_manager', order: 2, isRequired: true },
      { role: 'finance_director', order: 3, isRequired: true }
    ]
  };

  // Create Approval Workflow
  async createWorkflow(params: {
    investorId: string;
    type: keyof typeof ApprovalWorkflowService.prototype.workflowTemplates;
    metadata?: Record<string, any>;
  }): Promise<ApprovalWorkflow> {
    const steps = this.workflowTemplates[params.type];
    if (!steps) {
      throw new Error(`Invalid workflow type: ${params.type}`);
    }

    const workflow: Omit<ApprovalWorkflow, 'id'> = {
      investorId: params.investorId,
      type: params.type,
      status: 'pending',
      currentStep: 1,
      steps,
      approvals: [],
      rejections: [],
      metadata: params.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('approval_workflows')
      .insert([workflow])
      .select()
      .single();

    if (error) throw error;
    return data as ApprovalWorkflow;
  }

  // Submit Approval
  async submitApproval(params: {
    workflowId: string;
    role: string;
    userId: string;
    comments?: string;
  }): Promise<ApprovalWorkflow> {
    const workflow = await this.getWorkflow(params.workflowId);
    
    if (workflow.status !== 'pending' && workflow.status !== 'in_progress') {
      throw new Error(`Cannot approve workflow in ${workflow.status} status`);
    }

    const currentStep = workflow.steps.find(s => s.order === workflow.currentStep);
    if (!currentStep) {
      throw new Error('Invalid workflow step');
    }

    if (currentStep.role !== params.role) {
      throw new Error('Unauthorized role for current step');
    }

    const approval = {
      step: workflow.currentStep,
      role: params.role,
      approvedBy: params.userId,
      approvedAt: new Date().toISOString(),
      comments: params.comments
    };

    const updatedWorkflow = {
      ...workflow,
      approvals: [...workflow.approvals, approval],
      currentStep: workflow.currentStep + 1,
      status: workflow.currentStep === workflow.steps.length ? 'approved' : 'in_progress',
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('approval_workflows')
      .update(updatedWorkflow)
      .eq('id', params.workflowId)
      .select()
      .single();

    if (error) throw error;
    return data as ApprovalWorkflow;
  }

  // Submit Rejection
  async submitRejection(params: {
    workflowId: string;
    role: string;
    userId: string;
    reason: string;
  }): Promise<ApprovalWorkflow> {
    const workflow = await this.getWorkflow(params.workflowId);
    
    if (workflow.status !== 'pending' && workflow.status !== 'in_progress') {
      throw new Error(`Cannot reject workflow in ${workflow.status} status`);
    }

    const currentStep = workflow.steps.find(s => s.order === workflow.currentStep);
    if (!currentStep) {
      throw new Error('Invalid workflow step');
    }

    if (currentStep.role !== params.role) {
      throw new Error('Unauthorized role for current step');
    }

    const rejection = {
      step: workflow.currentStep,
      role: params.role,
      rejectedBy: params.userId,
      rejectedAt: new Date().toISOString(),
      reason: params.reason
    };

    const updatedWorkflow = {
      ...workflow,
      rejections: [...workflow.rejections, rejection],
      status: 'rejected',
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('approval_workflows')
      .update(updatedWorkflow)
      .eq('id', params.workflowId)
      .select()
      .single();

    if (error) throw error;
    return data as ApprovalWorkflow;
  }

  // Get Workflow
  async getWorkflow(workflowId: string): Promise<ApprovalWorkflow> {
    const { data, error } = await this.supabase
      .from('approval_workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (error) throw error;
    return data as ApprovalWorkflow;
  }

  // Get Investor Workflows
  async getInvestorWorkflows(investorId: string): Promise<ApprovalWorkflow[]> {
    const { data, error } = await this.supabase
      .from('approval_workflows')
      .select('*')
      .eq('investor_id', investorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ApprovalWorkflow[];
  }

  // Get Pending Approvals by Role
  async getPendingApprovalsByRole(role: string): Promise<ApprovalWorkflow[]> {
    const { data, error } = await this.supabase
      .from('approval_workflows')
      .select('*')
      .in('status', ['pending', 'in_progress'])
      .contains('steps', [{ role }]);

    if (error) throw error;
    return (data as ApprovalWorkflow[]).filter(
      workflow => workflow.steps[workflow.currentStep - 1]?.role === role
    );
  }

  // Check if workflow requires approval from role
  async requiresApprovalFrom(params: {
    workflowId: string;
    role: string;
  }): Promise<boolean> {
    const workflow = await this.getWorkflow(params.workflowId);
    return workflow.steps.some(step => 
      step.role === params.role && 
      step.order >= workflow.currentStep
    );
  }

  // Handle Expired Workflows
  async handleExpiredWorkflows(): Promise<void> {
    const { data: workflows, error } = await this.supabase
      .from('approval_workflows')
      .select('*')
      .in('status', ['pending', 'in_progress']);

    if (error) throw error;

    const now = new Date();
    const expiredWorkflows = (workflows as ApprovalWorkflow[]).filter(workflow => {
      const currentStep = workflow.steps[workflow.currentStep - 1];
      if (!currentStep?.timeoutHours) return false;

      const stepStartTime = new Date(workflow.updatedAt);
      const timeoutMs = currentStep.timeoutHours * 60 * 60 * 1000;
      return now.getTime() - stepStartTime.getTime() > timeoutMs;
    });

    await Promise.all(
      expiredWorkflows.map(workflow =>
        this.supabase
          .from('approval_workflows')
          .update({ status: 'expired', updatedAt: now.toISOString() })
          .eq('id', workflow.id)
      )
    );
  }

  // Batch Create Workflows
  async batchCreateWorkflows(workflows: Array<{
    investorId: string;
    type: keyof typeof ApprovalWorkflowService.prototype.workflowTemplates;
    metadata?: Record<string, any>;
  }>): Promise<ApprovalWorkflow[]> {
    return Promise.all(
      workflows.map(workflow => this.createWorkflow(workflow))
    );
  }
}