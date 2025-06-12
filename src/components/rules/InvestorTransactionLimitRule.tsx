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
import { getAllInvestorTypes } from "@/utils/compliance/investorTypes";

interface InvestorType {
  id: string;
  name: string;
}

interface InvestorTransactionLimitRuleProps {
  onSave?: (ruleData: any) => void;
  initialData?: any;
}

const InvestorTransactionLimitRule = ({
  onSave = () => {},
  initialData,
}: InvestorTransactionLimitRuleProps) => {
  const [limitAmount, setLimitAmount] = useState<string>(initialData?.limitAmount || "");
  const [unit, setUnit] = useState<string>(initialData?.unit || "");
  const [transactionType, setTransactionType] = useState<string>(initialData?.transactionType || "");
  const [selectedInvestorTypes, setSelectedInvestorTypes] = useState<string[]>(
    initialData?.selectedInvestorTypes || [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Initialize form data from initialData
  useEffect(() => {
    if (initialData) {
      setLimitAmount(initialData.limitAmount || "");
      setUnit(initialData.unit || "");
      setTransactionType(initialData.transactionType || "");
    }
  }, [initialData]);

  // Validate form on input changes
  useEffect(() => {
    validateForm();
  }, [limitAmount, unit, transactionType]);

  // Available investor types
  const investorTypes = getAllInvestorTypes();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let valid = true;

    // Transaction Type validation
    if (!transactionType) {
      newErrors.transactionType = "Transaction type is required";
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

    // Unit validation
    if (!unit) {
      newErrors.unit = "Unit is required";
      valid = false;
    }

    setErrors(newErrors);
    setIsFormValid(valid);
    return valid;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        type: "investor_transaction_limit",
        transactionType,
        limitAmount,
        unit,
        selectedInvestorTypes,
        description: `Maximum transaction amount of ${limitAmount} ${unit} per investor`,
        conditions: [{
          field: "investor_transaction_amount",
          operator: "greater_than",
          value: limitAmount
        }],
        actions: [{
          type: "block_transaction",
          params: {
            reason: `Transaction amount exceeds investor limit of ${limitAmount} ${unit}`
          }
        }]
      });
    }
  };

  const toggleInvestorType = (typeId: string) => {
    setSelectedInvestorTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId],
    );
  };

  return (
    <Card className="w-full bg-white border-blue-200">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg font-medium flex items-center">
          Investor Transaction Limits
          <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-200">
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

        {/* Limit Amount */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="limitAmount" className="text-sm font-medium">
              Limit Amount
            </Label>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="limitAmount"
                type="number"
                placeholder="e.g., 1000"
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

            {/* Unit */}
            <div className="w-[120px]">
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className={errors.unit ? "border-red-500" : ""}>
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tokens">Tokens</SelectItem>
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="eur">EUR</SelectItem>
                  <SelectItem value="gbp">GBP</SelectItem>
                </SelectContent>
              </Select>
              {errors.unit && (
                <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.unit}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Investor Types */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Investor Types (Optional)
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
                    Apply this limit to specific investor types (leave blank for all).
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="max-h-40 overflow-y-auto border rounded-md p-2">
            <div className="grid grid-cols-2 gap-2">
              {investorTypes.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox" 
                    id={`type-${type.id}`}
                    checked={selectedInvestorTypes.includes(type.id)}
                    onChange={() => toggleInvestorType(type.id)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor={`type-${type.id}`} className="text-sm">
                    {type.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {selectedInvestorTypes.length === 0
              ? "No investor types selected. Rule will apply to all investors."
              : `Rule will apply to ${selectedInvestorTypes.length} selected investor type(s).`}
          </p>
        </div>

        <Separator />

        {/* Rule Behavior */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Rule Behavior</h3>
          <div className="bg-blue-50 p-3 rounded-md space-y-2 text-sm text-blue-800">
            <p>
              This rule limits {transactionType} transactions to {limitAmount}{" "}
              {unit.toUpperCase()} per investor.
            </p>
            <p>
              {selectedInvestorTypes.length > 0
                ? `This limit applies specifically to ${selectedInvestorTypes.length} selected investor type(s).`
                : "This limit applies to all investors."}
            </p>
            <p className="text-xs text-blue-600">
              Note: Transactions exceeding this limit will be automatically rejected.
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

export default InvestorTransactionLimitRule;
