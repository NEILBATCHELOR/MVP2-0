import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/infrastructure/auth/AuthProvider";
import {
  getPolicyTemplateById,
  getTemplateVersions,
  saveTemplateVersion,
  deleteTemplateVersion,
  templateToPolicy,
} from "@/services/policy/enhancedPolicyTemplateService";
import PolicyTemplateVersionList from "./PolicyTemplateVersionList";
import PolicyTemplateVersionDialog from "./PolicyTemplateVersionDialog";
import PolicyCreationModal from "./PolicyCreationModal";
import DeleteTemplateDialog from "./DeleteTemplateDialog";
import PolicyVersionComparison from "./PolicyVersionComparison";
import { Button } from "../ui/button";
import { ChevronLeft, PlusCircle, Save, History } from "lucide-react";
import type { TemplateVersion } from "@/services/policy/enhancedPolicyTemplateService";
import type { PolicyTemplatesTable } from "@/types/core/database";

const PolicyTemplateVersionManagement = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<PolicyTemplatesTable | null>(null);
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [compareVersions, setCompareVersions] = useState<{ v1: string; v2: string }>({ v1: "", v2: "" });
  const [currentVersion, setCurrentVersion] = useState<string>("");

  // Load template and versions
  useEffect(() => {
    const loadData = async () => {
      if (!templateId) return;
      
      try {
        setLoading(true);
        const templateData = await getPolicyTemplateById(templateId);
        if (!templateData) {
          navigate("/templates");
          return;
        }
        
        setTemplate(templateData);
        
        const versionsData = await getTemplateVersions(templateId);
        setVersions(versionsData);
        
        // Get the latest version number
        if (versionsData.length > 0) {
          setCurrentVersion(versionsData[0].version);
        }
      } catch (error) {
        console.error("Error loading template data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [templateId, navigate]);

  const handleCreateVersion = () => {
    setShowVersionDialog(true);
  };

  const handleSaveVersion = async (version: string, notes: string) => {
    if (!template || !user) return;
    
    try {
      const newVersion = await saveTemplateVersion(
        template.template_id,
        version,
        template.template_data,
        user.id,
        notes
      );
      
      // Update versions list
      setVersions([newVersion, ...versions]);
      setCurrentVersion(version);
      setShowVersionDialog(false);
    } catch (error) {
      console.error("Error saving template version:", error);
    }
  };

  const handleUseVersion = (version: TemplateVersion) => {
    // Create a new policy from this version
    if (!template) return;
    
    const versionData = version.version_data;
    
    navigate("/policies/new", {
      state: { 
        initialData: {
          ...versionData,
          name: `${template.template_name} (from v${version.version})`,
          isTemplate: false
        }
      }
    });
  };

  const handleDeleteVersion = (versionId: string) => {
    setSelectedVersionId(versionId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteVersion = async () => {
    if (!selectedVersionId) return;
    
    try {
      await deleteTemplateVersion(selectedVersionId);
      
      // Update versions list
      setVersions(versions.filter(v => v.version_id !== selectedVersionId));
      setShowDeleteDialog(false);
      
      // Update current version if needed
      if (versions.length > 0 && versions[0].version_id === selectedVersionId) {
        setCurrentVersion(versions.length > 1 ? versions[1].version : "");
      }
    } catch (error) {
      console.error("Error deleting version:", error);
    }
  };

  const handleEditTemplate = () => {
    setShowEditModal(true);
  };

  const handleSaveTemplate = async (policyData: any) => {
    // Logic to update the template
  };

  const handleCompareVersions = (v1: string, v2: string) => {
    setCompareVersions({ v1, v2 });
    setShowCompareModal(true);
  };

  const goBack = () => {
    navigate("/templates");
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0f172b]"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <p className="text-lg text-gray-700">Template not found</p>
          <Button className="mt-4" onClick={goBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={goBack} className="p-1">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">{template.template_name}</h1>
          </div>
          <p className="text-gray-500 mt-1 ml-7">
            {template.description || "Manage versions of this template"}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleEditTemplate}
            className="border-[#0f172b] text-[#0f172b]"
          >
            <Save className="mr-2 h-4 w-4" />
            Edit Template
          </Button>
          <Button
            onClick={handleCreateVersion}
            className="bg-[#0f172b] hover:bg-[#0f172b]/90"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Version
          </Button>
        </div>
      </header>

      <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 rounded-full p-3">
            <History className="h-6 w-6 text-blue-700" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-blue-800 mb-1">Template Version History</h3>
            <p className="text-blue-700">
              {versions.length > 0
                ? `This template has ${versions.length} version${versions.length !== 1 ? "s" : ""}. The latest version is ${currentVersion}.`
                : "This template has no saved versions yet. Create a version to track changes over time."}
            </p>
          </div>
        </div>
      </div>

      <PolicyTemplateVersionList
        versions={versions}
        templateName={template.template_name}
        onUseVersion={handleUseVersion}
        onDeleteVersion={handleDeleteVersion}
        onCompareVersions={handleCompareVersions}
      />

      {showVersionDialog && (
        <PolicyTemplateVersionDialog
          open={showVersionDialog}
          onOpenChange={setShowVersionDialog}
          templateName={template.template_name}
          currentVersion={currentVersion}
          onConfirm={handleSaveVersion}
          onCancel={() => setShowVersionDialog(false)}
        />
      )}

      {showDeleteDialog && (
        <DeleteTemplateDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          templateName={`Version ${versions.find(v => v.version_id === selectedVersionId)?.version || ""}`}
          onConfirm={confirmDeleteVersion}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}

      {showEditModal && (
        <PolicyCreationModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onSave={handleSaveTemplate}
          onCancel={() => setShowEditModal(false)}
          initialData={{
            ...(template.template_data as any),
            name: template.template_name,
            description: template.description,
            isTemplate: true,
          }}
        />
      )}

      {showCompareModal && (
        <PolicyVersionComparison
          leftVersion={versions.find(v => v.version === compareVersions.v1)?.version_data || {}}
          rightVersion={versions.find(v => v.version === compareVersions.v2)?.version_data || {}}
          leftTitle={`Version ${compareVersions.v1}`}
          rightTitle={`Version ${compareVersions.v2}`}
          open={showCompareModal}
          onOpenChange={setShowCompareModal}
          onClose={() => setShowCompareModal(false)}
        />
      )}
    </div>
  );
};

export default PolicyTemplateVersionManagement;