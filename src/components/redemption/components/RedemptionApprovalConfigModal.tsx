import React, { useState, useEffect } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { toast } from "../../ui/use-toast";
import { useAuth } from "@/hooks/auth";
import { supabase } from "@/infrastructure/supabaseClient";
import RedemptionApproverSelection from "./RedemptionApproverSelection";
import type { 
  ApprovalConfigsTable
} from "@/types/approval/approval-configs";

interface RedemptionApprover {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface RedemptionApprovalConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const RedemptionApprovalConfigModal: React.FC<RedemptionApprovalConfigModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  // Form state
  const [configName, setConfigName] = useState("Default Redemption Approval Config");
  const [configDescription, setConfigDescription] = useState("Default approval configuration for all redemption requests");
  const [consensusType, setConsensusType] = useState("any");
  const [requiredApprovals, setRequiredApprovals] = useState(1);
  const [approvers, setApprovers] = useState<RedemptionApprover[]>([]);
  
  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      loadExistingConfig();
    }
  }, [open]);

  const loadExistingConfig = async () => {
    try {
      setLoading(true);
      const redemptionApprovalConfigId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
      
      const { data, error } = await supabase
        .from("approval_configs")
        .select("*")
        .eq("id", redemptionApprovalConfigId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error loading redemption approval config:", error);
        return;
      }

      if (data) {
        setConfigName(data.config_name || "Default Redemption Approval Config");
        setConfigDescription(data.config_description || "");
        setConsensusType(data.consensus_type || 'any');
        setRequiredApprovals(data.required_approvals || 1);
      }
    } catch (error) {
      console.error("Error in loadExistingConfig:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'configName') {
      setConfigName(value);
    } else if (name === 'configDescription') {
      setConfigDescription(value);
    }

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    if (field === 'consensusType') {
      setConsensusType(value);
    }

    // Clear error when user selects
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleApproversChange = (selectedApprovers: RedemptionApprover[]) => {
    setApprovers(selectedApprovers);

    // Clear error when approvers change
    if (errors.approvers) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.approvers;
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!configName.trim()) {
      newErrors.configName = "Configuration name is required";
    }

    if (approvers.length === 0) {
      newErrors.approvers = "At least one approver must be selected";
    }

    if (requiredApprovals > approvers.length) {
      newErrors.requiredApprovals = "Required approvals cannot exceed the number of selected approvers";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const redemptionApprovalConfigId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

      // Update the main approval config
      const { error: configError } = await supabase
        .from("approval_configs")
        .upsert({
          id: redemptionApprovalConfigId,
          permission_id: redemptionApprovalConfigId,
          config_name: configName,
          config_description: configDescription,
          approval_mode: 'user_specific',
          required_approvals: requiredApprovals,
          requires_all_approvers: consensusType === 'all',
          consensus_type: consensusType,
          eligible_roles: [],
          auto_approval_conditions: {},
          auto_approve_threshold: 0,
          active: true,
          created_by: user?.id,
          last_modified_by: user?.id,
          updated_at: new Date().toISOString()
        });

      if (configError) {
        throw configError;
      }

      // Clear existing approver assignments
      const { error: deleteError } = await supabase
        .from("approval_config_approvers")
        .delete()
        .eq("approval_config_id", redemptionApprovalConfigId);

      if (deleteError) {
        throw deleteError;
      }

      // Insert new approver assignments
      if (approvers.length > 0) {
        const approverInserts = approvers.map((approver, index) => ({
          approval_config_id: redemptionApprovalConfigId,
          approver_type: 'user',
          approver_user_id: approver.id,
          approver_role_id: null,
          is_required: true,
          order_priority: index,
          created_by: user?.id
        }));

        const { error: approverError } = await supabase
          .from("approval_config_approvers")
          .insert(approverInserts);

        if (approverError) {
          throw approverError;
        }
      }

      toast({
        title: "Success",
        description: `Redemption approval configuration "${configName}" has been saved with ${approvers.length} approvers.`,
        duration: 5000,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving redemption approval config:", error);
      toast({
        title: "Error",
        description: "Failed to save redemption approval configuration.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading configuration...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Configure Redemption Approvers
          </DialogTitle>
          <DialogDescription>
            Set up the approval workflow for all redemption requests
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Configuration */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="configName" className="font-medium">Configuration Name</Label>
              <Input
                id="configName"
                name="configName"
                value={configName}
                onChange={handleInputChange}
                placeholder="Enter configuration name"
                className={errors.configName ? "border-red-500" : ""}
              />
              {errors.configName && (
                <p className="text-sm text-red-500">{errors.configName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="configDescription" className="font-medium">Description</Label>
              <Textarea
                id="configDescription"
                name="configDescription"
                value={configDescription}
                onChange={handleInputChange}
                placeholder="Describe this approval configuration"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="consensusType" className="font-medium">Consensus Type</Label>
                <Select value={consensusType} onValueChange={(value) => handleSelectChange('consensusType', value)}>
                  <SelectTrigger className={errors.consensusType ? "border-red-500" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All approvers (unanimous)</SelectItem>
                    <SelectItem value="majority">Majority of approvers</SelectItem>
                    <SelectItem value="any">Any approver (first approval)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.consensusType && (
                  <p className="text-sm text-red-500">{errors.consensusType}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="requiredApprovals" className="font-medium">Required Approvals</Label>
                <Input
                  id="requiredApprovals"
                  type="number"
                  min="1"
                  max={approvers.length || 1}
                  value={requiredApprovals}
                  onChange={(e) => setRequiredApprovals(parseInt(e.target.value) || 1)}
                  className={errors.requiredApprovals ? "border-red-500" : ""}
                />
                {errors.requiredApprovals && (
                  <p className="text-sm text-red-500">{errors.requiredApprovals}</p>
                )}
              </div>
            </div>
          </div>

          {/* Approver Selection */}
          <RedemptionApproverSelection
            selectedApprovers={approvers}
            onApproversChange={handleApproversChange}
            minApprovers={1}
            maxApprovers={5}
          />

          {errors.approvers && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{errors.approvers}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button variant="outline" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-[#0f172b] hover:bg-[#0f172b]/90"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Configuration
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RedemptionApprovalConfigModal;