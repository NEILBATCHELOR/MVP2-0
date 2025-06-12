import React, { useState, useEffect } from "react";
import { Check, ChevronRight, Clock, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { getWorkflowStages, WorkflowStage } from "@/services/dashboard/dashboardDataService";

interface WorkflowVisualizationProps {
  stages?: WorkflowStage[];
  currentStageId?: string;
  onStageClick?: (stageId: string) => void;
  organizationId?: string;
}

const WorkflowVisualization: React.FC<WorkflowVisualizationProps> = ({
  stages: initialStages,
  currentStageId = "document_collection",
  onStageClick = () => {},
  organizationId = "default-org",
}) => {
  const [stages, setStages] = useState<WorkflowStage[]>(initialStages || []);
  const [loading, setLoading] = useState(!initialStages);

  useEffect(() => {
    if (initialStages) {
      setStages(initialStages);
      return;
    }

    const fetchStages = async () => {
      setLoading(true);
      try {
        const data = await getWorkflowStages(organizationId);
        setStages(data);
      } catch (error) {
        console.error("Error fetching workflow stages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStages();
  }, [organizationId, initialStages]);
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  const getStatusIcon = (status: WorkflowStage["status"]) => {
    switch (status) {
      case "completed":
        return <Check className="h-5 w-5 text-white" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-white" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-white" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: WorkflowStage["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in_progress":
        return "bg-blue-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  const getConnectorColor = (index: number) => {
    const currentStageIndex = stages.findIndex(
      (stage) => stage.id === currentStageId,
    );

    if (index < currentStageIndex) {
      return "bg-green-500"; // Completed connector
    } else if (index === currentStageIndex) {
      return "bg-blue-500"; // Current stage connector
    } else {
      return "bg-gray-300"; // Future stage connector
    }
  };

  return (
    <Card className="w-full bg-white">
      <CardContent className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">SPV Setup Progress</h2>
          <p className="text-gray-500">
            Track your progress through the SPV setup workflow
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading workflow data...</span>
          </div>
        ) : (
          <>
            <div className="relative flex items-start justify-between mt-8">
              {stages.map((stage, index) => (
                <React.Fragment key={stage.id}>
                  <div
                    className="flex flex-col items-center z-10 relative"
                    onMouseEnter={() => setHoveredStage(stage.id)}
                    onMouseLeave={() => setHoveredStage(null)}
                  >
                    <TooltipProvider>
                      <Tooltip open={hoveredStage === stage.id}>
                        <TooltipTrigger asChild>
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer ${getStatusColor(stage.status)}`}
                            onClick={() => onStageClick(stage.id)}
                          >
                            {getStatusIcon(stage.status) || (
                              <span className="text-white font-bold">
                                {index + 1}
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="p-4 max-w-xs">
                          <div>
                            <h3 className="font-bold">{stage.name}</h3>
                            <p className="text-sm">{stage.description}</p>
                            {stage.completionPercentage !== undefined && (
                              <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${getStatusColor(stage.status)}`}
                                    style={{
                                      width: `${stage.completionPercentage}%`,
                                    }}
                                  ></div>
                                </div>
                                <p className="text-xs text-right mt-1">
                                  {stage.completionPercentage}% complete
                                </p>
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <div className="mt-3 text-center">
                      <p className="font-medium text-sm">{stage.name}</p>
                      <p className="text-xs text-gray-500">
                        {stage.status === "completed" && "Completed"}
                        {stage.status === "in_progress" && "In Progress"}
                        {stage.status === "pending" && "Pending"}
                        {stage.status === "error" && "Action Required"}
                      </p>
                    </div>
                  </div>

                  {/* Connector line between stages */}
                  {index < stages.length - 1 && (
                    <div className="flex-1 flex items-center justify-center z-0">
                      <div
                        className={`h-1 w-full ${getConnectorColor(index)}`}
                      ></div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                variant="outline"
                className="mr-2"
                onClick={() => {
                  const currentIndex = stages.findIndex(
                    (stage) => stage.id === currentStageId,
                  );
                  if (currentIndex > 0) {
                    onStageClick(stages[currentIndex - 1].id);
                  }
                }}
                disabled={
                  currentStageId === stages[0]?.id || stages.length === 0
                }
              >
                Previous Stage
              </Button>
              <Button
                onClick={() => {
                  const currentIndex = stages.findIndex(
                    (stage) => stage.id === currentStageId,
                  );
                  if (currentIndex < stages.length - 1) {
                    onStageClick(stages[currentIndex + 1].id);
                  }
                }}
                disabled={
                  currentStageId === stages[stages.length - 1]?.id ||
                  stages.length === 0
                }
              >
                Next Stage
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkflowVisualization;
