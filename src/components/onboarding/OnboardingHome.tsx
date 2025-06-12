import React, { useState, useEffect } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import WorkflowVisualization from "@/components/dashboard/WorkflowVisualization";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import StatusSummary from "@/components/dashboard/StatusSummary";
import { getWorkflowStages, WorkflowStage } from "@/services/dashboard/dashboardDataService";

const Home = () => {
  const [currentStageId, setCurrentStageId] = useState("document_collection");
  const [activeTab, setActiveTab] = useState("documents");
  const [organizationId] = useState("default-org"); // In a real app, this would come from auth context

  // Handle stage click in workflow visualization
  const handleStageClick = (stageId: string) => {
    setCurrentStageId(stageId);

    // Map stage to corresponding tab
    if (stageId === "registration" || stageId === "document_collection") {
      setActiveTab("documents");
    } else if (stageId === "wallet_setup") {
      setActiveTab("wallets");
    } else if (stageId === "compliance") {
      setActiveTab("compliance");
    } else if (stageId === "secondary_market") {
      setActiveTab("wallets"); // Assuming secondary market is part of wallet management
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <WorkflowVisualization
          currentStageId={currentStageId}
          onStageClick={handleStageClick}
          organizationId={organizationId}
        />

        <StatusSummary organizationId={organizationId} />

        <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </main>
    </div>
  );
};

export default Home;
