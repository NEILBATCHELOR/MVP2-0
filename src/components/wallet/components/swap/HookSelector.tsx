import React, { useState, useEffect } from "react";
import { HookInfo, Token } from "./types";
import { UniswapV4Service } from "@/services/wallet/v4/uniswapV4Service";
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
import { InfoIcon, ShieldCheckIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/Spinner";

interface HookSelectorProps {
  fromToken: Token | null;
  toToken: Token | null;
  selectedHook: string;
  onHookSelect: (hookAddress: string) => void;
  isEnabled: boolean;
}

export function HookSelector({
  fromToken,
  toToken,
  selectedHook,
  onHookSelect,
  isEnabled
}: HookSelectorProps) {
  const [availableHooks, setAvailableHooks] = useState<HookInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const v4Service = new UniswapV4Service();
  
  useEffect(() => {
    async function fetchHooks() {
      if (!fromToken || !toToken || !isEnabled) {
        setAvailableHooks([]);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const hooks = await v4Service.getAvailableHooks(fromToken, toToken);
        
        // Always add the "No Hook" option
        const noHookOption: HookInfo = {
          address: "0x0000000000000000000000000000000000000000",
          name: "No Hook",
          description: "Standard V4 pool without custom hooks",
          isVerified: true,
          implementedHooks: [],
          gasEstimate: 0
        };
        
        setAvailableHooks([noHookOption, ...hooks]);
        
        // If no hook is selected, default to "No Hook"
        if (!selectedHook || selectedHook === "") {
          onHookSelect(noHookOption.address);
        }
      } catch (error) {
        console.error("Failed to fetch hooks:", error);
        setError("Failed to load available hooks");
        
        // Set default "No Hook" option even on error
        const noHookOption: HookInfo = {
          address: "0x0000000000000000000000000000000000000000",
          name: "No Hook",
          description: "Standard V4 pool without custom hooks",
          isVerified: true,
          implementedHooks: [],
          gasEstimate: 0
        };
        setAvailableHooks([noHookOption]);
        onHookSelect(noHookOption.address);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchHooks();
  }, [fromToken, toToken, isEnabled]);
  
  if (!isEnabled) {
    return null;
  }
  
  const selectedHookInfo = availableHooks.find(hook => hook.address === selectedHook) || availableHooks[0];

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md">Pool Hooks</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>Uniswap V4 hooks are plugin-like contracts that customize pool behavior.</p>
                <p className="mt-1">They can enable features like dynamic fees, limit orders, and custom oracles.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>
          Select a hook for your V4 swap
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Spinner size="md" />
          </div>
        ) : error ? (
          <div className="text-destructive text-sm p-2">{error}</div>
        ) : (
          <>
            <Select
              value={selectedHook}
              onValueChange={onHookSelect}
              disabled={availableHooks.length <= 1}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Hook" />
              </SelectTrigger>
              <SelectContent>
                {availableHooks.map((hook) => (
                  <SelectItem key={hook.address} value={hook.address}>
                    <div className="flex items-center justify-between w-full">
                      <span>{hook.name}</span>
                      {hook.isVerified && (
                        <ShieldCheckIcon className="h-4 w-4 text-green-500 ml-2" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedHookInfo && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{selectedHookInfo.name}</span>
                  {selectedHookInfo.isVerified && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedHookInfo.description}
                </p>
                {selectedHookInfo.implementedHooks && selectedHookInfo.implementedHooks.length > 0 && (
                  <div className="mt-2">
                    <Separator className="my-2" />
                    <div className="text-xs text-muted-foreground">Implemented hooks:</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedHookInfo.implementedHooks.map((hookType) => (
                        <Badge key={hookType} variant="secondary" className="text-xs">
                          {hookType}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedHookInfo.gasEstimate !== undefined && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Est. gas impact: {selectedHookInfo.gasEstimate > 0 ? '+' : ''}{selectedHookInfo.gasEstimate}%
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
} 