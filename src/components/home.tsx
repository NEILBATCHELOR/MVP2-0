import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import ProjectsList from "./projects/ProjectsList";
import CapTableView from "./captable/CapTableView";
import SubscriptionManager from "./subscriptions/SubscriptionManager";
import { getProject, getProjectStatistics } from "@/services/project/projectService";
import { useToast } from "@/components/ui/use-toast";
import { ProjectUI, SubscriptionUI, ProjectType } from "@/types/core/centralModels";
import { mapProjectToProjectUI, mapSubscriptionToSubscriptionUI } from "@/utils/shared/formatting/typeMappers";
import { createSubscriptionV2 as createDbSubscription, updateSubscriptionV2 as updateDbSubscription } from "@/infrastructure/subscriptions";

/**
 * Home Component
 * Central hub for managing projects, viewing cap tables, and handling subscriptions
 */
const Home: React.FC = () => {
  const location = useLocation();
  const [selectedProject, setSelectedProject] = useState<ProjectUI | null>(null);
  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false);
  const [selectedSubscriptionProject, setSelectedSubscriptionProject] = useState<ProjectUI | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Handle project selection for viewing cap table
   * @param projectId Project ID to load
   */
  const handleViewProject = async (projectId: string) => {
    try {
      setIsLoading(true);
      const project = await getProject(projectId);

      if (!project) {
        toast({
          title: "Error",
          description: "Project not found",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Create the project UI before fetching statistics
      const projectUI = mapProjectToProjectUI(project);
      
      try {
        // Fetch statistics separately with its own error handling
        const stats = await getProjectStatistics(projectId);
        console.log("Project statistics loaded successfully:", stats);
        projectUI.totalInvestors = stats.investorCount;
      } catch (statsError) {
        console.error("Error fetching project statistics:", statsError);
        // Use default value if statistics fetch fails
        projectUI.totalInvestors = 0;
      }

      setSelectedProject(projectUI);
    } catch (err) {
      console.error("Error fetching project details:", err);
      toast({
        title: "Error",
        description: "Failed to load project details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset view to projects list
   */
  const handleBackToProjects = () => {
    setSelectedProject(null);
    setShowSubscriptionManager(false);
    setSelectedSubscriptionProject(null);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
  };

  /**
   * Load project for subscription management
   * @param projectId Project ID to manage subscriptions for
   */
  const handleManageSubscription = async (projectId: string) => {
    try {
      setIsLoading(true);
      const project = await getProject(projectId);

      if (!project) {
        toast({
          title: "Error",
          description: "Project not found",
          variant: "destructive",
        });
        return;
      }

      const projectUI = mapProjectToProjectUI(project);
      setSelectedSubscriptionProject(projectUI);
      setShowSubscriptionManager(true);
    } catch (err) {
      console.error("Error fetching project details for subscription:", err);
      toast({
        title: "Error",
        description: "Failed to load project details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle subscription creation
   * @param planId Plan ID to subscribe to
   */
  const handleSubscribe = async (planId: string) => {
    if (!selectedSubscriptionProject) return;

    try {
      setIsLoading(true);

      // Create actual subscription in database
      const fiatAmount = planId === "basic" ? 49.99 : planId === "professional" ? 99.99 : 199.99;
      const subscriptionDate = new Date().toISOString();
      
      const subscriptionData = await createDbSubscription({
        project_id: selectedSubscriptionProject.id,
        investor_id: "default-investor", // This should be the actual investor ID in a real scenario
        currency: "USD",
        fiat_amount: fiatAmount,
        subscription_id: `SUB-${Date.now()}`,
        subscription_date: subscriptionDate,
        confirmed: false,
        allocated: false,
        distributed: false,
        notes: `Subscription to ${planId} plan`,
      });

      // Create UI representation for the new subscription
      const paymentMethod = {
        type: "credit_card" as const,
        last4: "4242",
        expiryDate: "12/25",
        cardType: "Visa",
      };

      const subscriptionUI: SubscriptionUI = {
        id: subscriptionData.id,
        status: "active",
        planName: planId === "basic" ? "Basic" : planId === "professional" ? "Professional" : "Enterprise",
        planId: planId,
        startDate: subscriptionDate,
        billingCycle: "monthly",
        price: fiatAmount,
        paymentMethod,
        investorId: "default-investor",
        projectId: selectedSubscriptionProject.id,
      };

      // Update the project with the new subscription
      setSelectedSubscriptionProject({
        ...selectedSubscriptionProject,
        subscription: subscriptionUI
      });

      toast({
        title: "Success",
        description: "Subscription created successfully",
      });
    } catch (err) {
      console.error("Error creating subscription:", err);
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle subscription cancellation
   */
  const handleCancelSubscription = async () => {
    if (!selectedSubscriptionProject?.subscription) return;
    
    try {
      setIsLoading(true);
      
      // Extract subscription ID safely
      const subscriptionId = typeof selectedSubscriptionProject.subscription === 'object' && 'id' in selectedSubscriptionProject.subscription 
        ? selectedSubscriptionProject.subscription.id 
        : "";
      
      if (!subscriptionId) {
        throw new Error("Invalid subscription ID");
      }
      
      // Update the subscription status in the database
      await updateDbSubscription(subscriptionId, {
        // This is a workaround for the type mismatch
        // In a real application, we would ensure the database schema matches our type definitions
        confirmed: false, // Use this field as a proxy for "cancelled"
        notes: "Cancelled by user"
      });
      
      // Create updated subscription UI object
      const updatedSubscription: SubscriptionUI = {
        ...(typeof selectedSubscriptionProject.subscription === 'object' && 'planId' in selectedSubscriptionProject.subscription
          ? selectedSubscriptionProject.subscription
          : mapSubscriptionToSubscriptionUI(selectedSubscriptionProject.subscription)),
        status: "canceled"
      };
      
      // Update UI state
      setSelectedSubscriptionProject({
        ...selectedSubscriptionProject,
        subscription: updatedSubscription
      });
      
      toast({
        title: "Success",
        description: "Subscription canceled successfully",
      });
    } catch (err) {
      console.error("Error canceling subscription:", err);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle subscription renewal
   */
  const handleRenewSubscription = async () => {
    if (!selectedSubscriptionProject?.subscription) return;
    
    try {
      setIsLoading(true);
      
      // Extract subscription details safely
      const subscription = selectedSubscriptionProject.subscription;
      const subscriptionId = 'id' in subscription ? subscription.id : "";
      
      if (!subscriptionId) {
        throw new Error("Invalid subscription ID");
      }
      
      // Update the subscription status in the database
      await updateDbSubscription(subscriptionId, {
        // This is a workaround for the type mismatch
        confirmed: true, // Use this field as a proxy for "active"
        notes: "Renewed by user"
      });
      
      // Create updated subscription UI object
      const updatedSubscription: SubscriptionUI = {
        ...(typeof subscription === 'object' && 'planId' in subscription
          ? subscription
          : mapSubscriptionToSubscriptionUI(subscription)),
        status: "active"
      };
      
      // Update UI state
      setSelectedSubscriptionProject({
        ...selectedSubscriptionProject,
        subscription: updatedSubscription
      });
      
      toast({
        title: "Success",
        description: "Subscription renewed successfully",
      });
    } catch (err) {
      console.error("Error renewing subscription:", err);
      toast({
        title: "Error",
        description: "Failed to renew subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Convert ProjectType enum to string for CapTableView
   */
  const getCapTableProjectType = (projectType?: ProjectType): "equity" | "token" | "hybrid" => {
    if (!projectType) return "hybrid";
    
    switch (projectType) {
      case ProjectType.EQUITY:
        return "equity";
      case ProjectType.TOKEN:
        return "token";
      case ProjectType.HYBRID:
        return "hybrid";
      case ProjectType.RECEIVABLES:
        return "hybrid"; // Map receivables to hybrid for compatibility
      default:
        return "hybrid";
    }
  };

  /**
   * Safely extract subscription for SubscriptionManager
   */
  const getSubscriptionForUI = (project: ProjectUI): SubscriptionUI | undefined => {
    if (!project.subscription) return undefined;
    
    if ('planId' in project.subscription) {
      return project.subscription as SubscriptionUI;
    }
    
    return mapSubscriptionToSubscriptionUI(project.subscription);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 container mx-auto py-6 px-4 md:px-6">
        {!selectedProject && !showSubscriptionManager && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">
              Manage your token issuance projects
            </p>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : selectedProject ? (
          <CapTableView
            projectId={selectedProject.id}
            projectName={selectedProject.title || selectedProject.name}
            projectSymbol={selectedProject.tokenSymbol || "TKN"}
            projectType={getCapTableProjectType(selectedProject.projectType)}
            authorizedShares={selectedProject.authorizedShares || 10000000}
            sharePrice={selectedProject.sharePrice || selectedProject.tokenPrice || 1.0}
            companyValuation={selectedProject.companyValuation || 10000000}
            fundingRound={(selectedProject as any).fundingRound || "Seed"}
            onBack={handleBackToProjects}
          />
        ) : showSubscriptionManager && selectedSubscriptionProject ? (
          <SubscriptionManager 
            currentSubscription={getSubscriptionForUI(selectedSubscriptionProject)}
            onSubscribe={handleSubscribe}
            onCancelSubscription={handleCancelSubscription}
            onRenewSubscription={handleRenewSubscription}
            onBack={handleBackToProjects}
          />
        ) : (
          <ProjectsList
            onViewProject={handleViewProject}
            onManageSubscription={handleManageSubscription}
            hideHeader={true}
          />
        )}
      </main>
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 md:px-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Chain Capital. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Home;
