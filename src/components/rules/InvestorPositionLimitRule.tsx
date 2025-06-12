import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Button } from "../ui/button";
import { Info, AlertCircle, Check } from "lucide-react";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { getAllInvestorTypes } from "@/utils/compliance/investorTypes";

interface InvestorPositionLimitRuleProps {
  onSave?: (ruleData: any) => void;
  initialData?: any;
}

const InvestorPositionLimitRule = ({
  onSave = () => {},
  initialData,
}: InvestorPositionLimitRuleProps) => {
  const [maxAmount, setMaxAmount] = useState<string>(
    initialData?.maxAmount || "",
  );
  const [unit, setUnit] = useState<string>(initialData?.unit || "");
  const [selectedInvestorTypes, setSelectedInvestorTypes] = useState<string[]>(
    initialData?.selectedInvestorTypes || [],
  );
  const [timeBasedScaling, setTimeBasedScaling] = useState<boolean>(
    initialData?.timeBasedScaling || false,
  );
  const [scalingType, setScalingType] = useState<string>(
    initialData?.scalingType || "linear",
  );
  const [adjustmentInterval, setAdjustmentInterval] = useState<string>(
    initialData?.adjustmentInterval || "monthly",
  );
  const [dynamicProfiling, setDynamicProfiling] = useState<boolean>(
    initialData?.dynamicProfiling || false,
  );
  const [minimumPosition, setMinimumPosition] = useState<string>(
    initialData?.minimumPosition || ""
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Available investor types
  const investorTypes = getAllInvestorTypes();

  // Validate form on input changes
  useEffect(() => {
    validateForm();
  }, [maxAmount, unit]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let valid = true;

    // Max Amount validation
    if (!maxAmount) {
      newErrors.maxAmount = "Maximum allocation amount is required";
      valid = false;
    } else if (isNaN(Number(maxAmount)) || Number(maxAmount) <= 0) {
      newErrors.maxAmount = "Maximum allocation must be a positive number";
      valid = false;
    }

    // Unit validation
    if (!unit) {
      newErrors.unit = "Unit is required";
      valid = false;
    }

    setErrors(newErrors);
    setIsFormValid(valid);
    return valid;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        type: "investor_position_limit",
        maxAmount,
        unit,
        selectedInvestorTypes,
        timeBasedScaling,
        description: `Maximum position of ${maxAmount} ${unit} per investor`,
        conditions: [{
          field: "investor_position",
          operator: "greater_than",
          value: maxAmount,
          investorTypes: selectedInvestorTypes
        }],
        actions: [{
          type: "block_transaction",
          params: {
            reason: `Position would exceed investor limit of ${maxAmount} ${unit}`
          }
        }]
      });
    }
  };

  const toggleInvestorType = (typeId: string) => {
    setSelectedInvestorTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId],
    );
  };

  return (
    <Card className="w-full bg-white border-purple-200">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg font-medium flex items-center">
          Investor Position Limits & Adaptive Allocation Control
          <Badge className="ml-2 bg-purple-100 text-purple-800 border-purple-200">
            Allocation Rule
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {/* Maximum Allocation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="maxAmount" className="text-sm font-medium">
              Maximum Allocation
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Info className="h-4 w-4 text-gray-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">
                    The maximum number of tokens or value an investor can hold.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="maxAmount"
                type="number"
                placeholder="e.g., 100000"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className={errors.maxAmount ? "border-red-500" : ""}
              />
              {errors.maxAmount && (
                <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.maxAmount}
                </p>
              )}
            </div>

            {/* Unit */}
            <div className="w-[120px]">
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className={errors.unit ? "border-red-500" : ""}>
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tokens">Tokens</SelectItem>
                  <SelectItem value="usd">USD</SelectItem>
                </SelectContent>
              </Select>
              {errors.unit && (
                <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.unit}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Investor Types */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Investor Types (Optional)
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Info className="h-4 w-4 text-gray-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">
                    Apply this limit to specific investor types (leave blank for all).
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="max-h-40 overflow-y-auto border rounded-md p-2">
            <div className="grid grid-cols-2 gap-2">
              {investorTypes.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox" 
                    id={`type-${type.id}`}
                    checked={selectedInvestorTypes.includes(type.id)}
                    onChange={() => toggleInvestorType(type.id)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor={`type-${type.id}`} className="text-sm">
                    {type.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {selectedInvestorTypes.length === 0
              ? "No investor types selected. Rule will apply to all investors."
              : `Rule will apply to ${selectedInvestorTypes.length} selected investor type(s).`}
          </p>
        </div>

        {/* Time-Based Scaling */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Time-Based Scaling (Optional)
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Info className="h-4 w-4 text-gray-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">
                    Automatically adjust position limits over time based on
                    investor tenure.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="timeBasedScaling"
              checked={timeBasedScaling}
              onCheckedChange={setTimeBasedScaling}
            />
            <Label htmlFor="timeBasedScaling">
              Enable time-based scaling of position limits
            </Label>
          </div>

          {timeBasedScaling && (
            <div className="pl-6 border-l-2 border-purple-100 space-y-4 mt-2">
              <div className="space-y-2">
                <Label className="text-sm">Scaling Type</Label>
                <RadioGroup
                  value={scalingType}
                  onValueChange={setScalingType}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="linear" id="scaling-linear" />
                    <Label htmlFor="scaling-linear">Linear</Label>
                    <span className="text-xs text-gray-500">
                      (steady increase)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="exponential"
                      id="scaling-exponential"
                    />
                    <Label htmlFor="scaling-exponential">Exponential</Label>
                    <span className="text-xs text-gray-500">
                      (accelerating increase)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="step" id="scaling-step" />
                    <Label htmlFor="scaling-step">Step-Function</Label>
                    <span className="text-xs text-gray-500">
                      (threshold-based increases)
                    </span>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Adjustment Interval</Label>
                <Select
                  value={adjustmentInterval}
                  onValueChange={setAdjustmentInterval}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Investor Profiling */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Dynamic Investor Profiling (Optional)
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Info className="h-4 w-4 text-gray-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">
                    Adjust position limits based on investor behavior, risk
                    appetite, and transaction patterns.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="dynamicProfiling"
              checked={dynamicProfiling}
              onCheckedChange={setDynamicProfiling}
            />
            <Label htmlFor="dynamicProfiling">
              Enable dynamic adjustment based on investor behavior
            </Label>
          </div>
          {dynamicProfiling && (
            <div className="bg-gray-50 p-3 rounded-md space-y-1 text-xs text-gray-600 mt-2">
              <p>Triggers that will adjust position limits:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Investment behavior patterns</li>
                <li>Risk appetite assessment</li>
                <li>Transaction frequency and volume</li>
                <li>Market condition adaptations</li>
              </ul>
            </div>
          )}
        </div>

        <Separator />

        {/* Rule Behavior */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Rule Behavior</h3>
          <div className="bg-orange-50 p-3 rounded-md space-y-2 text-sm text-orange-800">
            <p>
              This rule limits investor positions as follows:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Maximum position: {maxAmount || "[amount]"} {unit.toUpperCase()} per investor
              </li>
              <li>
                Minimum position: {minimumPosition || "[amount]"} {unit.toUpperCase()} per investor
              </li>
              <li>
                {selectedInvestorTypes.length > 0
                  ? `This rule applies to ${selectedInvestorTypes.length} selected investor type(s).`
                  : "This rule applies to all investors."}
              </li>
            </ul>
            <p className="text-xs text-orange-600">
              Note: Transactions that would violate these limits will be automatically rejected.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <Button
            onClick={handleSave}
            disabled={!isFormValid}
            className="w-full bg-[#0f172b] hover:bg-[#0f172b]/90"
          >
            <Check className="mr-2 h-4 w-4" />
            Save Rule
          </Button>
          {!isFormValid && (
            <p className="text-xs text-center text-gray-500 mt-2">
              Please fill in all required fields to save this rule.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestorPositionLimitRule;
