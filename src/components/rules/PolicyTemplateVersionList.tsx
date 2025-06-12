import React from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Clock, Download, History, Trash2, Copy, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { TemplateVersion } from "@/services/policy/enhancedPolicyTemplateService";

interface PolicyTemplateVersionListProps {
  versions: TemplateVersion[];
  templateName: string;
  onUseVersion: (version: TemplateVersion) => void;
  onDeleteVersion: (versionId: string) => void;
  onCompareVersions?: (version1: string, version2: string) => void;
}

const PolicyTemplateVersionList = ({
  versions = [],
  templateName,
  onUseVersion = () => {},
  onDeleteVersion = () => {},
  onCompareVersions,
}: PolicyTemplateVersionListProps) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-sm">
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            {templateName} - Versions
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage and compare different versions of this template
          </p>
        </div>
      </div>

      {versions.length > 0 ? (
        <div className="space-y-4">
          {versions.map((version, index) => (
            <Card
              key={version.version_id}
              className="w-full border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        Version {version.version}
                      </h3>
                      {index === 0 && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Latest
                        </Badge>
                      )}
                    </div>

                    {version.notes && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {version.notes}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-3">
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        Created: {formatDate(version.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-start">
                    <Button
                      onClick={() => onUseVersion(version)}
                      className="bg-[#0f172b] hover:bg-[#0f172b]/90 text-white"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Use Version
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onCompareVersions && versions.length > 1 && index > 0 && (
                          <DropdownMenuItem
                            onClick={() => onCompareVersions(versions[0].version, version.version)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <History className="mr-2 h-4 w-4" />
                            Compare with Latest
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => onDeleteVersion(version.version_id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Version
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="text-xs text-gray-500">
                  <FileText className="h-3.5 w-3.5 inline mr-1" />
                  <span className="font-medium">Version ID:</span>{" "}
                  {version.version_id.substring(0, 8)}...
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No versions available</p>
          <p className="text-sm text-gray-400">
            Save new versions of this template to track changes over time
          </p>
        </div>
      )}
    </div>
  );
};

export default PolicyTemplateVersionList;