import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { Token, SwapRouteStep } from "../swap/types";

export interface SwapRouteInfoProps {
  route: SwapRouteStep[];
  tokens: Record<string, Token>;
}

export const SwapRouteInfo: React.FC<SwapRouteInfoProps> = ({ route, tokens }) => {
  if (!route || route.length === 0) return null;

  // Calculate the total number of hops to visualize
  const tokenPath = route.reduce<string[]>((acc, step, index) => {
    if (index === 0) {
      // First step, add both tokens
      acc.push(step.tokenIn.symbol, step.tokenOut.symbol);
    } else {
      // Subsequent steps, just add the output token
      acc.push(step.tokenOut.symbol);
    }
    return acc;
  }, []);

  // Remove duplicates
  const uniqueTokenPath = [...new Set(tokenPath)];

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-md">Route</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Protocol steps */}
        <div className="space-y-2">
          {route.map((step, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <img
                    src={tokens[step.tokenIn.address]?.logoURI || step.tokenIn.logoURI}
                    alt={step.tokenIn.symbol}
                    className="h-5 w-5 rounded-full"
                  />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <img
                    src={tokens[step.tokenOut.address]?.logoURI || step.tokenOut.logoURI}
                    alt={step.tokenOut.symbol}
                    className="h-5 w-5 rounded-full"
                  />
                </div>
                <span className="text-sm">
                  {step.protocol}
                </span>
              </div>
              {/* Remove the portion display since it's not in the type */}
            </div>
          ))}
        </div>

        {/* Token path visualization */}
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {tokenPath.map((symbol, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                  <span className="text-xs font-medium">{symbol}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 