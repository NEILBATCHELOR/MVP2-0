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
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/auth";
import { ensureUUID } from "@/utils/shared/formatting/uuidUtils";

// Import enhanced services and types
import { 
  createRule, 
  updateRule, 
  getRuleById, 
  PolicyRule 
} from "@/services/rule/enhancedRuleService";
import type { RuleTable } from "@/types/core/database";
import { authService } from "@/services/auth";
import { AuditLogService, AuditEventType } from "@/services/audit/auditLogService";

// Import rule components
import TransferLimitRule from "./TransferLimitRule";
import InvestorTransactionLimitRule from "./InvestorTransactionLimitRule";
import VelocityLimitRule from "./VelocityLimitRule";
import LockUpPeriodRule from "./LockUpPeriodRule";
import WhitelistTransferRule from "./WhitelistTransferRule";
import VolumeSupplyLimitRule from "./VolumeSupplyLimitRule";
import InvestorPositionLimitRule from "./InvestorPositionLimitRule";
import KYCVerificationRule from "./KYCVerificationRule";
import AMLSanctionsRule from "./AMLSanctionsRule";
import RiskProfileRule from "./RiskProfileRule";
import AccreditedInvestorRule from "./AccreditedInvestorRule";
import TokenizedFundRule from "./TokenizedFundRule";
import RedemptionRule from "./RedemptionRule";

interface RuleEditModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  ruleId?: string;
  onSuccess?: () => void;
}

const RuleEditModal = ({
  open = false,
  onOpenChange = () => {},
  ruleId,
  onSuccess = () => {},
}: RuleEditModalProps) => {
  const { user } = useAuth();
  const [ruleData, setRuleData] = useState<PolicyRule>({
    name: "",
    type: "",
    description: "",
    conditions: [],
    actions: [],
    priority: "medium",
    isActive: true,
    isTemplate: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedRuleType, setSelectedRuleType] = useState<string>("");
  
  useEffect(() => {
    if (open && ruleId) {
      fetchRuleData();
    } else if (open && !ruleId) {
      // Reset form for new rule
      setRuleData({
        name: "",
        type: "",
        description: "",
        conditions: [],
        actions: [],
        priority: "medium",
        isActive: true,
        isTemplate: false
      });
      setSelectedRuleType("");
      setErrors({});
    }
  }, [open, ruleId]);

  const fetchRuleData = async () => {
    if (!ruleId) return;
    
    setLoading(true);
    try {
      const rule = await getRuleById(ruleId);
      if (!rule) {
        throw new Error("Rule not found");
      }
      
      setRuleData(rule);
      setSelectedRuleType(rule.type);
    } catch (error) {
      console.error("Error fetching rule data:", error);
      toast({
        title: "Error",
        description: "Failed to load rule data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setRuleData((prev) => ({
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

  const handleSelectChange = (field: string, value: string) => {
    setRuleData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user selects
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleStatusChange = (checked: boolean) => {
    setRuleData((prev) => ({
      ...prev,
      isActive: checked,
    }));
  };

  const handleTemplateChange = (checked: boolean) => {
    setRuleData((prev) => ({
      ...prev,
      isTemplate: checked,
    }));
  };

  const handleSpecificRuleAdd = (specificRuleData: any) => {
    setRuleData((prev) => ({
      ...prev,
      id: ensureUUID(prev.id),
      type: specificRuleData.type,
      name: prev.name || `${specificRuleData.type.replace(/_/g, ' ')} Rule`,
      description: specificRuleData.description || "",
      conditions: specificRuleData.conditions || [],
      actions: specificRuleData.actions || []
    }));
    
    // Clear error when rule details change
    if (errors.description) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.description;
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!ruleData.name.trim()) {
      newErrors.name = "Rule name is required";
    }

    if (!ruleData.type) {
      newErrors.type = "Rule type is required";
    }

    if (!ruleData.conditions?.length || !ruleData.actions?.length) {
      newErrors.description = "Rule conditions and actions are required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      if (!user?.id) {
        throw new Error("Authentication required");
      }

      const auditLogService = new AuditLogService();
      
      if (ruleId) {
        // Update existing rule
        const updatedRule = await updateRule(ruleId, ruleData, user.id);
        
        if (updatedRule) {
          await auditLogService.createLog(
            AuditEventType.RULE_UPDATED,
            user.id,
            ruleId,
            'rule',
            { ruleName: ruleData.name }
          );
        }
      } else {
        // Create new rule
        const ruleToCreate: PolicyRule = {
          ...ruleData,
          createdBy: user.id,
          isActive: true,
          isTemplate: false
        };
        const newRule = await createRule(ruleToCreate, user.id);
        
        if (newRule?.id) {
          await auditLogService.createLog(
            AuditEventType.RULE_CREATED,
            user.id,
            newRule.id,
            'rule',
            { ruleName: ruleData.name }
          );
        }
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving rule:", error);
      toast({
        title: "Error",
        description: `Failed to save rule: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const renderRuleTypeComponent = () => {
    switch (selectedRuleType) {
      case "transfer_limit":
        return (
          <TransferLimitRule 
            onSave={handleSpecificRuleAdd} 
            initialData={ruleData}
          />
        );
      case "investor_transaction_limit":
        return (
          <InvestorTransactionLimitRule 
            onSave={handleSpecificRuleAdd}
            initialData={ruleData}
          />
        );
      case "velocity_limit":
        return (
          <VelocityLimitRule 
            onSave={handleSpecificRuleAdd}
            initialData={ruleData}
          />
        );
      case "lock_up_period":
        return (
          <LockUpPeriodRule 
            onSave={handleSpecificRuleAdd}
            initialData={ruleData}
          />
        );
      case "whitelist_transfer":
        return (
          <WhitelistTransferRule 
            onSave={handleSpecificRuleAdd}
            initialData={ruleData}
          />
        );
      case "volume_supply_limit":
        return (
          <VolumeSupplyLimitRule 
            onSave={handleSpecificRuleAdd}
            initialData={ruleData}
          />
        );
      case "investor_position_limit":
        return (
          <InvestorPositionLimitRule 
            onSave={handleSpecificRuleAdd}
            initialData={ruleData}
          />
        );
      case "kyc_verification":
        return (
          <KYCVerificationRule 
            onSave={handleSpecificRuleAdd}
            initialData={ruleData}
          />
        );
      case "aml_sanctions":
        return (
          <AMLSanctionsRule 
            onSave={handleSpecificRuleAdd}
            initialData={ruleData}
          />
        );
      case "risk_profile":
        return (
          <RiskProfileRule 
            onSave={handleSpecificRuleAdd}
            initialData={ruleData}
          />
        );
      case "accredited_investor":
        return (
          <AccreditedInvestorRule 
            onSave={handleSpecificRuleAdd}
            initialData={ruleData}
          />
        );
      case "tokenized_fund":
        return (
          <TokenizedFundRule 
            onSave={handleSpecificRuleAdd}
            initialData={ruleData}
          />
        );
      case "redemption":
        return (
          <RedemptionRule 
            onSave={handleSpecificRuleAdd}
            initialData={ruleData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {ruleId ? "Edit Rule" : "Create New Rule"}
          </DialogTitle>
          <DialogDescription>
            Define rule parameters and behavior for compliance policies.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="name" className="text-sm font-medium">
              Rule Name
            </Label>
            <Input
              id="name"
              name="name"
              value={ruleData.name}
              onChange={handleInputChange}
              placeholder="Enter rule name"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="type" className="text-sm font-medium">
              Rule Type
            </Label>
            <Select
              value={selectedRuleType}
              onValueChange={(value) => {
                setSelectedRuleType(value);
                handleSelectChange("type", value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a rule type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transfer_limit">
                  Transfer Limit
                </SelectItem>
                <SelectItem value="investor_transaction_limit">
                  Investor Transaction Limit
                </SelectItem>
                <SelectItem value="investor_position_limit">
                  Investor Position Limits
                </SelectItem>
                <SelectItem value="velocity_limit">
                  Velocity Limit
                </SelectItem>
                <SelectItem value="lock_up_period">
                  Lock-Up Period
                </SelectItem>
                <SelectItem value="whitelist_transfer">
                  Whitelist Transfer
                </SelectItem>
                <SelectItem value="volume_supply_limit">
                  Volume/Supply Limit
                </SelectItem>
                <SelectItem value="kyc_verification">
                  KYC Verification
                </SelectItem>
                <SelectItem value="aml_sanctions">
                  AML Sanctions Check
                </SelectItem>
                <SelectItem value="accredited_investor">
                  Accredited Investor
                </SelectItem>
                <SelectItem value="risk_profile">Risk Profile</SelectItem>
                <SelectItem value="tokenized_fund">
                  Tokenized Fund
                </SelectItem>
                <SelectItem value="redemption">Redemption</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type}</p>
            )}
          </div>

          {selectedRuleType && (
            <div className="pt-2">
              {renderRuleTypeComponent()}
              {errors.description && (
                <p className="text-sm text-red-500 mt-2">{errors.description}</p>
              )}
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive" className="text-sm font-medium">
                  Rule Status
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <Info className="h-4 w-4 text-gray-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-[200px] text-xs">
                        Inactive rules won't be enforced but will be saved
                        for future use
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={ruleData.isActive}
                  onCheckedChange={handleStatusChange}
                />
                <Label htmlFor="isActive">
                  {ruleData.isActive ? "Active" : "Inactive"}
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="isTemplate" className="text-sm font-medium">
                  Save as Template
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <Info className="h-4 w-4 text-gray-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-[200px] text-xs">
                        Templates can be reused when creating new policies
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isTemplate"
                  checked={ruleData.isTemplate}
                  onCheckedChange={handleTemplateChange}
                />
                <Label htmlFor="isTemplate">
                  {ruleData.isTemplate ? "Yes" : "No"}
                </Label>
              </div>
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
                Save Rule
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RuleEditModal; 