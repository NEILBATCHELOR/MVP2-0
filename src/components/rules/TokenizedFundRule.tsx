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
import {
  Info,
  AlertCircle,
  Check,
  TrendingUp,
  BarChart3,
  Percent,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Slider } from "../ui/slider";

interface TokenizedFundRuleProps {
  onSave?: (ruleData: any) => void;
  initialData?: any;
}

const TokenizedFundRule = ({
  onSave = () => {},
  initialData,
}: TokenizedFundRuleProps) => {
  const [tokenConcentrationCap, setTokenConcentrationCap] = useState<number>(
    initialData?.tokenConcentrationCap || 30,
  );
  const [counterpartyExposureLimit, setCounterpartyExposureLimit] =
    useState<number>(initialData?.counterpartyExposureLimit || 25);
  const [riskPositionSizeLimit, setRiskPositionSizeLimit] = useState<number>(
    initialData?.riskPositionSizeLimit || 20,
  );
  const [strategyAllocationCap, setStrategyAllocationCap] = useState<number>(
    initialData?.strategyAllocationCap || 20,
  );
  const [longTermInvestmentLimit, setLongTermInvestmentLimit] =
    useState<number>(initialData?.longTermInvestmentLimit || 15);
  const [maxMonthlyDrawdown, setMaxMonthlyDrawdown] = useState<number>(
    initialData?.maxMonthlyDrawdown || 10,
  );
  const [targetReturn, setTargetReturn] = useState<number>(
    initialData?.targetReturn || 30,
  );
  const [maxCapacity, setMaxCapacity] = useState<string>(
    initialData?.maxCapacity || "50000000",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Added state variables for tokenized fund
  const [fundType, setFundType] = useState<string | undefined>(
    initialData?.fundType as string | undefined
  );
  const [minInvestment, setMinInvestment] = useState<number | undefined>(
    initialData?.minInvestment as number | undefined
  );
  const [maxInvestors, setMaxInvestors] = useState<number | undefined>(
    initialData?.maxInvestors as number | undefined
  );
  const [redemptionFrequency, setRedemptionFrequency] = useState<string | undefined>(
    initialData?.redemptionFrequency as string | undefined
  );

  // Validate form on input changes
  useEffect(() => {
    validateForm();
  }, [
    tokenConcentrationCap,
    counterpartyExposureLimit,
    riskPositionSizeLimit,
    strategyAllocationCap,
    longTermInvestmentLimit,
    maxMonthlyDrawdown,
    targetReturn,
    maxCapacity,
  ]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let valid = true;

    // Validate all percentage fields are between 0-100
    if (tokenConcentrationCap < 0 || tokenConcentrationCap > 100) {
      newErrors.tokenConcentrationCap =
        "Token concentration cap must be between 0-100%";
      valid = false;
    }

    if (counterpartyExposureLimit < 0 || counterpartyExposureLimit > 100) {
      newErrors.counterpartyExposureLimit =
        "Counterparty exposure limit must be between 0-100%";
      valid = false;
    }

    if (riskPositionSizeLimit < 0 || riskPositionSizeLimit > 100) {
      newErrors.riskPositionSizeLimit =
        "Risk position size limit must be between 0-100%";
      valid = false;
    }

    if (strategyAllocationCap < 0 || strategyAllocationCap > 100) {
      newErrors.strategyAllocationCap =
        "Strategy allocation cap must be between 0-100%";
      valid = false;
    }

    if (longTermInvestmentLimit < 0 || longTermInvestmentLimit > 100) {
      newErrors.longTermInvestmentLimit =
        "Long term investment limit must be between 0-100%";
      valid = false;
    }

    if (maxMonthlyDrawdown < 0 || maxMonthlyDrawdown > 100) {
      newErrors.maxMonthlyDrawdown =
        "Max monthly drawdown must be between 0-100%";
      valid = false;
    }

    if (targetReturn < 0 || targetReturn > 1000) {
      newErrors.targetReturn = "Target return must be between 0-1000%";
      valid = false;
    }

    if (!maxCapacity || parseInt(maxCapacity) <= 0) {
      newErrors.maxCapacity = "Max capacity must be greater than zero";
      valid = false;
    }

    setErrors(newErrors);
    setIsFormValid(valid);
    return valid;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        type: "tokenized_fund",
        minInvestment,
        fundType,
        tokenConcentrationCap,
        counterpartyExposureLimit,
        riskPositionSizeLimit,
        strategyAllocationCap,
        liquidityCoverage: 100,
        redemptionPeriod: redemptionFrequency,
        description: `Tokenized fund rule with minimum investment ${minInvestment} ${fundType}`,
        conditions: [{
          field: "investment_amount",
          operator: "less_than",
          value: minInvestment,
          currency: fundType
        }],
        actions: [{
          type: "block_transaction",
          params: {
            reason: `Investment amount below minimum of ${minInvestment} ${fundType}`
          }
        }]
      });
    }
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(parseInt(value) || 0);
  };

  return (
    <Card className="w-full bg-white border-blue-200">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg font-medium flex items-center">
          Tokenized Fund Rule
          <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-200">
            Fund Management Rule
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Token Concentration Cap */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="tokenConcentrationCap"
                className="text-sm font-medium"
              >
                Token Concentration Cap (%)
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
                      Maximum percentage of fund that can be allocated to a
                      single non-core stable token.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-4">
              <Slider
                value={[tokenConcentrationCap]}
                max={100}
                min={0}
                step={5}
                onValueChange={(value) => setTokenConcentrationCap(value[0])}
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">0%</span>
                <span className="text-sm font-medium">
                  {tokenConcentrationCap}%
                </span>
                <span className="text-sm text-gray-500">100%</span>
              </div>
            </div>
            {errors.tokenConcentrationCap && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.tokenConcentrationCap}
              </p>
            )}
          </div>

          {/* Counterparty Exposure Limit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="counterpartyExposureLimit"
                className="text-sm font-medium"
              >
                Counterparty Exposure Limit (%)
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
                      Maximum exposure to any single counterparty to mitigate
                      default risk.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-4">
              <Slider
                value={[counterpartyExposureLimit]}
                max={100}
                min={0}
                step={5}
                onValueChange={(value) =>
                  setCounterpartyExposureLimit(value[0])
                }
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">0%</span>
                <span className="text-sm font-medium">
                  {counterpartyExposureLimit}%
                </span>
                <span className="text-sm text-gray-500">100%</span>
              </div>
            </div>
            {errors.counterpartyExposureLimit && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.counterpartyExposureLimit}
              </p>
            )}
          </div>

          {/* Risk Position Size Limit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="riskPositionSizeLimit"
                className="text-sm font-medium"
              >
                Risk Position Size Limit (%)
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
                      Maximum size of individual positions to control risk
                      exposure.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-4">
              <Slider
                value={[riskPositionSizeLimit]}
                max={100}
                min={0}
                step={5}
                onValueChange={(value) => setRiskPositionSizeLimit(value[0])}
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">0%</span>
                <span className="text-sm font-medium">
                  {riskPositionSizeLimit}%
                </span>
                <span className="text-sm text-gray-500">100%</span>
              </div>
            </div>
            {errors.riskPositionSizeLimit && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.riskPositionSizeLimit}
              </p>
            )}
          </div>

          {/* Strategy Allocation Cap */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="strategyAllocationCap"
                className="text-sm font-medium"
              >
                Strategy Allocation Cap (%)
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
                      Maximum allocation to any single strategy to maintain
                      diversification.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-4">
              <Slider
                value={[strategyAllocationCap]}
                max={100}
                min={0}
                step={5}
                onValueChange={(value) => setStrategyAllocationCap(value[0])}
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">0%</span>
                <span className="text-sm font-medium">
                  {strategyAllocationCap}%
                </span>
                <span className="text-sm text-gray-500">100%</span>
              </div>
            </div>
            {errors.strategyAllocationCap && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.strategyAllocationCap}
              </p>
            )}
          </div>

          {/* Long Term Investment Limit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="longTermInvestmentLimit"
                className="text-sm font-medium"
              >
                Long Term Protocol Investments Limit (%)
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
                      Maximum allocation for long-term protocol investments.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-4">
              <Slider
                value={[longTermInvestmentLimit]}
                max={100}
                min={0}
                step={5}
                onValueChange={(value) => setLongTermInvestmentLimit(value[0])}
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">0%</span>
                <span className="text-sm font-medium">
                  {longTermInvestmentLimit}%
                </span>
                <span className="text-sm text-gray-500">100%</span>
              </div>
            </div>
            {errors.longTermInvestmentLimit && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.longTermInvestmentLimit}
              </p>
            )}
          </div>

          {/* Max Monthly Drawdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="maxMonthlyDrawdown"
                className="text-sm font-medium"
              >
                Max Monthly Drawdown (%)
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
                      Maximum allowed monthly drawdown before triggering risk
                      controls.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-4">
              <Slider
                value={[maxMonthlyDrawdown]}
                max={50}
                min={0}
                step={1}
                onValueChange={(value) => setMaxMonthlyDrawdown(value[0])}
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">0%</span>
                <span className="text-sm font-medium">
                  {maxMonthlyDrawdown}%
                </span>
                <span className="text-sm text-gray-500">50%</span>
              </div>
            </div>
            {errors.maxMonthlyDrawdown && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.maxMonthlyDrawdown}
              </p>
            )}
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Target Return */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="targetReturn" className="text-sm font-medium">
                Target Annual Return (%)
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
                      Target annual return percentage for the fund.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="targetReturn"
                type="number"
                min="0"
                max="1000"
                value={targetReturn}
                onChange={(e) => setTargetReturn(parseInt(e.target.value) || 0)}
                className="w-20"
              />
              <div className="flex-1">
                <Slider
                  value={[targetReturn]}
                  max={100}
                  min={0}
                  step={5}
                  onValueChange={(value) => setTargetReturn(value[0])}
                />
              </div>
              <Percent className="h-4 w-4 text-gray-500" />
            </div>
            {errors.targetReturn && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.targetReturn}
              </p>
            )}
          </div>

          {/* Max Capacity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="maxCapacity" className="text-sm font-medium">
                Maximum Fund Capacity (USD)
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
                      Maximum capacity of the fund in USD.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </div>
              <Input
                id="maxCapacity"
                value={maxCapacity}
                onChange={(e) =>
                  setMaxCapacity(e.target.value.replace(/\D/g, ""))
                }
                className={`pl-6 ${errors.maxCapacity ? "border-red-500" : ""}`}
                placeholder="50000000"
              />
            </div>
            {errors.maxCapacity && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.maxCapacity}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Current capacity: {formatCurrency(maxCapacity)}
            </p>
          </div>
        </div>

        <Separator />

        {/* Rule Behavior */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Rule Behavior</h3>
          <div className="bg-blue-50 p-3 rounded-md space-y-2 text-sm text-blue-800">
            <p>
              This rule establishes a tokenized fund with the following parameters:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                {fundType ? `Fund type: ${fundType}` : "Fund type: Not specified"}
              </li>
              <li>
                {minInvestment
                  ? `Minimum investment: ${minInvestment}`
                  : "No minimum investment specified"}
              </li>
              <li>
                {maxInvestors
                  ? `Maximum number of investors: ${maxInvestors}`
                  : "No maximum investor limit"}
              </li>
              <li>
                {redemptionFrequency
                  ? `Redemption frequency: ${redemptionFrequency}`
                  : "Redemption frequency not specified"}
              </li>
            </ul>
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

export default TokenizedFundRule;
