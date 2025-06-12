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
  Upload,
  DollarSign,
  Users,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

interface AccreditedInvestorRuleProps {
  onSave?: (ruleData: any) => void;
  initialData?: any;
}

const AccreditedInvestorRule = ({
  onSave = () => {},
  initialData,
}: AccreditedInvestorRuleProps) => {
  const [netWorthThreshold, setNetWorthThreshold] = useState<string>(
    initialData?.netWorthThreshold || "1000000",
  );
  const [individualIncomeThreshold, setIndividualIncomeThreshold] =
    useState<string>(initialData?.individualIncomeThreshold || "200000");
  const [combinedIncomeThreshold, setCombinedIncomeThreshold] =
    useState<string>(initialData?.combinedIncomeThreshold || "300000");
  const [verificationMethod, setVerificationMethod] = useState<string>(
    initialData?.verificationMethod || "automatic",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Validate form on input changes
  useEffect(() => {
    validateForm();
  }, [
    netWorthThreshold,
    individualIncomeThreshold,
    combinedIncomeThreshold,
    verificationMethod,
  ]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let valid = true;

    // Net Worth validation
    if (!netWorthThreshold || parseInt(netWorthThreshold) <= 0) {
      newErrors.netWorthThreshold =
        "Net worth threshold must be greater than zero";
      valid = false;
    }

    // Individual Income validation
    if (
      !individualIncomeThreshold ||
      parseInt(individualIncomeThreshold) <= 0
    ) {
      newErrors.individualIncomeThreshold =
        "Individual income threshold must be greater than zero";
      valid = false;
    }

    // Combined Income validation
    if (!combinedIncomeThreshold || parseInt(combinedIncomeThreshold) <= 0) {
      newErrors.combinedIncomeThreshold =
        "Combined income threshold must be greater than zero";
      valid = false;
    }

    setErrors(newErrors);
    setIsFormValid(valid);
    return valid;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        type: "accredited_investor",
        netWorthThreshold,
        individualIncomeThreshold,
        combinedIncomeThreshold,
        verificationRequired: verificationMethod === "automatic",
        description: `Accredited investor verification with minimum net worth ${netWorthThreshold} USD`,
        conditions: [{
          field: "net_worth",
          operator: "less_than",
          value: netWorthThreshold,
          currency: "USD"
        }],
        actions: [{
          type: "block_transaction",
          params: {
            reason: `Investor does not meet accreditation requirements (minimum net worth: ${netWorthThreshold} USD)`
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
    <Card className="w-full bg-white border-green-200">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg font-medium flex items-center">
          Accredited Investor Verification Rule
          <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">
            Compliance Rule
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {/* Net Worth Threshold */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="netWorthThreshold" className="text-sm font-medium">
              Net Worth Threshold (USD)
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
                    Minimum net worth required to qualify as an accredited
                    investor. Standard is $1,000,000 USD.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              id="netWorthThreshold"
              value={netWorthThreshold}
              onChange={(e) =>
                setNetWorthThreshold(e.target.value.replace(/\D/g, ""))
              }
              className={`pl-10 ${errors.netWorthThreshold ? "border-red-500" : ""}`}
              placeholder="1000000"
            />
          </div>
          {errors.netWorthThreshold && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" />
              {errors.netWorthThreshold}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Current threshold: {formatCurrency(netWorthThreshold)}
          </p>
        </div>

        {/* Individual Income Threshold */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="individualIncomeThreshold"
              className="text-sm font-medium"
            >
              Individual Income Threshold (USD)
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
                    Minimum individual income for the last two years required to
                    qualify. Standard is $200,000 USD.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              id="individualIncomeThreshold"
              value={individualIncomeThreshold}
              onChange={(e) =>
                setIndividualIncomeThreshold(e.target.value.replace(/\D/g, ""))
              }
              className={`pl-10 ${errors.individualIncomeThreshold ? "border-red-500" : ""}`}
              placeholder="200000"
            />
          </div>
          {errors.individualIncomeThreshold && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" />
              {errors.individualIncomeThreshold}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Current threshold: {formatCurrency(individualIncomeThreshold)} for
            the last two years
          </p>
        </div>

        {/* Combined Income Threshold */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="combinedIncomeThreshold"
              className="text-sm font-medium"
            >
              Combined Income with Spouse Threshold (USD)
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
                    Minimum combined income with spouse for the last two years.
                    Standard is $300,000 USD.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              id="combinedIncomeThreshold"
              value={combinedIncomeThreshold}
              onChange={(e) =>
                setCombinedIncomeThreshold(e.target.value.replace(/\D/g, ""))
              }
              className={`pl-10 ${errors.combinedIncomeThreshold ? "border-red-500" : ""}`}
              placeholder="300000"
            />
          </div>
          {errors.combinedIncomeThreshold && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" />
              {errors.combinedIncomeThreshold}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Current threshold: {formatCurrency(combinedIncomeThreshold)} for the
            last two years
          </p>
        </div>

        {/* Verification Method */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Verification Method</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Info className="h-4 w-4 text-gray-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">
                    Choose whether verification is done automatically or
                    manually by compliance officers.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <RadioGroup
            value={verificationMethod}
            onValueChange={setVerificationMethod}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="automatic" id="method-automatic" />
              <Label htmlFor="method-automatic">
                Auto-verification with document upload
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="manual" id="method-manual" />
              <Label htmlFor="method-manual">Manual Review by Compliance</Label>
            </div>
          </RadioGroup>
          {verificationMethod === "automatic" && (
            <div className="bg-blue-50 p-3 rounded-md text-xs text-blue-800 mt-2">
              <p>
                Automatic verification will be performed when investors upload
                sufficient documentation.
              </p>
            </div>
          )}
          {verificationMethod === "manual" && (
            <div className="bg-amber-50 p-3 rounded-md text-xs text-amber-800 mt-2">
              <p>
                Manual verification requires review by compliance officers and
                may take 1-2 business days.
              </p>
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-3 rounded-md mt-2">
          <div className="flex items-center">
            <Upload className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">
              Document upload required for verification
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Investors must upload documentation proving they meet either the net
            worth or income criteria.
          </p>
        </div>

        <Separator />

        {/* Rule Behavior */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Rule Behavior</h3>
          <div className="bg-blue-50 p-3 rounded-md space-y-2 text-sm text-blue-800">
            <p>
              This rule enforces accredited investor verification requirements
              based on {verificationMethod === "automatic" ? "automatic" : "manual"} verification.
            </p>
            <p>
              Investors must meet
              {verificationMethod === "automatic" ? (
                ` net worth threshold of ${formatCurrency(netWorthThreshold)}`
              ) : (
                <>
                  {individualIncomeThreshold && ` income threshold of ${formatCurrency(individualIncomeThreshold)} for the last two years`}
                  {individualIncomeThreshold && combinedIncomeThreshold && " or "}
                  {combinedIncomeThreshold && ` combined income with spouse threshold of ${formatCurrency(combinedIncomeThreshold)} for the last two years`}
                </>
              )}
            </p>
            <p>
              Investors are required to submit{" "}
              {verificationMethod === "automatic" ? (
                "supporting documentation"
              ) : (
                <>
                  {individualIncomeThreshold && "individual income documentation"}
                  {individualIncomeThreshold && combinedIncomeThreshold && " and "}
                  {combinedIncomeThreshold && "combined income with spouse documentation"}
                </>
              )}
              for verification.
            </p>
            <p className="text-xs text-blue-600">
              Note: Investments will be blocked until verification is complete.
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
                <p>"Threshold not set." – Define at least one criterion.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-700">Execution:</p>
                <p>"Accreditation check failed." – Participation blocked.</p>
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
              Please set valid thresholds for all criteria.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AccreditedInvestorRule;
