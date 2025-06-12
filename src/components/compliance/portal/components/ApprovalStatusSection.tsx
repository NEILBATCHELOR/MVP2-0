import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Investor } from "@/types/core/centralModels";
import { supabase } from "@/infrastructure/database/client";
import { CheckCircle, Clock } from "lucide-react";

interface ApprovalStatusSectionProps {
  investor: Investor;
}

interface InvestorApprovalStatus {
  submittedAt?: string;
  underReviewAt?: string;
  guardianPolicyAt?: string;
  finalApprovalAt?: string;
  currentStatus: "submitted" | "under_review" | "guardian_policy" | "final_approval" | "completed";
}

const ApprovalStatusSection: React.FC<ApprovalStatusSectionProps> = ({ investor }) => {
  const [approvalStatus, setApprovalStatus] = useState<InvestorApprovalStatus>({
    currentStatus: "submitted",
  });

  useEffect(() => {
    fetchApprovalStatus();
  }, [investor.id]);

  const fetchApprovalStatus = async () => {
    try {
      // Fetch the latest investor approval
      const { data, error } = await supabase
        .from("investor_approvals")
        .select("*")
        .eq("investor_id", investor.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // If no approval record found, we're just at the "submitted" step
        setApprovalStatus({
          submittedAt: investor.createdAt as unknown as string,
          currentStatus: "submitted",
        });
        return;
      }

      // Create the approval status object based on the retrieved data
      const status: InvestorApprovalStatus = {
        submittedAt: investor.createdAt as unknown as string,
        currentStatus: "submitted",
      };

      const approval = data;
      
      // Determine the current status based on the approval data
      if (approval.status === "pending") {
        status.underReviewAt = approval.submission_date;
        status.currentStatus = "under_review";
      } else if (approval.metadata && typeof approval.metadata === 'object' && 'guardian_policy_status' in approval.metadata && approval.metadata.guardian_policy_status === "pending") {
        status.underReviewAt = approval.submission_date;
        status.guardianPolicyAt = approval.metadata && typeof approval.metadata === 'object' && 'guardian_policy_date' in approval.metadata ? 
          approval.metadata.guardian_policy_date as string : undefined;
        status.currentStatus = "guardian_policy";
      } else if (approval.status === "approved" && !approval.approval_date) {
        status.underReviewAt = approval.submission_date;
        status.guardianPolicyAt = approval.metadata && typeof approval.metadata === 'object' && 'guardian_policy_date' in approval.metadata ? 
          approval.metadata.guardian_policy_date as string : undefined;
        status.currentStatus = "final_approval";
      } else if (approval.status === "approved" && approval.approval_date) {
        status.underReviewAt = approval.submission_date;
        status.guardianPolicyAt = approval.metadata && typeof approval.metadata === 'object' && 'guardian_policy_date' in approval.metadata ? 
          approval.metadata.guardian_policy_date as string : undefined;
        status.finalApprovalAt = approval.approval_date;
        status.currentStatus = "completed";
      }

      setApprovalStatus(status);
    } catch (error) {
      console.error("Error fetching approval status:", error);
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const steps = [
    {
      id: "submitted",
      title: "Submitted",
      description: approvalStatus.submittedAt 
        ? formatDate(approvalStatus.submittedAt)
        : null,
      isCompleted: !!approvalStatus.submittedAt,
      isCurrent: approvalStatus.currentStatus === "submitted",
    },
    {
      id: "under_review",
      title: "Under Review",
      description: "Compliance agent is reviewing your submission",
      isCompleted: !!approvalStatus.underReviewAt,
      isCurrent: approvalStatus.currentStatus === "under_review",
    },
    {
      id: "guardian_policy",
      title: "Guardian Policy Enforcement",
      description: "Pending automated validation",
      isCompleted: !!approvalStatus.guardianPolicyAt,
      isCurrent: approvalStatus.currentStatus === "guardian_policy",
    },
    {
      id: "final_approval",
      title: "Final Approval",
      description: "Pending final approval",
      isCompleted: !!approvalStatus.finalApprovalAt,
      isCurrent: approvalStatus.currentStatus === "final_approval",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval Status</CardTitle>
        <p className="text-sm text-muted-foreground">
          Current status of your investor application
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div 
              key={step.id} 
              className={`flex items-start space-x-3 ${
                index < steps.length - 1 ? "pb-6 relative" : ""
              }`}
            >
              {/* Vertical line connecting steps */}
              {index < steps.length - 1 && (
                <div 
                  className={`absolute left-3.5 top-6 h-[calc(100%-1.5rem)] w-px ${
                    step.isCompleted ? "bg-green-500" : "bg-gray-200"
                  }`}
                  style={{ transform: "translateX(-50%)" }}
                />
              )}
              
              {/* Status icon */}
              <div className="flex-shrink-0">
                {step.isCompleted ? (
                  <CheckCircle className="h-7 w-7 text-green-500" />
                ) : step.isCurrent ? (
                  <Clock className="h-7 w-7 text-blue-500" />
                ) : (
                  <Clock className="h-7 w-7 text-gray-200" />
                )}
              </div>
              
              {/* Step content */}
              <div className="space-y-1">
                <p className={`font-medium ${
                  step.isCompleted 
                    ? "text-green-500" 
                    : step.isCurrent 
                      ? "text-blue-500" 
                      : "text-gray-500"
                }`}>
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ApprovalStatusSection; 