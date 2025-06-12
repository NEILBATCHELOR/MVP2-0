import { useState, useEffect } from "react";
import type { WorkflowStage } from "@/services/dashboard/dashboardDataService";
import { getWorkflowStages } from "@/services/dashboard/dashboardDataService";
import {
  getWorkflowStatus,
  updateStageStatus,
  getStageRequirements,
  completeRequirement,
  failRequirement,
  StageRequirement,
} from "@/services/workflow/workflowService";

export function useWorkflow(organizationId: string = "default-org") {
  const [stages, setStages] = useState<WorkflowStage[]>([]);
  const [currentStageId, setCurrentStageId] = useState<string>("");
  const [overallProgress, setOverallProgress] = useState(0);
  const [requirements, setRequirements] = useState<StageRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load workflow data on component mount
  useEffect(() => {
    loadWorkflowData();
  }, [organizationId]);

  // Load workflow data from the API
  const loadWorkflowData = async () => {
    setLoading(true);
    try {
      const response = await getWorkflowStatus(organizationId);
      if (response.error) {
        throw new Error(response.error);
      }

      setStages(response.data.stages);
      setCurrentStageId(response.data.currentStage);
      setOverallProgress(response.data.overallProgress);

      // Load requirements for the current stage
      if (response.data.currentStage) {
        await loadStageRequirements(response.data.currentStage);
      }

      setError(null);
    } catch (err) {
      console.error("Error loading workflow data:", err);
      setError("Failed to load workflow data");

      // Fall back to getWorkflowStages for backward compatibility
      try {
        const fallbackStages = await getWorkflowStages(organizationId);
        setStages(fallbackStages);

        // Find the current stage
        const inProgressStage = fallbackStages.find(
          (stage) => stage.status === "in_progress",
        );
        if (inProgressStage) {
          setCurrentStageId(inProgressStage.id);
        } else if (fallbackStages.length > 0) {
          setCurrentStageId(fallbackStages[0].id);
        }

        // Calculate overall progress
        const calculatedProgress = Math.round(
          fallbackStages.reduce(
            (sum, stage) => sum + (stage.completionPercentage || 0),
            0,
          ) / fallbackStages.length,
        );
        setOverallProgress(calculatedProgress);
      } catch (fallbackErr) {
        console.error("Error loading fallback workflow data:", fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load requirements for a specific stage
  const loadStageRequirements = async (stageId: string) => {
    setLoading(true);
    try {
      const response = await getStageRequirements(stageId);
      if (response.error) {
        throw new Error(response.error);
      }

      setRequirements(response.data);
      setError(null);
    } catch (err) {
      console.error("Error loading stage requirements:", err);
      setError("Failed to load stage requirements");
      setRequirements([]);
    } finally {
      setLoading(false);
    }
  };

  // Update the status of a workflow stage
  const updateStage = async (
    stageId: string,
    status: WorkflowStage["status"],
    completionPercentage?: number,
  ) => {
    setLoading(true);
    try {
      const response = await updateStageStatus(
        stageId,
        status,
        completionPercentage,
      );
      if (response.error) {
        throw new Error(response.error);
      }

      // Update the stages in the local state
      setStages((prev) => {
        return prev.map((stage) => {
          if (stage.id === stageId) {
            return {
              ...stage,
              status,
              completionPercentage:
                completionPercentage !== undefined
                  ? completionPercentage
                  : stage.completionPercentage,
            };
          }
          return stage;
        });
      });

      // If a stage is completed, we might need to update the current stage
      if (status === "completed" && stageId === currentStageId) {
        // Find the next stage that's not completed
        const stageIndex = stages.findIndex((stage) => stage.id === stageId);
        if (stageIndex !== -1 && stageIndex < stages.length - 1) {
          const nextStage = stages[stageIndex + 1];
          setCurrentStageId(nextStage.id);
          await loadStageRequirements(nextStage.id);
        }
      }

      // Recalculate overall progress
      const calculatedProgress = Math.round(
        stages.reduce((sum, stage) => {
          // Use the updated value for the stage we just changed
          if (stage.id === stageId) {
            return sum + (completionPercentage || 0);
          }
          return sum + (stage.completionPercentage || 0);
        }, 0) / stages.length,
      );
      setOverallProgress(calculatedProgress);

      setError(null);
      return response.data;
    } catch (err) {
      console.error("Error updating stage:", err);
      setError("Failed to update stage");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Complete a requirement
  const completeStageRequirement = async (requirementId: string) => {
    setLoading(true);
    try {
      const response = await completeRequirement(requirementId);
      if (response.error) {
        throw new Error(response.error);
      }

      // Update the requirements in the local state
      setRequirements((prev) => {
        return prev.map((req) => {
          if (req.id === requirementId) {
            return {
              ...req,
              status: "completed",
              completedAt: new Date().toISOString(),
            };
          }
          return req;
        });
      });

      // Reload the workflow data to get updated stage completion percentages
      await loadWorkflowData();

      setError(null);
      return response.data;
    } catch (err) {
      console.error("Error completing requirement:", err);
      setError("Failed to complete requirement");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fail a requirement
  const failStageRequirement = async (
    requirementId: string,
    reason: string,
  ) => {
    setLoading(true);
    try {
      const response = await failRequirement(requirementId, reason);
      if (response.error) {
        throw new Error(response.error);
      }

      // Update the requirements in the local state
      setRequirements((prev) => {
        return prev.map((req) => {
          if (req.id === requirementId) {
            return {
              ...req,
              status: "failed",
            };
          }
          return req;
        });
      });

      // Reload the workflow data to get updated stage status
      await loadWorkflowData();

      setError(null);
      return response.data;
    } catch (err) {
      console.error("Error failing requirement:", err);
      setError("Failed to update requirement");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    stages,
    currentStageId,
    overallProgress,
    requirements,
    loading,
    error,
    loadWorkflowData,
    loadStageRequirements,
    updateStage,
    completeRequirement: completeStageRequirement,
    failRequirement: failStageRequirement,
  };
}