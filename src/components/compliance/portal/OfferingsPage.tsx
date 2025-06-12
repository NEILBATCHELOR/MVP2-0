import React, { useEffect, useState } from "react";
import { supabase } from "@/infrastructure/database/client";
import { ProjectUI, IssuerDocument } from "@/types/core/centralModels";
import { mapDbProjectToProject } from "@/utils/shared/formatting/typeMappers";
import OfferingCard from "./OfferingCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

const OfferingsPage = () => {
  const [offerings, setOfferings] = useState<ProjectUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOfferings();
  }, []);

  const fetchOfferings = async () => {
    setIsLoading(true);
    try {
      // Fetch open investment projects
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("investment_status", "Open");

      if (projectsError) {
        throw projectsError;
      }

      // Map DB projects to ProjectUI format
      const mappedProjects = projectsData.map(mapDbProjectToProject);

      // For each project, fetch its public documents
      const projectsWithDocs = await Promise.all(
        mappedProjects.map(async (project) => {
          const { data: docsData, error: docsError } = await supabase
            .from("issuer_detail_documents")
            .select("*")
            .eq("project_id", project.id)
            .eq("is_public", true);

          if (docsError) {
            console.error(`Error fetching documents for project ${project.id}:`, docsError);
            return project;
          }

          return {
            ...project,
            issuerDocuments: docsData || [],
          };
        })
      );

      setOfferings(projectsWithDocs);
    } catch (error) {
      console.error("Error fetching offerings:", error);
      toast({
        title: "Error",
        description: "Failed to load investment opportunities. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Investment Opportunities</h1>
        <p className="text-muted-foreground">
          Browse available tokenized projects open for investment
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <div className="pt-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="h-10 w-full mt-4" />
            </div>
          ))}
        </div>
      ) : offerings.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">No investment opportunities available</h3>
          <p className="text-muted-foreground">
            Check back later for new investment opportunities.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offerings.map((offering) => (
            <OfferingCard key={offering.id} offering={offering} />
          ))}
        </div>
      )}
    </div>
  );
};

export default OfferingsPage;