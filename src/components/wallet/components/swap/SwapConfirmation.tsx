import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { Quote, Token, SwapConfirmationProps } from "./types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const SwapConfirmation: React.FC<SwapConfirmationProps> = ({
  quote,
  fromToken,
  toToken,
  slippage,
  onConfirm,
  onCancel,
}) => {
  // Safety checks
  if (!quote || !fromToken || !toToken) {
    return null;
  }
  
  // Check if price impact is high
  const hasPriceImpactWarning = parseFloat(quote.priceImpact) > 3;
  
  return (
    <div className="space-y-4">
      <CardHeader className="px-0 pt-0 pb-2">
        <CardTitle className="text-xl">Confirm Swap</CardTitle>
      </CardHeader>
      
      <div className="flex flex-col items-center gap-2 py-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <img 
              src={fromToken.logoURI} 
              alt={fromToken.symbol} 
              className="w-8 h-8 rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/generic.svg';
              }}
            />
            <span className="ml-2 text-lg font-medium">{quote.fromAmount} {fromToken.symbol}</span>
          </div>
          
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
          
          <div className="flex items-center">
            <img 
              src={toToken.logoURI} 
              alt={toToken.symbol} 
              className="w-8 h-8 rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/generic.svg';
              }}
            />
            <span className="ml-2 text-lg font-medium">{quote.toAmount} {toToken.symbol}</span>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          1 {fromToken.symbol} = {parseFloat(quote.exchangeRate).toFixed(6)} {toToken.symbol}
        </div>
      </div>
      
      {hasPriceImpactWarning && (
        <Alert variant="destructive" className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-600">Price Impact Warning</AlertTitle>
          <AlertDescription className="text-amber-600">
            The price impact of this swap is {quote.priceImpact}%, which is relatively high.
            You might get a better price by breaking this swap into multiple smaller swaps.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2 rounded-md border p-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Rate</span>
          <span>
            1 {fromToken.symbol} = {parseFloat(quote.exchangeRate).toFixed(6)} {toToken.symbol}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Price Impact
          </span>
          <span className={parseFloat(quote.priceImpact) > 5 ? "text-destructive" : ""}>
            {quote.priceImpact}%
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Slippage Tolerance
          </span>
          <span>
            {slippage}%
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Min. Received
          </span>
          <span>
            {quote.minimumReceived} {toToken.symbol}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Network Fee
          </span>
          <span>
            ~{quote.gasCost.eth} ETH (${quote.gasCost.usd})
          </span>
        </div>
      </div>
      
      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button className="flex-1" onClick={onConfirm}>Confirm Swap</Button>
      </div>
    </div>
  );
}; 