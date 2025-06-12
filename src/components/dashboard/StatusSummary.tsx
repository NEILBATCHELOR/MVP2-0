import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { CheckCircle, AlertCircle, Clock, Loader2 } from "lucide-react";
import { getWorkflowStages, StatusItem } from "@/services/dashboard/dashboardDataService";

interface StatusSummaryProps {
  items?: StatusItem[];
  overallProgress?: number;
  organizationId?: string;
}

const StatusSummary = ({
  items: initialItems,
  overallProgress: initialProgress,
  organizationId = "default-org",
}: StatusSummaryProps) => {
  const [items, setItems] = useState<StatusItem[]>(initialItems || []);
  const [overallProgress, setOverallProgress] = useState(initialProgress || 0);
  const [loading, setLoading] = useState(!initialItems);

  useEffect(() => {
    if (initialItems) {
      setItems(initialItems);
      return;
    }

    const fetchStatusItems = async () => {
      setLoading(true);
      try {
        // Fetch workflow stages and convert to status items
        const stages = await getWorkflowStages(organizationId);

        const statusItems = stages.map((stage) => ({
          id: stage.id,
          name: stage.name,
          status:
            stage.status === "error" ? "attention" : (stage.status as any),
          percentage: stage.completionPercentage || 0,
        }));

        setItems(statusItems);

        // Calculate overall progress
        const calculatedProgress = Math.round(
          stages.reduce(
            (sum, stage) => sum + (stage.completionPercentage || 0),
            0,
          ) / stages.length,
        );

        setOverallProgress(calculatedProgress);
      } catch (error) {
        console.error("Error fetching status items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatusItems();
  }, [organizationId, initialItems, initialProgress]);
  const getStatusIcon = (status: StatusItem["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "attention":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: StatusItem["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Completed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            In Progress
          </Badge>
        );
      case "attention":
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            Needs Attention
          </Badge>
        );
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-white p-4 rounded-lg shadow-sm">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">SPV Setup Progress</h3>
            <p className="text-sm text-gray-500">
              Overall completion: {overallProgress}%
            </p>
          </div>
          <Progress value={overallProgress} className="w-32 h-2" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading status data...</span>
          </div>
        ) : (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col items-center p-2 text-center"
                  >
                    <div className="flex items-center justify-center mb-2">
                      {getStatusIcon(item.status)}
                    </div>
                    <p className="text-sm font-medium mb-1">{item.name}</p>
                    <div className="mb-2">{getStatusBadge(item.status)}</div>
                    <Progress
                      value={item.percentage}
                      className="h-1 w-full"
                      aria-label={`${item.name} progress: ${item.percentage}%`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {item.percentage}%
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StatusSummary;
