import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import OnboardingLayout from "./OnboardingLayout";
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

const FinalReview = () => {
  const navigate = useNavigate();
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reviewSections: ReviewSection[] = [
    {
      id: "organization",
      title: "Organization Details",
      status: "completed",
      items: [
        { name: "Legal Name", value: "Acme Capital SPV, LLC" },
        { name: "Registration Number", value: "LLC-12345-67890" },
        { name: "Business Type", value: "SPV" },
        { name: "Regulatory Status", value: "Regulated" },
        { name: "Entity Structure", value: "Limited Liability Company" },
      ],
    },
    {
      id: "documents",
      title: "Document Submissions",
      status: "attention",
      items: [
        {
          name: "Certificate of Incorporation",
          value: "Uploaded",
          status: "completed",
        },
        {
          name: "Articles of Association",
          value: "Uploaded",
          status: "completed",
        },
        { name: "List of Directors", value: "Uploaded", status: "completed" },
        {
          name: "Shareholder Register",
          value: "Pending Review",
          status: "attention",
        },
        {
          name: "Financial Statements",
          value: "Not Uploaded",
          status: "incomplete",
        },
      ],
    },
    {
      id: "compliance",
      title: "Compliance Information",
      status: "completed",
      items: [
        { name: "UBO Verification", value: "Completed" },
        { name: "Risk Classification", value: "Medium Risk" },
        { name: "Jurisdiction", value: "United States" },
        { name: "KYC/AML Status", value: "Verified" },
      ],
    },
    {
      id: "wallet",
      title: "Wallet Configuration",
      status: "completed",
      items: [
        { name: "Blockchain", value: "Ethereum" },
        {
          name: "Wallet Address",
          value: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
        },
        { name: "Multi-Signature", value: "Enabled" },
        { name: "Number of Signatories", value: "3" },
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
    <OnboardingLayout
      currentStep={6}
      totalSteps={6}
      title="Final Review & Submission"
      description="Review all information before submitting for approval"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Approval Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                <div className="space-y-6">
                  <div className="relative pl-10">
                    <div className="absolute left-0 p-1 rounded-full bg-blue-100 border-2 border-white z-10">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="font-medium">Submitted</p>
                    <p className="text-sm text-gray-500">
                      Your application will be submitted for review
                    </p>
                  </div>

                  <div className="relative pl-10">
                    <div className="absolute left-0 p-1 rounded-full bg-gray-100 border-2 border-white z-10">
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="font-medium text-gray-500">Under Review</p>
                    <p className="text-sm text-gray-500">
                      Compliance agent will review your submission
                    </p>
                  </div>

                  <div className="relative pl-10">
                    <div className="absolute left-0 p-1 rounded-full bg-gray-100 border-2 border-white z-10">
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="font-medium text-gray-500">
                      Guardian Policy Enforcement
                    </p>
                    <p className="text-sm text-gray-500">
                      Automated validation of compliance requirements
                    </p>
                  </div>

                  <div className="relative pl-10">
                    <div className="absolute left-0 p-1 rounded-full bg-gray-100 border-2 border-white z-10">
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="font-medium text-gray-500">Final Approval</p>
                    <p className="text-sm text-gray-500">
                      Your SPV will be fully approved or rejected with feedback
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
                          <span className="font-medium">{item.value}</span>
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
          <Button type="button" variant="outline">
            Back
          </Button>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit for Approval"}
          </Button>
        </div>
      </form>
    </OnboardingLayout>
  );
};

export default FinalReview;
