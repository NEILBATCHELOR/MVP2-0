import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { CheckCircle, XCircle, Clock, Search } from "lucide-react";
import { Input } from "../ui/input";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import ApprovalWorkflow from "./ApprovalWorkflow";
import ApprovalNotifications from "./ApprovalNotifications";
import { useAuth } from "@/infrastructure/auth/AuthProvider";
import { 
  getPendingApprovalsForUser, 
  getCompletedApprovalsForUser,
  getApproversForEntity,
  getEntityDetails,
  approveEntity,
  rejectEntity 
} from "@/services/policy/approvalService";
import { UserService } from "@/services/user/userService";
import type { User } from "@/types/core/centralModels";
import type { Approver as CentralApprover } from "@/types/core/centralModels";

// Local interface for Approver that matches our component needs
interface Approver {
  id: string;
  name: string;
  email?: string; // Make email optional
  role: string;
  status?: "approved" | "rejected" | "pending";
  comment?: string;
  timestamp?: string;
  approved?: boolean; // Add this to match the CentralApprover interface
  avatarUrl?: string;
}

interface PolicyToApprove {
  id: string;
  name: string;
  type: string;
  description?: string;
  entity_type: "rule" | "template" | string;
  createdAt: string;
  createdBy?: {
    name: string;
    id: string;
  };
  approvers: Approver[];
  requiredApprovals?: number;
}

// Define an interface for notifications compatible with ApprovalNotifications
interface ApprovalNotification {
  id: string;
  policyId: string;
  policyName: string;
  type: "approval_request" | "approval_complete" | "approval_rejected";
  timestamp: string;
  read: boolean;
}

interface EnhancedApprovalDashboardProps {
  onViewPolicy?: (id: string) => void;
}

const EnhancedApprovalDashboard = ({ onViewPolicy }: EnhancedApprovalDashboardProps) => {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingApprovals, setPendingApprovals] = useState<PolicyToApprove[]>([]);
  const [completedApprovals, setCompletedApprovals] = useState<PolicyToApprove[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyToApprove | null>(null);
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const { user } = useAuth();

  // Fetch user profile when component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const profile = await UserService.getUserProfile(user.id);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Fetch approvals when component mounts
  useEffect(() => {
    const fetchApprovals = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const pending = await getPendingApprovalsForUser(user.id);
        const completed = await getCompletedApprovalsForUser(user.id);
        
        // Transform the data for the component
        const transformedPending = await Promise.all(
          pending.map(async (item) => {
            // Type guard to ensure entity_type is "rule" or "template"
            if (item.entity_type !== "rule" && item.entity_type !== "template") {
              throw new Error(`Invalid entity type: ${item.entity_type}`);
            }
            const details = await getEntityDetails(item.id, item.entity_type);
            const approversData = await getApproversForEntity(item.id);
            
            // Use type assertions to handle properties that may not exist
            const description = item.entity_type === 'rule' 
              ? (details as any).rule_details?.description 
              : (details as any).description;
            
            const createdByName = (details as any).created_by_name || 'Unknown';
            const createdById = (details as any).created_by || '';
            
            // Transform approvers data
            const formattedApprovers = approversData.map(a => ({
              id: a.user_id,
              name: (a.user as any)?.name || 'Unknown',
              email: (a.user as any)?.email || '',
              role: (a.user as any)?.role || '',
              status: a.status || 'pending',
              approved: a.status === 'approved',
              comment: a.comment,
              timestamp: a.timestamp,
            }));
            
            // Get required approvals with fallback
            const requiredApprovals = (details as any).rule_details?.requiredApprovals || 
                                    (details as any).template_data?.requiredApprovals || 
                                    approversData.length;
            
            return {
              id: item.id,
              name: item.name,
              type: item.type,
              entity_type: item.entity_type,
              description,
              createdAt: item.createdAt,
              createdBy: {
                name: createdByName,
                id: createdById,
              },
              approvers: formattedApprovers,
              requiredApprovals,
            };
          })
        );
        
        // Type assertion to ensure transformed data matches our interfaces
        const typedPendingApprovals = transformedPending.map(item => ({
          ...item,
          approvers: item.approvers.map(approver => ({
            ...approver,
            status: approver.status as "approved" | "rejected" | "pending"
          }))
        }));
        
        setPendingApprovals(typedPendingApprovals);
        
        // Similarly transform completed approvals
        const transformedCompleted = await Promise.all(
          completed.map(async (item) => {
            // Type guard to ensure entity_type is "rule" or "template"
            if (item.entity_type !== "rule" && item.entity_type !== "template") {
              throw new Error(`Invalid entity type: ${item.entity_type}`);
            }
            const details = await getEntityDetails(item.id, item.entity_type);
            const approversData = await getApproversForEntity(item.id);
            
            // Use type assertions to handle properties that may not exist
            const description = item.entity_type === 'rule' 
              ? (details as any).rule_details?.description 
              : (details as any).description;
            
            const createdByName = (details as any).created_by_name || 'Unknown';
            const createdById = (details as any).created_by || '';
            
            // Transform approvers data
            const formattedApprovers = approversData.map(a => ({
              id: a.user_id,
              name: (a.user as any)?.name || 'Unknown',
              email: (a.user as any)?.email || '',
              role: (a.user as any)?.role || '',
              status: a.status || 'pending',
              approved: a.status === 'approved',
              comment: a.comment,
              timestamp: a.timestamp,
            }));
            
            // Get required approvals with fallback
            const requiredApprovals = (details as any).rule_details?.requiredApprovals || 
                                    (details as any).template_data?.requiredApprovals || 
                                    approversData.length;
            
            return {
              id: item.id,
              name: item.name,
              type: item.type,
              entity_type: item.entity_type,
              description,
              createdAt: item.createdAt,
              createdBy: {
                name: createdByName,
                id: createdById,
              },
              approvers: formattedApprovers,
              requiredApprovals,
            };
          })
        );
        
        // Type assertion to ensure transformed completed matches our interfaces
        const typedCompletedApprovals = transformedCompleted.map(item => ({
          ...item,
          approvers: item.approvers.map(approver => ({
            ...approver,
            status: approver.status as "approved" | "rejected" | "pending"
          }))
        }));
        
        setCompletedApprovals(typedCompletedApprovals);
      } catch (error) {
        console.error("Error fetching approvals:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApprovals();
  }, [user]);

  const filteredPendingApprovals = pendingApprovals.filter(
    (approval) => approval.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCompletedApprovals = completedApprovals.filter(
    (approval) => approval.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async () => {
    if (!selectedPolicy || !user) return;
    
    try {
      await approveEntity(selectedPolicy.id, user.id, approvalComment);
      setShowApproveDialog(false);
      setApprovalComment("");
      
      // Refresh data
      const pending = await getPendingApprovalsForUser(user.id);
      const completed = await getCompletedApprovalsForUser(user.id);
      
      setPendingApprovals(pendingApprovals.filter(p => p.id !== selectedPolicy.id));
      setCompletedApprovals([...completedApprovals, {
        ...selectedPolicy,
        approvers: selectedPolicy.approvers.map(a => 
          a.id === user.id ? { ...a, status: 'approved', approved: true, comment: approvalComment } : a
        )
      }]);
      
      setSelectedPolicy(null);
    } catch (error) {
      console.error("Error approving entity:", error);
    }
  };

  const handleReject = async () => {
    if (!selectedPolicy || !user) return;
    
    try {
      await rejectEntity(selectedPolicy.id, user.id, approvalComment);
      setShowRejectDialog(false);
      setApprovalComment("");
      
      // Refresh data
      const pending = await getPendingApprovalsForUser(user.id);
      const completed = await getCompletedApprovalsForUser(user.id);
      
      setPendingApprovals(pendingApprovals.filter(p => p.id !== selectedPolicy.id));
      setCompletedApprovals([...completedApprovals, {
        ...selectedPolicy,
        approvers: selectedPolicy.approvers.map(a => 
          a.id === user.id ? { ...a, status: 'rejected', approved: false, comment: approvalComment } : a
        )
      }]);
      
      setSelectedPolicy(null);
    } catch (error) {
      console.error("Error rejecting entity:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Rejected
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Pending
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Unknown
          </Badge>
        );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "pending":
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  // Convert our internal approvers format to match the ApprovalWorkflow component
  const mapApproversForWorkflow = (approvers: Approver[]): CentralApprover[] => {
    return approvers.map(approver => ({
      id: approver.id,
      name: approver.name,
      role: approver.role,
      avatarUrl: approver.avatarUrl,
      approved: approver.status === 'approved', // Map status to approved boolean
      timestamp: approver.timestamp,
    })) as CentralApprover[];
  };

  // Convert our internal pending approvals to the format ApprovalNotifications expects
  const mapApprovalsToNotifications = (approvals: PolicyToApprove[]): ApprovalNotification[] => {
    return approvals.map(policy => ({
      id: policy.id,
      policyId: policy.id,
      policyName: policy.name,
      type: "approval_request",
      timestamp: policy.createdAt,
      read: false
    }));
  };

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-sm">
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Approval Dashboard
          {pendingApprovals.length > 0 && (
            <Badge className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-200">
              {pendingApprovals.length} pending for you
            </Badge>
          )}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="pending">
                Pending Approvals ({pendingApprovals.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedApprovals.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-6">
              {isLoading ? (
                <p className="text-center py-8">Loading...</p>
              ) : pendingApprovals.length > 0 ? (
                <div className="space-y-6">
                  {pendingApprovals.map((policy) => (
                    <Card key={policy.id} className="border border-gray-200">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-medium flex items-center gap-2">
                            {policy.name}
                            <Badge variant="outline" className="ml-2">{policy.entity_type}</Badge>
                            {getStatusBadge("pending")}
                          </CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPolicy(policy);
                              if (onViewPolicy) {
                                onViewPolicy(policy.id);
                              }
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600">
                          {policy.description || `${policy.entity_type === 'rule' ? 'Rule' : 'Template'} for ${policy.type}`}
                        </p>

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div>
                            <span className="font-medium">Type:</span> {policy.type}
                          </div>
                          <div>
                            <span className="font-medium">Date:</span>{" "}
                            {formatDate(policy.createdAt)}
                          </div>
                        </div>

                        <Separator />

                        <ApprovalWorkflow
                          policyId={policy.id}
                          policyName={policy.name}
                          approvers={mapApproversForWorkflow(policy.approvers)}
                          threshold={policy.requiredApprovals === policy.approvers.length ? "all" : "majority"}
                          status="pending"
                          currentUser={user && userProfile ? {
                            id: user.id,
                            name: userProfile.name || user.email,
                            role: userProfile.role,
                            approved: false
                          } as CentralApprover : undefined}
                          onApprove={() => {
                            setSelectedPolicy(policy);
                            setShowApproveDialog(true);
                          }}
                          onReject={() => {
                            setSelectedPolicy(policy);
                            setShowRejectDialog(true);
                          }}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-4">No pending policies require approval</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-6">
              {isLoading ? (
                <p className="text-center py-8">Loading...</p>
              ) : completedApprovals.length > 0 ? (
                <div className="space-y-6">
                  {completedApprovals.map((policy) => (
                    <Card key={policy.id} className="border border-gray-200">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-medium flex items-center gap-2">
                            {policy.name}
                            <Badge variant="outline" className="ml-2">{policy.entity_type}</Badge>
                            {getStatusBadge(
                              policy.approvers.find((a) => a.id === user?.id)?.status || "pending"
                            )}
                          </CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPolicy(policy);
                              if (onViewPolicy) {
                                onViewPolicy(policy.id);
                              }
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600">
                          {policy.description || `${policy.entity_type === 'rule' ? 'Rule' : 'Template'} for ${policy.type}`}
                        </p>

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div>
                            <span className="font-medium">Type:</span> {policy.type}
                          </div>
                          <div>
                            <span className="font-medium">Date:</span>{" "}
                            {formatDate(policy.createdAt)}
                          </div>
                        </div>

                        <Separator />

                        <ApprovalWorkflow
                          policyId={policy.id}
                          policyName={policy.name}
                          approvers={mapApproversForWorkflow(policy.approvers)}
                          threshold={policy.requiredApprovals === policy.approvers.length ? "all" : "majority"}
                          status="in_progress"
                          currentUser={user && userProfile ? {
                            id: user.id,
                            name: userProfile.name || user.email,
                            role: userProfile.role,
                            approved: policy.approvers.find(a => a.id === user.id)?.approved || false
                          } as CentralApprover : undefined}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-4">No completed policies found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                <div className="flex items-center justify-between">
                  <span>Approval Notifications</span>
                  <Badge className="bg-red-500 text-white">{pendingApprovals.length}</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ApprovalNotifications
                notifications={mapApprovalsToNotifications(pendingApprovals)}
                onMarkAsRead={(id) => console.log("Mark as read:", id)}
                onMarkAllAsRead={() => console.log("Mark all as read")}
                onViewPolicy={(policyId) => {
                  if (onViewPolicy) {
                    onViewPolicy(policyId);
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve {selectedPolicy?.entity_type}</DialogTitle>
            <DialogDescription>
              Add a comment to explain your approval decision (optional)
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Add your comments here..."
            value={approvalComment}
            onChange={(e) => setApprovalComment(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {selectedPolicy?.entity_type}</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Explain why you're rejecting this..."
            value={approvalComment}
            onChange={(e) => setApprovalComment(e.target.value)}
            className="min-h-[100px]"
            required
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReject} variant="destructive">
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedApprovalDashboard;