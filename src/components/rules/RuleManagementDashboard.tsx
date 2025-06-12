import React, { useState, useEffect } from "react";
import DashboardHeader from "./DashboardHeader";
import PolicyList from "./PolicyList";
import PolicyCreationModal from "./PolicyCreationModal";
import PolicyDetailsPanel from "./PolicyDetailsPanel";
import PolicyAnalytics from "./PolicyAnalytics";
import DeletePolicyDialog from "./DeletePolicyDialog";
import EnhancedApprovalDashboard from "./EnhancedApprovalDashboard";
import PolicyTemplatesTab from "./PolicyTemplatesTab";
import { useAuth } from "@/infrastructure/auth/AuthProvider";
import { savePolicy, getAllPolicies } from "@/services/policy/enhancedPolicyService";
import { Policy } from "@/services/policy/policyService";
import { savePolicyTemplate } from "@/services/policy/policyTemplateService";
import { getAllPolicyTemplates, toggleTemplateStatus } from "@/services/policy/enhancedPolicyTemplateService";
import { v4 as uuidv4 } from 'uuid';

// Local Policy interface for UI component
interface PolicyData {
  id: string;
  name: string;
  status: "active" | "inactive" | "draft" | "pending";
  createdAt: string;
  modifiedAt: string;
  description: string;
  type: string;
  jurisdiction: string;
  effectiveDate: string;
  expirationDate?: string;
  tags: string[];
  rules: any[];
  approvers: any[];
  approvalHistory?: any[];
  reviewFrequency?: string;
  isActive?: boolean;
  isTemplate?: boolean;
  version?: number;
}

// Helper function to ensure we have a valid UUID
function ensureUUID(id) {
  if (!id) return uuidv4(); // If no ID is provided, generate a new one
  
  // Check if it's already a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;
  
  // For special cases like 'admin-bypass', generate a deterministic UUID
  if (id === 'admin-bypass') {
    return '00000000-0000-0000-0000-000000000000'; // Special admin UUID
  }
  
  // For other cases, create a UUID v5 based on the string
  return uuidv4(); // In a real implementation, you might want to use a deterministic UUID
}

const RuleManagementDashboard = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyData | null>(null);
  const [policyToDelete, setPolicyToDelete] = useState<PolicyData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [policyTemplates, setPolicyTemplates] = useState<any[]>([]);
  const [policies, setPolicies] = useState<PolicyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const { user } = useAuth();

  // Fetch policies when component mounts
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setIsLoading(true);
        const data = await getAllPolicies();
        
        // Transform the data to match our PolicyData interface
        const formattedPolicies = data.map(policy => {
          // Create a properly typed object
          const formattedPolicy: PolicyData = {
            id: policy.id || '',
            name: policy.name || '',
            description: policy.description || '',
            type: policy.type || '',
            jurisdiction: policy.jurisdiction || 'global',
            effectiveDate: policy.effectiveDate || new Date().toISOString().split('T')[0],
            tags: policy.tags || [],
            rules: policy.rules || [],
            approvers: policy.approvers || [],
            status: (policy.status || 'draft') as "active" | "inactive" | "draft" | "pending",
            createdAt: policy.createdAt || new Date().toISOString(),
            modifiedAt: policy.modifiedAt || new Date().toISOString(),
            isActive: policy.isActive || false,
            approvalHistory: (policy as any).approvalHistory || [],
            expirationDate: policy.expirationDate,
            reviewFrequency: policy.reviewFrequency,
            isTemplate: policy.isTemplate,
            version: policy.version
          };
          
          return formattedPolicy;
        });
        
        setPolicies(formattedPolicies);
      } catch (error) {
        console.error("Error fetching policies:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolicies();
  }, []);
  
  // Fetch policy templates when component mounts
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await getAllPolicyTemplates();
        
        // Transform to match the expected format for the UI
        const formattedTemplates = data.map(template => ({
          id: template.template_id,
          name: template.template_name,
          description: template.description || "",
          type: (template.template_data as any)?.type || 'custom',
          createdAt: template.created_at || new Date().toISOString(),
          tags: (template.template_data as any)?.tags || [],
          rules: (template.template_data as any)?.rules || [],
          approvers: (template.template_data as any)?.approvers || [],
          isTemplate: true,
          status: template.status || 'active'
        }));
        
        setPolicyTemplates(formattedTemplates);
      } catch (error) {
        console.error("Error fetching templates:", error);
      }
    };

    fetchTemplates();
  }, []);

  // Update the pendingApprovalsCount when component mounts or user changes
  useEffect(() => {
    if (user) {
      // Fetch the pending approvals count
      const fetchPendingCount = async () => {
        try {
          // Ensure we have a valid UUID for user ID
          const safeUserId = ensureUUID(user.id);
          
          // Import the service function directly in the component
          const { getPendingApprovalsForUser } = await import("@/services/policy/approvalService");
          const pendingApprovals = await getPendingApprovalsForUser(safeUserId);
          setPendingApprovalsCount(pendingApprovals.length);
        } catch (error) {
          console.error("Error fetching pending approvals count:", error);
          setPendingApprovalsCount(0);
        }
      };
      
      fetchPendingCount();
    }
  }, [user]);

  const handleCreatePolicy = () => {
    setSelectedPolicy(null);
    setShowCreateModal(true);
  };

  const handleSavePolicy = async (policyData: any) => {
    if (!user) return;
    
    try {
      // Ensure we have a valid UUID for user ID
      const safeUserId = ensureUUID(user.id);
      
      // Save the policy to the rules table
      const savedPolicy = await savePolicy(policyData, safeUserId);
      
      if (selectedPolicy) {
        // Editing existing policy
        const updatedPolicies = policies.map((policy) => {
          if (policy.id === selectedPolicy.id) {
            // Create a properly formatted policy
            const updatedPolicy: PolicyData = {
              ...policy,
              ...savedPolicy,
              status: (savedPolicy.isActive ? "active" : "draft") as "active" | "inactive" | "draft" | "pending",
              description: savedPolicy.description || policy.description,
              jurisdiction: savedPolicy.jurisdiction || policy.jurisdiction,
              effectiveDate: savedPolicy.effectiveDate || policy.effectiveDate,
              tags: savedPolicy.tags || policy.tags,
              rules: savedPolicy.rules || policy.rules,
              approvers: savedPolicy.approvers || policy.approvers
            };
            return updatedPolicy;
          }
          return policy;
        });

        setPolicies(updatedPolicies);
      } else {
        // Creating new policy
        const newPolicy: PolicyData = {
          ...savedPolicy,
          id: savedPolicy.id || `policy-${policies.length + 1}`,
          name: savedPolicy.name || 'Untitled Policy',
          description: savedPolicy.description || '',
          type: savedPolicy.type || 'custom',
          jurisdiction: savedPolicy.jurisdiction || 'global',
          effectiveDate: savedPolicy.effectiveDate || new Date().toISOString().split('T')[0],
          tags: savedPolicy.tags || [],
          rules: savedPolicy.rules || [],
          approvers: savedPolicy.approvers || [],
          status: (savedPolicy.isActive ? "active" : "draft") as "active" | "inactive" | "draft" | "pending",
          createdAt: savedPolicy.createdAt || new Date().toISOString(),
          modifiedAt: savedPolicy.modifiedAt || new Date().toISOString(),
          approvalHistory: []
        };
        
        setPolicies([...policies, newPolicy]);
      }

      setShowCreateModal(false);
      setSelectedPolicy(null);
    } catch (error) {
      console.error("Error saving policy:", error);
    }
  };

  const handleSaveAsTemplate = async (templateData: any) => {
    if (!user) return;
    
    try {
      // Ensure we have a valid UUID for user ID
      const safeUserId = ensureUUID(user.id);
      
      // Extract approvers IDs from the policy data if they exist
      const approverIds = templateData.approvers?.map((approver: any) => approver.id) || [];
      
      // Save to the policy_templates table
      await savePolicyTemplate(
        templateData.name,
        templateData.description,
        templateData,
        safeUserId,
        approverIds
      );
      
      // Refresh templates list
      const data = await getAllPolicyTemplates();
      const formattedTemplates = data.map(template => ({
        id: template.template_id,
        name: template.template_name,
        description: template.description || "",
        type: (template.template_data as any)?.type || 'custom',
        createdAt: template.created_at || new Date().toISOString(),
        tags: (template.template_data as any)?.tags || [],
        rules: (template.template_data as any)?.rules || [],
        approvers: (template.template_data as any)?.approvers || [],
        isTemplate: true,
        status: template.status || 'active'
      }));
      
      setPolicyTemplates(formattedTemplates);
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  const handleUseTemplate = (template: any) => {
    // Create a new policy from the template
    setSelectedPolicy(null);
    
    // Ensure the template has all required fields to satisfy PolicyData
    const templateToUse: PolicyData = {
      ...template,
      id: template.id || '',
      name: template.name?.replace(" Template", "") || 'Untitled Policy',
      description: template.description || '',
      type: template.type || 'custom',
      jurisdiction: template.jurisdiction || 'global',
      effectiveDate: template.effectiveDate || new Date().toISOString().split('T')[0],
      expirationDate: template.expirationDate,
      tags: template.tags || [],
      rules: template.rules || [],
      approvers: template.approvers || [],
      isTemplate: false,
      status: "draft" as "active" | "inactive" | "draft" | "pending",
      createdAt: template.createdAt || new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      approvalHistory: []
    };
    
    setShowCreateModal(true);
    setShowTemplates(false);
    // Pass the template data as initialData to the creation modal
    setSelectedPolicy(templateToUse);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      // In a real app, you would delete from the database first
      // For now, just update the UI
      setPolicyTemplates(
        policyTemplates.filter((template) => template.id !== templateId),
      );
      
      // In a real app, refresh the templates after deleting
      // const data = await getAllPolicyTemplates();
      // setPolicyTemplates(data);
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  const handleToggleTemplateStatus = async (templateId: string, newStatus: string) => {
    try {
      // Update template status in the database
      await toggleTemplateStatus(templateId, newStatus);
      
      // Update templates list with new status
      setPolicyTemplates(
        policyTemplates.map((template) => 
          template.id === templateId 
            ? { ...template, status: newStatus } 
            : template
        )
      );
    } catch (error) {
      console.error("Error toggling template status:", error);
    }
  };

  const handleEditPolicy = (id: string) => {
    const policyToEdit = policies.find((policy) => policy.id === id);
    if (policyToEdit) {
      setSelectedPolicy(policyToEdit);
      setShowCreateModal(true);
    }
  };

  const handleDeletePolicy = (id: string) => {
    const policyToDelete = policies.find((policy) => policy.id === id);
    if (policyToDelete) {
      setPolicyToDelete(policyToDelete);
      setShowDeleteDialog(true);
    }
  };

  const confirmDeletePolicy = () => {
    if (policyToDelete) {
      setPolicies(policies.filter((policy) => policy.id !== policyToDelete.id));
      setPolicyToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  const cancelDeletePolicy = () => {
    setPolicyToDelete(null);
    setShowDeleteDialog(false);
  };

  const toggleAnalytics = () => {
    setShowAnalytics(!showAnalytics);
    if (showApprovals) setShowApprovals(false);
    if (showTemplates) setShowTemplates(false);
  };

  const toggleApprovals = () => {
    setShowApprovals(!showApprovals);
    if (showAnalytics) setShowAnalytics(false);
    if (showTemplates) setShowTemplates(false);
  };

  const toggleTemplates = () => {
    // This function is no longer needed for navigation as we now use direct routing
    // But we'll keep it for backward compatibility
    setShowTemplates(!showTemplates);
    if (showAnalytics) setShowAnalytics(false);
    if (showApprovals) setShowApprovals(false);
  };

  const handleViewPolicy = (id: string) => {
    const policyToView = policies.find((policy) => policy.id === id);
    if (policyToView) {
      setSelectedPolicy(policyToView);
      setShowDetailsPanel(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <DashboardHeader
        onCreatePolicy={handleCreatePolicy}
        onSettingsClick={toggleAnalytics}
        onNotificationsClick={toggleApprovals}
        onTemplatesClick={toggleTemplates}
        onSearch={setSearchTerm}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      <main className="flex-1 container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0f172b]"></div>
          </div>
        ) : showAnalytics ? (
          <PolicyAnalytics policies={policies as any} />
        ) : showTemplates ? (
          <PolicyTemplatesTab
            templates={policyTemplates}
            onUseTemplate={handleUseTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onToggleStatus={handleToggleTemplateStatus}
          />
        ) : showApprovals ? (
          <EnhancedApprovalDashboard 
            onViewPolicy={handleViewPolicy}
          />
        ) : (
          <PolicyList
            policies={policies as any}
            searchTerm={searchTerm}
            onCreatePolicy={handleCreatePolicy}
            onEditPolicy={handleEditPolicy}
            onDeletePolicy={handleDeletePolicy}
            onViewPolicy={handleViewPolicy}
          />
        )}
      </main>

      {showCreateModal && (
        <PolicyCreationModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onSave={handleSavePolicy}
          initialData={selectedPolicy as any}
          onCancel={() => {
            setShowCreateModal(false);
            setSelectedPolicy(null);
          }}
          onSaveAsTemplate={handleSaveAsTemplate}
        />
      )}

      {showDetailsPanel && selectedPolicy && (
        <PolicyDetailsPanel
          open={showDetailsPanel}
          onOpenChange={setShowDetailsPanel}
          policy={selectedPolicy as any}
        />
      )}

      {showDeleteDialog && policyToDelete && (
        <DeletePolicyDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          policyName={policyToDelete.name}
          onConfirm={confirmDeletePolicy}
          onCancel={cancelDeletePolicy}
        />
      )}
    </div>
  );
};

export default RuleManagementDashboard;