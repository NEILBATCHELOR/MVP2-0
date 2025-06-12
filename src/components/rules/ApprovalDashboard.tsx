import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { CheckCircle, XCircle, Clock, Filter, Search } from "lucide-react";
import { Input } from "../ui/input";
import ApprovalWorkflow from "./ApprovalWorkflow";
import ApprovalNotifications from "./ApprovalNotifications";
import type { Approver as CentralApprover } from "@/types/core/centralModels";

// Use composition to extend the central Approver type
interface Approver extends CentralApprover {
  status?: "approved" | "rejected" | "pending";
  comment?: string;
  timestamp?: string;
}

interface Policy {
  id: string;
  name: string;
  description: string;
  status: "pending" | "approved" | "rejected" | "in_progress";
  createdAt: string;
  createdBy: {
    name: string;
    role: string;
  };
  approvers: Approver[];
  threshold: "all" | "majority" | "any";
}

interface ApprovalNotification {
  id: string;
  policyId: string;
  policyName: string;
  type: "approval_request" | "approval_complete" | "approval_rejected";
  timestamp: string;
  read: boolean;
}

interface ApprovalDashboardProps {
  policies?: Policy[];
  notifications?: ApprovalNotification[];
  currentUser?: Approver;
  onApprove?: (policyId: string, comment: string) => void;
  onReject?: (policyId: string, comment: string) => void;
  onViewPolicy?: (policyId: string) => void;
}

const ApprovalDashboard = ({
  policies = [],
  notifications = [],
  currentUser,
  onApprove = () => {},
  onReject = () => {},
  onViewPolicy = () => {},
}: ApprovalDashboardProps) => {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");

  const pendingPolicies = policies.filter(
    (policy) => policy.status === "pending" || policy.status === "in_progress",
  );

  const completedPolicies = policies.filter(
    (policy) => policy.status === "approved" || policy.status === "rejected",
  );

  const filteredPendingPolicies = pendingPolicies.filter((policy) =>
    policy.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredCompletedPolicies = completedPolicies.filter((policy) =>
    policy.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const pendingForCurrentUser = pendingPolicies.filter((policy) =>
    policy.approvers.some(
      (approver) =>
        approver.id === currentUser?.id && approver.status === "pending",
    ),
  );

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
      case "in_progress":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            In Progress
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
      case "in_progress":
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const handleMarkNotificationAsRead = (notificationId: string) => {
    // This would be implemented with actual state management
    console.log("Mark notification as read:", notificationId);
  };

  const handleMarkAllNotificationsAsRead = () => {
    // This would be implemented with actual state management
    console.log("Mark all notifications as read");
  };

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-sm">
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Approval Dashboard
          {pendingForCurrentUser.length > 0 && (
            <Badge className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-200">
              {pendingForCurrentUser.length} pending for you
            </Badge>
          )}
        </h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search policies..."
            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="pending">
                Pending Approvals ({pendingPolicies.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedPolicies.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-6">
              {filteredPendingPolicies.length > 0 ? (
                <div className="space-y-6">
                  {filteredPendingPolicies.map((policy) => (
                    <Card key={policy.id} className="border border-gray-200">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-medium flex items-center gap-2">
                            {policy.name}
                            {getStatusBadge(policy.status)}
                          </CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewPolicy(policy.id)}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600">
                          {policy.description}
                        </p>

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div>
                            <span className="font-medium">Created by:</span>{" "}
                            {policy.createdBy.name} ({policy.createdBy.role})
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
                          approvers={policy.approvers}
                          threshold={policy.threshold}
                          status={policy.status}
                          currentUser={currentUser}
                          onApprove={onApprove}
                          onReject={onReject}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-4">
                    {searchTerm
                      ? "No pending policies match your search"
                      : "No pending policies require approval"}
                  </p>
                  {searchTerm && (
                    <Button variant="outline" onClick={() => setSearchTerm("")}>
                      Clear Search
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-6">
              {filteredCompletedPolicies.length > 0 ? (
                <div className="space-y-4">
                  {filteredCompletedPolicies.map((policy) => (
                    <div
                      key={policy.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(policy.status)}
                          <div>
                            <h3 className="font-medium">{policy.name}</h3>
                            <p className="text-sm text-gray-500">
                              Completed on {formatDate(policy.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(policy.status)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewPolicy(policy.id)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-4">
                    {searchTerm
                      ? "No completed policies match your search"
                      : "No completed policies found"}
                  </p>
                  {searchTerm && (
                    <Button variant="outline" onClick={() => setSearchTerm("")}>
                      Clear Search
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <ApprovalNotifications
            notifications={notifications}
            onViewPolicy={onViewPolicy}
            onMarkAsRead={handleMarkNotificationAsRead}
            onMarkAllAsRead={handleMarkAllNotificationsAsRead}
          />
        </div>
      </div>
    </div>
  );
};

export default ApprovalDashboard;
