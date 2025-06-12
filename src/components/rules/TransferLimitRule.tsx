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

interface TransferLimitRuleProps {
  onSave?: (ruleData: any) => void;
  initialData?: any;
}

const TransferLimitRule = ({
  onSave = () => {},
  initialData,
}: TransferLimitRuleProps) => {
  const [transferAmount, setTransferAmount] = useState<string>(
    initialData?.transferAmount || "",
  );
  const [currency, setCurrency] = useState<string>(initialData?.currency || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Initialize form data from initialData
  useEffect(() => {
    if (initialData) {
      setTransferAmount(initialData.transferAmount || "");
      setCurrency(initialData.currency || "");
    }
  }, [initialData]);

  // Validate form on input changes
  useEffect(() => {
    validateForm();
  }, [transferAmount, currency]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let valid = true;

    // Transfer Amount validation
    if (!transferAmount) {
      newErrors.transferAmount = "Transfer amount is required";
      valid = false;
    } else if (isNaN(Number(transferAmount)) || Number(transferAmount) <= 0) {
      newErrors.transferAmount = "Transfer amount must be a positive number";
      valid = false;
    }

    // Currency validation
    if (!currency) {
      newErrors.currency = "Currency is required";
      valid = false;
    }

    setErrors(newErrors);
    setIsFormValid(valid);
    return valid;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        type: "transfer_limit",
        transferAmount,
        currency,
        description: `Maximum transfer amount of ${transferAmount} ${currency} per transaction`,
        conditions: [{
          field: "amount",
          operator: "greater_than",
          value: transferAmount
        }],
        actions: [{
          type: "block_transaction",
          params: {
            reason: `Transfer amount exceeds limit of ${transferAmount} ${currency}`
          }
        }]
      });
    }
  };

  return (
    <Card className="w-full bg-white border-blue-200">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg font-medium flex items-center">
          Transfer Limit
          <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-200">
            Transaction Rule
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {/* Transfer Amount */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="transferAmount" className="text-sm font-medium">
              Transfer Amount
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
                    The maximum amount that can be transferred in a single
                    transaction.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="transferAmount"
                type="number"
                placeholder="e.g., 10000"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className={errors.transferAmount ? "border-red-500" : ""}
              />
              {errors.transferAmount && (
                <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.transferAmount}
                </p>
              )}
            </div>

            {/* Currency */}
            <div className="w-[120px]">
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger
                  className={errors.currency ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
              {errors.currency && (
                <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.currency}
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Rule Behavior */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Rule Behavior</h3>
          <div className="bg-blue-50 p-3 rounded-md space-y-2 text-sm text-blue-800">
            <p>
              This rule enforces a maximum transfer amount of{" "}
              {transferAmount || "[amount]"} {currency || "tokens"} per transaction.
            </p>
            <p>
              {transferAmount
                ? "This limit applies to all transfers."
                : "This limit applies only to specific transfer types."}
            </p>
            <p className="text-xs text-blue-600">
              Note: Transfers exceeding this limit will be automatically rejected.
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

export default TransferLimitRule;
