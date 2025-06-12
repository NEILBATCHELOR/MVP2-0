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
  Calendar,
  Lock,
  BarChart,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface IntervalFundRedemptionRuleProps {
  onSave?: (ruleData: any) => void;
  initialData?: any;
}

const IntervalFundRedemptionRule = ({
  onSave = () => {},
  initialData,
}: IntervalFundRedemptionRuleProps) => {
  const [repurchaseFrequency, setRepurchaseFrequency] = useState<string>(
    initialData?.repurchaseFrequency || "quarterly",
  );
  const [lockUpPeriod, setLockUpPeriod] = useState<number>(
    initialData?.lockUpPeriod || 90,
  );
  const [submissionWindowDays, setSubmissionWindowDays] = useState<number>(
    initialData?.submissionWindowDays || 14,
  );
  const [lockTokensOnRequest, setLockTokensOnRequest] = useState<boolean>(
    initialData?.lockTokensOnRequest !== false,
  );
  const [useWindowNAV, setUseWindowNAV] = useState<boolean>(
    initialData?.useWindowNAV !== false,
  );
  const [enableProRataDistribution, setEnableProRataDistribution] =
    useState<boolean>(initialData?.enableProRataDistribution !== false);
  const [queueUnprocessedRequests, setQueueUnprocessedRequests] =
    useState<boolean>(initialData?.queueUnprocessedRequests !== false);
  const [enableAdminOverride, setEnableAdminOverride] = useState<boolean>(
    initialData?.enableAdminOverride !== false,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(true);

  // Validate form on input changes
  useEffect(() => {
    validateForm();
  }, [
    repurchaseFrequency,
    lockUpPeriod,
    submissionWindowDays,
    lockTokensOnRequest,
    useWindowNAV,
    enableProRataDistribution,
    queueUnprocessedRequests,
    enableAdminOverride,
  ]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let valid = true;

    if (lockUpPeriod < 0) {
      newErrors.lockUpPeriod = "Lock-up period cannot be negative";
      valid = false;
    }

    if (submissionWindowDays <= 0) {
      newErrors.submissionWindowDays =
        "Submission window must be greater than zero days";
      valid = false;
    }

    setErrors(newErrors);
    setIsFormValid(valid);
    return valid;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        type: "interval_fund_redemption",
        repurchaseFrequency,
        lockUpPeriod,
        submissionWindowDays,
        lockTokensOnRequest,
        useWindowNAV,
        enableProRataDistribution,
        queueUnprocessedRequests,
        enableAdminOverride,
        repurchaseLimit: initialData?.repurchaseLimit || 0,
        description: `Interval fund redemption with ${repurchaseFrequency} frequency and ${submissionWindowDays} day window`,
        conditions: [{
          field: "redemption_request",
          operator: "validate",
          value: {
            type: "interval",
            frequency: repurchaseFrequency,
            lockupPeriod: lockUpPeriod,
            submissionWindow: submissionWindowDays,
            lockTokens: lockTokensOnRequest,
            useWindowNAV: useWindowNAV,
            proRataDistribution: enableProRataDistribution,
            queueUnprocessed: queueUnprocessedRequests,
            adminOverride: enableAdminOverride
          }
        }],
        actions: [{
          type: "block_transaction",
          params: {
            reason: "Redemption request does not meet interval fund requirements"
          }
        }]
      });
    }
  };

  return (
    <Card className="w-full bg-white border-purple-200">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg font-medium flex items-center">
          Interval Fund Repurchase Rule
          <Badge className="ml-2 bg-purple-100 text-purple-800 border-purple-200">
            Periodic Liquidity
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {/* Repurchase Frequency */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="repurchaseFrequency"
              className="text-sm font-medium"
            >
              Repurchase Frequency
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
                    How often the fund offers repurchase opportunities to
                    investors.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select
            value={repurchaseFrequency}
            onValueChange={setRepurchaseFrequency}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select repurchase frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="semi_annually">Semi-Annually</SelectItem>
              <SelectItem value="annually">Annually</SelectItem>
            </SelectContent>
          </Select>
          <div className="bg-purple-50 p-3 rounded-md text-xs text-purple-800 mt-2">
            <p>
              Redemptions can only be requested and processed during{" "}
              {repurchaseFrequency} repurchase windows.
            </p>
          </div>
        </div>

        {/* Lock-Up Period */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="lockUpPeriod" className="text-sm font-medium">
              Lock-Up Period (Days)
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
                    Number of days tokens must be held before they can be
                    redeemed.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="lockUpPeriod"
            type="number"
            min="0"
            value={lockUpPeriod}
            onChange={(e) => setLockUpPeriod(parseInt(e.target.value) || 0)}
            className={errors.lockUpPeriod ? "border-red-500" : ""}
          />
          {errors.lockUpPeriod && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" />
              {errors.lockUpPeriod}
            </p>
          )}
          <div className="bg-purple-50 p-3 rounded-md text-xs text-purple-800 mt-2">
            <p>
              Tokens will be locked for {lockUpPeriod} days after purchase
              before they can be redeemed.
            </p>
          </div>
        </div>

        {/* Submission Window */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="submissionWindowDays"
              className="text-sm font-medium"
            >
              Submission Window (Days)
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
                    Number of days the redemption request window is open before
                    each repurchase date.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="submissionWindowDays"
            type="number"
            min="1"
            value={submissionWindowDays}
            onChange={(e) =>
              setSubmissionWindowDays(parseInt(e.target.value) || 0)
            }
            className={errors.submissionWindowDays ? "border-red-500" : ""}
          />
          {errors.submissionWindowDays && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" />
              {errors.submissionWindowDays}
            </p>
          )}
          <div className="bg-purple-50 p-3 rounded-md text-xs text-purple-800 mt-2">
            <p>
              Investors must submit redemption requests during the{" "}
              {submissionWindowDays}-day window before each repurchase date.
            </p>
          </div>
        </div>

        {/* Token Locking */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="lockTokensOnRequest"
              className="text-sm font-medium"
            >
              Token Locking on Request
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
                    Lock tokens from trading once a redemption request is
                    submitted until processed or canceled.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="lockTokensOnRequest"
              checked={lockTokensOnRequest}
              onCheckedChange={setLockTokensOnRequest}
            />
            <Label htmlFor="lockTokensOnRequest">
              {lockTokensOnRequest
                ? "Lock Tokens on Request"
                : "No Token Locking"}
            </Label>
          </div>
          {lockTokensOnRequest && (
            <div className="bg-purple-50 p-3 rounded-md text-xs text-purple-800 mt-2">
              <p>
                Once a redemption request is submitted, the specified tokens
                will be locked until the repurchase is processed or canceled.
              </p>
            </div>
          )}
        </div>

        {/* NAV Calculation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="useWindowNAV" className="text-sm font-medium">
              Window NAV Calculation
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
                    Use a single NAV calculation for all redemptions in the same
                    window.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="useWindowNAV"
              checked={useWindowNAV}
              onCheckedChange={setUseWindowNAV}
            />
            <Label htmlFor="useWindowNAV">
              {useWindowNAV ? "Use Window NAV" : "Individual NAV"}
            </Label>
          </div>
          {useWindowNAV && (
            <div className="bg-purple-50 p-3 rounded-md text-xs text-purple-800 mt-2">
              <p>
                The redemption amount will be determined using the NAV fetched
                at the time of the repurchase window, ensuring all investors in
                the same window receive the same valuation.
              </p>
            </div>
          )}
        </div>

        {/* Liquidity Constraints */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Liquidity Constraints Handling
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
                    How to handle situations when redemption requests exceed
                    available liquidity.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="enableProRataDistribution"
                checked={enableProRataDistribution}
                onCheckedChange={setEnableProRataDistribution}
              />
              <Label htmlFor="enableProRataDistribution">
                Pro-rata Distribution
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                      <Info className="h-3 w-3 text-gray-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-[200px] text-xs">
                      Each investor receives a proportional share of available
                      funds based on their request size.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="queueUnprocessedRequests"
                checked={queueUnprocessedRequests}
                onCheckedChange={setQueueUnprocessedRequests}
              />
              <Label htmlFor="queueUnprocessedRequests">
                Queue Unprocessed Requests
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                      <Info className="h-3 w-3 text-gray-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-[200px] text-xs">
                      Automatically queue unfulfilled requests for the next
                      repurchase window.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="bg-purple-50 p-3 rounded-md text-xs text-purple-800 mt-2">
            <p>
              When total redemption requests exceed available liquidity, the
              system will:
            </p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              {enableProRataDistribution && (
                <li>
                  Apply pro-rata distribution where each investor receives a
                  proportional share
                </li>
              )}
              {queueUnprocessedRequests && (
                <li>
                  Queue unfulfilled or partially fulfilled requests for the next
                  repurchase window
                </li>
              )}
              {!enableProRataDistribution && !queueUnprocessedRequests && (
                <li>
                  Reject excess requests (first-come, first-served up to
                  liquidity limit)
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Administrative Override */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="enableAdminOverride"
              className="text-sm font-medium"
            >
              Administrative Override
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
                    Allow administrators to manually review and adjust the
                    repurchase process.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="enableAdminOverride"
              checked={enableAdminOverride}
              onCheckedChange={setEnableAdminOverride}
            />
            <Label htmlFor="enableAdminOverride">
              {enableAdminOverride
                ? "Admin Override Enabled"
                : "No Admin Override"}
            </Label>
          </div>
          {enableAdminOverride && (
            <div className="bg-purple-50 p-3 rounded-md text-xs text-purple-800 mt-2">
              <p>
                Administrators will have the ability to manually review and
                adjust the repurchase process (e.g., override NAV or handle
                exceptions).
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
              This rule establishes interval-based redemption windows with the following parameters:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Redemption frequency: {repurchaseFrequency}
              </li>
              <li>
                Lock-up period: {lockUpPeriod} {lockUpPeriod === 1 ? "day" : "days"}
              </li>
              <li>
                Submission window: {submissionWindowDays} {submissionWindowDays === 1 ? "day" : "days"}
              </li>
              <li>
                Token locking: {lockTokensOnRequest ? "Yes" : "No"}
              </li>
              <li>
                NAV calculation: {useWindowNAV ? "Window" : "Individual"}
              </li>
              <li>
                Liquidity handling: {enableProRataDistribution ? "Pro-rata distribution" : queueUnprocessedRequests ? "Request queuing" : "First-come, first-served"}
              </li>
              <li>
                Administrative override: {enableAdminOverride ? "Enabled" : "Disabled"}
              </li>
            </ul>
            <p className="text-xs text-blue-600">
              Note: Redemption requests must be submitted during the submission window
              and will be processed at the end of each interval.
            </p>
          </div>
        </div>

        {/* Process Flow */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            Interval Fund Repurchase Process Flow
          </h3>
          <div className="bg-gray-50 p-3 rounded-md space-y-3 text-xs text-gray-600">
            <div className="flex items-start gap-2">
              <div className="bg-purple-100 text-purple-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium text-gray-700">Window Opening:</p>
                <p>
                  Repurchase window opens {submissionWindowDays} days before the
                  scheduled repurchase date
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="bg-purple-100 text-purple-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium text-gray-700">Request Submission:</p>
                <p>
                  Investors submit redemption requests during the open window
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="bg-purple-100 text-purple-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium text-gray-700">Token Locking:</p>
                <p>
                  {lockTokensOnRequest
                    ? "Requested tokens are locked from trading"
                    : "Tokens remain tradable until processing"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="bg-purple-100 text-purple-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                4
              </div>
              <div>
                <p className="font-medium text-gray-700">NAV Calculation:</p>
                <p>
                  {useWindowNAV
                    ? "Single NAV calculated for all redemptions in the window"
                    : "Individual NAV calculated for each redemption"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="bg-purple-100 text-purple-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                5
              </div>
              <div>
                <p className="font-medium text-gray-700">Liquidity Check:</p>
                <p>
                  System checks if total requests exceed available liquidity
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="bg-purple-100 text-purple-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                6
              </div>
              <div>
                <p className="font-medium text-gray-700">Processing:</p>
                <p>
                  {enableProRataDistribution
                    ? "Pro-rata distribution applied if needed"
                    : ""}
                  {enableProRataDistribution && queueUnprocessedRequests
                    ? ", "
                    : ""}
                  {queueUnprocessedRequests
                    ? "unfulfilled requests queued for next window"
                    : ""}
                  {!enableProRataDistribution && !queueUnprocessedRequests
                    ? "Requests processed first-come, first-served"
                    : ""}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="bg-purple-100 text-purple-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                7
              </div>
              <div>
                <p className="font-medium text-gray-700">Settlement:</p>
                <p>
                  Tokens burned and funds transferred based on calculated
                  redemption amounts
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

export default IntervalFundRedemptionRule;
