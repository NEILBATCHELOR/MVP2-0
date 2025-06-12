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

interface InvestorGroup {
  id: string;
  name: string;
}

interface LockUpPeriodRuleProps {
  onSave?: (ruleData: any) => void;
  initialData?: any;
}

const LockUpPeriodRule = ({
  onSave = () => {},
  initialData,
}: LockUpPeriodRuleProps) => {
  const [startDate, setStartDate] = useState<string>(
    initialData?.startDate || "",
  );
  const [endDate, setEndDate] = useState<string>(initialData?.endDate || "");
  const [applyTo, setApplyTo] = useState<string>(initialData?.applyTo || "all");
  const [selectedGroups, setSelectedGroups] = useState<string[]>(
    initialData?.selectedGroups || [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Available investor groups
  const investorGroups: InvestorGroup[] = [
    { id: "group-1", name: "Seed Investors" },
    { id: "group-2", name: "Private Sale" },
    { id: "group-3", name: "Team & Advisors" },
    { id: "group-4", name: "Strategic Partners" },
  ];

  // Validate form on input changes
  useEffect(() => {
    validateForm();
  }, [startDate, endDate, applyTo, selectedGroups]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let valid = true;

    // Start Date validation
    if (!startDate) {
      newErrors.startDate = "Start date is required";
      valid = false;
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedStartDate = new Date(startDate);
      if (selectedStartDate < today) {
        newErrors.startDate = "Start date must be in the future";
        valid = false;
      }
    }

    // End Date validation
    if (!endDate) {
      newErrors.endDate = "End date is required";
      valid = false;
    } else if (startDate) {
      const selectedStartDate = new Date(startDate);
      const selectedEndDate = new Date(endDate);
      if (selectedEndDate <= selectedStartDate) {
        newErrors.endDate = "End date must follow start date";
        valid = false;
      }
    }

    // Group validation
    if (applyTo === "specific" && selectedGroups.length === 0) {
      newErrors.groups = "Select at least one investor group";
      valid = false;
    }

    setErrors(newErrors);
    setIsFormValid(valid);
    return valid;
  };

  const handleSave = () => {
    if (validateForm()) {
      const lockupDuration = endDate ? 
        Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) : 
        0;
      
      onSave({
        type: "lock_up_period",
        startDate,
        endDate,
        applyTo,
        selectedGroups: applyTo === "specific" ? selectedGroups : [],
        lockupDuration,
        description: `Lock-up period from ${startDate} to ${endDate}${applyTo === "specific" ? " for specific groups" : ""}`,
        conditions: [{
          field: "lock_up_period",
          operator: "within_period",
          value: {
            startDate,
            endDate,
            applyTo,
            selectedGroups: applyTo === "specific" ? selectedGroups : []
          }
        }],
        actions: [{
          type: "block_transaction",
          params: {
            reason: `Asset is locked until ${endDate}`
          }
        }]
      });
    }
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  return (
    <Card className="w-full bg-white border-purple-200">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg font-medium flex items-center">
          Lock-Up Periods
          <Badge className="ml-2 bg-purple-100 text-purple-800 border-purple-200">
            Transfer Restriction
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {/* Start Date */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="startDate" className="text-sm font-medium">
              Start Date
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
                    The date when the lock-up period begins. Must be a future
                    date.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={errors.startDate ? "border-red-500" : ""}
          />
          {errors.startDate && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" />
              {errors.startDate}
            </p>
          )}
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="endDate" className="text-sm font-medium">
              End Date
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
                    The date when the lock-up period ends. Must be after the
                    start date.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={errors.endDate ? "border-red-500" : ""}
          />
          {errors.endDate && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" />
              {errors.endDate}
            </p>
          )}
        </div>

        {/* Apply To */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Apply To</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Info className="h-4 w-4 text-gray-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">
                    Choose whether to apply this lock-up period to all investors
                    or specific groups.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <RadioGroup
            value={applyTo}
            onValueChange={setApplyTo}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="apply-all" />
              <Label htmlFor="apply-all">All Investors</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="specific" id="apply-specific" />
              <Label htmlFor="apply-specific">Specific Groups</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Investor Groups (conditional) */}
        {applyTo === "specific" && (
          <div className="space-y-2 pl-6 border-l-2 border-purple-100">
            <Label className="text-sm font-medium">
              Select Investor Groups
            </Label>
            <div className="flex flex-col space-y-2">
              {investorGroups.map((group) => (
                <div key={group.id} className="flex items-center space-x-2">
                  <Switch
                    id={`group-${group.id}`}
                    checked={selectedGroups.includes(group.id)}
                    onCheckedChange={() => toggleGroup(group.id)}
                  />
                  <Label htmlFor={`group-${group.id}`}>{group.name}</Label>
                </div>
              ))}
            </div>
            {errors.groups && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.groups}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {selectedGroups.length === 0
                ? "No groups selected. Please select at least one group."
                : `Lock-up will apply to ${selectedGroups.length} selected group(s).`}
            </p>
          </div>
        )}

        <Separator />

        {/* Rule Behavior */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Rule Behavior</h3>
          <div className="bg-pink-50 p-3 rounded-md space-y-2 text-sm text-pink-800">
            <p>
              This rule prevents asset transfers from{" "}
              {startDate ? new Date(startDate).toLocaleDateString() : "start"} to{" "}
              {endDate ? new Date(endDate).toLocaleDateString() : "end"}.
            </p>
            <p>
              {applyTo === "all"
                ? "All investors are subject to this lock-up period."
                : "Only specific investor groups are subject to this lock-up period."}
            </p>
            <p className="text-xs text-pink-600">
              Note: Attempted transfers during the lock-up period will be
              automatically blocked.
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

export default LockUpPeriodRule;
