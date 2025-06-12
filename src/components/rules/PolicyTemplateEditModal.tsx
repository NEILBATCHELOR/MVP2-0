import React, { useState, useEffect } from "react";
import { X, Save, Info, AlertCircle, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import { Separator } from "../ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Badge } from "../ui/badge";
import { supabase } from "@/infrastructure/database/client";
import { useAuth } from "@/hooks/auth";
import RuleConflictDetector from "./RuleConflictDetector";
import ApproverSelection from "./ApproverSelection";
import { toast } from "../ui/use-toast";

interface PolicyTemplateEditModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  templateId?: string;
  onSuccess?: () => void;
}

interface TemplateData {
  name: string;
  description: string;
  type: string;
  jurisdiction: string;
  effectiveDate: string;
  expirationDate?: string;
  tags: string[];
  rules: any[];
  approvers: any[];
  reviewFrequency?: string;
  isActive?: boolean;
  isTemplate: boolean;
  logicalGroups?: any[];
}

interface PolicyTemplateData {
  template_id?: string;
  template_name: string;
  description: string;
  template_data: TemplateData;
  status: string;
}

const PolicyTemplateEditModal = ({
  open = false,
  onOpenChange = () => {},
  templateId,
  onSuccess = () => {},
}: PolicyTemplateEditModalProps) => {
  const { user } = useAuth();
  const [policyTemplateData, setPolicyTemplateData] = useState<PolicyTemplateData>({
    template_name: "",
    description: "",
    template_data: {
      name: "",
      description: "",
      type: "transfer_limit",
      jurisdiction: "global",
      effectiveDate: new Date().toISOString().split("T")[0],
      expirationDate: "",
      tags: [],
      rules: [],
      approvers: [],
      reviewFrequency: "quarterly",
      isActive: true,
      isTemplate: true,
      logicalGroups: [],
    },
    status: "active",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<string>("general");
  const [tagInput, setTagInput] = useState("");
  
  useEffect(() => {
    if (open && templateId) {
      fetchTemplateData();
    } else if (open && !templateId) {
      // Reset form for new template
      setPolicyTemplateData({
        template_name: "",
        description: "",
        template_data: {
          name: "",
          description: "",
          type: "transfer_limit",
          jurisdiction: "global",
          effectiveDate: new Date().toISOString().split("T")[0],
          expirationDate: "",
          tags: [],
          rules: [],
          approvers: [],
          reviewFrequency: "quarterly",
          isActive: true,
          isTemplate: true,
          logicalGroups: [],
        },
        status: "active",
      });
      setErrors({});
    }
  }, [open, templateId]);

  const fetchTemplateData = async () => {
    if (!templateId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("policy_templates")
        .select("*")
        .eq("template_id", templateId)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        const templateData = data.template_data as TemplateData | Record<string, any>;
        
        setPolicyTemplateData({
          template_id: data.template_id,
          template_name: data.template_name,
          description: data.description || "",
          template_data: {
            name: templateData.name || data.template_name || "",
            description: templateData.description || data.description || "",
            type: templateData.type || "transfer_limit",
            jurisdiction: templateData.jurisdiction || "global",
            effectiveDate: templateData.effectiveDate || new Date().toISOString().split("T")[0],
            expirationDate: templateData.expirationDate || "",
            tags: Array.isArray(templateData.tags) ? templateData.tags : [],
            rules: Array.isArray(templateData.rules) ? templateData.rules : [],
            approvers: Array.isArray(templateData.approvers) ? templateData.approvers : [],
            reviewFrequency: templateData.reviewFrequency || "quarterly",
            isActive: templateData.isActive !== undefined ? templateData.isActive : true,
            isTemplate: true,
            logicalGroups: Array.isArray(templateData.logicalGroups) ? templateData.logicalGroups : [],
          },
          status: data.status,
        });
      }
    } catch (error) {
      console.error("Error fetching template data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setPolicyTemplateData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTemplateDataChange = (
    field: string,
    value: any
  ) => {
    setPolicyTemplateData((prev) => ({
      ...prev,
      template_data: {
        ...prev.template_data,
        [field]: value,
      },
    }));

    // Clear error when user updates template data
    if (errors[`template_data.${field}`]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`template_data.${field}`];
        return newErrors;
      });
    }
  };

  const handleStatusChange = (checked: boolean) => {
    setPolicyTemplateData((prev) => ({
      ...prev,
      status: checked ? "active" : "inactive",
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !policyTemplateData.template_data.tags.includes(tagInput.trim())) {
      handleTemplateDataChange("tags", [...policyTemplateData.template_data.tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    handleTemplateDataChange(
      "tags",
      policyTemplateData.template_data.tags.filter((t) => t !== tag)
    );
  };

  const handleApproversChange = (approvers: any[]) => {
    handleTemplateDataChange("approvers", approvers);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!policyTemplateData.template_name.trim()) {
      newErrors.template_name = "Template name is required";
    }

    if (!policyTemplateData.template_data.type) {
      newErrors["template_data.type"] = "Policy type is required";
    }

    if (!policyTemplateData.template_data.jurisdiction) {
      newErrors["template_data.jurisdiction"] = "Jurisdiction is required";
    }

    if (!policyTemplateData.template_data.effectiveDate) {
      newErrors["template_data.effectiveDate"] = "Effective date is required";
    }

    if (policyTemplateData.template_data.approvers.length === 0) {
      newErrors["template_data.approvers"] = "At least one approver is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      let userUUID;
      
      try {
        // Get the UUID directly from auth to avoid type mismatch
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.warn("Authentication error:", userError);
          throw new Error("Authentication required. Please sign in to create a policy template.");
        }
        
        if (!userData?.user?.id) {
          throw new Error("User authentication data is incomplete. Please sign in again.");
        }
        
        userUUID = userData.user.id;
      } catch (authError) {
        console.error("Error getting authenticated user:", authError);
        toast({
          title: "Authentication Error",
          description: "Please sign in to create policy templates.",
          variant: "destructive",
        });
        onOpenChange(false);
        return;
      }
      
      // Ensure template_data.name matches template_name for consistency
      const templateDataWithUpdatedName = {
        ...policyTemplateData.template_data,
        name: policyTemplateData.template_name,
        description: policyTemplateData.description,
      };
      
      let response;
      
      if (templateId) {
        // Update existing template - don't include created_by
        const updatePayload = {
          template_name: policyTemplateData.template_name,
          description: policyTemplateData.description,
          template_data: templateDataWithUpdatedName,
          status: policyTemplateData.status,
          updated_at: new Date().toISOString(),
        };
        
        response = await supabase
          .from("policy_templates")
          .update(updatePayload)
          .eq("template_id", templateId);
      } else {
        // Create new template with current user as creator
        const createPayload = {
          template_name: policyTemplateData.template_name,
          description: policyTemplateData.description,
          template_data: templateDataWithUpdatedName,
          status: policyTemplateData.status,
          created_by: userUUID, // Using UUID directly from auth
        };
        
        response = await supabase
          .from("policy_templates")
          .insert([createPayload]);
      }
      
      if (response.error) {
        throw response.error;
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving policy template:", error);
      toast({
        title: "Error",
        description: `Failed to save policy template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const policyTypes = [
    { value: "transfer_limit", label: "Transfer Limit" },
    { value: "kyc_verification", label: "KYC Verification" },
    { value: "restricted_assets", label: "Restricted Assets" },
    { value: "dormant_account", label: "Dormant Account" },
    { value: "transaction_monitoring", label: "Transaction Monitoring" },
    { value: "custom", label: "Custom Policy" },
  ];

  const jurisdictions = [
    { value: "global", label: "Global" },
    { value: "us", label: "United States" },
    { value: "eu", label: "European Union" },
    { value: "uk", label: "United Kingdom" },
    { value: "asia_pacific", label: "Asia Pacific" },
    { value: "custom", label: "Custom Jurisdiction" },
  ];

  const reviewFrequencies = [
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "biannually", label: "Bi-annually" },
    { value: "annually", label: "Annually" },
    { value: "custom", label: "Custom Schedule" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {templateId ? "Edit Policy Template" : "Create New Policy Template"}
          </DialogTitle>
          <DialogDescription>
            Define a policy template that can be reused to create new policies.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="template_name" className="text-sm font-medium">
              Template Name
            </Label>
            <Input
              id="template_name"
              name="template_name"
              value={policyTemplateData.template_name}
              onChange={handleInputChange}
              placeholder="Enter template name"
              className={errors.template_name ? "border-red-500" : ""}
            />
            {errors.template_name && (
              <p className="text-sm text-red-500">{errors.template_name}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={policyTemplateData.description}
              onChange={handleInputChange}
              placeholder="Describe the purpose and usage of this template"
              rows={4}
            />
          </div>

          <Separator className="my-4" />
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-medium">Policy Configuration</h3>
              <div className="flex items-center space-x-2">
                <Label htmlFor="status" className="text-sm">Status:</Label>
                <Switch
                  id="status"
                  checked={policyTemplateData.status === "active"}
                  onCheckedChange={handleStatusChange}
                />
                <span className="text-sm">
                  {policyTemplateData.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="policy_type" className="text-sm font-medium">
                  Policy Type
                </Label>
                <Select
                  value={policyTemplateData.template_data.type}
                  onValueChange={(value) => handleTemplateDataChange("type", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a policy type" />
                  </SelectTrigger>
                  <SelectContent>
                    {policyTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors["template_data.type"] && (
                  <p className="text-sm text-red-500">{errors["template_data.type"]}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="jurisdiction" className="text-sm font-medium">
                  Jurisdiction
                </Label>
                <Select
                  value={policyTemplateData.template_data.jurisdiction}
                  onValueChange={(value) => handleTemplateDataChange("jurisdiction", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select jurisdiction" />
                  </SelectTrigger>
                  <SelectContent>
                    {jurisdictions.map(jurisdiction => (
                      <SelectItem key={jurisdiction.value} value={jurisdiction.value}>
                        {jurisdiction.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors["template_data.jurisdiction"] && (
                  <p className="text-sm text-red-500">{errors["template_data.jurisdiction"]}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="effectiveDate" className="text-sm font-medium">
                  Effective Date
                </Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={policyTemplateData.template_data.effectiveDate}
                  onChange={(e) => handleTemplateDataChange("effectiveDate", e.target.value)}
                  className={errors["template_data.effectiveDate"] ? "border-red-500" : ""}
                />
                {errors["template_data.effectiveDate"] && (
                  <p className="text-sm text-red-500">{errors["template_data.effectiveDate"]}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="reviewFrequency" className="text-sm font-medium">
                  Review Frequency
                </Label>
                <Select
                  value={policyTemplateData.template_data.reviewFrequency}
                  onValueChange={(value) => handleTemplateDataChange("reviewFrequency", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select review frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {reviewFrequencies.map(frequency => (
                      <SelectItem key={frequency.value} value={frequency.value}>
                        {frequency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {policyTemplateData.template_data.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1"
                  >
                    {tag}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 text-blue-700 hover:text-blue-900 hover:bg-transparent"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <h3 className="text-md font-medium">Template Approvers</h3>
              <ApproverSelection
                selectedApprovers={policyTemplateData.template_data.approvers}
                onApproversChange={handleApproversChange}
                minApprovers={1}
                maxApprovers={5}
              />
              {errors["template_data.approvers"] && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md mt-4">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm">{errors["template_data.approvers"]}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between mt-6 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-[#0f172b] hover:bg-[#0f172b]/90"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PolicyTemplateEditModal; 