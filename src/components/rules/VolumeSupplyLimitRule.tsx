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
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

interface VolumeSupplyLimitRuleProps {
  onSave?: (ruleData: any) => void;
  initialData?: any;
}

const VolumeSupplyLimitRule = ({
  onSave = () => {},
  initialData,
}: VolumeSupplyLimitRuleProps) => {
  const [limitType, setLimitType] = useState<string>(
    initialData?.limitType || "volume",
  );
  const [limitAmount, setLimitAmount] = useState<string>(
    initialData?.limitAmount || "",
  );
  const [timePeriod, setTimePeriod] = useState<string>(
    initialData?.timePeriod || "",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Validate form on input changes
  useEffect(() => {
    validateForm();
  }, [limitType, limitAmount, timePeriod]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let valid = true;

    // Limit Amount validation
    if (!limitAmount) {
      newErrors.limitAmount = "Limit amount is required";
      valid = false;
    } else if (isNaN(Number(limitAmount)) || Number(limitAmount) <= 0) {
      newErrors.limitAmount = "Limit amount must be a positive number";
      valid = false;
    }

    // Time Period validation (only required for volume limit)
    if (limitType === "volume" && !timePeriod) {
      newErrors.timePeriod = "Time period is required for volume limits";
      valid = false;
    }

    setErrors(newErrors);
    setIsFormValid(valid);
    return valid;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        type: "volume_supply_limit",
        limitType,
        limitAmount,
        timePeriod,
        description: `Maximum supply of ${limitAmount} ${limitType === "volume" ? timePeriod.replace("_", " ") : "tokens"}`,
        conditions: [{
          field: "total_supply",
          operator: "greater_than",
          value: limitAmount
        }],
        actions: [{
          type: "block_transaction",
          params: {
            reason: `Transaction would exceed maximum supply of ${limitAmount} ${limitType === "volume" ? timePeriod.replace("_", " ") : "tokens"}`
          }
        }]
      });
    }
  };

  return (
    <Card className="w-full bg-white border-indigo-200">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg font-medium flex items-center">
          Volume/Supply Limits
          <Badge className="ml-2 bg-indigo-100 text-indigo-800 border-indigo-200">
            Supply Control
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {/* Limit Type */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Limit Type</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Info className="h-4 w-4 text-gray-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">
                    Choose between a volume limit (transactions over time) or a
                    total supply limit (maximum tokens in circulation).
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <RadioGroup
            value={limitType}
            onValueChange={setLimitType}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="volume" id="limit-volume" />
              <Label htmlFor="limit-volume">Volume Limit</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="total_supply" id="limit-supply" />
              <Label htmlFor="limit-supply">Total Supply Limit</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Limit Amount */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="limitAmount" className="text-sm font-medium">
              {limitType === "volume" ? "Volume Limit" : "Supply Limit"}
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
                    {limitType === "volume"
                      ? "Maximum transaction volume within the selected time period."
                      : "Maximum number of tokens that can be in circulation."}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="limitAmount"
            type="number"
            placeholder={
              limitType === "volume" ? "e.g., 1000000" : "e.g., 21000000"
            }
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

        {/* Time Period (only for volume limit) */}
        {limitType === "volume" && (
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
                      The time frame for the volume limit.
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
        )}

        <Separator />

        {/* Rule Behavior */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Rule Behavior</h3>
          <div className="bg-amber-50 p-3 rounded-md space-y-2 text-sm text-amber-800">
            {limitType === "volume" ? (
              <>
                <p>
                  This rule limits the total transaction volume to{" "}
                  {limitAmount || "[amount]"}{" "}
                  {timePeriod ? timePeriod.replace("_", " ") : "per period"}.
                </p>
                <p>
                  Transactions will be blocked if they would cause the total
                  volume to exceed this limit within the specified period.
                </p>
              </>
            ) : (
              <>
                <p>
                  This rule limits the total supply to {limitAmount || "[amount]"} tokens.
                </p>
                <p>
                  Minting operations that would cause the total supply to exceed
                  this limit will be blocked.
                </p>
              </>
            )}
            <p className="text-xs text-amber-600">
              Note: Operations that would exceed this limit will be automatically rejected.
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

export default VolumeSupplyLimitRule;
