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
  Users,
  Flame,
  Wallet,
  Calendar,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import StandardRedemptionRule from "./StandardRedemptionRule";
import IntervalFundRedemptionRule from "./IntervalFundRedemptionRule";

interface RedemptionRuleProps {
  onSave?: (ruleData: any) => void;
  initialData?: any;
}

const RedemptionRule = ({
  onSave = () => {},
  initialData,
}: RedemptionRuleProps) => {
  const [activeTab, setActiveTab] = useState("general");
  const [redemptionType, setRedemptionType] = useState<string>(
    initialData?.redemptionType || "standard",
  );
  const [requireMultiSigApproval, setRequireMultiSigApproval] =
    useState<boolean>(initialData?.requireMultiSigApproval !== false);
  const [requiredApprovers, setRequiredApprovers] = useState<number>(
    initialData?.requiredApprovers || 2,
  );
  const [totalApprovers, setTotalApprovers] = useState<number>(
    initialData?.totalApprovers || 3,
  );
  const [notifyInvestors, setNotifyInvestors] = useState<boolean>(
    initialData?.notifyInvestors !== false,
  );
  const [settlementMethod, setSettlementMethod] = useState<string>(
    initialData?.settlementMethod || "stablecoin",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Added state variables for redemption rule
  const [frequency, setFrequency] = useState<number | undefined>(
    initialData?.frequency as number | undefined
  );
  const [notificationDays, setNotificationDays] = useState<number | undefined>(
    initialData?.notificationDays as number | undefined
  );
  const [maxAmount, setMaxAmount] = useState<number | undefined>(
    initialData?.maxAmount as number | undefined
  );

  // Validate form on input changes
  useEffect(() => {
    validateForm();
  }, [
    redemptionType,
    requireMultiSigApproval,
    requiredApprovers,
    totalApprovers,
    notifyInvestors,
    settlementMethod,
  ]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let valid = true;

    // Validate required approvers
    if (requireMultiSigApproval) {
      if (requiredApprovers <= 0) {
        newErrors.requiredApprovers =
          "Required approvers must be greater than zero";
        valid = false;
      }

      if (totalApprovers <= 0) {
        newErrors.totalApprovers = "Total approvers must be greater than zero";
        valid = false;
      }

      if (requiredApprovers > totalApprovers) {
        newErrors.requiredApprovers =
          "Required approvers cannot exceed total approvers";
        valid = false;
      }
    }

    setErrors(newErrors);
    setIsFormValid(valid);
    return valid;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        type: "redemption",
        redemptionType,
        notificationDays,
        frequency,
        maxAmount,
        settlementMethod,
        requireMultiSigApproval,
        requiredApprovers,
        totalApprovers,
        notifyInvestors,
        description: `Redemption rule with ${redemptionType} frequency and ${notificationDays} day notice`,
        conditions: [{
          field: "redemption_request",
          operator: "validate",
          value: {
            type: redemptionType,
            noticePeriod: Number(notificationDays),
            lockupPeriod: Number(frequency),
            minAmount: Number(maxAmount),
            maxAmount: Number(maxAmount),
            currency: settlementMethod
          }
        }],
        actions: [{
          type: "block_transaction",
          params: {
            reason: "Redemption request does not meet requirements"
          }
        }]
      });
    }
  };

  const handleSpecificRuleAdd = (ruleData: any) => {
    if (ruleData.subType === "standard" || ruleData.subType === "interval") {
      setRedemptionType(ruleData.subType);
      // Merge the specific rule data with the general settings
      onSave({
        type: "redemption",
        redemptionType: ruleData.subType,
        requireMultiSigApproval,
        requiredApprovers: requireMultiSigApproval ? requiredApprovers : 0,
        totalApprovers: requireMultiSigApproval ? totalApprovers : 0,
        notifyInvestors,
        settlementMethod,
        ...ruleData,
      });
    }
  };

  return (
    <Card className="w-full bg-white border-indigo-200">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg font-medium flex items-center">
          Redemption Rule
          <Badge className="ml-2 bg-indigo-100 text-indigo-800 border-indigo-200">
            Token Management Rule
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="standard">Standard Redemption</TabsTrigger>
            <TabsTrigger value="interval">Interval Fund</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="redemptionType" className="text-sm font-medium">
                  Redemption Type
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
                        Choose between standard redemptions (immediate
                        liquidity) or interval fund repurchases (periodic
                        liquidity).
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <RadioGroup
                value={redemptionType}
                onValueChange={(value) => {
                  setRedemptionType(value);
                  setActiveTab(value); // Switch to the corresponding tab
                }}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="standard" id="type-standard" />
                  <Label htmlFor="type-standard">
                    Standard Redemption (Immediate Liquidity)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="interval" id="type-interval" />
                  <Label htmlFor="type-interval">
                    Interval Fund Repurchase (Periodic Liquidity)
                  </Label>
                </div>
              </RadioGroup>

              <div className="bg-indigo-50 p-3 rounded-md text-xs text-indigo-800 mt-2">
                {redemptionType === "standard" ? (
                  <p>
                    Standard redemptions allow investors to cash out their
                    tokens immediately, offering flexibility and quick
                    liquidity.
                  </p>
                ) : (
                  <p>
                    Interval fund repurchases are periodic and subject to
                    additional constraints, designed to manage liquidity for
                    funds with less liquid underlying assets.
                  </p>
                )}
              </div>
            </div>
            {/* Multi-Signature Approval */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="requireMultiSigApproval"
                  className="text-sm font-medium"
                >
                  Multi-Signature Approval
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
                        Require multiple approvers to sign off on redemption
                        requests for enhanced security.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="requireMultiSigApproval"
                  checked={requireMultiSigApproval}
                  onCheckedChange={setRequireMultiSigApproval}
                />
                <Label htmlFor="requireMultiSigApproval">
                  {requireMultiSigApproval ? "Required" : "Not Required"}
                </Label>
              </div>

              {requireMultiSigApproval && (
                <div className="mt-4 space-y-4 bg-indigo-50 p-4 rounded-md">
                  <div className="space-y-2">
                    <Label
                      htmlFor="requiredApprovers"
                      className="text-sm font-medium"
                    >
                      Required Approvers
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="requiredApprovers"
                        type="number"
                        min="1"
                        max={totalApprovers}
                        value={requiredApprovers}
                        onChange={(e) =>
                          setRequiredApprovers(parseInt(e.target.value) || 0)
                        }
                        className={`w-20 ${errors.requiredApprovers ? "border-red-500" : ""}`}
                      />
                      <span className="text-sm text-gray-500">out of</span>
                      <Input
                        id="totalApprovers"
                        type="number"
                        min={requiredApprovers}
                        value={totalApprovers}
                        onChange={(e) =>
                          setTotalApprovers(parseInt(e.target.value) || 0)
                        }
                        className={`w-20 ${errors.totalApprovers ? "border-red-500" : ""}`}
                      />
                      <span className="text-sm text-gray-500">approvers</span>
                    </div>
                    {errors.requiredApprovers && (
                      <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.requiredApprovers}
                      </p>
                    )}
                    {errors.totalApprovers && (
                      <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.totalApprovers}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-indigo-700">
                    Redemption requests will require {requiredApprovers} out of{" "}
                    {totalApprovers} approvers to sign off before execution.
                  </p>
                </div>
              )}
            </div>

            {/* Settlement Method */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Settlement Method</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Info className="h-4 w-4 text-gray-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-[200px] text-xs">
                        Choose how investors will receive funds after
                        redemption.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <RadioGroup
                value={settlementMethod}
                onValueChange={setSettlementMethod}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="stablecoin" id="method-stablecoin" />
                  <Label htmlFor="method-stablecoin">Stablecoin Transfer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fiat" id="method-fiat" />
                  <Label htmlFor="method-fiat">Fiat Bank Transfer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hybrid" id="method-hybrid" />
                  <Label htmlFor="method-hybrid">
                    Hybrid (Investor Choice)
                  </Label>
                </div>
              </RadioGroup>
              {settlementMethod === "stablecoin" && (
                <div className="bg-blue-50 p-3 rounded-md text-xs text-blue-800 mt-2">
                  <p>
                    Redemption proceeds will be transferred as stablecoins to
                    the investor's registered wallet address.
                  </p>
                </div>
              )}
              {settlementMethod === "fiat" && (
                <div className="bg-green-50 p-3 rounded-md text-xs text-green-800 mt-2">
                  <p>
                    Redemption proceeds will be transferred as fiat currency to
                    the investor's registered bank account.
                  </p>
                </div>
              )}
              {settlementMethod === "hybrid" && (
                <div className="bg-purple-50 p-3 rounded-md text-xs text-purple-800 mt-2">
                  <p>
                    Investors can choose between stablecoin or fiat settlement
                    for each redemption request.
                  </p>
                </div>
              )}
            </div>

            {/* Investor Notifications */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="notifyInvestors"
                  className="text-sm font-medium"
                >
                  Investor Notifications
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
                        Send real-time notifications to investors at each stage
                        of the redemption process.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="notifyInvestors"
                  checked={notifyInvestors}
                  onCheckedChange={setNotifyInvestors}
                />
                <Label htmlFor="notifyInvestors">
                  {notifyInvestors ? "Enabled" : "Disabled"}
                </Label>
              </div>
              {notifyInvestors && (
                <div className="bg-gray-50 p-3 rounded-md mt-2">
                  <p className="text-xs text-gray-600">
                    Investors will receive notifications at the following
                    stages: submission, approval, execution, and settlement.
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
                  This rule establishes redemption windows every{" "}
                  {frequency ? frequency : "[frequency]"} months with a{" "}
                  {notificationDays ? notificationDays : "[X]"} day notification
                  period.
                </p>
                <p>
                  {maxAmount
                    ? `Maximum redemption amount per window: ${maxAmount}%`
                    : "No maximum redemption limit set."}
                </p>
                <p className="text-xs text-blue-600">
                  Note: Redemption requests must be submitted during the notification
                  period and will be processed at the next window.
                </p>
              </div>
            </div>

            {/* Process Flow */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Redemption Process Flow</h3>
              <div className="bg-gray-50 p-3 rounded-md space-y-3 text-xs text-gray-600">
                <div className="flex items-start gap-2">
                  <div className="bg-indigo-100 text-indigo-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Submission:</p>
                    <p>
                      Investor submits redemption request specifying token
                      amount
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="bg-indigo-100 text-indigo-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Verification:</p>
                    <p>
                      System verifies token ownership and compliance
                      requirements
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="bg-indigo-100 text-indigo-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Approval:</p>
                    <p>
                      {requireMultiSigApproval
                        ? `${requiredApprovers}/${totalApprovers} approvers sign off on the request`
                        : "Automatic approval if verification passes"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="bg-indigo-100 text-indigo-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Execution:</p>
                    <p>Tokens are burned and cap table is updated</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="bg-indigo-100 text-indigo-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    5
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Settlement:</p>
                    <p>
                      Funds transferred to investor via{" "}
                      {settlementMethod === "stablecoin"
                        ? "stablecoin"
                        : settlementMethod === "fiat"
                          ? "fiat bank transfer"
                          : "chosen method"}
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
          </TabsContent>

          <TabsContent value="standard">
            <StandardRedemptionRule onSave={handleSpecificRuleAdd} />
          </TabsContent>

          <TabsContent value="interval">
            <IntervalFundRedemptionRule onSave={handleSpecificRuleAdd} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RedemptionRule;
