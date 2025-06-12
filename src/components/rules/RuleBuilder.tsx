import React, { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { useAuth } from "@/hooks/auth";
import { ensureUUID } from "@/utils/shared/formatting/uuidUtils";
import { 
  PolicyRule,
  createRule,
  updateRule,
  deleteRule
} from "@/services/rule/enhancedRuleService";

interface RuleBuilderProps {
  rules?: PolicyRule[];
  onChange?: (rules: PolicyRule[]) => void;
  defaultActiveTab?: string;
}

const RuleBuilder = ({ 
  rules = [], 
  onChange,
  defaultActiveTab = "rule-templates" 
}: RuleBuilderProps) => {
  const { user } = useAuth();
  const [localRules, setLocalRules] = useState<PolicyRule[]>(
    rules.length > 0
      ? rules
      : [
          {
            id: ensureUUID(undefined),
            name: "High Value Transfer",
            type: "transaction",
            conditions: [{
              field: "amount",
              operator: "greater_than",
              value: "10000",
            }],
            actions: [{
              type: "require_approval",
              params: {
                level: "compliance",
                threshold: "all",
              },
            }],
            priority: "high",
            isActive: true,
          },
        ],
  );

  const [expandedRules, setExpandedRules] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<string>(defaultActiveTab);

  // Rule templates for quick selection
  const ruleTemplates = [
    {
      id: "template-1",
      name: "High Value Transfer",
      type: "transaction",
      description: "Require approval for transfers above a certain amount",
      condition: {
        field: "amount",
        operator: "greater_than",
        value: "10000",
      },
      action: {
        type: "require_approval",
        params: {
          level: "compliance",
          threshold: "all",
        },
      },
      priority: "high",
      enabled: true,
    },
    {
      id: "template-2",
      name: "Restricted Asset Transfer",
      type: "asset",
      description: "Block transfers of restricted assets",
      condition: {
        field: "asset_type",
        operator: "equals",
        value: "restricted",
      },
      action: {
        type: "block_transaction",
        params: {},
      },
      priority: "high",
      enabled: true,
    },
    {
      id: "template-3",
      name: "New Wallet Monitoring",
      type: "wallet",
      description: "Flag transactions from newly created wallets",
      condition: {
        field: "wallet_age",
        operator: "less_than",
        value: "30",
      },
      action: {
        type: "flag_for_review",
        params: {
          reason: "New wallet activity",
        },
      },
      priority: "medium",
      enabled: true,
    },
    {
      id: "template-4",
      name: "After Hours Activity",
      type: "time",
      description: "Notify admins of transactions outside business hours",
      condition: {
        field: "time_of_day",
        operator: "outside_range",
        value: "09:00-17:00",
      },
      action: {
        type: "notify_admin",
        params: {
          urgent: "true",
          message: "After hours transaction detected",
        },
      },
      priority: "low",
      enabled: true,
    },
    {
      id: "template-5",
      name: "Unverified User Limit",
      type: "user",
      description: "Limit transaction amounts for unverified users",
      condition: {
        field: "user_verification",
        operator: "equals",
        value: "unverified",
      },
      action: {
        type: "limit_amount",
        params: {
          max_amount: "1000",
          currency: "USD",
        },
      },
      priority: "medium",
      enabled: true,
    },
  ];

  const addRule = async (template?: any) => {
    if (!user?.id) {
      console.error("User not authenticated");
      return;
    }

    const newRule: PolicyRule = {
      id: ensureUUID(undefined),
      name: template ? template.name : `New Rule ${localRules.length + 1}`,
      type: template ? template.type : "transaction",
      conditions: template
        ? [...template.conditions]
        : [{
            field: "amount",
            operator: "greater_than",
            value: "",
          }],
      actions: template
        ? [...template.actions]
        : [{
            type: "require_approval",
            params: {
              level: "manager",
              threshold: "any",
            },
          }],
      priority: template ? template.priority : "medium",
      isActive: true,
    };

    try {
      const savedRule = await createRule(newRule, user.id);
      const updatedRules = [...localRules, savedRule];
      setLocalRules(updatedRules);
      setExpandedRules((prev) => ({ ...prev, [savedRule.id!]: true }));
      setActiveTab("custom-rules");

      if (onChange) {
        onChange(updatedRules);
      }
    } catch (error) {
      console.error("Error creating rule:", error);
    }
  };

  const removeRule = async (id: string) => {
    try {
      await deleteRule(id);
      const updatedRules = localRules.filter((rule) => rule.id !== id);
      setLocalRules(updatedRules);

      if (onChange) {
        onChange(updatedRules);
      }
    } catch (error) {
      console.error("Error deleting rule:", error);
    }
  };

  const updateRuleData = async (id: string, updatedRule: Partial<PolicyRule>) => {
    if (!user?.id) {
      console.error("User not authenticated");
      return;
    }

    try {
      const existingRule = localRules.find(rule => rule.id === id);
      if (!existingRule) {
        console.error("Rule not found:", id);
        return;
      }

      const updatedRuleData = await updateRule(id, {
        ...existingRule,
        ...updatedRule
      }, user.id);

      const updatedRules = localRules.map((rule) => {
        if (rule.id === id) {
          return updatedRuleData;
        }
        return rule;
      });

      setLocalRules(updatedRules);

      if (onChange) {
        onChange(updatedRules);
      }
    } catch (error) {
      console.error("Error updating rule:", error);
    }
  };

  const toggleRuleExpansion = (id: string) => {
    setExpandedRules((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleRuleEnabled = (id: string, enabled: boolean) => {
    updateRuleData(id, { isActive: enabled });
  };

  const getFieldOptions = (ruleType: string) => {
    switch (ruleType) {
      case "transaction":
        return [
          { value: "amount", label: "Amount" },
          { value: "currency", label: "Currency" },
          { value: "transaction_type", label: "Transaction Type" },
          { value: "recipient_address", label: "Recipient Address" },
          { value: "sender_address", label: "Sender Address" },
        ];
      case "wallet":
        return [
          { value: "wallet_age", label: "Wallet Age (days)" },
          { value: "wallet_balance", label: "Wallet Balance" },
          { value: "wallet_type", label: "Wallet Type" },
          { value: "transaction_count", label: "Transaction Count" },
        ];
      case "asset":
        return [
          { value: "asset_type", label: "Asset Type" },
          { value: "asset_risk_level", label: "Risk Level" },
          { value: "asset_jurisdiction", label: "Jurisdiction" },
          { value: "asset_age", label: "Asset Age (days)" },
        ];
      case "user":
        return [
          { value: "user_verification", label: "Verification Status" },
          { value: "user_risk_score", label: "Risk Score" },
          { value: "user_role", label: "User Role" },
          { value: "user_location", label: "User Location" },
        ];
      case "time":
        return [
          { value: "time_of_day", label: "Time of Day" },
          { value: "day_of_week", label: "Day of Week" },
          { value: "is_business_hours", label: "Business Hours" },
          { value: "is_holiday", label: "Holiday" },
        ];
      default:
        return [];
    }
  };

  const getOperatorOptions = (field: string) => {
    // Time-specific operators
    if (field.includes("time") || field.includes("day")) {
      return [
        { value: "equals", label: "Equals" },
        { value: "not_equals", label: "Not Equals" },
        { value: "in_range", label: "In Range" },
        { value: "outside_range", label: "Outside Range" },
      ];
    }

    // Boolean operators
    if (field.startsWith("is_")) {
      return [
        { value: "equals", label: "Equals" },
        { value: "not_equals", label: "Not Equals" },
      ];
    }

    // Numeric operators
    if (
      field.includes("amount") ||
      field.includes("balance") ||
      field.includes("count") ||
      field.includes("age") ||
      field.includes("score")
    ) {
      return [
        { value: "equals", label: "Equals" },
        { value: "not_equals", label: "Not Equals" },
        { value: "greater_than", label: "Greater Than" },
        { value: "less_than", label: "Less Than" },
        { value: "between", label: "Between" },
      ];
    }

    // String/enum operators
    return [
      { value: "equals", label: "Equals" },
      { value: "not_equals", label: "Not Equals" },
      { value: "contains", label: "Contains" },
      { value: "starts_with", label: "Starts With" },
      { value: "ends_with", label: "Ends With" },
    ];
  };

  const getActionOptions = () => [
    { value: "require_approval", label: "Require Approval" },
    { value: "block_transaction", label: "Block Transaction" },
    { value: "flag_for_review", label: "Flag for Review" },
    { value: "notify_admin", label: "Notify Admin" },
    { value: "limit_amount", label: "Limit Amount" },
    { value: "delay_transaction", label: "Delay Transaction" },
    {
      value: "require_additional_verification",
      label: "Require Additional Verification",
    },
  ];

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "transaction":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "wallet":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "asset":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "user":
        return "bg-pink-100 text-pink-800 border-pink-200";
      case "time":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="p-4 border-b border-gray-200">
          <Button
            onClick={() => addRule()}
            size="sm"
            className="flex items-center gap-1 bg-[#0f172b] hover:bg-[#0f172b]/90 ml-auto mb-4"
          >
            <Plus className="h-4 w-4" />
            Create Custom Rule
          </Button>

          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="rule-templates">Rule Templates</TabsTrigger>
            <TabsTrigger value="custom-rules">
              Custom Rules ({localRules.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="rule-templates" className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ruleTemplates.map((template) => (
              <Card
                key={template.id}
                className="p-4 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => addRule(template)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {template.name}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {template.description}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={getTypeBadgeColor(template.type)}
                  >
                    {template.type.charAt(0).toUpperCase() +
                      template.type.slice(1)}
                  </Badge>
                </div>

                <div className="mt-3 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Condition:</span>
                    <span>
                      {template.condition.field.replace(/_/g, " ")}{" "}
                      {template.condition.operator.replace(/_/g, " ")}{" "}
                      {template.condition.value}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="font-medium">Action:</span>
                    <span>{template.action.type.replace(/_/g, " ")}</span>
                  </div>
                </div>

                <div className="mt-3 flex justify-between items-center">
                  <Badge
                    variant="outline"
                    className={getPriorityBadgeColor(template.priority)}
                  >
                    {template.priority.charAt(0).toUpperCase() +
                      template.priority.slice(1)}{" "}
                    Priority
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="custom-rules" className="p-4 space-y-4">
          {localRules.length > 0 ? (
            <div className="space-y-4">
              {localRules.map((rule) => (
                <Card key={rule.id} className="border border-gray-200">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-auto"
                          onClick={() => toggleRuleExpansion(rule.id)}
                        >
                          {expandedRules[rule.id] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {rule.name}
                            </span>
                            <div className="flex gap-1">
                              <Badge
                                variant="outline"
                                className={getTypeBadgeColor(rule.type)}
                              >
                                {rule.type.charAt(0).toUpperCase() +
                                  rule.type.slice(1)}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={getPriorityBadgeColor(rule.priority)}
                              >
                                {rule.priority.charAt(0).toUpperCase() +
                                  rule.priority.slice(1)}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {rule.conditions[0].field.replace(/_/g, " ")}{" "}
                            {rule.conditions[0].operator.replace(/_/g, " ")}{" "}
                            {rule.conditions[0].value} →{" "}
                            {rule.actions[0].type.replace(/_/g, " ")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`enabled-${rule.id}`}
                          checked={rule.isActive}
                          onCheckedChange={(checked) =>
                            toggleRuleEnabled(rule.id, checked)
                          }
                        />
                        <Label
                          htmlFor={`enabled-${rule.id}`}
                          className="text-sm"
                        >
                          {rule.isActive ? "Enabled" : "Disabled"}
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 p-1 h-auto"
                          onClick={() => removeRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {expandedRules[rule.id] && (
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor={`rule-name-${rule.id}`}
                            className="text-sm font-medium"
                          >
                            Rule Name
                          </Label>
                          <Input
                            id={`rule-name-${rule.id}`}
                            value={rule.name}
                            onChange={(e) =>
                              updateRuleData(rule.id, { name: e.target.value })
                            }
                            placeholder="Enter rule name"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">
                              Rule Type
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
                                    The rule type determines which fields are
                                    available for conditions
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Select
                            value={rule.type}
                            onValueChange={(
                              value:
                                | "transaction"
                                | "wallet"
                                | "asset"
                                | "user"
                                | "time",
                            ) => {
                              updateRuleData(rule.id, {
                                type: value,
                                // Reset the condition field when changing type
                                conditions: [
                                  {
                                    ...rule.conditions[0],
                                    field: getFieldOptions(value)[0]?.value || "",
                                  },
                                ],
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select rule type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="transaction">
                                Transaction
                              </SelectItem>
                              <SelectItem value="wallet">Wallet</SelectItem>
                              <SelectItem value="asset">Asset</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="time">Time</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="text-sm font-medium mb-3">Condition</h4>
                        <div className="flex flex-wrap gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Field</Label>
                            <Select
                              value={rule.conditions[0].field}
                              onValueChange={(value) => {
                                updateRuleData(rule.id, {
                                  conditions: [
                                    {
                                      ...rule.conditions[0],
                                      field: value,
                                    },
                                  ],
                                });
                              }}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select field" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>
                                    {rule.type.charAt(0).toUpperCase() +
                                      rule.type.slice(1)}{" "}
                                    Fields
                                  </SelectLabel>
                                  {getFieldOptions(rule.type).map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Operator</Label>
                            <Select
                              value={rule.conditions[0].operator}
                              onValueChange={(value) => {
                                updateRuleData(rule.id, {
                                  conditions: [
                                    {
                                      ...rule.conditions[0],
                                      operator: value,
                                    },
                                  ],
                                });
                              }}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select operator" />
                              </SelectTrigger>
                              <SelectContent>
                                {getOperatorOptions(rule.conditions[0].field).map(
                                  (option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Value</Label>
                            <Input
                              className="w-[180px]"
                              placeholder="Value"
                              value={rule.conditions[0].value}
                              onChange={(e) => {
                                updateRuleData(rule.id, {
                                  conditions: [
                                    {
                                      ...rule.conditions[0],
                                      value: e.target.value,
                                    },
                                  ],
                                });
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="text-sm font-medium mb-3">Action</h4>
                        <div className="flex flex-wrap gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs">Action Type</Label>
                            <Select
                              value={rule.actions[0].type}
                              onValueChange={(value) => {
                                updateRuleData(rule.id, {
                                  actions: [
                                    {
                                      type: value,
                                      params: {},
                                    },
                                  ],
                                });
                              }}
                            >
                              <SelectTrigger className="w-[220px]">
                                <SelectValue placeholder="Select action" />
                              </SelectTrigger>
                              <SelectContent>
                                {getActionOptions().map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Action-specific parameters */}
                          {rule.actions[0].type === "require_approval" && (
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <Label className="text-xs">
                                  Approval Level
                                </Label>
                                <Select
                                  value={rule.actions[0].params.level || "manager"}
                                  onValueChange={(value) => {
                                    updateRuleData(rule.id, {
                                      actions: [
                                        {
                                          ...rule.actions[0],
                                          params: {
                                            ...rule.actions[0].params,
                                            level: value,
                                          },
                                        },
                                      ],
                                    });
                                  }}
                                >
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Approval level" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="manager">
                                      Manager
                                    </SelectItem>
                                    <SelectItem value="director">
                                      Director
                                    </SelectItem>
                                    <SelectItem value="compliance">
                                      Compliance
                                    </SelectItem>
                                    <SelectItem value="executive">
                                      Executive
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">
                                  Approval Threshold
                                </Label>
                                <Select
                                  value={rule.actions[0].params.threshold || "all"}
                                  onValueChange={(value) => {
                                    updateRuleData(rule.id, {
                                      actions: [
                                        {
                                          ...rule.actions[0],
                                          params: {
                                            ...rule.actions[0].params,
                                            threshold: value,
                                          },
                                        },
                                      ],
                                    });
                                  }}
                                >
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Threshold" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">
                                      All Approvers
                                    </SelectItem>
                                    <SelectItem value="majority">
                                      Majority
                                    </SelectItem>
                                    <SelectItem value="any">
                                      Any Approver
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}

                          {rule.actions[0].type === "notify_admin" && (
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id={`urgent-${rule.id}`}
                                  checked={rule.actions[0].params.urgent === "true"}
                                  onCheckedChange={(checked) => {
                                    updateRuleData(rule.id, {
                                      actions: [
                                        {
                                          ...rule.actions[0],
                                          params: {
                                            ...rule.actions[0].params,
                                            urgent: checked.toString(),
                                          },
                                        },
                                      ],
                                    });
                                  }}
                                />
                                <Label htmlFor={`urgent-${rule.id}`}>
                                  Mark as urgent
                                </Label>
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">
                                  Notification Message
                                </Label>
                                <Input
                                  value={rule.actions[0].params.message || ""}
                                  onChange={(e) => {
                                    updateRuleData(rule.id, {
                                      actions: [
                                        {
                                          ...rule.actions[0],
                                          params: {
                                            ...rule.actions[0].params,
                                            message: e.target.value,
                                          },
                                        },
                                      ],
                                    });
                                  }}
                                  placeholder="Enter notification message"
                                  className="w-[300px]"
                                />
                              </div>
                            </div>
                          )}

                          {rule.actions[0].type === "limit_amount" && (
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <Label className="text-xs">
                                  Maximum Amount
                                </Label>
                                <Input
                                  type="number"
                                  value={rule.actions[0].params.max_amount || ""}
                                  onChange={(e) => {
                                    updateRuleData(rule.id, {
                                      actions: [
                                        {
                                          ...rule.actions[0],
                                          params: {
                                            ...rule.actions[0].params,
                                            max_amount: e.target.value,
                                          },
                                        },
                                      ],
                                    });
                                  }}
                                  placeholder="Enter maximum amount"
                                  className="w-[180px]"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">Currency</Label>
                                <Select
                                  value={rule.actions[0].params.currency || "USD"}
                                  onValueChange={(value) => {
                                    updateRuleData(rule.id, {
                                      actions: [
                                        {
                                          ...rule.actions[0],
                                          params: {
                                            ...rule.actions[0].params,
                                            currency: value,
                                          },
                                        },
                                      ],
                                    });
                                  }}
                                >
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select currency" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="GBP">GBP</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}

                          {rule.actions[0].type === "delay_transaction" && (
                            <div className="space-y-1">
                              <Label className="text-xs">
                                Delay Period (hours)
                              </Label>
                              <Input
                                type="number"
                                value={rule.actions[0].params.delay_hours || "24"}
                                onChange={(e) => {
                                  updateRuleData(rule.id, {
                                    actions: [
                                      {
                                        ...rule.actions[0],
                                        params: {
                                          ...rule.actions[0].params,
                                          delay_hours: e.target.value,
                                        },
                                      },
                                    ],
                                  });
                                }}
                                placeholder="Enter delay in hours"
                                className="w-[180px]"
                              />
                            </div>
                          )}

                          {rule.actions[0].type === "flag_for_review" && (
                            <div className="space-y-1">
                              <Label className="text-xs">Reason</Label>
                              <Input
                                value={rule.actions[0].params.reason || ""}
                                onChange={(e) => {
                                  updateRuleData(rule.id, {
                                    actions: [
                                      {
                                        ...rule.actions[0],
                                        params: {
                                          ...rule.actions[0].params,
                                          reason: e.target.value,
                                        },
                                      },
                                    ],
                                  });
                                }}
                                placeholder="Enter review reason"
                                className="w-[300px]"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator />

                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <Label className="text-xs">Priority</Label>
                          <Select
                            value={rule.priority}
                            onValueChange={(
                              value: "high" | "medium" | "low",
                            ) => {
                              updateRuleData(rule.id, { priority: value });
                            }}
                          >
                            <SelectTrigger className="w-[150px]">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => removeRule(rule.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete Rule
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              <p className="mb-4">No custom rules defined yet</p>
              <Button
                onClick={() => addRule()}
                className="bg-[#0f172b] hover:bg-[#0f172b]/90"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Your First Rule
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RuleBuilder;
