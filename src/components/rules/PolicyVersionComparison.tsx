import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { ArrowLeft, ArrowRight, FileText, Clock, X } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

interface PolicyVersion {
  id: string;
  versionNumber: number;
  timestamp: string;
  changedBy: {
    name: string;
    role: string;
  };
  policyData: any;
}

interface PolicyVersionComparisonProps {
  leftVersion: any;
  rightVersion: any;
  leftTitle: string;
  rightTitle: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
}

const PolicyVersionComparison = ({
  leftVersion,
  rightVersion,
  leftTitle,
  rightTitle,
  onClose,
}: PolicyVersionComparisonProps) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Generate differences between versions
  const differences = generateDifferences(leftVersion, rightVersion);

  return (
    <Card className="w-full bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Version Comparison
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                {leftTitle}
              </Badge>
              {leftVersion.timestamp && (
                <div className="text-xs text-gray-500">
                  <Clock className="inline-block h-3 w-3 mr-1" />
                  {formatDate(leftVersion.timestamp)}
                </div>
              )}
            </div>
            {leftVersion.changedBy && (
              <div className="text-sm">
                <span className="font-medium">Changed by:</span>{" "}
                {leftVersion.changedBy.name} ({leftVersion.changedBy.role})
              </div>
            )}
          </div>

          <div className="p-3 bg-green-50 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="bg-green-100 text-green-800">
                {rightTitle}
              </Badge>
              {rightVersion.timestamp && (
                <div className="text-xs text-gray-500">
                  <Clock className="inline-block h-3 w-3 mr-1" />
                  {formatDate(rightVersion.timestamp)}
                </div>
              )}
            </div>
            {rightVersion.changedBy && (
              <div className="text-sm">
                <span className="font-medium">Changed by:</span>{" "}
                {rightVersion.changedBy.name} ({rightVersion.changedBy.role})
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="text-sm font-medium">Changes Summary</div>

        <ScrollArea className="h-[400px] pr-4">
          {differences.length > 0 ? (
            <div className="space-y-4">
              {differences.map((diff, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-md"
                >
                  <h3 className="font-medium mb-2">{diff.field}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-md">
                      <div className="text-sm text-blue-800">
                        {renderValue(diff.oldValue)}
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-md">
                      <div className="text-sm text-green-800">
                        {renderValue(diff.newValue)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center mt-2 text-gray-500">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="mx-2 text-xs">Changes</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No differences found between these versions</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

// Helper function to render different types of values
function renderValue(value: any) {
  if (value === undefined || value === null) {
    return <span className="text-gray-400 italic">None</span>;
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return (
      <div className="space-y-1">
        {Object.entries(value).map(([key, val]) => (
          <div key={key} className="text-xs">
            <span className="font-medium">{key}:</span> {renderSimpleValue(val)}
          </div>
        ))}
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div className="space-y-1">
        {value.length === 0 ? (
          <span className="text-gray-400 italic">Empty array</span>
        ) : (
          value.map((item, i) => (
            <div key={i} className="text-xs">
              {typeof item === "object" ? (
                <div className="ml-2">
                  {Object.entries(item).map(([key, val]) => (
                    <div key={key}>
                      <span className="font-medium">{key}:</span>{" "}
                      {renderSimpleValue(val)}
                    </div>
                  ))}
                </div>
              ) : (
                <span>• {String(item)}</span>
              )}
            </div>
          ))
        )}
      </div>
    );
  }

  return renderSimpleValue(value);
}

// Helper function to render simple values
function renderSimpleValue(value: any) {
  if (value === undefined || value === null) {
    return <span className="text-gray-400 italic">None</span>;
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

// Helper function to generate differences between two objects
function generateDifferences(oldObj: any, newObj: any) {
  const differences: { field: string; oldValue: any; newValue: any }[] = [];

  // Helper function to recursively find differences
  function findDifferences(oldValue: any, newValue: any, path: string = "") {
    // If both values are objects, compare their properties
    if (
      typeof oldValue === "object" &&
      oldValue !== null &&
      typeof newValue === "object" &&
      newValue !== null &&
      !Array.isArray(oldValue) &&
      !Array.isArray(newValue)
    ) {
      // Get all keys from both objects
      const allKeys = new Set([
        ...Object.keys(oldValue),
        ...Object.keys(newValue),
      ]);

      for (const key of allKeys) {
        const oldVal = oldValue[key];
        const newVal = newValue[key];
        const newPath = path ? `${path}.${key}` : key;

        // Recursively find differences
        findDifferences(oldVal, newVal, newPath);
      }
    }
    // If both values are arrays, compare them
    else if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      // Simple length check
      if (oldValue.length !== newValue.length) {
        differences.push({
          field: path || "Array",
          oldValue,
          newValue,
        });
      } else {
        // Check each element (simplified, doesn't handle reordering well)
        let hasDifference = false;
        for (let i = 0; i < oldValue.length; i++) {
          if (JSON.stringify(oldValue[i]) !== JSON.stringify(newValue[i])) {
            hasDifference = true;
            break;
          }
        }
        if (hasDifference) {
          differences.push({
            field: path || "Array",
            oldValue,
            newValue,
          });
        }
      }
    }
    // For primitive values, compare directly
    else if (oldValue !== newValue) {
      differences.push({
        field: path || "Value",
        oldValue,
        newValue,
      });
    }
  }

  // Start the recursive comparison
  findDifferences(oldObj, newObj);

  return differences;
}

export default PolicyVersionComparison;
