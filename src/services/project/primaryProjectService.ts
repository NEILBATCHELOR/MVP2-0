/**
 * Primary Project Service
 * Provides utilities for working with the primary project flag
 */
import { supabase } from "@/infrastructure/database/client";
import { mapDbProjectToProject } from "@/utils/shared/formatting/typeMappers";
import type { ProjectUI } from "@/types/core/centralModels";

/**
 * Get the primary project if one exists
 * @returns The primary project or null if none exists
 */
export async function getPrimaryProject(): Promise<ProjectUI | null> {
  try {
    // Query for projects with is_primary=true
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("is_primary", true)
      .maybeSingle();

    if (error) {
      console.error("Error fetching primary project:", error);
      return null;
    }

    // No primary project found
    if (!data) {
      return null;
    }

    // Map the database project to the ProjectUI type
    return mapDbProjectToProject(data);
  } catch (err) {
    console.error("Unexpected error in getPrimaryProject:", err);
    return null;
  }
}

/**
 * Get either the primary project or the first available project
 * @returns The primary project, first available project, or null if no projects exist
 */
export async function getPrimaryOrFirstProject(): Promise<ProjectUI | null> {
  try {
    // First, try to get the primary project
    const primaryProject = await getPrimaryProject();
    if (primaryProject) {
      return primaryProject;
    }

    // If no primary project exists, get the first project ordered by creation date
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching first project:", error);
      return null;
    }

    // No projects found
    if (!data) {
      return null;
    }

    // Map the database project to the ProjectUI type
    return mapDbProjectToProject(data);
  } catch (err) {
    console.error("Unexpected error in getPrimaryOrFirstProject:", err);
    return null;
  }
}

/**
 * Set a project as the primary project
 * @param projectId The ID of the project to set as primary
 * @returns The updated project or null if the operation failed
 */
export async function setPrimaryProject(projectId: string): Promise<ProjectUI | null> {
  try {
    // First, unset any existing primary projects
    const { error: clearError } = await supabase
      .from("projects")
      .update({ is_primary: false })
      .eq("is_primary", true);

    if (clearError) {
      console.error("Error clearing existing primary projects:", clearError);
      return null;
    }

    // Now set the specified project as primary
    const { data, error } = await supabase
      .from("projects")
      .update({ is_primary: true })
      .eq("id", projectId)
      .select()
      .single();

    if (error) {
      console.error(`Error setting project ${projectId} as primary:`, error);
      return null;
    }

    // Map the database project to the ProjectUI type
    return mapDbProjectToProject(data);
  } catch (err) {
    console.error("Unexpected error in setPrimaryProject:", err);
    return null;
  }
}

/**
 * Clear all primary project flags
 * @returns true if successful, false otherwise
 */
export async function clearPrimaryProjects(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("projects")
      .update({ is_primary: false })
      .eq("is_primary", true);

    if (error) {
      console.error("Error clearing primary projects:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Unexpected error in clearPrimaryProjects:", err);
    return false;
  }
}

/**
 * Check if a project is the primary project
 * @param projectId The ID of the project to check
 * @returns true if the project is primary, false otherwise
 */
export async function isProjectPrimary(projectId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("is_primary")
      .eq("id", projectId)
      .single();

    if (error) {
      console.error(`Error checking if project ${projectId} is primary:`, error);
      return false;
    }

    return data?.is_primary === true;
  } catch (err) {
    console.error("Unexpected error in isProjectPrimary:", err);
    return false;
  }
} 