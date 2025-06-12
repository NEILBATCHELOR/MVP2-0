import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Button } from "../ui/button";
import { Info, AlertCircle, Check, TrendingUp } from "lucide-react";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Slider } from "../ui/slider";

interface RiskProfileRuleProps {
  onSave?: (ruleData: any) => void;
  initialData?: any;
}

const RiskProfileRule = ({
  onSave = () => {},
  initialData,
}: RiskProfileRuleProps) => {
  const [riskTolerance, setRiskTolerance] = useState<number>(
    initialData?.riskTolerance || 3,
  );
  const [highRiskExposure, setHighRiskExposure] = useState<number>(
    initialData?.highRiskExposure || 20,
  );
  const [mediumRiskExposure, setMediumRiskExposure] = useState<number>(
    initialData?.mediumRiskExposure || 40,
  );
  const [lowRiskExposure, setLowRiskExposure] = useState<number>(
    initialData?.lowRiskExposure || 40,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [minimumScore, setMinimumScore] = useState<number>(
    initialData?.minimumScore || 70,
  );

  // Validate form on input changes
  useEffect(() => {
    validateForm();
  }, [riskTolerance, highRiskExposure, mediumRiskExposure, lowRiskExposure]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let valid = true;

    // Validate that exposure percentages add up to 100%
    const totalExposure =
      highRiskExposure + mediumRiskExposure + lowRiskExposure;
    if (totalExposure !== 100) {
      newErrors.exposure = `Exposure percentages must add up to 100%. Current total: ${totalExposure}%`;
      valid = false;
    }

    setErrors(newErrors);
    setIsFormValid(valid);
    return valid;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        type: "risk_profile",
        riskTolerance,
        minimumScore,
        highRiskExposure,
        mediumRiskExposure,
        lowRiskExposure,
        description: `Risk profile check with minimum score ${minimumScore}`,
        conditions: [{
          field: "risk_score",
          operator: "less_than",
          value: minimumScore
        }],
        actions: [{
          type: "block_transaction",
          params: {
            reason: `Risk score below required minimum of ${minimumScore}`
          }
        }]
      });
    }
  };

  const getRiskToleranceLabel = (value: number) => {
    switch (value) {
      case 1:
        return "Conservative";
      case 2:
        return "Moderately Conservative";
      case 3:
        return "Moderate";
      case 4:
        return "Moderately Aggressive";
      case 5:
        return "Aggressive";
      default:
        return "Moderate";
    }
  };

  const handleExposureChange = (type: string, value: number) => {
    switch (type) {
      case "high":
        setHighRiskExposure(value);
        break;
      case "medium":
        setMediumRiskExposure(value);
        break;
      case "low":
        setLowRiskExposure(value);
        break;
    }
  };

  return (
    <Card className="w-full bg-white border-orange-200">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg font-medium flex items-center">
          Risk Profile Verification Rule
          <Badge className="ml-2 bg-orange-100 text-orange-800 border-orange-200">
            Compliance Rule
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {/* Risk Tolerance Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Risk Tolerance</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Info className="h-4 w-4 text-gray-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">
                    Set the investor's risk tolerance profile from Conservative
                    to Aggressive.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="space-y-4">
            <Slider
              defaultValue={[riskTolerance]}
              max={5}
              min={1}
              step={1}
              onValueChange={(value) => setRiskTolerance(value[0])}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Conservative</span>
              <span>Aggressive</span>
            </div>
            <div className="text-center font-medium">
              {getRiskToleranceLabel(riskTolerance)}
            </div>
          </div>
        </div>

        {/* Asset Exposure Limits */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Asset Exposure Limits</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Info className="h-4 w-4 text-gray-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">
                    Define maximum exposure percentages for different risk
                    categories. Total must equal 100%.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="highRisk" className="text-sm">
                  High-Risk Assets
                </Label>
                <span className="text-sm font-medium">{highRiskExposure}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="highRisk"
                  type="number"
                  min="0"
                  max="100"
                  value={highRiskExposure}
                  onChange={(e) =>
                    handleExposureChange("high", parseInt(e.target.value) || 0)
                  }
                  className="w-20"
                />
                <div className="flex-1">
                  <Slider
                    value={[highRiskExposure]}
                    max={100}
                    min={0}
                    step={5}
                    onValueChange={(value) =>
                      handleExposureChange("high", value[0])
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="mediumRisk" className="text-sm">
                  Medium-Risk Assets
                </Label>
                <span className="text-sm font-medium">
                  {mediumRiskExposure}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="mediumRisk"
                  type="number"
                  min="0"
                  max="100"
                  value={mediumRiskExposure}
                  onChange={(e) =>
                    handleExposureChange(
                      "medium",
                      parseInt(e.target.value) || 0,
                    )
                  }
                  className="w-20"
                />
                <div className="flex-1">
                  <Slider
                    value={[mediumRiskExposure]}
                    max={100}
                    min={0}
                    step={5}
                    onValueChange={(value) =>
                      handleExposureChange("medium", value[0])
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="lowRisk" className="text-sm">
                  Low-Risk Assets
                </Label>
                <span className="text-sm font-medium">{lowRiskExposure}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="lowRisk"
                  type="number"
                  min="0"
                  max="100"
                  value={lowRiskExposure}
                  onChange={(e) =>
                    handleExposureChange("low", parseInt(e.target.value) || 0)
                  }
                  className="w-20"
                />
                <div className="flex-1">
                  <Slider
                    value={[lowRiskExposure]}
                    max={100}
                    min={0}
                    step={5}
                    onValueChange={(value) =>
                      handleExposureChange("low", value[0])
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <span className="text-sm font-medium">Total Allocation:</span>
              <span
                className={`text-sm font-bold ${highRiskExposure + mediumRiskExposure + lowRiskExposure === 100 ? "text-green-600" : "text-red-600"}`}
              >
                {highRiskExposure + mediumRiskExposure + lowRiskExposure}%
              </span>
            </div>

            {errors.exposure && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.exposure}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Rule Behavior */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Rule Behavior</h3>
          <div className="bg-orange-50 p-3 rounded-md space-y-2 text-sm text-orange-800">
            <p>
              This rule limits exposure to high-risk assets based on the
              investor's risk profile:{" "}
              <strong>{getRiskToleranceLabel(riskTolerance)}</strong>.
            </p>
            <p>
              Maximum exposure limits: {highRiskExposure}% high-risk,{" "}
              {mediumRiskExposure}% medium-risk, {lowRiskExposure}% low-risk
              assets.
            </p>
            <p>
              Investments exceeding these limits will be blocked or require
              additional approval.
            </p>
            <p className="text-xs text-orange-600">
              Note: This rule is triggered on each investment attempt to ensure
              portfolio compliance.
            </p>
          </div>
        </div>

        {/* Error Handling */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Error Handling</h3>
          <div className="bg-gray-50 p-3 rounded-md space-y-2 text-xs text-gray-600">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-700">Creation:</p>
                <p>"Risk tolerance not set." – Set tolerance.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-700">Execution:</p>
                <p>"Risk check failed." – Investment blocked.</p>
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
              Please ensure exposure percentages add up to 100%.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskProfileRule;
