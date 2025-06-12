import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertCircle, 
  CheckCircle, 
  X, 
  Search, 
  Filter, 
  ArrowDownUp, 
  FileCheck, 
  ShieldAlert,
  UserCheck,
  Users,
  RefreshCw,
  ChevronRight
} from "lucide-react";
import { ApprovalWorkflowService } from '../services/approvalWorkflowService';
import { ApprovalWorkflow, ApprovalStatus, EntityType } from '@/types/domain/compliance/compliance';

// Define a union type that includes additional statuses used in this component
type ExtendedApprovalStatus = ApprovalStatus | 'ERROR';

// Define the workflow status type that matches what's in the API
type WorkflowStatus = 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';

interface BatchApprovalProcessorProps {
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
  entityType?: EntityType;
  onBatchProcessed?: (results: Record<string, ExtendedApprovalStatus>) => void;
}

export const BatchApprovalProcessor: React.FC<BatchApprovalProcessorProps> = ({
  currentUser,
  entityType = 'INVESTOR',
  onBatchProcessed
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [selectedWorkflows, setSelectedWorkflows] = useState<Set<string>>(new Set());
  const [filteredWorkflows, setFilteredWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  }>({ key: 'createdAt', direction: 'descending' });
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [approvalComment, setApprovalComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Fetch workflows on component mount and tab change
  useEffect(() => {
    fetchWorkflows();
  }, [activeTab, entityType]);
  
  // Filter and sort workflows when data changes
  useEffect(() => {
    let filtered = [...workflows];
    
    // Filter by status - cast the status to WorkflowStatus to avoid type errors
    if (activeTab === 'pending') {
      filtered = filtered.filter(w => (w.status as WorkflowStatus) === 'PENDING');
    } else if (activeTab === 'approved') {
      filtered = filtered.filter(w => (w.status as WorkflowStatus) === 'APPROVED');
    } else if (activeTab === 'rejected') {
      filtered = filtered.filter(w => (w.status as WorkflowStatus) === 'REJECTED');
    } else if (activeTab === 'escalated') {
      // Use type assertion for ESCALATED status since we know it can be a valid status in the system
      filtered = filtered.filter(w => (w.status as ApprovalStatus) === 'ESCALATED');
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(w => 
        w.id.toLowerCase().includes(term) || 
        w.entityId.toLowerCase().includes(term) ||
        (w.entityName && w.entityName.toLowerCase().includes(term))
      );
    }
    
    // Sort the data
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'riskLevel':
          aValue = a.riskLevel;
          bValue = b.riskLevel;
          break;
        case 'entityName':
          aValue = a.entityName || '';
          bValue = b.entityName || '';
          break;
        default:
          aValue = a[sortConfig.key as keyof ApprovalWorkflow];
          bValue = b[sortConfig.key as keyof ApprovalWorkflow];
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    
    setFilteredWorkflows(filtered);
  }, [workflows, activeTab, searchTerm, sortConfig]);
  
  const fetchWorkflows = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const workflowService = ApprovalWorkflowService.getInstance();
      const fetchedWorkflows = await workflowService.getAllWorkflows(entityType);
      setWorkflows(fetchedWorkflows);
    } catch (err) {
      console.error('Error fetching workflows:', err);
      setError(err instanceof Error ? err.message : 'Failed to load approval workflows');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSort = (key: string) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        return {
          key,
          direction: prevConfig.direction === 'ascending' ? 'descending' : 'ascending'
        };
      }
      return { key, direction: 'ascending' };
    });
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set(selectedWorkflows);
      filteredWorkflows.forEach(workflow => {
        if ((workflow.status as WorkflowStatus) === 'PENDING') {
          newSelected.add(workflow.id);
        }
      });
      setSelectedWorkflows(newSelected);
    } else {
      setSelectedWorkflows(new Set());
    }
  };
  
  const handleSelectWorkflow = (workflowId: string, checked: boolean) => {
    const newSelected = new Set(selectedWorkflows);
    
    if (checked) {
      newSelected.add(workflowId);
    } else {
      newSelected.delete(workflowId);
    }
    
    setSelectedWorkflows(newSelected);
  };
  
  const handleBatchApprove = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessCount(0);
    
    try {
      const workflowService = ApprovalWorkflowService.getInstance();
      const results: Record<string, ExtendedApprovalStatus> = {};
      let successfulCount = 0;
      
      for (const workflowId of selectedWorkflows) {
        try {
          const updatedWorkflow = await workflowService.approveWorkflow(
            workflowId,
            currentUser.id,
            approvalComment
          );
          
          // Cast the status to ensure type safety
          results[workflowId] = updatedWorkflow.status as ExtendedApprovalStatus;
          successfulCount++;
        } catch (err) {
          console.error(`Error approving workflow ${workflowId}:`, err);
          results[workflowId] = 'ERROR';
        }
      }
      
      setSuccessCount(successfulCount);
      
      // Update workflows list
      fetchWorkflows();
      
      // Clear selection
      setSelectedWorkflows(new Set());
      
      if (onBatchProcessed) {
        onBatchProcessed(results);
      }
    } catch (err) {
      console.error('Batch approval error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process batch approval');
    } finally {
      setIsLoading(false);
      setIsApproveDialogOpen(false);
      setApprovalComment('');
    }
  };
  
  const handleBatchReject = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessCount(0);
    
    try {
      const workflowService = ApprovalWorkflowService.getInstance();
      const results: Record<string, ExtendedApprovalStatus> = {};
      let successfulCount = 0;
      
      for (const workflowId of selectedWorkflows) {
        try {
          const updatedWorkflow = await workflowService.rejectWorkflow(
            workflowId,
            currentUser.id,
            rejectionReason
          );
          
          // Cast the status to ensure type safety
          results[workflowId] = updatedWorkflow.status as ExtendedApprovalStatus;
          successfulCount++;
        } catch (err) {
          console.error(`Error rejecting workflow ${workflowId}:`, err);
          results[workflowId] = 'ERROR';
        }
      }
      
      setSuccessCount(successfulCount);
      
      // Update workflows list
      fetchWorkflows();
      
      // Clear selection
      setSelectedWorkflows(new Set());
      
      if (onBatchProcessed) {
        onBatchProcessed(results);
      }
    } catch (err) {
      console.error('Batch rejection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process batch rejection');
    } finally {
      setIsLoading(false);
      setIsRejectDialogOpen(false);
      setRejectionReason('');
    }
  };
  
  // Accept any status string to handle both WorkflowStatus and ApprovalStatus
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Approved
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Rejected
          </Badge>
        );
      case 'ESCALATED':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Escalated
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Pending
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">{status}</Badge>
        );
    }
  };
  
  const getRiskBadge = (riskLevel: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (riskLevel) {
      case 'LOW':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Low Risk
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Medium Risk
          </Badge>
        );
      case 'HIGH':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            High Risk
          </Badge>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Batch Approval Processing</CardTitle>
          <CardDescription>
            Process multiple compliance approval requests at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                <TabsTrigger value="escalated">Escalated</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="pl-8 w-[250px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={fetchWorkflows}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {successCount > 0 && (
              <Alert variant="default" className="mb-4 bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>Successfully processed {successCount} workflow{successCount !== 1 ? 's' : ''}</AlertDescription>
              </Alert>
            )}
            
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    {activeTab === 'pending' && (
                      <TableHead className="w-[50px]">
                        <Checkbox 
                          checked={selectedWorkflows.size > 0 && selectedWorkflows.size === filteredWorkflows.filter(w => (w.status as WorkflowStatus) === 'PENDING').length}
                          onCheckedChange={(checked) => handleSelectAll(checked === true)}
                        />
                      </TableHead>
                    )}
                    <TableHead className="cursor-pointer" onClick={() => handleSort('id')}>
                      <div className="flex items-center space-x-1">
                        <span>ID</span>
                        {sortConfig.key === 'id' && (
                          <ArrowDownUp className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('entityType')}>
                      <div className="flex items-center space-x-1">
                        <span>Type</span>
                        {sortConfig.key === 'entityType' && (
                          <ArrowDownUp className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('entityName')}>
                      <div className="flex items-center space-x-1">
                        <span>Name</span>
                        {sortConfig.key === 'entityName' && (
                          <ArrowDownUp className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('riskLevel')}>
                      <div className="flex items-center space-x-1">
                        <span>Risk Level</span>
                        {sortConfig.key === 'riskLevel' && (
                          <ArrowDownUp className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('createdAt')}>
                      <div className="flex items-center space-x-1">
                        <span>Date</span>
                        {sortConfig.key === 'createdAt' && (
                          <ArrowDownUp className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    {activeTab !== 'pending' && <TableHead>Updated By</TableHead>}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && !filteredWorkflows.length ? (
                    <TableRow>
                      <TableCell colSpan={activeTab === 'pending' ? 8 : 8} className="text-center py-8">
                        <div className="flex justify-center">
                          <Spinner className="h-6 w-6" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">Loading workflows...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredWorkflows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={activeTab === 'pending' ? 8 : 8} className="text-center py-8">
                        <p className="text-muted-foreground">No workflows found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredWorkflows.map((workflow) => (
                      <TableRow key={workflow.id}>
                        {activeTab === 'pending' && (
                          <TableCell>
                            <Checkbox 
                              checked={selectedWorkflows.has(workflow.id)}
                              onCheckedChange={(checked) => handleSelectWorkflow(workflow.id, checked === true)}
                              disabled={(workflow.status as WorkflowStatus) !== 'PENDING'}
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-medium">{workflow.id.substring(0, 8)}...</TableCell>
                        <TableCell>
                          {workflow.entityType === 'INVESTOR' ? (
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1 text-blue-600" />
                              <span>Investor</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <FileCheck className="h-4 w-4 mr-1 text-blue-600" />
                              <span>Issuer</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{workflow.entityName || workflow.entityId}</TableCell>
                        <TableCell>{getRiskBadge(workflow.riskLevel)}</TableCell>
                        <TableCell>{new Date(workflow.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{getStatusBadge(workflow.status)}</TableCell>
                        {activeTab !== 'pending' && (
                          <TableCell>
                            {workflow.updatedBy ? workflow.updatedBy.name : '-'}
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`/compliance/approvals/${workflow.id}`}>
                              View <ChevronRight className="ml-1 h-4 w-4" />
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {activeTab === 'pending' && selectedWorkflows.size > 0 && (
              <div className="flex justify-end space-x-2 mt-4">
                <span className="flex items-center text-sm mr-2 text-muted-foreground">
                  {selectedWorkflows.size} item{selectedWorkflows.size !== 1 ? 's' : ''} selected
                </span>
                <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <X className="mr-2 h-4 w-4" />
                      Reject Selected
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reject Selected Workflows</DialogTitle>
                      <DialogDescription>
                        You are about to reject {selectedWorkflows.size} workflow{selectedWorkflows.size !== 1 ? 's' : ''}. This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label htmlFor="reason" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Rejection Reason (Required)
                        </label>
                        <Textarea
                          id="reason"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Provide a reason for rejection..."
                          rows={4}
                          className="resize-none"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleBatchReject}
                        disabled={!rejectionReason.trim() || isLoading}
                      >
                        {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                        Reject
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve Selected
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Approve Selected Workflows</DialogTitle>
                      <DialogDescription>
                        You are about to approve {selectedWorkflows.size} workflow{selectedWorkflows.size !== 1 ? 's' : ''}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label htmlFor="comments" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Comments (Optional)
                        </label>
                        <Textarea
                          id="comments"
                          value={approvalComment}
                          onChange={(e) => setApprovalComment(e.target.value)}
                          placeholder="Add any additional comments..."
                          rows={4}
                          className="resize-none"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        variant="default" 
                        onClick={handleBatchApprove}
                        disabled={isLoading}
                      >
                        {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                        Approve
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BatchApprovalProcessor; 