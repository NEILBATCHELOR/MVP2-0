import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { BlockchainNetwork, NetworkEnvironment } from "@/components/tokens/types";

// Interface for gas configuration
export interface GasConfig {
  mode: "recommended" | "custom";
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

interface GasConfiguratorProps {
  gasConfig: GasConfig;
  onChange: (config: GasConfig) => void;
  selectedNetwork: BlockchainNetwork;
  selectedEnvironment: NetworkEnvironment;
  disabled?: boolean;
}

/**
 * Gas configuration component for setting gas parameters for token deployment
 */
const GasConfigurator: React.FC<GasConfiguratorProps> = ({
  gasConfig,
  onChange,
  selectedNetwork,
  selectedEnvironment,
  disabled = false
}) => {
  // Only show for EVM-compatible networks
  const isEVMNetwork = [
    BlockchainNetwork.ETHEREUM,
    BlockchainNetwork.POLYGON,
    BlockchainNetwork.OPTIMISM,
    BlockchainNetwork.ARBITRUM,
    BlockchainNetwork.BASE,
    BlockchainNetwork.AVALANCHE
  ].includes(selectedNetwork);

  if (!isEVMNetwork) {
    return null;
  }

  const handleInputChange = (field: keyof GasConfig, value: string) => {
    onChange({
      ...gasConfig,
      [field]: value
    });
  };

  const handleModeChange = (mode: "recommended" | "custom") => {
    onChange({
      ...gasConfig,
      mode
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center">
        <Label className="mr-2">Gas Configuration</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p>Configure gas settings for deployment transaction</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <RadioGroup
        value={gasConfig.mode}
        onValueChange={(value) => handleModeChange(value as "recommended" | "custom")}
        disabled={disabled}
        className="flex flex-col space-y-3"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="recommended" id="recommended" />
          <Label htmlFor="recommended" className="cursor-pointer">
            <div>Recommended Settings</div>
            <div className="text-xs text-muted-foreground">
              Automatically calculate optimal gas parameters
            </div>
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="custom" id="custom" />
          <Label htmlFor="custom" className="cursor-pointer">
            <div>Custom Settings</div>
            <div className="text-xs text-muted-foreground">
              Manually set gas parameters
            </div>
          </Label>
        </div>
      </RadioGroup>

      {gasConfig.mode === "custom" && (
        <div className="space-y-3 pl-6 pt-2">
          <div className="space-y-2">
            <Label htmlFor="gasLimit" className="text-sm">Gas Limit</Label>
            <Input
              id="gasLimit"
              placeholder="e.g., 300000"
              value={gasConfig.gasLimit || ""}
              onChange={(e) => handleInputChange("gasLimit", e.target.value)}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Maximum gas units for the transaction
            </p>
          </div>

          {(selectedNetwork === BlockchainNetwork.ETHEREUM ||
           selectedNetwork === BlockchainNetwork.POLYGON ||
           selectedNetwork === BlockchainNetwork.OPTIMISM ||
           selectedNetwork === BlockchainNetwork.BASE) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="maxFeePerGas" className="text-sm">Max Fee (Gwei)</Label>
                <Input
                  id="maxFeePerGas"
                  placeholder="e.g., 30"
                  value={gasConfig.maxFeePerGas || ""}
                  onChange={(e) => handleInputChange("maxFeePerGas", e.target.value)}
                  disabled={disabled}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum total fee per gas unit
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPriorityFeePerGas" className="text-sm">Priority Fee (Gwei)</Label>
                <Input
                  id="maxPriorityFeePerGas"
                  placeholder="e.g., 2"
                  value={gasConfig.maxPriorityFeePerGas || ""}
                  onChange={(e) => handleInputChange("maxPriorityFeePerGas", e.target.value)}
                  disabled={disabled}
                />
                <p className="text-xs text-muted-foreground">
                  Miner tip to prioritize your transaction
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GasConfigurator;