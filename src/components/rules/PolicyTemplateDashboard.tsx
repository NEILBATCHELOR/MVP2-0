import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/infrastructure/auth/AuthProvider";
import {
  getAllPolicyTemplates,
  deletePolicyTemplate,
  templateToPolicy,
  getPolicyTemplateById,
  toggleTemplateStatus,
  updatePolicyTemplate
} from "@/services/policy/enhancedPolicyTemplateService";
import { savePolicyTemplate } from "@/services/policy/policyTemplateService";
import PolicyTemplateList from "./PolicyTemplateList";
import PolicyCreationModal from "./PolicyCreationModal";
import DeleteTemplateDialog from "./DeleteTemplateDialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Search,
  PlusCircle,
  FileText,
  Download,
  SlidersHorizontal,
  Filter,
  SortDesc,
  SortAsc,
  Tag,
  Globe,
  Eye,
  Pencil,
} from "lucide-react";
import type { PolicyTemplatesTable, PolicyTemplateUpdate } from "@/types/core/database";
import type { Json } from "@/types/core/supabase";
import { PolicyTemplateWithData } from "@/types/domain/policy/policyTemplates";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import PolicyExportDialog from "./PolicyExportDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { supabase } from "@/infrastructure/database/client";

// Simple TemplateViewModal component for viewing template details
interface TemplateViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: PolicyTemplate;
  onEdit: () => void;
}

const TemplateViewModal = ({
  open,
  onOpenChange,
  template,
  onEdit,
}: TemplateViewModalProps) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {template.name}
          </DialogTitle>
          <DialogDescription>
            {template.description || "No description provided."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Template Type</h4>
              <p className="text-sm">{template.type}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Created</h4>
              <p className="text-sm">{formatDate(template.createdAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Status</h4>
              <Badge 
                className={
                  template.status === "active"
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-red-100 text-red-800 border-red-200"
                }
              >
                {template.status === "active" ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {template.tags && template.tags.length > 0 ? (
                  template.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">No tags</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-1">Rules</h4>
            <div className="space-y-2">
              {template.rules && template.rules.length > 0 ? (
                template.rules.map((rule, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium">{rule.name}</p>
                    <p className="text-xs text-gray-500">{rule.type}</p>
                  </div>
                ))
              ) : (
                <span className="text-sm text-gray-500">No rules defined</span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-center">
          <Button variant="outline" onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Interface matching what PolicyTemplateList expects
interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  createdAt: string;
  tags: string[];
  rules: any[];
  approvers: any[];
  isTemplate: boolean;
  status: string;
}

// Adapter function to convert PolicyTemplateWithData to PolicyTemplate
const adaptToListTemplate = (template: PolicyTemplateWithData): PolicyTemplate => {
  return {
    id: template.template_id,
    name: template.template_name,
    description: template.description || "",
    type: (template.template_data as any)?.type || 'custom',
    createdAt: template.created_at || new Date().toISOString(),
    tags: (template.template_data as any)?.tags || [],
    rules: (template.template_data as any)?.rules || [],
    approvers: (template.template_data as any)?.approvers || [],
    isTemplate: true,
    status: template.status || "active"
  };
};

// Extend the PolicyTemplateList props interface
interface ExtendedPolicyTemplateListProps {
  templates: PolicyTemplate[];
  onDeleteTemplate: (templateId: string) => void;
  onViewTemplate?: (templateId: string) => void;
  onEditTemplate?: (templateId: string) => void;
  onToggleStatus?: (templateId: string, newStatus: string) => void;
}

interface PolicyData {
  id?: string;
  name: string;
  description?: string;
  type: string;
  jurisdiction: string;
  effectiveDate: string;
  expirationDate?: string;
  tags: string[];
  rules: any[];
  approvers: { id: string; role: string }[];
  reviewFrequency?: string;
  isActive?: boolean;
  isTemplate?: boolean;
  logicalGroups?: { operator: 'AND' | 'OR'; ruleIds: string[] }[];
  status?: string;
}

// Helper function to ensure UUID is properly formatted 
function formatUUID(id: string): string {
  // Simple regex to check if this is already a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return id;
  }
  
  // If not a UUID, log the issue but return original
  console.warn(`Non-UUID format detected in dashboard: ${id}`);
  return id;
}

const PolicyTemplateDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<PolicyTemplateWithData[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PolicyTemplateWithData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTemplates, setFilteredTemplates] = useState<PolicyTemplateWithData[]>([]);
  
  // Advanced filtering and sorting options
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortField, setSortField] = useState<"name" | "createdAt">("createdAt");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);

    const loadTemplates = async () => {
      try {
        setLoading(true);
        const data = await getAllPolicyTemplates();
        
        // Convert database templates to the right format for the UI
        const formattedTemplates = data.map((template) => ({
          ...template,
          id: template.template_id,
          name: template.template_name,
          createdAt: template.created_at,
          // Parse template_data to get the rules and approvers
          rules: (template.template_data as any)?.rules || [],
          approvers: (template.template_data as any)?.approvers || [],
          tags: (template.template_data as any)?.tags || [],
          type: (template.template_data as any)?.type || 'custom',
        isTemplate: true,
        status: template.status || 'active'
        }));
        
        setTemplates(formattedTemplates as unknown as PolicyTemplateWithData[]);
        setFilteredTemplates(formattedTemplates as unknown as PolicyTemplateWithData[]);
      } catch (error) {
        console.error("Error loading templates:", error);
      } finally {
        setLoading(false);
      }
    };

  // Get unique template types and tags for filtering
  const templateTypes = [
    "all",
    ...new Set(templates.map((template) => (template.template_data as any)?.type || 'custom')),
  ];

  const allTags = Array.from(
    new Set(templates.flatMap((template) => (template.template_data as any)?.tags || [])),
  );

  // Filter and sort templates when criteria changes
  useEffect(() => {
    let filtered = [...templates];

    // Apply search query filter
    if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
      (template) =>
        template.template_name.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query) ||
        (template.template_data as any)?.type?.toLowerCase().includes(query)
    );
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(
        (template) => (template.template_data as any)?.type === typeFilter
      );
    }

    // Apply tag filter
    if (tagFilter.length > 0) {
      filtered = filtered.filter((template) => {
        const templateTags = (template.template_data as any)?.tags || [];
        return tagFilter.some((tag) => templateTags.includes(tag));
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortField === "name") {
        return sortOrder === "asc"
          ? a.template_name.localeCompare(b.template_name)
          : b.template_name.localeCompare(a.template_name);
      } else {
        const dateA = new Date(a.created_at || "");
        const dateB = new Date(b.created_at || "");
        return sortOrder === "asc"
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      }
    });

    setFilteredTemplates(filtered);
  }, [searchQuery, templates, typeFilter, tagFilter, sortOrder, sortField]);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const toggleTagFilter = (tag: string) => {
    setTagFilter((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const clearAllFilters = () => {
    setTypeFilter("all");
    setTagFilter([]);
    setSearchQuery("");
  };

  const getPolicyTypeName = (type: string) => {
    if (type === "all") return "All Types";

    const typeMap: Record<string, string> = {
      transfer_limit: "Transfer Limit",
      kyc_verification: "KYC Verification",
      restricted_assets: "Restricted Assets",
      multi_signature: "Multi-Signature Approval",
      dormant_account: "Dormant Account",
      risk_assessment: "Risk Assessment",
      transaction_monitoring: "Transaction Monitoring",
      custom: "Custom Policy",
    };
    return (
      typeMap[type] ||
      (type
        ? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "")
    );
  };

  const handleViewTemplate = async (templateId: string) => {
    try {
      const template = templates.find((t) => t.template_id === templateId);
      if (template) {
        setSelectedTemplate(template);
        setShowViewModal(true);
      }
    } catch (error) {
      console.error("Error getting template details:", error);
    }
  };

  const handleEditTemplate = async (templateId: string) => {
    try {
      // First, get the complete template data
      const template = templates.find((t) => t.template_id === templateId);
      if (template) {
        setSelectedTemplate(template);
        // Convert to the format expected by PolicyCreationModal
        const templateForEdit = {
          id: template.template_id,
          name: template.template_name,
          description: template.description || "",
          type: (template.template_data as any)?.type || 'custom',
          jurisdiction: (template.template_data as any)?.jurisdiction || 'global',
          effectiveDate: (template.template_data as any)?.effectiveDate || new Date().toISOString().split("T")[0],
          expirationDate: (template.template_data as any)?.expirationDate || "",
          tags: (template.template_data as any)?.tags || [],
          rules: (template.template_data as any)?.rules || [],
          approvers: (template.template_data as any)?.approvers || [],
          reviewFrequency: (template.template_data as any)?.reviewFrequency || "quarterly",
          isActive: (template.template_data as any)?.isActive !== false,
          isTemplate: true,
        };
        
        // Store the template data for the modal
        setSelectedTemplate({
          ...template,
          templateForEdit
        } as unknown as PolicyTemplateWithData);
        
        setShowEditModal(true);
      }
    } catch (error) {
      console.error("Error preparing template for edit:", error);
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    const template = templates.find((t) => t.template_id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setShowDeleteDialog(true);
    }
  };

  const confirmDeleteTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      await deletePolicyTemplate(selectedTemplate.template_id);
      
      // Update the templates list
      setTemplates(templates.filter((t) => t.template_id !== selectedTemplate.template_id));
      setFilteredTemplates(filteredTemplates.filter((t) => t.template_id !== selectedTemplate.template_id));
      
      setShowDeleteDialog(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  const handleCreateTemplate = () => {
    setShowCreateModal(true);
  };

  const handleSaveTemplate = async (policyData: any) => {
    if (!user) {
      console.error("Cannot save template: No authenticated user");
      return;
    }

    try {
      setLoading(true);
      
      // Log the operation we're about to perform
      console.log("----- STARTING TEMPLATE CREATION -----");
      console.log("Template name:", policyData.name);
      console.log("Description:", policyData.description || "(no description)");
      
      // Extract approvers and ensure they have valid UUIDs
      const approvers = policyData.approvers || [];
      const approverIds = approvers.map((approver: any) => {
        const id = formatUUID(approver.id);
        console.log(`Prepared approver: ${id}`);
        return id;
      });
      
      console.log(`Prepared ${approverIds.length} approvers for template`);
      
      // Ensure user ID is valid
      const safeUserId = user.id ? formatUUID(user.id) : 'system';
      console.log(`Using creator ID: ${safeUserId}`);
      
      // Save the template using enhanced policyTemplateService
      // The new database structure with deferrable constraint allows this to work
      // in a single transaction
      console.log("Creating template in database with approvers...");
      const createdTemplate = await savePolicyTemplate(
        policyData.name,
        policyData.description || "",
        policyData,
        safeUserId,
        approverIds.length > 0 ? approverIds : undefined
      );
      
      console.log("Template created successfully with ID:", createdTemplate.template_id);
      
      // Refresh the templates list
      console.log("Refreshing template list...");
      await loadTemplates();
      
      // Clean up UI state
      setShowCreateModal(false);
      
      console.log("----- TEMPLATE CREATION COMPLETED -----");
    } catch (error) {
      console.error("----- TEMPLATE CREATION FAILED -----");
      console.error("Error details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTemplate = async (policyData: PolicyData) => {
    if (!selectedTemplate) return;
    
    try {
      setLoading(true);
      console.log(`----- STARTING TEMPLATE UPDATE -----`);
      console.log(`Template ID: ${selectedTemplate.template_id}`);
      console.log(`Template name: ${policyData.name}`);
      
      // Prepare the template update data
      const templateUpdate: PolicyTemplateUpdate = {
        template_name: policyData.name,
        description: policyData.description,
        template_data: {
          type: policyData.type,
          tags: policyData.tags,
          rules: policyData.rules
        } as unknown as Json,
        status: policyData.status || "active"
      };

      // Extract and format approver IDs
      const approvers = policyData.approvers || [];
      const approverIds = approvers.map(approver => formatUUID(approver.id));
      console.log(`Prepared ${approverIds.length} approvers for update`);
      
      // Get creator ID for attribution
      const creatorId = user?.id ? formatUUID(user.id) : 'system';
      
      // Update the template and its approvers in a single operation
      console.log("Updating template and approvers...");
      const updatedTemplate = await updatePolicyTemplate(
        selectedTemplate.template_id, 
        templateUpdate,
        approverIds,
        creatorId
      );
      
      if (!updatedTemplate) {
        throw new Error(`Failed to update template ${selectedTemplate.template_id}`);
      }
      
      console.log(`Template updated successfully`);

      // Refresh data and UI
      console.log("Refreshing template list...");
      await loadTemplates();
      setShowEditModal(false);
      console.log('----- TEMPLATE UPDATE COMPLETED -----');
    } catch (error) {
      console.error('----- TEMPLATE UPDATE FAILED -----');
      console.error('Error details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTemplateStatus = async (templateId: string, newStatus: string) => {
    try {
      // Update template status in the database
      await toggleTemplateStatus(templateId, newStatus);
      
      // Update templates list with new status
      setTemplates(
        templates.map((template) => 
          template.template_id === templateId 
            ? { ...template, status: newStatus } 
            : template
        )
      );
      
      // Also update filtered templates
      setFilteredTemplates(
        filteredTemplates.map((template) => 
          template.template_id === templateId 
            ? { ...template, status: newStatus } 
            : template
        )
      );
    } catch (error) {
      console.error("Error toggling template status:", error);
    }
  };

  const isFiltered = typeFilter !== "all" || tagFilter.length > 0 || searchQuery.trim() !== "";

  return (
    <div className="container mx-auto p-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Policy Templates</h1>
          <p className="text-gray-500 mt-1">
            Create and manage reusable policy templates
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => setShowExportDialog(true)}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            onClick={handleCreateTemplate}
            className="bg-[#0f172b] hover:bg-[#0f172b]/90"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      </header>

      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-4 flex flex-col space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative w-full sm:w-96 md:w-[36rem]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <div className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Template Type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {templateTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getPolicyTypeName(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  Tags
                  {tagFilter.length > 0 && (
                    <Badge className="ml-1 bg-blue-100 text-blue-800 hover:bg-blue-100">
                      {tagFilter.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {allTags.length > 0 ? (
                  <>
                    {allTags.map((tag) => (
                      <DropdownMenuCheckboxItem
                        key={tag}
                        checked={tagFilter.includes(tag)}
                        onCheckedChange={() => toggleTagFilter(tag)}
                      >
                        {tag}
                      </DropdownMenuCheckboxItem>
                    ))}
                    {tagFilter.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setTagFilter([])}>
                          Clear tag filters
                        </DropdownMenuItem>
                      </>
                    )}
                  </>
                ) : (
                  <DropdownMenuItem disabled>No tags available</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {sortOrder === "asc" ? (
                    <SortAsc className="mr-2 h-4 w-4" />
                  ) : (
                    <SortDesc className="mr-2 h-4 w-4" />
                  )}
                  Sort by
            </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setSortField("name")}
                  className={sortField === "name" ? "bg-gray-100" : ""}
                >
                  Name
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortField("createdAt")}
                  className={sortField === "createdAt" ? "bg-gray-100" : ""}
                >
                  Creation Date
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleSortOrder}>
                  {sortOrder === "asc" ? "Ascending ↑" : "Descending ↓"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              >
                Clear Filters
            </Button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-6 rounded-lg shadow-sm flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0f172b]"></div>
        </div>
      ) : filteredTemplates.length > 0 ? (
        <PolicyTemplateList
          templates={filteredTemplates.map(adaptToListTemplate)}
          onDeleteTemplate={handleDeleteTemplate}
          onViewTemplate={handleViewTemplate}
          onEditTemplate={handleEditTemplate}
          onToggleStatus={handleToggleTemplateStatus}
        />
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">
            No templates found matching your criteria
          </p>
          <Button variant="outline" onClick={clearAllFilters}>
            Clear All Filters
          </Button>
        </div>
      )}

      {templates.length > 0 && filteredTemplates.length > 0 && (
        <div className="mt-6 text-sm text-gray-500 text-right">
          Showing {filteredTemplates.length} of {templates.length} templates
        </div>
      )}

      {showCreateModal && (
        <PolicyCreationModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onSave={handleSaveTemplate}
          onCancel={() => setShowCreateModal(false)}
          initialData={{
            name: "New Template",
            description: "",
            type: "custom",
            jurisdiction: "global",
            effectiveDate: new Date().toISOString().split("T")[0],
            expirationDate: "",
            tags: [],
            rules: [],
            approvers: [],
            reviewFrequency: "quarterly",
            isActive: true,
            isTemplate: true,
          }}
        />
      )}

      {showEditModal && selectedTemplate && (
        <PolicyCreationModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onSave={handleUpdateTemplate}
          onCancel={() => setShowEditModal(false)}
          initialData={(selectedTemplate as any).templateForEdit}
          defaultActiveTab="rules"
        />
      )}

      {showViewModal && selectedTemplate && (
        <TemplateViewModal
          open={showViewModal}
          onOpenChange={setShowViewModal}
          template={adaptToListTemplate(selectedTemplate)}
          onEdit={() => {
            setShowViewModal(false);
            handleEditTemplate(selectedTemplate.template_id);
          }}
        />
      )}

      {showDeleteDialog && selectedTemplate && (
        <DeleteTemplateDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          templateName={selectedTemplate.template_name}
          onConfirm={confirmDeleteTemplate}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}

      <PolicyExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        policies={templates.map(adaptToListTemplate)}
        selectedPolicyIds={selectedTemplateIds}
      />
    </div>
  );
};

export default PolicyTemplateDashboard;