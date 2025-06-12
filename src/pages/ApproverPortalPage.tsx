import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ApproverDashboard } from "@/components/redemption/approvals";

interface ApproverPortalPageProps {
  onBack: () => void;
}

const ApproverPortalPage = ({ onBack }: ApproverPortalPageProps) => {
  // In a real app, this would come from authentication
  const [approverId, setApproverId] = useState("1"); // Default to Jane Cooper (Fund Manager)

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={onBack} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Approver Portal</h1>
      </div>

      <ApproverDashboard approverId={approverId} />
    </div>
  );
};

export default ApproverPortalPage;
