import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ERC4626Config } from "../../types";

// Define the props interface based on the main types
interface ERC4626SimpleConfigProps {
  tokenForm: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setTokenForm: React.Dispatch<React.SetStateAction<any>>;
  onConfigChange?: (config: any) => void;
  initialConfig?: Partial<ERC4626Config>;
}

/**
 * Simple configuration component for ERC4626 (Tokenized Vault) tokens
 * Focuses on the core features needed to deploy an ERC-4626 vault
 */
const ERC4626SimpleConfig: React.FC<ERC4626SimpleConfigProps> = ({ 
  tokenForm,
  handleInputChange,
  setTokenForm,
  onConfigChange,
  initialConfig = {} 
}) => {
  // If onConfigChange is provided, we'll use internal state for backward compatibility
  const [config, setConfig] = useState({
    name: initialConfig.name || "",
    symbol: initialConfig.symbol || "",
    description: initialConfig.description || "",
    decimals: initialConfig.decimals ?? 18,
    assetAddress: initialConfig.assetAddress || "",
    assetDecimals: initialConfig.assetDecimals ?? 18,
    fee: initialConfig.fee ?? { enabled: false },
    minDepositAmount: initialConfig.minDeposit || "",
    maxDepositAmount: initialConfig.maxDeposit || "",
    // Also set the alternate property names for consistency
    minDeposit: initialConfig.minDeposit || "",
    maxDeposit: initialConfig.maxDeposit || "",
    pausable: initialConfig.pausable ?? false
  });

  // Track what actual values to display in the UI
  // This handles the dual source of truth (internal config and tokenForm)
  const displayValues = onConfigChange ? config : tokenForm;

  // Handle fields directly using handleInputChange if provided
  const updateField = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (handleInputChange) {
      handleInputChange(e);
    } else {
      const { name, value, type, checked } = e.target;
      const fieldValue = type === 'checkbox' ? checked : value;
      setConfig((prev) => ({
        ...prev,
        [name]: fieldValue
      }));
    }
  };

  // Handle fee toggle
  const handleFeeToggle = (enabled: boolean) => {
    const updatedFee = { 
      ...(displayValues.fee || {}),
      enabled 
    };
    
    if (setTokenForm) {
      setTokenForm(prev => ({
        ...prev,
        fee: updatedFee
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        fee: updatedFee
      }));
    }
  };

  // Handle fee value changes
  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const feeField = name.split('.')[1]; // Extract the fee field name (managementFee, etc.)
    
    const updatedFee = { 
      ...(displayValues.fee || { enabled: true }),
      [feeField]: value 
    };
    
    if (setTokenForm) {
      setTokenForm(prev => ({
        ...prev,
        fee: updatedFee
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        fee: updatedFee
      }));
    }
  };

  // Update parent when config changes
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange(config);
    }
  }, [config, onConfigChange]);

  // Update local state when tokenForm changes from parent
  useEffect(() => {
    if (!onConfigChange && tokenForm) {
      setConfig(prev => ({
        ...prev,
        name: tokenForm.name || prev.name,
        symbol: tokenForm.symbol || prev.symbol,
        description: tokenForm.description || prev.description,
        decimals: tokenForm.decimals ?? prev.decimals,
        assetAddress: (tokenForm as any).assetAddress || prev.assetAddress,
        assetDecimals: (tokenForm as any).assetDecimals ?? prev.assetDecimals,
        fee: (tokenForm as any).fee || prev.fee,
        minDeposit: (tokenForm as any).minDeposit || prev.minDeposit,
        maxDeposit: (tokenForm as any).maxDeposit || prev.maxDeposit,
        pausable: (tokenForm as any).pausable ?? prev.pausable
      }));
    }
  }, [tokenForm, onConfigChange]);

  return (
    <div className="space-y-6">
      {/* Asset Configuration */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assetAddress" className="flex items-center">
                Underlying Asset Address
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoCircledIcon className="h-4 w-4 ml-1 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-80">
                        Address of the ERC-20 token that this vault will accept and manage
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="assetAddress"
                name="assetAddress"
                placeholder="0x..."
                value={displayValues.assetAddress || ''}
                onChange={updateField}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assetDecimals">Asset Decimals</Label>
              <Input
                id="assetDecimals"
                name="assetDecimals"
                type="number"
                placeholder="18"
                value={displayValues.assetDecimals || '18'}
                onChange={updateField}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Configuration */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="feeEnabled" className="flex items-center cursor-pointer">
                Enable Fees
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoCircledIcon className="h-4 w-4 ml-1 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-80">
                        Enable fee collection from vault operations
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Switch
                id="feeEnabled"
                checked={Boolean((displayValues.fee as any)?.enabled)}
                onCheckedChange={handleFeeToggle}
              />
            </div>

            {(displayValues.fee as any)?.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fee.managementFee">Management Fee (%)</Label>
                  <Input
                    id="fee.managementFee"
                    name="fee.managementFee"
                    placeholder="2.0"
                    value={(displayValues.fee as any)?.managementFee || ''}
                    onChange={handleFeeChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee.performanceFee">Performance Fee (%)</Label>
                  <Input
                    id="fee.performanceFee"
                    name="fee.performanceFee"
                    placeholder="20.0"
                    value={(displayValues.fee as any)?.performanceFee || ''}
                    onChange={handleFeeChange}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Deposit Limits */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="minDeposit" className="flex items-center">
                Minimum Deposit
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoCircledIcon className="h-4 w-4 ml-1 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-80">
                        Minimum amount that can be deposited (in underlying token units)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="minDeposit"
                name="minDeposit"
                className="w-40"
                placeholder="0"
                value={displayValues.minDeposit || ''}
                onChange={updateField}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="maxDeposit" className="flex items-center">
                Maximum Deposit
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoCircledIcon className="h-4 w-4 ml-1 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-80">
                        Maximum amount that can be deposited (0 for unlimited)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="maxDeposit"
                name="maxDeposit"
                className="w-40"
                placeholder="0"
                value={displayValues.maxDeposit || ''}
                onChange={updateField}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Features */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="pausable" className="flex items-center cursor-pointer">
                Pausable
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoCircledIcon className="h-4 w-4 ml-1 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-80">
                        Allow vault operations to be paused in case of emergencies
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Switch
                id="pausable"
                name="pausable"
                checked={Boolean(displayValues.pausable)}
                onCheckedChange={(checked) => {
                  const event = {
                    target: {
                      name: "pausable",
                      type: "checkbox",
                      checked
                    }
                  } as React.ChangeEvent<HTMLInputElement>;
                  updateField(event);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ERC4626SimpleConfig;