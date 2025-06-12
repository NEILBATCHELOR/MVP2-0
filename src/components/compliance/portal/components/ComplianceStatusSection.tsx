import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Investor, InvestorDocument, KycStatus, AccreditationStatus } from "@/types/core/centralModels";
import { ExternalLink } from "lucide-react";

interface ComplianceStatusSectionProps {
  investor: Investor;
  documents: InvestorDocument[];
}

const ComplianceStatusSection: React.FC<ComplianceStatusSectionProps> = ({
  investor,
  documents,
}) => {
  const complianceItems = [
    {
      id: "kyc_aml",
      title: "KYC/AML",
      status: investor.kycStatus === KycStatus.APPROVED
        ? "Completed"
        : investor.kycStatus === KycStatus.PENDING
          ? "In Progress"
          : "Pending",
    },
    {
      id: "accreditation",
      title: "Accreditation",
      status: investor.accreditationStatus === AccreditationStatus.APPROVED ? "Completed" : "Pending",
    },
    {
      id: "tax_documentation",
      title: "Tax Documentation",
      status: documents.some(d => d.documentType.includes("tax") && d.status === "APPROVED")
        ? "Completed"
        : documents.some(d => d.documentType.includes("tax"))
          ? "Pending"
          : "Action Required",
    },
    {
      id: "wallet_verification",
      title: "Wallet Verification",
      status: investor.walletAddress ? "Completed" : "Pending",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Status</CardTitle>
        <p className="text-sm text-muted-foreground">
          Status of your compliance requirements
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {complianceItems.map((item) => (
            <div key={item.id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
              <span className="font-medium">{item.title}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                item.status === "Completed"
                  ? "bg-green-100 text-green-800"
                  : item.status === "In Progress"
                    ? "bg-blue-100 text-blue-800"
                    : item.status === "Action Required"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-gray-100 text-gray-800"
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          <ExternalLink className="h-4 w-4 mr-2" />
          View Compliance Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ComplianceStatusSection; 