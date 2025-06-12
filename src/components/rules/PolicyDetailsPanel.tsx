import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Calendar,
  Clock,
  Edit,
  FileText,
  Globe,
  Tag,
  Trash2,
  Users,
  History,
  Download,
  Copy,
} from "lucide-react";
import PolicyVersionHistory from "./PolicyVersionHistory";
import PolicyVersionComparison from "./PolicyVersionComparison";

interface PolicyDetailsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: any;
  onEdit?: (policy: any) => void;
  onDelete?: (policy: any) => void;
  onDuplicate?: (policy: any) => void;
  onClose?: () => void;
}

const PolicyDetailsPanel = ({
  open,
  onOpenChange,
  policy,
  onEdit = () => {},
  onDelete = () => {},
  onDuplicate = () => {},
  onClose = () => {},
}: PolicyDetailsPanelProps) => {
  const [activeTab, setActiveTab] = useState("details");
  const [showVersionComparison, setShowVersionComparison] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<any[]>([]);

  // Mock version history data
  const versionHistory = [
    {
      id: "version-1",
      versionNumber: 3,
      timestamp: "2023-07-20T14:30:00Z",
      changedBy: {
        name: "Alex Johnson",
        role: "Compliance Officer",
      },
      changeType: "updated",
      changes: [
        {
          field: "Transfer Limit",
          oldValue: "5000 USD",
          newValue: "10000 USD",
        },
        {
          field: "Approvers",
          oldValue: "2",
          newValue: "3",
        },
      ],
      comment: "Increased transfer limit and added additional approver",
    },
    {
      id: "version-2",
      versionNumber: 2,
      timestamp: "2023-07-15T09:45:00Z",
      changedBy: {
        name: "Morgan Smith",
        role: "Risk Manager",
      },
      changeType: "approved",
      changes: [],
      comment: "Approved after compliance review",
    },
    {
      id: "version-3",
      versionNumber: 1,
      timestamp: "2023-07-10T11:20:00Z",
      changedBy: {
        name: "Jamie Lee",
        role: "Policy Administrator",
      },
      changeType: "created",
      changes: [
        {
          field: "Policy",
          newValue: "Transfer Limit Policy",
        },
        {
          field: "Status",
          newValue: "Draft",
        },
        {
          field: "Rules",
          newValue: "1 rule added",
        },
      ],
    },
  ];

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "draft":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPolicyTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      transfer_limit: "Transfer Limit",
      kyc_verification: "KYC Verification",
      restricted_assets: "Restricted Assets",
      multi_signature: "Multi-Signature Approval",
      dormant_account: "Dormant Account",
      risk_assessment: "Risk Assessment",
      transaction_monitoring: "Transaction Monitoring",
      custom: "Custom Policy",
    };
    return (
      typeMap[type] ||
      (type
        ? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "")
    );
  };

  const getJurisdictionName = (jurisdiction: string) => {
    const jurisdictionMap: Record<string, string> = {
      global: "Global",
      us: "United States",
      eu: "European Union",
      uk: "United Kingdom",
      asia_pacific: "Asia Pacific",
      custom: "Custom Jurisdiction",
    };
    return (
      jurisdictionMap[jurisdiction] ||
      (jurisdiction
        ? jurisdiction
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : "")
    );
  };

  const handleViewVersion = (versionId: string) => {
    console.log(`Viewing version: ${versionId}`);
    // In a real app, this would load the specific version data
  };

  const handleRollbackToVersion = (versionId: string) => {
    console.log(`Rolling back to version: ${versionId}`);
    // In a real app, this would create a new version based on the selected one
  };

  const handleCompareVersions = (versionId1: string, versionId2: string) => {
    console.log(`Comparing versions: ${versionId1} and ${versionId2}`);
    // Mock data for comparison
    const version1 = versionHistory.find((v) => v.id === versionId1);
    const version2 = versionHistory.find((v) => v.id === versionId2);

    if (version1 && version2) {
      setSelectedVersions([
        {
          ...version1,
          policyData: { ...policy, rules: policy?.rules?.slice(0, 1) || [] },
        },
        {
          ...version2,
          policyData: { ...policy },
        },
      ]);
      setShowVersionComparison(true);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        className="w-[600px] sm:max-w-[600px] overflow-y-auto"
        aria-describedby="policy-details-description"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl font-semibold">
            {policy?.name || "Policy Details"}
          </SheetTitle>
          <div id="policy-details-description" className="text-sm text-muted-foreground">
            View and manage policy details, rules, and approvers.
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Badge
                className={getStatusColor(policy?.status || "")}
                variant="outline"
              >
                {policy?.status
                  ? policy.status.charAt(0).toUpperCase() +
                    policy.status.slice(1)
                  : "Unknown"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (policy) {
                    const newStatus =
                      policy.status === "active" ? "inactive" : "active";
                    // In a real app, this would update the status in your state management or backend
                    console.log(
                      `Toggling status from ${policy.status} to ${newStatus}`,
                    );
                  }
                }}
                className="ml-2 text-xs"
              >
                {policy?.status === "active" ? "Deactivate" : "Activate"}
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(policy)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDuplicate(policy)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Export policy as JSON
                  const jsonData = JSON.stringify(policy, null, 2);
                  const blob = new Blob([jsonData], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `policy_${policy?.id || "export"}_${new Date().toISOString().split("T")[0]}.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => onDelete(policy)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="details">
              <FileText className="mr-2 h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="mr-2 h-4 w-4" />
              Version History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Description</h3>
              <p className="text-sm text-gray-600">
                {policy?.description || "No description available"}
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500">
                  <FileText className="h-4 w-4 mr-2" />
                  <span>Type:</span>
                </div>
                <p className="text-sm font-medium">
                  {getPolicyTypeName(policy?.type || "")}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500">
                  <Globe className="h-4 w-4 mr-2" />
                  <span>Jurisdiction:</span>
                </div>
                <p className="text-sm font-medium">
                  {getJurisdictionName(policy?.jurisdiction || "")}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Effective Date:</span>
                </div>
                <p className="text-sm font-medium">
                  {formatDate(policy?.effectiveDate || "")}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Expiration Date:</span>
                </div>
                <p className="text-sm font-medium">
                  {policy?.expirationDate
                    ? formatDate(policy.expirationDate)
                    : "No expiration"}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Created:</span>
                </div>
                <p className="text-sm font-medium">
                  {formatDate(policy?.createdAt || "")}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Last Modified:</span>
                </div>
                <p className="text-sm font-medium">
                  {formatDate(policy?.modifiedAt || "")}
                </p>
              </div>
            </div>

            {policy?.tags && policy.tags.length > 0 && (
              <>
                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Tag className="h-4 w-4 mr-2" />
                    <span>Tags:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {policy.tags.map((tag: string) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Rules ({policy?.rules?.length || 0})
              </h3>

              {policy?.rules && policy.rules.length > 0 ? (
                <div className="space-y-3">
                  {policy.rules.map((rule: any) => (
                    <div
                      key={rule.id}
                      className="p-3 bg-gray-50 rounded-md space-y-1"
                    >
                      <div className="font-medium text-sm">{rule.name}</div>
                      <div className="text-xs text-gray-500">
                        Type:{" "}
                        {rule.type
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </div>
                      {rule.condition && (
                        <div className="text-xs text-gray-500">
                          Condition: {rule.condition.field}{" "}
                          {rule.condition.operator.replace(/_/g, " ")}{" "}
                          {rule.condition.value}
                        </div>
                      )}
                      {rule.action && (
                        <div className="text-xs text-gray-500">
                          Action:{" "}
                          {rule.action.type
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">
                  No rules defined for this policy
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Approvers ({policy?.approvers?.length || 0})
              </h3>

              {policy?.approvers && policy.approvers.length > 0 ? (
                <div className="space-y-3">
                  {policy.approvers.map((approver: any) => (
                    <div
                      key={approver.id}
                      className="p-3 bg-gray-50 rounded-md flex items-center space-x-3"
                    >
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-medium text-sm">
                        {approver?.name
                          ? approver.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                          : "??"}
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {approver?.name || "Unknown"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {approver?.role || "No role"} •{" "}
                          {approver?.email || "No email"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">
                  No approvers assigned to this policy
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history">
            {showVersionComparison ? (
              <PolicyVersionComparison
                leftVersion={selectedVersions[0]}
                rightVersion={selectedVersions[1]}
                leftTitle={`Version ${selectedVersions[0]?.versionNumber || 'Unknown'}`}
                rightTitle={`Version ${selectedVersions[1]?.versionNumber || 'Unknown'}`}
                onClose={() => setShowVersionComparison(false)}
              />
            ) : (
              <PolicyVersionHistory
                policyId={policy?.id || ""}
                policyName={policy?.name || "Unknown Policy"}
                versions={versionHistory.map(version => ({
                  ...version,
                  changeType: version.changeType as "approved" | "rejected" | "created" | "updated" | "rolled back"
                }))}
                currentVersion={3}
                onViewVersion={handleViewVersion}
                onRollbackToVersion={handleRollbackToVersion}
                onCompareVersions={handleCompareVersions}
              />
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default PolicyDetailsPanel;
