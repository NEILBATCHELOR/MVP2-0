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

interface VelocityLimitRuleProps {
  onSave?: (ruleData: any) => void;
  initialData?: any;
}

const VelocityLimitRule = ({
  onSave = () => {},
  initialData,
}: VelocityLimitRuleProps) => {
  const [limitAmount, setLimitAmount] = useState<string>(initialData?.limitAmount || "");
  const [timePeriod, setTimePeriod] = useState<string>(initialData?.timePeriod || "");
  const [transactionType, setTransactionType] = useState<string>(initialData?.transactionType || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Initialize form data from initialData
  useEffect(() => {
    if (initialData) {
      setLimitAmount(initialData.limitAmount || "");
      setTimePeriod(initialData.timePeriod || "");
      setTransactionType(initialData.transactionType || "");
    }
  }, [initialData]);

  // Validate form on input changes
  useEffect(() => {
    validateForm();
  }, [limitAmount, timePeriod, transactionType]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let valid = true;

    // Transaction Type validation
    if (!transactionType) {
      newErrors.transactionType = "Transaction type is required";
      valid = false;
    }

    // Time Period validation
    if (!timePeriod) {
      newErrors.timePeriod = "Time period is required";
      valid = false;
    }

    // Limit Amount validation
    if (!limitAmount) {
      newErrors.limitAmount = "Limit amount is required";
      valid = false;
    } else if (isNaN(Number(limitAmount)) || Number(limitAmount) <= 0) {
      newErrors.limitAmount = "Limit amount must be a positive number";
      valid = false;
    }

    setErrors(newErrors);
    setIsFormValid(valid);
    return valid;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        type: "velocity_limit",
        transactionType,
        limitAmount,
        timePeriod,
        description: `Maximum ${transactionType} of ${limitAmount} ${timePeriod}`,
        conditions: [{
          field: "transaction_type",
          operator: "equals",
          value: transactionType
        }, {
          field: "amount",
          operator: "sum_greater_than",
          value: limitAmount,
          timeFrame: {
            value: timePeriod,
            unit: timePeriod.replace("_", " ")
          }
        }],
        actions: [{
          type: "block_transaction",
          params: {
            reason: `Velocity limit exceeded: ${limitAmount} ${timePeriod}`
          }
        }]
      });
    }
  };

  return (
    <Card className="w-full bg-white border-purple-200">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg font-medium flex items-center">
          Velocity Limit
          <Badge className="ml-2 bg-purple-100 text-purple-800 border-purple-200">
            Transaction Rule
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {/* Transaction Type */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="transactionType" className="text-sm font-medium">
              Transaction Type
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
                    Select the type of transaction this limit applies to.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select value={transactionType} onValueChange={setTransactionType}>
            <SelectTrigger
              className={errors.transactionType ? "border-red-500" : ""}
            >
              <SelectValue placeholder="Select transaction type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="subscribe">Subscribe</SelectItem>
              <SelectItem value="redeem">Redeem</SelectItem>
              <SelectItem value="both">Both</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
          {errors.transactionType && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" />
              {errors.transactionType}
            </p>
          )}
        </div>

        {/* Time Period */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="timePeriod" className="text-sm font-medium">
              Time Period
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
                    Select the time period over which the velocity limit is
                    calculated.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger
              className={errors.timePeriod ? "border-red-500" : ""}
            >
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="per_day">Per Day</SelectItem>
              <SelectItem value="per_week">Per Week</SelectItem>
              <SelectItem value="per_month">Per Month</SelectItem>
              <SelectItem value="per_quarter">Per Quarter</SelectItem>
              <SelectItem value="per_year">Per Year</SelectItem>
            </SelectContent>
          </Select>
          {errors.timePeriod && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" />
              {errors.timePeriod}
            </p>
          )}
        </div>

        {/* Limit Amount */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="limitAmount" className="text-sm font-medium">
              Limit Amount
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
                    The maximum volume of transactions allowed within the
                    selected time period.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="limitAmount"
            type="number"
            placeholder="e.g., 10000"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            className={errors.limitAmount ? "border-red-500" : ""}
          />
          {errors.limitAmount && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" />
              {errors.limitAmount}
            </p>
          )}
        </div>

        <Separator />

        {/* Rule Behavior */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Rule Behavior</h3>
          <div className="bg-purple-50 p-3 rounded-md space-y-2 text-sm text-purple-800">
            <p>
              This rule will limit the amount an investor can{" "}
              {transactionType || "transact"} to {limitAmount || "X"} tokens{" "}
              {timePeriod ? timePeriod.replace("_", " ") : "per period"}.
            </p>
            <p>
              If an investor exceeds this limit, additional transactions will be
              blocked until the next time period.
            </p>
            <p className="text-xs text-purple-600">
              Note: Limits are calculated based on historical transaction volume
              within the time window.
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

export default VelocityLimitRule;
