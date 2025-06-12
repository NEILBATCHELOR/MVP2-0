import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useIssuerOnboarding } from "./IssuerOnboardingContext";

interface ReviewSection {
  id: string;
  title: string;
  status: "completed" | "incomplete" | "attention";
  items: {
    name: string;
    value: string;
    status?: "completed" | "incomplete" | "attention";
  }[];
}

const FinalReview: React.FC = () => {
  const navigate = useNavigate();
  const { state, previousStep } = useIssuerOnboarding();
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate review sections based on actual state data
  const reviewSections: ReviewSection[] = [
    {
      id: "organization",
      title: "Organization Details",
      status: "completed",
      items: [
        { name: "Legal Name", value: state.organization.name || "Not provided" },
        { name: "Registration Number", value: state.organization.registrationNumber || "Not provided" },
        { name: "Business Type", value: state.organization.businessType || "Not provided" },
        { name: "Regulatory Status", value: state.organization.regulatoryStatus || "Not provided" },
        { name: "Entity Structure", value: state.organization.entityStructure || "Not provided" },
        { name: "Country of Registration", value: state.organization.countryOfRegistration || "Not provided" },
        { name: "Business Email", value: state.organization.businessEmail || "Not provided" },
      ],
    },
    {
      id: "documents",
      title: "Document Submissions",
      status: state.documents.some(doc => doc.status !== "uploaded") ? "attention" : "completed",
      items: state.documents.map(doc => ({
        name: doc.name,
        value: doc.status === "uploaded" ? "Uploaded" : 
              doc.status === "pending_review" ? "Pending Review" : 
              doc.status === "verified" ? "Verified" : "Not Uploaded",
        status: doc.status === "uploaded" || doc.status === "verified" ? "completed" : 
                doc.status === "pending_review" ? "attention" : "incomplete"
      })),
    },
    {
      id: "wallet",
      title: "Wallet Configuration",
      status: state.wallet.address ? "completed" : "incomplete",
      items: [
        { name: "Blockchain", value: state.walletConfig.blockchain || "Ethereum" },
        {
          name: "Wallet Address",
          value: state.wallet.address || "Not generated",
          status: state.wallet.address ? "completed" : "incomplete"
        },
        { 
          name: "Multi-Signature", 
          value: state.wallet.isMultiSig ? "Enabled" : "Disabled",
        },
        { 
          name: "Number of Signatories", 
          value: state.wallet.isMultiSig && state.wallet.signatories ? 
                 state.wallet.signatories.length.toString() : "N/A",
        },
      ],
    },
  ];

  const getSectionStatusIcon = (status: ReviewSection["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "incomplete":
        return <Clock className="h-5 w-5 text-gray-400" />;
      case "attention":
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
    }
  };

  const getItemStatusIcon = (status?: ReviewSection["status"]) => {
    if (!status) return null;

    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "incomplete":
        return <Clock className="h-4 w-4 text-gray-400" />;
      case "attention":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!confirmAccuracy) {
      setError(
        "Please confirm that all information is accurate before submitting",
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    // Mock submission process
    setTimeout(() => {
      setSubmitting(false);
      // Redirect to dashboard or confirmation page
      navigate("/dashboard");
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Final Review & Submission</h2>
      <p className="text-muted-foreground">
        Review all information before submitting for approval
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          <Accordion
            type="multiple"
            defaultValue={reviewSections.map((section) => section.id)}
            className="space-y-4"
          >
            {reviewSections.map((section) => (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="border rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    {getSectionStatusIcon(section.status)}
                    <span>{section.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 pt-2">
                  <div className="space-y-3">
                    {section.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <span className="text-gray-700">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${item.name === "Wallet Address" ? "font-mono text-sm" : ""}`}>
                            {item.value}
                          </span>
                          {getItemStatusIcon(item.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="flex items-start space-x-2 pt-4 border-t border-gray-200">
          <Checkbox
            id="confirmAccuracy"
            checked={confirmAccuracy}
            onCheckedChange={(checked) =>
              setConfirmAccuracy(checked as boolean)
            }
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="confirmAccuracy"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I confirm that all details provided are accurate and complete
            </label>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={previousStep}>
            Back
          </Button>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit for Approval"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FinalReview;