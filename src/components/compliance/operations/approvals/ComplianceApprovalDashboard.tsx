import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  UserCheck, 
  Building, 
  ArrowRight, 
  Search, 
  Filter, 
  RefreshCw,
  Calendar, 
  AlertTriangle,
  Clock
} from "lucide-react";
import { ApprovalWorkflow as ApprovalWorkflowComponent } from './components/ApprovalWorkflow';
import { ApprovalWorkflowService } from './services/approvalWorkflowService';
import type { 
  ApprovalWorkflow, 
  ApprovalEntityType, 
  ApprovalLevel, 
  ApprovalStatus,
  Approver
} from '@/types/domain/compliance/compliance';

// Define extended workflow interface that includes all properties needed by ApprovalWorkflowComponent
interface ExtendedApprovalWorkflow extends Omit<ApprovalWorkflow, 'approvers'> {
  approvers: Approver[];
  currentLevel: ApprovalLevel;
  requiredLevels: ApprovalLevel[];
}

// Define internal types for this component
type ExtendedApprovalStatus = ApprovalStatus | 'IN_PROGRESS' | 'ALL';
type TabType = 'all' | 'investors' | 'issuers' | 'transactions';

interface ComplianceApprovalDashboardProps {
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
}

export const ComplianceApprovalDashboard: React.FC<ComplianceApprovalDashboardProps> = ({
  currentUser = { id: '1', name: 'Admin User', role: 'COMPLIANCE_OFFICER' } // Default for development
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [entityType, setEntityType] = useState<ApprovalEntityType | 'ALL'>('ALL');
  const [status, setStatus] = useState<ExtendedApprovalStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ExtendedApprovalWorkflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load workflows that need approval by the current user
  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        setIsLoading(true);
        const workflowService = ApprovalWorkflowService.getInstance();
        const pendingWorkflows = await workflowService.getWorkflowsForApprover(currentUser.id);
        setWorkflows(pendingWorkflows);
      } catch (err) {
        console.error('Error loading workflows:', err);
        setError(err instanceof Error ? err.message : 'Failed to load approval workflows');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadWorkflows();
  }, [currentUser.id]);
  
  // Filter workflows based on current filters
  const filteredWorkflows = workflows.filter(workflow => {
    // Filter by entity type
    if (entityType !== 'ALL' && workflow.entityType !== entityType) {
      return false;
    }
    
    // Filter by status
    if (status !== 'ALL' && workflow.status !== status) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm && !workflow.entityId.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filter by tab selection
    if (activeTab === 'investors' && workflow.entityType !== 'INVESTOR') {
      return false;
    }
    if (activeTab === 'issuers' && workflow.entityType !== 'ISSUER') {
      return false;
    }
    // Update transaction filter to use valid types
    if (activeTab === 'transactions') {
      return false; // Since 'TRANSACTION' is not in EntityType, filter out all
    }
    
    return true;
  });
  
  // Handle workflow approval
  const handleApprove = async (workflowId: string, comments?: string) => {
    try {
      const workflowService = ApprovalWorkflowService.getInstance();
      const updatedWorkflow = await workflowService.approveWorkflow(
        workflowId,
        currentUser.id,
        comments
      );
      
      // Update the workflows list and selected workflow
      setWorkflows(prev => prev.map(wf => 
        wf.id === workflowId ? updatedWorkflow : wf
      ));
      
      if (selectedWorkflow?.id === workflowId) {
        setSelectedWorkflow(updatedWorkflow as ExtendedApprovalWorkflow);
      }
    } catch (err) {
      console.error('Error approving workflow:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve workflow');
    }
  };
  
  // Handle workflow rejection
  const handleReject = async (workflowId: string, reason: string) => {
    try {
      const workflowService = ApprovalWorkflowService.getInstance();
      const updatedWorkflow = await workflowService.rejectWorkflow(
        workflowId,
        currentUser.id,
        reason
      );
      
      // Update the workflows list and selected workflow
      setWorkflows(prev => prev.map(wf => 
        wf.id === workflowId ? updatedWorkflow : wf
      ));
      
      if (selectedWorkflow?.id === workflowId) {
        setSelectedWorkflow(updatedWorkflow as ExtendedApprovalWorkflow);
      }
    } catch (err) {
      console.error('Error rejecting workflow:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject workflow');
    }
  };
  
  // Handle workflow escalation
  const handleEscalate = async (workflowId: string, reason: string) => {
    try {
      const workflowService = ApprovalWorkflowService.getInstance();
      const updatedWorkflow = await workflowService.escalateWorkflow(
        workflowId,
        currentUser.id,
        reason
      );
      
      // Update the workflows list and selected workflow
      setWorkflows(prev => prev.map(wf => 
        wf.id === workflowId ? updatedWorkflow : wf
      ));
      
      if (selectedWorkflow?.id === workflowId) {
        setSelectedWorkflow(updatedWorkflow as ExtendedApprovalWorkflow);
      }
    } catch (err) {
      console.error('Error escalating workflow:', err);
      setError(err instanceof Error ? err.message : 'Failed to escalate workflow');
    }
  };
  
  // Helper function for entity type icon
  const getEntityTypeIcon = (type: ApprovalEntityType) => {
    switch (type) {
      case 'INVESTOR':
        return <UserCheck className="h-4 w-4" />;
      case 'ISSUER':
        return <Building className="h-4 w-4" />;
      default:
        return <ArrowRight className="h-4 w-4" />;
    }
  };
  
  // Helper function for status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'ESCALATED':
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Escalated</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">In Progress</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };
  
  // Format date for display
  const formatDate = (dateString: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateString);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Compliance Approval Dashboard</h2>
          <p className="text-muted-foreground">
            Manage and process approval workflows for high-risk entities
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setSelectedWorkflow(null)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex space-x-4">
        <div className="w-1/3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Approval Queue</CardTitle>
              <CardDescription>
                Workflows requiring your approval
              </CardDescription>
              
              <div className="flex items-center space-x-2 mt-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by ID"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex space-x-2 mt-2">
                <Select
                  value={entityType}
                  onValueChange={(value) => setEntityType(value as ApprovalEntityType | 'ALL')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Entity Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="INVESTOR">Investor</SelectItem>
                    <SelectItem value="ISSUER">Issuer</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as ExtendedApprovalStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="ESCALATED">Escalated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="h-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="investors">Investors</TabsTrigger>
                  <TabsTrigger value="issuers">Issuers</TabsTrigger>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-4 h-[calc(100vh-400px)] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    </div>
                  ) : filteredWorkflows.length > 0 ? (
                    <div className="space-y-4">
                      {filteredWorkflows.map(workflow => (
                        <div
                          key={workflow.id}
                          className={`p-4 border rounded-md cursor-pointer transition-colors ${
                            selectedWorkflow?.id === workflow.id 
                              ? 'border-blue-500 bg-blue-50'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedWorkflow(workflow as ExtendedApprovalWorkflow)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              {getEntityTypeIcon(workflow.entityType)}
                              <span className="ml-2 font-medium">
                                {workflow.entityType} {workflow.entityId.substring(0, 8)}...
                              </span>
                            </div>
                            {getStatusBadge(workflow.status)}
                          </div>
                          
                          <div className="mt-1 flex items-center text-xs text-muted-foreground">
                            <Calendar className="mr-1 h-3 w-3" />
                            <span>Created: {formatDate(workflow.createdAt)}</span>
                          </div>
                          
                          {workflow.status === 'PENDING' && (
                            <div className="mt-2 flex items-center text-xs">
                              <Clock className="mr-1 h-3 w-3 text-blue-500" />
                              <span className="text-blue-500">Awaiting your approval</span>
                            </div>
                          )}
                          
                          {(workflow.status as ApprovalStatus) === 'ESCALATED' && (
                            <div className="mt-2 flex items-center text-xs">
                              <AlertTriangle className="mr-1 h-3 w-3 text-amber-500" />
                              <span className="text-amber-500">Escalated for review</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-muted-foreground">No approval workflows found</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="investors" className="mt-4">
                  {/* Same content structure as "all" tab but filtered for investors */}
                </TabsContent>
                
                <TabsContent value="issuers" className="mt-4">
                  {/* Same content structure as "all" tab but filtered for issuers */}
                </TabsContent>
                
                <TabsContent value="transactions" className="mt-4">
                  {/* Same content structure as "all" tab but filtered for transactions */}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div className="w-2/3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>
                {selectedWorkflow 
                  ? `${selectedWorkflow.entityType} Approval - ${selectedWorkflow.entityId.substring(0, 12)}...` 
                  : 'Select a Workflow'}
              </CardTitle>
              <CardDescription>
                {selectedWorkflow 
                  ? 'Multi-signature approval workflow' 
                  : 'Select a workflow from the queue to review'}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {selectedWorkflow ? (
                <ApprovalWorkflowComponent
                  workflow={selectedWorkflow}
                  currentUser={currentUser}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onEscalate={handleEscalate}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <UserCheck className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
                  <h3 className="text-lg font-semibold">No Workflow Selected</h3>
                  <p className="text-muted-foreground max-w-md mt-2">
                    Select a workflow from the approval queue to review and take action.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ComplianceApprovalDashboard; 