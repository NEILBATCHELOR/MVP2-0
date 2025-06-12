import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
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
import { Info, AlertCircle, Check, Shield } from "lucide-react";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Slider } from "../ui/slider";

interface AMLSanctionsRuleProps {
  onSave?: (ruleData: any) => void;
  initialData?: any;
}

const AMLSanctionsRule = ({
  onSave = () => {},
  initialData,
}: AMLSanctionsRuleProps) => {
  const [sanctionsListSource, setSanctionsListSource] = useState<string>(
    initialData?.sanctionsListSource || "",
  );
  const [checkFrequency, setCheckFrequency] = useState<number>(
    initialData?.checkFrequency || 1,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [selectedLists, setSelectedLists] = useState<string[]>(
    initialData?.selectedLists || []
  );

  // Validate form on input changes
  useEffect(() => {
    validateForm();
  }, [sanctionsListSource, checkFrequency]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let valid = true;

    // Sanctions List Source validation
    if (!sanctionsListSource) {
      newErrors.sanctionsListSource = "Sanctions list source is required";
      valid = false;
    }

    setErrors(newErrors);
    setIsFormValid(valid);
    return valid;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        type: "aml_sanctions",
        sanctionsListSource,
        checkFrequency,
        selectedLists,
        description: `AML sanctions check using ${sanctionsListSource.replace("_", " ").toUpperCase()} at ${getFrequencyLabel(checkFrequency).toLowerCase()} frequency`,
        conditions: [{
          field: "sanctions_check",
          operator: "in_list",
          value: selectedLists
        }],
        actions: [{
          type: "block_transaction",
          params: {
            reason: "Failed AML sanctions check"
          }
        }]
      });
    }
  };

  const getFrequencyLabel = (value: number) => {
    switch (value) {
      case 1:
        return "Daily";
      case 2:
        return "Every 2 days";
      case 3:
        return "Every 3 days";
      case 4:
        return "Every 4 days";
      case 5:
        return "Every 5 days";
      case 6:
        return "Every 6 days";
      case 7:
        return "Weekly";
      default:
        return `Every ${value} days`;
    }
  };

  return (
    <Card className="w-full bg-white border-red-200">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg font-medium flex items-center">
          AML Sanctions Check Rule
          <Badge className="ml-2 bg-red-100 text-red-800 border-red-200">
            Compliance Rule
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {/* Sanctions List Source */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="sanctionsListSource"
              className="text-sm font-medium"
            >
              Sanctions List Source
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
                    Select the sanctions list to check against for blocked
                    transactions.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select
            value={sanctionsListSource}
            onValueChange={setSanctionsListSource}
          >
            <SelectTrigger
              className={errors.sanctionsListSource ? "border-red-500" : ""}
            >
              <SelectValue placeholder="Select sanctions list source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ofac">OFAC (US Treasury)</SelectItem>
              <SelectItem value="eu_sanctions">EU Sanctions List</SelectItem>
              <SelectItem value="un_sanctions">UN Sanctions List</SelectItem>
              <SelectItem value="uk_sanctions">UK Sanctions List</SelectItem>
              <SelectItem value="consolidated">
                Consolidated Global List
              </SelectItem>
            </SelectContent>
          </Select>
          {errors.sanctionsListSource && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" />
              {errors.sanctionsListSource}
            </p>
          )}
        </div>

        {/* Check Frequency */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Check Frequency</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Info className="h-4 w-4 text-gray-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">
                    How often to check transactions against the sanctions list.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="space-y-4">
            <Slider
              defaultValue={[checkFrequency]}
              max={7}
              min={1}
              step={1}
              onValueChange={(value) => setCheckFrequency(value[0])}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Daily</span>
              <span>Weekly</span>
            </div>
            <div className="text-center font-medium">
              {getFrequencyLabel(checkFrequency)}
            </div>
          </div>
        </div>

        <Separator />

        {/* Rule Behavior */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Rule Behavior</h3>
          <div className="bg-red-50 p-3 rounded-md space-y-2 text-sm text-red-800">
            <p>
              This rule blocks transactions to sanctioned regions or entities on
              the{" "}
              {sanctionsListSource
                ? sanctionsListSource.replace("_", " ").toUpperCase()
                : "selected"}{" "}
              sanctions list.
            </p>
            <p>
              Checks are performed{" "}
              {getFrequencyLabel(checkFrequency).toLowerCase()} and on all
              transactions.
            </p>
            <p className="text-xs text-red-600">
              Note: Transactions involving sanctioned entities will be
              automatically blocked.
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
              Please select a sanctions list source to save this rule.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AMLSanctionsRule;
