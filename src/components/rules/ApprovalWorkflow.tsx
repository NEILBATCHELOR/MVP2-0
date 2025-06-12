import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { CheckCircle, XCircle, Clock, MessageSquare } from "lucide-react";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Approver } from "@/types/core/centralModels";
import { formatDate } from "@/utils/shared/formatting/formatters";

interface ApprovalWorkflowProps {
  policyId: string;
  policyName: string;
  approvers: Approver[];
  threshold: "all" | "majority" | "any";
  status: "pending" | "approved" | "rejected" | "in_progress";
  currentUser?: Approver;
  onApprove?: (policyId: string, comment: string) => void;
  onReject?: (policyId: string, comment: string) => void;
}

const ApprovalWorkflow = ({
  policyId,
  policyName,
  approvers = [],
  threshold = "all",
  status = "pending",
  currentUser,
  onApprove = () => {},
  onReject = () => {},
}: ApprovalWorkflowProps) => {
  const [comment, setComment] = useState("");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

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

  const getStatusIcon = (approved?: boolean) => {
    if (approved === true) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (approved === false) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    } else {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getThresholdText = (threshold: string) => {
    switch (threshold) {
      case "all":
        return `All approvers (${approvers.length}/${approvers.length})`;
      case "majority":
        return `Majority (${Math.ceil(approvers.length / 2)}/${approvers.length})`;
      case "any":
        return `Any approver (1/${approvers.length})`;
      default:
        return "Unknown threshold";
    }
  };

  const approvedCount = approvers.filter(
    (approver) => approver.approved === true
  ).length;

  const rejectedCount = approvers.filter(
    (approver) => approver.approved === false
  ).length;

  const isCurrentUserApprover = currentUser
    ? approvers.some((approver) => approver.id === currentUser.id)
    : false;

  const currentUserApproved = currentUser
    ? approvers.find((approver) => approver.id === currentUser.id)?.approved
    : undefined;

  const canTakeAction =
    isCurrentUserApprover &&
    currentUserApproved === undefined &&
    status !== "approved" &&
    status !== "rejected";

  const handleApprove = () => {
    onApprove(policyId, comment);
    setShowApproveDialog(false);
    setComment("");
  };

  const handleReject = () => {
    onReject(policyId, comment);
    setShowRejectDialog(false);
    setComment("");
  };

  return (
    <Card className="w-full bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">
            Approval Workflow
          </CardTitle>
          {getStatusBadge(status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <span className="font-medium">Policy:</span> {policyName}
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-medium">Required:</span>{" "}
            {getThresholdText(threshold)}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <span className="font-medium">Progress:</span> {approvedCount}/
            {approvers.length} approved
          </div>
          <div className="flex items-center gap-1">
            <div className="w-full bg-gray-200 rounded-full h-2 w-32">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{
                  width: `${(approvedCount / approvers.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="text-sm font-medium">Approvers</h3>
          {approvers.map((approver) => (
            <div
              key={approver.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={approver.avatarUrl} alt={approver.name || ''} />
                  <AvatarFallback>
                    {approver.name
                      ? approver.name.substring(0, 2).toUpperCase()
                      : "??"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{approver.name}</div>
                  <div className="text-sm text-gray-500">{approver.role}</div>
                  {approver.timestamp && (
                    <div className="text-xs text-gray-400">
                      {formatDate(approver.timestamp)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(approver.approved)}
              </div>
            </div>
          ))}
        </div>

        {canTakeAction && (
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setShowRejectDialog(true)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setShowApproveDialog(true)}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </div>
        )}

        {/* Approve Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Policy</DialogTitle>
              <DialogDescription>
                You are about to approve the policy "{policyName}". This action
                will be recorded in the approval history.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="Optional comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="resize-none"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleApprove}>Confirm Approval</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Policy</DialogTitle>
              <DialogDescription>
                You are about to reject the policy "{policyName}". Please provide a
                reason for your rejection.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="Reason for rejection..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="resize-none"
                required
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!comment.trim()}
              >
                Confirm Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ApprovalWorkflow;
