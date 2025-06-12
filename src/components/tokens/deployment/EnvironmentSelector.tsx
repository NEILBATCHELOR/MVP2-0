import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { NetworkEnvironment } from "@/components/tokens/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Network environment data with details
const ENVIRONMENT_DATA = {
  [NetworkEnvironment.TESTNET]: {
    name: "Testnet",
    description: "For testing purposes only. No real value.",
    testNames: {
      ethereum: "Goerli/Sepolia",
      polygon: "Mumbai",
      optimism: "Optimism Goerli",
      arbitrum: "Arbitrum Goerli",
      base: "Base Goerli",
      avalanche: "Fuji",
      xrp: "XRP Testnet",
      aptos: "Aptos Testnet",
      sui: "Sui Testnet",
      near: "Near Testnet"
    }
  },
  [NetworkEnvironment.MAINNET]: {
    name: "Mainnet",
    description: "Production environment with real value. Deployment fees apply.",
  }
};

interface EnvironmentSelectorProps {
  selectedEnvironment: NetworkEnvironment;
  onChange: (environment: NetworkEnvironment) => void;
  selectedNetwork: string;
  disabled?: boolean;
}

/**
 * Network environment selector component for choosing between testnet and mainnet
 */
const EnvironmentSelector: React.FC<EnvironmentSelectorProps> = ({
  selectedEnvironment,
  onChange,
  selectedNetwork,
  disabled = false
}) => {
  // Get specific testnet name for the selected network
  const testnetName = selectedNetwork ? 
    ENVIRONMENT_DATA[NetworkEnvironment.TESTNET].testNames[selectedNetwork] : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center">
        <Label className="mr-2">Network Environment</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p>Select whether to deploy to a test network or the main production network</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <RadioGroup
        value={selectedEnvironment}
        onValueChange={(value) => onChange(value as NetworkEnvironment)}
        disabled={disabled}
        className="flex flex-col space-y-3"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value={NetworkEnvironment.TESTNET} id="testnet" />
          <Label htmlFor="testnet" className="cursor-pointer">
            <div>
              Testnet {testnetName && <span className="text-xs text-muted-foreground">({testnetName})</span>}
            </div>
            <div className="text-xs text-muted-foreground">For testing purposes only</div>
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value={NetworkEnvironment.MAINNET} id="mainnet" />
          <Label htmlFor="mainnet" className="cursor-pointer">
            <div>Mainnet</div>
            <div className="text-xs text-muted-foreground">Production environment with real value</div>
          </Label>
        </div>
      </RadioGroup>

      {selectedEnvironment === NetworkEnvironment.MAINNET && (
        <Alert className="mt-3 bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700 text-sm">
            Mainnet deployment incurs real gas fees and creates tokens with real value. 
            Make sure your token is ready for production.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default EnvironmentSelector;