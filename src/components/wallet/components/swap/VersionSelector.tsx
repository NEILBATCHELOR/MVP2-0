import React from "react";
import { UniswapVersion } from "./types";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { InfoIcon } from "lucide-react";

interface VersionSelectorProps {
  currentVersion: UniswapVersion;
  onVersionChange: (version: UniswapVersion) => void;
  showBadges?: boolean;
  className?: string;
}

export function VersionSelector({
  currentVersion,
  onVersionChange,
  showBadges = true,
  className = ""
}: VersionSelectorProps) {
  const versionInfo = {
    v2: {
      description: "Original Uniswap version with constant product formula",
      gasEfficiency: "Low",
    },
    v3: {
      description: "Concentrated liquidity with higher capital efficiency",
      gasEfficiency: "Medium",
    },
    v4: {
      description: "Latest version with hooks for customization and lower gas costs",
      gasEfficiency: "High",
      isNew: true
    },
    auto: {
      description: "Automatically selects the optimal version based on your swap",
      gasEfficiency: "Adaptive",
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select
        value={currentVersion}
        onValueChange={(value) => onVersionChange(value as UniswapVersion)}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Version" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="auto">Auto Select</SelectItem>
          <SelectItem value="v2">Uniswap V2</SelectItem>
          <SelectItem value="v3">Uniswap V3</SelectItem>
          <SelectItem value="v4" className="flex items-center justify-between">
            Uniswap V4
            {showBadges && <Badge variant="default" className="ml-2 bg-blue-500">New</Badge>}
          </SelectItem>
        </SelectContent>
      </Select>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-[300px]">
            <div className="space-y-2">
              <p className="font-semibold">Current: {currentVersion.toUpperCase()}</p>
              <p>{versionInfo[currentVersion].description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs">Gas Efficiency:</span>
                <Badge variant="outline">{versionInfo[currentVersion].gasEfficiency}</Badge>
              </div>
              {currentVersion === "v4" && (
                <p className="text-xs mt-1">
                  V4 offers up to 99% gas savings on pool creation and significant savings on swaps.
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
} 