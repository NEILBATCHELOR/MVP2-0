import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Button } from "../ui/button";
import { Info, AlertCircle, Check, Clock, Calculator } from "lucide-react";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";

interface StandardRedemptionRuleProps {
  onSave?: (ruleData: any) => void;
  initialData?: any;
}

const StandardRedemptionRule = ({
  onSave = () => {},
  initialData,
}: StandardRedemptionRuleProps) => {
  const [immediateExecution, setImmediateExecution] = useState<boolean>(
    initialData?.immediateExecution !== false,
  );
  const [useLatestNAV, setUseLatestNAV] = useState<boolean>(
    initialData?.useLatestNAV !== false,
  );
  const [allowAnyTimeRedemption, setAllowAnyTimeRedemption] = useState<boolean>(
    initialData?.allowAnyTimeRedemption !== false,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(true);

  // Validate form on input changes
  useEffect(() => {
    validateForm();
  }, [immediateExecution, useLatestNAV, allowAnyTimeRedemption]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let valid = true;

    setErrors(newErrors);
    setIsFormValid(valid);
    return valid;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        type: "standard_redemption",
        immediateExecution,
        allowAnyTimeRedemption,
        useLatestNAV,
        description: `Standard redemption with ${immediateExecution ? 'immediate' : 'delayed'} execution`,
        conditions: [{
          field: "redemption_request",
          operator: "validate",
          value: {
            type: "standard",
            immediateExecution,
            useLatestNAV,
            allowAnyTimeRedemption
          }
        }],
        actions: [{
          type: "block_transaction",
          params: {
            reason: "Redemption request does not meet standard redemption requirements"
          }
        }]
      });
    }
  };

  return (
    <Card className="w-full bg-white border-blue-200">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg font-medium flex items-center">
          Standard Redemption Rule
          <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-200">
            Immediate Liquidity
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {/* Timing Flexibility */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="allowAnyTimeRedemption"
              className="text-sm font-medium"
            >
              Timing Flexibility
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
                    Allow investors to submit redemption requests at any time
                    without restriction to specific periods.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="allowAnyTimeRedemption"
              checked={allowAnyTimeRedemption}
              onCheckedChange={setAllowAnyTimeRedemption}
            />
            <Label htmlFor="allowAnyTimeRedemption">
              {allowAnyTimeRedemption
                ? "Unrestricted Timing"
                : "Restricted Timing"}
            </Label>
          </div>
          {allowAnyTimeRedemption && (
            <div className="bg-blue-50 p-3 rounded-md text-xs text-blue-800 mt-2">
              <p>
                Investors can submit redemption requests at any time, without
                restriction to specific periods or windows.
              </p>
            </div>
          )}
          {!allowAnyTimeRedemption && (
            <div className="bg-amber-50 p-3 rounded-md text-xs text-amber-800 mt-2">
              <p>
                Warning: This setting restricts standard redemptions to specific
                periods, which is typically a feature of interval fund
                repurchases instead.
              </p>
            </div>
          )}
        </div>

        {/* Immediate Execution */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="immediateExecution" className="text-sm font-medium">
              Immediate Execution
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
                    Process redemptions immediately after approval, without
                    waiting for specific processing windows.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="immediateExecution"
              checked={immediateExecution}
              onCheckedChange={setImmediateExecution}
            />
            <Label htmlFor="immediateExecution">
              {immediateExecution
                ? "Process Immediately"
                : "Delayed Processing"}
            </Label>
          </div>
          {immediateExecution && (
            <div className="bg-blue-50 p-3 rounded-md text-xs text-blue-800 mt-2">
              <p>
                Once approved, redemptions will be processed immediately, with
                tokens burned and funds settled without delay.
              </p>
            </div>
          )}
          {!immediateExecution && (
            <div className="bg-amber-50 p-3 rounded-md text-xs text-amber-800 mt-2">
              <p>
                Warning: Delayed processing is typically a feature of interval
                fund repurchases, not standard redemptions.
              </p>
            </div>
          )}
        </div>

        {/* NAV-Based Valuation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="useLatestNAV" className="text-sm font-medium">
              NAV-Based Valuation
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
                    Use the most recent Net Asset Value (NAV) available at the
                    time of processing for redemption calculations.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="useLatestNAV"
              checked={useLatestNAV}
              onCheckedChange={setUseLatestNAV}
            />
            <Label htmlFor="useLatestNAV">
              {useLatestNAV ? "Use Latest NAV" : "Fixed NAV"}
            </Label>
          </div>
          {useLatestNAV && (
            <div className="bg-blue-50 p-3 rounded-md text-xs text-blue-800 mt-2">
              <p>
                Redemption amount will be calculated using the most recent Net
                Asset Value (NAV) available at the time of processing.
              </p>
            </div>
          )}
          {!useLatestNAV && (
            <div className="bg-amber-50 p-3 rounded-md text-xs text-amber-800 mt-2">
              <p>
                Warning: Using a fixed NAV rather than the latest available is
                not typical for standard redemptions.
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Rule Behavior */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Rule Behavior</h3>
          <div className="bg-blue-50 p-3 rounded-md space-y-2 text-sm text-blue-800">
            <p>
              This rule configures standard redemption parameters with the following settings:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                {allowAnyTimeRedemption
                  ? "Investors can submit redemption requests at any time"
                  : "Redemption requests are restricted to specific periods"}
              </li>
              <li>
                {immediateExecution
                  ? "Redemptions are processed immediately after approval"
                  : "Redemptions are processed with a delay after approval"}
              </li>
              <li>
                {useLatestNAV
                  ? "Redemption amount calculated using the most recent NAV"
                  : "Redemption amount calculated using a fixed NAV"}
              </li>
              <li>
                Tokens are burned upon redemption and the cap table is updated
              </li>
              <li>Funds are transferred to the investor after execution</li>
            </ul>
            <p className="text-xs text-blue-600 mt-2">
              Note: Standard redemptions offer flexibility and quick liquidity
              compared to interval fund repurchases.
            </p>
          </div>
        </div>

        {/* Process Flow */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            Standard Redemption Process Flow
          </h3>
          <div className="bg-gray-50 p-3 rounded-md space-y-3 text-xs text-gray-600">
            <div className="flex items-start gap-2">
              <div className="bg-blue-100 text-blue-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium text-gray-700">Request Submission:</p>
                <p>
                  Investor submits redemption request at{" "}
                  {allowAnyTimeRedemption ? "any time" : "designated periods"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="bg-blue-100 text-blue-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium text-gray-700">Verification:</p>
                <p>
                  System verifies token ownership and compliance requirements
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="bg-blue-100 text-blue-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium text-gray-700">NAV Calculation:</p>
                <p>
                  {useLatestNAV
                    ? "Latest NAV is used for redemption amount calculation"
                    : "Fixed NAV is used for calculation"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="bg-blue-100 text-blue-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                4
              </div>
              <div>
                <p className="font-medium text-gray-700">Execution:</p>
                <p>
                  Tokens are burned and cap table is updated{" "}
                  {immediateExecution ? "immediately" : "at scheduled time"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="bg-blue-100 text-blue-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                5
              </div>
              <div>
                <p className="font-medium text-gray-700">Settlement:</p>
                <p>
                  Funds transferred to investor based on calculated redemption
                  amount
                </p>
              </div>
            </div>
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

export default StandardRedemptionRule;
