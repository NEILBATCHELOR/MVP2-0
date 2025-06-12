import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Shield, 
  Users, 
  Clock, 
  ArrowRight,
  ChevronRight
} from "lucide-react";
import { 
  ApprovalLevel, 
  ApprovalStatus, 
  Approver,
  ApprovalEntityType
} from '@/types/domain/compliance/compliance';

// Extended ApprovalWorkflow type that includes all the properties used in this component
interface ExtendedApprovalWorkflow {
  id: string;
  entityId: string;
  entityType: ApprovalEntityType;
  status: ApprovalStatus | 'IN_PROGRESS';
  createdAt: Date;
  approvers: Approver[];
  currentLevel: ApprovalLevel;
  requiredLevels: ApprovalLevel[];
  escalationReason?: string;
  completedAt?: Date;
}

interface ApprovalWorkflowProps {
  workflow: ExtendedApprovalWorkflow;
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
  onApprove: (workflowId: string, comments?: string) => Promise<void>;
  onReject: (workflowId: string, reason: string) => Promise<void>;
  onEscalate: (workflowId: string, reason: string) => Promise<void>;
}

export const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({
  workflow,
  currentUser,
  onApprove,
  onReject,
  onEscalate,
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [approvalComments, setApprovalComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | 'escalate' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if current user is an approver at the current level
  const isCurrentLevelApprover = workflow.approvers.some(
    approver => approver.userId === currentUser.id && approver.level === workflow.currentLevel
  );
  
  // Check if current user has already acted on this workflow
  const currentUserApprover = workflow.approvers.find(approver => approver.userId === currentUser.id);
  const hasActed = currentUserApprover && currentUserApprover.status !== 'PENDING';
  
  // Calculate approval progress
  const totalApprovers = workflow.approvers.length;
  const approvedCount = workflow.approvers.filter(a => a.status === 'APPROVED').length;
  const rejectedCount = workflow.approvers.filter(a => a.status === 'REJECTED').length;
  const progressPercent = Math.round((approvedCount / totalApprovers) * 100);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Handle approval submission
  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(workflow.id, approvalComments);
    } catch (error) {
      console.error('Error approving workflow:', error);
    } finally {
      setIsSubmitting(false);
      setAction(null);
    }
  };
  
  // Handle rejection submission
  const handleReject = async () => {
    if (!rejectionReason) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onReject(workflow.id, rejectionReason);
    } catch (error) {
      console.error('Error rejecting workflow:', error);
    } finally {
      setIsSubmitting(false);
      setAction(null);
    }
  };
  
  // Handle escalation submission
  const handleEscalate = async () => {
    if (!escalationReason) {
      alert('Please provide a reason for escalation');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onEscalate(workflow.id, escalationReason);
    } catch (error) {
      console.error('Error escalating workflow:', error);
    } finally {
      setIsSubmitting(false);
      setAction(null);
    }
  };
  
  // Get entity type label
  const getEntityTypeLabel = (type: ApprovalEntityType) => {
    switch (type) {
      case 'INVESTOR':
        return 'Investor';
      case 'ISSUER':
        return 'Issuer';
      case 'TRANSACTION':
        return 'Transaction';
      default:
        return type;
    }
  };
  
  // Get approval level label
  const getApprovalLevelLabel = (level: ApprovalLevel) => {
    switch (level) {
      case 'L1':
        return 'Level 1 (Initial)';
      case 'L2':
        return 'Level 2 (Secondary)';
      case 'EXECUTIVE':
        return 'Executive Approval';
      default:
        return level;
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: ApprovalStatus | 'IN_PROGRESS') => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-500">Approved</Badge>;
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
  
  // Get approver status badge
  const getApproverStatusBadge = (status: Approver['status']) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="outline" className="border-green-500 text-green-500">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="border-red-500 text-red-500">Rejected</Badge>;
      case 'RECUSED':
        return <Badge variant="outline" className="border-gray-500 text-gray-500">Recused</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Approval Workflow</CardTitle>
            <CardDescription>
              {getEntityTypeLabel(workflow.entityType)} approval process
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(workflow.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label className="text-muted-foreground">Entity Type</Label>
              <p className="font-medium">{getEntityTypeLabel(workflow.entityType)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Entity ID</Label>
              <p className="font-medium truncate">{workflow.entityId}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Created On</Label>
              <p className="font-medium">{formatDate(workflow.createdAt.toString())}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-muted-foreground">Approval Progress</Label>
              <span className="text-sm">{approvedCount} of {totalApprovers} approvers</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <Label className="text-muted-foreground">Approval Levels</Label>
            <div className="flex items-center">
              {workflow.requiredLevels.map((level, index) => (
                <React.Fragment key={level}>
                  <div 
                    className={`px-3 py-1 rounded-md border ${
                      workflow.currentLevel === level 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-background'
                    }`}
                  >
                    {getApprovalLevelLabel(level)}
                  </div>
                  {index < workflow.requiredLevels.length - 1 && (
                    <ChevronRight className="mx-1 text-muted-foreground" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="approvers">Approvers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Current Level</Label>
                  <p className="font-medium">{getApprovalLevelLabel(workflow.currentLevel)}</p>
                </div>
                
                {workflow.status === 'REJECTED' && (
                  <div>
                    <Label className="text-muted-foreground">Rejection Reason</Label>
                    <p className="font-medium text-destructive">
                      {workflow.approvers.find(a => a.status === 'REJECTED')?.comments || 'No reason provided'}
                    </p>
                  </div>
                )}
                
                {workflow.status === 'ESCALATED' && (
                  <div>
                    <Label className="text-muted-foreground">Escalation Reason</Label>
                    <p className="font-medium text-amber-600">{workflow.escalationReason}</p>
                  </div>
                )}
                
                {workflow.completedAt && (
                  <div>
                    <Label className="text-muted-foreground">Completed On</Label>
                    <p className="font-medium">{formatDate(workflow.completedAt.toString())}</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="approvers" className="mt-4">
              <div className="space-y-4">
                {workflow.requiredLevels.map(level => (
                  <div key={level} className="space-y-2">
                    <h3 className="text-sm font-medium">{getApprovalLevelLabel(level)}</h3>
                    <div className="border rounded-md divide-y">
                      {workflow.approvers
                        .filter(approver => approver.level === level)
                        .map(approver => (
                          <div key={approver.userId} className="p-3 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              {approver.status === 'APPROVED' ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : approver.status === 'REJECTED' ? (
                                <XCircle className="h-5 w-5 text-destructive" />
                              ) : (
                                <Clock className="h-5 w-5 text-muted-foreground" />
                              )}
                              <div>
                                <p className="font-medium">
                                  {approver.userId === currentUser.id ? 'You' : approver.userId}
                                </p>
                                <p className="text-sm text-muted-foreground">{approver.role}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getApproverStatusBadge(approver.status)}
                              {approver.timestamp && (
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(approver.timestamp.toString())}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
                
                {workflow.approvers.some(a => a.comments) && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-2">Comments</h3>
                    <div className="space-y-3">
                      {workflow.approvers
                        .filter(a => a.comments)
                        .map((approver, i) => (
                          <div key={i} className="p-3 border rounded-md">
                            <div className="flex justify-between items-center mb-2">
                              <p className="font-medium">
                                {approver.userId === currentUser.id ? 'You' : approver.userId}
                              </p>
                              <Badge variant="outline">{approver.role}</Badge>
                            </div>
                            <p className="text-sm">{approver.comments}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          {workflow.status === 'IN_PROGRESS' && isCurrentLevelApprover && !hasActed && !action && (
            <div className="pt-4 flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setAction('escalate')}
              >
                Escalate
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setAction('reject')}
              >
                Reject
              </Button>
              <Button 
                variant="default" 
                onClick={() => setAction('approve')}
              >
                Approve
              </Button>
            </div>
          )}
          
          {action === 'approve' && (
            <div className="pt-4 space-y-4 border-t">
              <div>
                <Label htmlFor="approval-comments">Comments (Optional)</Label>
                <Textarea
                  id="approval-comments"
                  placeholder="Add any comments about this approval..."
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setAction(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  variant="default" 
                  onClick={handleApprove}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="h-4 w-4 mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Confirm Approval'
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {action === 'reject' && (
            <div className="pt-4 space-y-4 border-t">
              <div>
                <Label htmlFor="rejection-reason" className="text-destructive">Rejection Reason</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Explain why this is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="border-destructive"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setAction(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleReject}
                  disabled={isSubmitting || !rejectionReason}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="h-4 w-4 mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Confirm Rejection'
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {action === 'escalate' && (
            <div className="pt-4 space-y-4 border-t">
              <div>
                <Label htmlFor="escalation-reason">Escalation Reason</Label>
                <Textarea
                  id="escalation-reason"
                  placeholder="Explain why this needs escalation..."
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setAction(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  variant="default" 
                  onClick={handleEscalate}
                  disabled={isSubmitting || !escalationReason}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="h-4 w-4 mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Confirm Escalation'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ApprovalWorkflow;