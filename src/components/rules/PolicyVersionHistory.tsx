import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import {
  History,
  Clock,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Eye,
  FileText,
} from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface PolicyVersion {
  id: string;
  versionNumber: number;
  timestamp: string;
  changedBy: {
    name: string;
    role: string;
  };
  changeType: "created" | "updated" | "approved" | "rejected" | "rolled back";
  changes: {
    field: string;
    oldValue?: any;
    newValue?: any;
  }[];
  comment?: string;
}

interface PolicyVersionHistoryProps {
  policyId: string;
  policyName: string;
  versions?: PolicyVersion[];
  currentVersion?: number;
  onViewVersion?: (versionId: string) => void;
  onRollbackToVersion?: (versionId: string) => void;
  onCompareVersions?: (versionId1: string, versionId2: string) => void;
}

const PolicyVersionHistory = ({
  policyId,
  policyName,
  versions = [],
  currentVersion = versions.length > 0 ? versions[0].versionNumber : 1,
  onViewVersion = () => {},
  onRollbackToVersion = () => {},
  onCompareVersions = () => {},
}: PolicyVersionHistoryProps) => {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState<string[]>([]);
  const [showRollbackDialog, setShowRollbackDialog] = useState(false);
  const [rollbackVersionId, setRollbackVersionId] = useState<string>("");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getChangeTypeBadge = (changeType: string) => {
    switch (changeType) {
      case "created":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Created
          </Badge>
        );
      case "updated":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            Updated
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Rejected
          </Badge>
        );
      case "rolled back":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            Rolled Back
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

  const handleVersionClick = (versionId: string) => {
    if (compareMode) {
      if (compareVersions.includes(versionId)) {
        setCompareVersions(compareVersions.filter((id) => id !== versionId));
      } else if (compareVersions.length < 2) {
        setCompareVersions([...compareVersions, versionId]);
      }
    } else {
      setSelectedVersion(versionId === selectedVersion ? null : versionId);
      if (versionId !== selectedVersion) {
        onViewVersion(versionId);
      }
    }
  };

  const handleCompareClick = () => {
    if (compareVersions.length === 2) {
      onCompareVersions(compareVersions[0], compareVersions[1]);
    }
  };

  const handleRollbackClick = (versionId: string) => {
    setRollbackVersionId(versionId);
    setShowRollbackDialog(true);
  };

  const confirmRollback = () => {
    onRollbackToVersion(rollbackVersionId);
    setShowRollbackDialog(false);
  };

  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    setCompareVersions([]);
  };

  return (
    <Card className="w-full bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center">
            <History className="mr-2 h-5 w-5" />
            Version History
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleCompareMode}
              className={compareMode ? "bg-blue-50 text-blue-700" : ""}
            >
              {compareMode ? "Cancel Compare" : "Compare Versions"}
            </Button>
            {compareMode && compareVersions.length === 2 && (
              <Button
                size="sm"
                onClick={handleCompareClick}
                className="bg-[#0f172b] hover:bg-[#0f172b]/90"
              >
                Compare Selected
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-500">
          <span className="font-medium">Policy:</span> {policyName}
          <span className="ml-4 font-medium">Current Version:</span> v
          {currentVersion}
        </div>

        <Separator />

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {versions.length > 0 ? (
              versions.map((version) => (
                <div
                  key={version.id}
                  className={`p-4 border rounded-md transition-colors ${selectedVersion === version.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"} ${
                    compareMode && compareVersions.includes(version.id)
                      ? "border-purple-500 bg-purple-50"
                      : ""
                  }`}
                  onClick={() => handleVersionClick(version.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-gray-100">
                        v{version.versionNumber}
                      </Badge>
                      {getChangeTypeBadge(version.changeType)}
                      {version.versionNumber === currentVersion && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!compareMode && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-blue-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewVersion(version.id);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View this version</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {!compareMode &&
                        version.versionNumber !== currentVersion && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-500 hover:text-amber-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRollbackClick(version.id);
                                  }}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Roll back to this version</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-2">
                    <Clock className="inline-block h-3 w-3 mr-1" />
                    {formatDate(version.timestamp)} by {version.changedBy.name}{" "}
                    ({version.changedBy.role})
                  </div>

                  {version.comment && (
                    <div className="text-sm italic text-gray-600 mb-2">
                      "{version.comment}"
                    </div>
                  )}

                  {version.changes && version.changes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <h4 className="text-xs font-medium text-gray-500 mb-2">
                        Changes:
                      </h4>
                      <div className="space-y-2">
                        {version.changes.map((change, index) => (
                          <div key={index} className="text-xs">
                            <span className="font-medium">{change.field}:</span>
                            {change.oldValue && change.newValue ? (
                              <span className="ml-1">
                                <span className="text-red-600 line-through">
                                  {typeof change.oldValue === "object"
                                    ? JSON.stringify(change.oldValue)
                                    : change.oldValue}
                                </span>
                                <ArrowRight className="inline-block h-3 w-3 mx-1" />
                                <span className="text-green-600">
                                  {typeof change.newValue === "object"
                                    ? JSON.stringify(change.newValue)
                                    : change.newValue}
                                </span>
                              </span>
                            ) : change.newValue ? (
                              <span className="ml-1 text-green-600">
                                Added{" "}
                                {typeof change.newValue === "object"
                                  ? JSON.stringify(change.newValue)
                                  : change.newValue}
                              </span>
                            ) : (
                              <span className="ml-1 text-red-600">
                                Removed{" "}
                                {typeof change.oldValue === "object"
                                  ? JSON.stringify(change.oldValue)
                                  : change.oldValue}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p>No version history available</p>
                <p className="text-sm mt-1">
                  Changes to this policy will be tracked here
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {versions.length > 0 && (
          <div className="pt-2">
            <Separator className="mb-2" />
            <div className="text-xs text-gray-500 text-center">
              Showing {versions.length} version
              {versions.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}
      </CardContent>

      {/* Rollback Confirmation Dialog */}
      <Dialog open={showRollbackDialog} onOpenChange={setShowRollbackDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Rollback</DialogTitle>
            <DialogDescription>
              Are you sure you want to roll back to version{" "}
              {versions.find((v) => v.id === rollbackVersionId)?.versionNumber}?
              This will create a new version based on the selected historical
              version.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50 p-3 rounded-md text-amber-800 text-sm mt-2">
            <p>
              Warning: Rolling back will revert all changes made after this
              version. This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowRollbackDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRollback}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Confirm Rollback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PolicyVersionHistory;
