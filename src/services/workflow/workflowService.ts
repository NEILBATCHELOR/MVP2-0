import { supabase } from "@/infrastructure/database/client";
import { ApiResponse } from "@/infrastructure/api";

// Define the correct workflow stage type
export interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  status: "pending" | "completed" | "error" | "in_progress";
  completionPercentage?: number;
}

// Types for workflow data
export interface WorkflowStatus {
  currentStage: string;
  overallProgress: number;
  stages: WorkflowStage[];
}

export interface StageRequirement {
  id: string;
  stageId: string;
  name: string;
  description: string;
  status: "completed" | "pending" | "failed";
  completedAt?: string;
}

// Workflow stage management functions
export async function getWorkflowStatus(
  organizationId: string,
): Promise<ApiResponse<WorkflowStatus>> {
  try {
    const { data, error } = await supabase
      .from("workflow_stages")
      .select("*")
      .eq("organization_id", organizationId)
      .order("order", { ascending: true });

    if (error) throw error;

    // Transform data to match our interface
    const stages: WorkflowStage[] = data.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      // Add type assertion to ensure status matches the expected enum
      status: (item.status as "pending" | "completed" | "error" | "in_progress"),
      completionPercentage: item.completion_percentage,
    }));

    // Calculate overall progress
    const overallProgress = Math.round(
      stages.reduce(
        (sum, stage) => sum + (stage.completionPercentage || 0),
        0,
      ) / stages.length,
    );

    // Determine current stage
    let currentStage = stages[0].id;
    for (const stage of stages) {
      if (stage.status === "in_progress") {
        currentStage = stage.id;
        break;
      }
    }

    return {
      data: {
        currentStage,
        overallProgress,
        stages,
      },
      status: 200,
    };
  } catch (error) {
    console.error("Error getting workflow status:", error);
    return { error: "Failed to get workflow status", status: 500 };
  }
}

export async function updateStageStatus(
  stageId: string,
  status: "completed" | "in_progress" | "pending" | "error",
  completionPercentage?: number,
): Promise<ApiResponse<WorkflowStage>> {
  try {
    const { data, error } = await supabase
      .from("workflow_stages")
      .update({
        status,
        completion_percentage: completionPercentage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", stageId)
      .select()
      .single();

    if (error) throw error;

    // If a stage is completed, set the next stage to in_progress
    if (status === "completed") {
      const { data: stageData } = await supabase
        .from("workflow_stages")
        .select("organization_id, order")
        .eq("id", stageId)
        .single();

      if (stageData) {
        // Find the next stage
        const { data: nextStages } = await supabase
          .from("workflow_stages")
          .select("id")
          .eq("organization_id", stageData.organization_id)
          .gt("order", stageData.order)
          .order("order", { ascending: true })
          .limit(1);

        if (nextStages && nextStages.length > 0) {
          // Set the next stage to in_progress
          await supabase
            .from("workflow_stages")
            .update({
              status: "in_progress",
              updated_at: new Date().toISOString(),
            })
            .eq("id", nextStages[0].id);
        }
      }
    }

    const updatedStage: WorkflowStage = {
      id: data.id,
      name: data.name,
      description: data.description,
      // Add type assertion to ensure status matches the expected enum
      status: data.status as "pending" | "completed" | "error" | "in_progress",
      completionPercentage: data.completion_percentage,
    };

    return { data: updatedStage, status: 200 };
  } catch (error) {
    console.error("Error updating stage status:", error);
    return { error: "Failed to update stage status", status: 500 };
  }
}

export async function getStageRequirements(
  stageId: string,
): Promise<ApiResponse<StageRequirement[]>> {
  try {
    const { data, error } = await supabase
      .from("stage_requirements")
      .select("*")
      .eq("stage_id", stageId)
      .order("order", { ascending: true });

    if (error) throw error;

    const requirements: StageRequirement[] = data.map((item) => ({
      id: item.id,
      stageId: item.stage_id,
      name: item.name,
      description: item.description,
      // Add type assertion to ensure status matches the expected enum
      status: item.status as "completed" | "pending" | "failed",
      completedAt: item.completed_at,
    }));

    return { data: requirements, status: 200 };
  } catch (error) {
    console.error("Error getting stage requirements:", error);
    return { error: "Failed to get stage requirements", status: 500 };
  }
}

export async function completeRequirement(
  requirementId: string,
): Promise<ApiResponse<StageRequirement>> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("stage_requirements")
      .update({
        status: "completed",
        completed_at: now,
        updated_at: now,
      })
      .eq("id", requirementId)
      .select()
      .single();

    if (error) throw error;

    // Check if all requirements for this stage are completed
    const { data: stageData } = await supabase
      .from("stage_requirements")
      .select("stage_id")
      .eq("id", requirementId)
      .single();

    if (stageData) {
      const { data: requirements } = await supabase
        .from("stage_requirements")
        .select("status")
        .eq("stage_id", stageData.stage_id);

      const allCompleted = requirements.every(
        (req) => req.status === "completed",
      );

      if (allCompleted) {
        // Update the stage completion percentage to 100%
        await supabase
          .from("workflow_stages")
          .update({
            completion_percentage: 100,
            updated_at: now,
          })
          .eq("id", stageData.stage_id);
      } else {
        // Calculate the completion percentage
        const completedCount = requirements.filter(
          (req) => req.status === "completed",
        ).length;
        const completionPercentage = Math.round(
          (completedCount / requirements.length) * 100,
        );

        await supabase
          .from("workflow_stages")
          .update({
            completion_percentage: completionPercentage,
            updated_at: now,
          })
          .eq("id", stageData.stage_id);
      }
    }

    const requirement: StageRequirement = {
      id: data.id,
      stageId: data.stage_id,
      name: data.name,
      description: data.description,
      status: "completed",
      completedAt: now,
    };

    return { data: requirement, status: 200 };
  } catch (error) {
    console.error("Error completing requirement:", error);
    return { error: "Failed to complete requirement", status: 500 };
  }
}

export async function failRequirement(
  requirementId: string,
  reason: string,
): Promise<ApiResponse<StageRequirement>> {
  try {
    const { data, error } = await supabase
      .from("stage_requirements")
      .update({
        status: "failed",
        failure_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requirementId)
      .select()
      .single();

    if (error) throw error;

    // Update the stage status to error
    const { data: stageData } = await supabase
      .from("stage_requirements")
      .select("stage_id")
      .eq("id", requirementId)
      .single();

    if (stageData) {
      await supabase
        .from("workflow_stages")
        .update({
          status: "error",
          updated_at: new Date().toISOString(),
        })
        .eq("id", stageData.stage_id);
    }

    const requirement: StageRequirement = {
      id: data.id,
      stageId: data.stage_id,
      name: data.name,
      description: data.description,
      status: "failed",
    };

    return { data: requirement, status: 200 };
  } catch (error) {
    console.error("Error failing requirement:", error);
    return { error: "Failed to update requirement status", status: 500 };
  }
}
