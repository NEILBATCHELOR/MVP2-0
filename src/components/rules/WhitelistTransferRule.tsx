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
import { Info, AlertCircle, Check, Plus, Trash2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";

interface WhitelistTransferRuleProps {
  onSave?: (ruleData: any) => void;
  initialData?: any;
}

const WhitelistTransferRule = ({
  onSave = () => {},
  initialData,
}: WhitelistTransferRuleProps) => {
  const [addresses, setAddresses] = useState<string[]>(
    initialData?.addresses || [],
  );
  const [newAddress, setNewAddress] = useState<string>("");
  const [restrictEnabled, setRestrictEnabled] = useState<boolean>(
    initialData?.restrictEnabled !== undefined
      ? initialData.restrictEnabled
      : true,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Validate form on input changes
  useEffect(() => {
    validateForm();
  }, [addresses]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let valid = true;

    // Addresses validation
    if (addresses.length === 0) {
      newErrors.addresses = "At least one address is required";
      valid = false;
    }

    setErrors(newErrors);
    setIsFormValid(valid);
    return valid;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        type: "whitelist_transfer",
        addresses,
        restrictEnabled,
        description: `Whitelist transfer rule for ${addresses.length} addresses`,
        conditions: [{
          field: "address",
          operator: "in_list",
          value: addresses
        }],
        actions: [{
          type: "block_transaction",
          params: {
            reason: "Transfer address not in whitelist"
          }
        }]
      });
    }
  };

  const addAddress = () => {
    if (newAddress.trim() && !addresses.includes(newAddress.trim())) {
      setAddresses([...addresses, newAddress.trim()]);
      setNewAddress("");
    }
  };

  const removeAddress = (address: string) => {
    setAddresses(addresses.filter((a) => a !== address));
  };

  const handleBulkAddresses = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (!text.trim()) return;

    // Split by commas, newlines, or spaces and filter out empty strings
    const newAddresses = text
      .split(/[,\n\s]+/)
      .map((a) => a.trim())
      .filter((a) => a && !addresses.includes(a));

    if (newAddresses.length > 0) {
      setAddresses([...addresses, ...newAddresses]);
      e.target.value = "";
    }
  };

  return (
    <Card className="w-full bg-white border-green-200">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg font-medium flex items-center">
          Whitelist Transfer
          <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">
            Transfer Restriction
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {/* Restriction Mode */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Restriction Mode</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Info className="h-4 w-4 text-gray-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">
                    Choose whether to enforce restrictions or just monitor
                    transfers to non-whitelisted addresses.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="restrictEnabled"
              checked={restrictEnabled}
              onCheckedChange={setRestrictEnabled}
            />
            <Label htmlFor="restrictEnabled">
              {restrictEnabled
                ? "Restrict transfers to whitelisted addresses only"
                : "Monitor transfers to non-whitelisted addresses"}
            </Label>
          </div>
          <p className="text-xs text-gray-500">
            {restrictEnabled
              ? "Transfers to addresses not on the whitelist will be blocked."
              : "Transfers to non-whitelisted addresses will be allowed but flagged for review."}
          </p>
        </div>

        {/* Add Address */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="newAddress" className="text-sm font-medium">
              Add Address
            </Label>
          </div>
          <div className="flex gap-2">
            <Input
              id="newAddress"
              placeholder="Enter wallet address"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={addAddress}
              disabled={!newAddress.trim()}
              variant="outline"
              className="shrink-0"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Bulk Add */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="bulkAddresses" className="text-sm font-medium">
              Bulk Add Addresses
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
                    Paste multiple addresses separated by commas, spaces, or new
                    lines.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Textarea
            id="bulkAddresses"
            placeholder="Paste multiple addresses here..."
            className="h-20"
            onBlur={handleBulkAddresses}
          />
        </div>

        {/* Whitelist Addresses */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Whitelisted Addresses ({addresses.length})
            </Label>
          </div>
          {addresses.length > 0 ? (
            <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
              {addresses.map((address, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                >
                  <span className="text-sm font-mono truncate">{address}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAddress(address)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 border rounded-md text-gray-500">
              No addresses added to whitelist yet
            </div>
          )}
          {errors.addresses && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" />
              {errors.addresses}
            </p>
          )}
        </div>

        <Separator />

        {/* Rule Behavior */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Rule Behavior</h3>
          <div className="bg-green-50 p-3 rounded-md space-y-2 text-sm text-green-800">
            <p>
              This rule {restrictEnabled ? "restricts" : "monitors"} transfers
              to{" "}
              {addresses.length > 0
                ? `${addresses.length} whitelisted addresses`
                : "whitelisted addresses (none added yet)"}
              .
            </p>
            <p>
              {restrictEnabled
                ? "Transfers to non-whitelisted addresses will be blocked."
                : "Transfers to non-whitelisted addresses will be allowed but flagged for review."}
            </p>
            <p className="text-xs text-green-600">
              Note: Whitelist can be updated at any time by authorized
              personnel.
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

export default WhitelistTransferRule;
