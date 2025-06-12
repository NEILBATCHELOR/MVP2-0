/**
 * Component for selecting a token standard with visual cards
 */
import React from 'react';
import { TokenStandard } from '@/types/core/centralModels';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoCircledIcon } from "@radix-ui/react-icons";

interface TokenStandardSelectorProps {
  selectedStandard: TokenStandard;
  onChange: (standard: TokenStandard) => void;
  disabled?: boolean;
}

const TokenStandardSelector: React.FC<TokenStandardSelectorProps> = ({
  selectedStandard,
  onChange,
  disabled = false
}) => {
  // Standard information with descriptions and use cases
  const standardInfo = [
    {
      standard: TokenStandard.ERC20,
      name: "ERC-20",
      description: "Fungible tokens, identical and interchangeable",
      useCase: "Currencies, utility tokens, shares, commodities",
      color: "bg-blue-400"
    },
    {
      standard: TokenStandard.ERC721,
      name: "ERC-721",
      description: "Non-fungible tokens (NFTs), unique and indivisible",
      useCase: "Unique assets, real estate, IP rights, collectibles",
      color: "bg-purple-400"
    },
    {
      standard: TokenStandard.ERC1155,
      name: "ERC-1155",
      description: "Multi-token standard for both fungible and non-fungible tokens",
      useCase: "Gaming items, asset bundles, mixed collections",
      color: "bg-amber-400"
    },
    {
      standard: TokenStandard.ERC1400,
      name: "ERC-1400",
      description: "Security tokens with compliance features",
      useCase: "Regulated securities, equity shares, debt instruments",
      color: "bg-green-400"
    },
    {
      standard: TokenStandard.ERC3525,
      name: "ERC-3525",
      description: "Semi-fungible tokens combining uniqueness with fractionalization",
      useCase: "Financial derivatives, structured products, fractional ownership",
      color: "bg-pink-400"
    },
    {
      standard: TokenStandard.ERC4626,
      name: "ERC-4626",
      description: "Tokenized vaults for yield-generating assets",
      useCase: "Yield farming, staking pools, interest-bearing tokens",
      color: "bg-cyan-400"
    }
  ];

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Select Token Standard</h3>
        
        <div className="grid grid-cols-1 gap-6">
          {standardInfo.map((info) => (
            <Card 
              key={info.standard}
              className={`cursor-pointer transition-all ${
                selectedStandard === info.standard 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !disabled && onChange(info.standard)}
            >
              <CardContent className="p-6">
                <div className="flex items-start">
                  <div className="mr-4">
                    <Badge className={`${info.color} text-white px-3 py-1.5 text-base`}>{info.name}</Badge>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center">
                      <h4 className="text-lg font-medium">{info.name}</h4>
                      <Tooltip>
                        <TooltipTrigger className="ml-2">
                          <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="w-80">
                          <div className="space-y-2">
                            <p className="font-medium">Description:</p>
                            <p className="text-sm">{info.description}</p>
                            <p className="font-medium mt-2">Use Cases:</p>
                            <p className="text-sm">{info.useCase}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-sm text-muted-foreground">{info.description}</p>
                    <div className="pt-2">
                      <p className="text-xs font-medium text-muted-foreground">COMMON USE CASES</p>
                      <p className="text-sm mt-1">{info.useCase}</p>
                    </div>
                    <div className="pt-2">
                      <p className="text-xs font-medium text-muted-foreground">TECHNICAL DETAILS</p>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div>
                          <p className="text-xs text-muted-foreground">Fungibility</p>
                          <p className="text-sm">
                            {info.standard === TokenStandard.ERC20 && "Fully Fungible"}
                            {info.standard === TokenStandard.ERC721 && "Non-Fungible"}
                            {info.standard === TokenStandard.ERC1155 && "Mixed"}
                            {info.standard === TokenStandard.ERC1400 && "Fungible with Restrictions"}
                            {info.standard === TokenStandard.ERC3525 && "Semi-Fungible"}
                            {info.standard === TokenStandard.ERC4626 && "Fungible (Yield-Bearing)"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Divisibility</p>
                          <p className="text-sm">
                            {info.standard === TokenStandard.ERC20 && "Divisible"}
                            {info.standard === TokenStandard.ERC721 && "Indivisible"}
                            {info.standard === TokenStandard.ERC1155 && "Configurable"}
                            {info.standard === TokenStandard.ERC1400 && "Divisible"}
                            {info.standard === TokenStandard.ERC3525 && "Divisible Values"}
                            {info.standard === TokenStandard.ERC4626 && "Divisible"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default TokenStandardSelector;