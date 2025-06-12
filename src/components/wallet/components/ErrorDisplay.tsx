import React from 'react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Info,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Common error codes and their user-friendly explanations
export const ERROR_CODES = {
  INSUFFICIENT_FUNDS: {
    title: "Insufficient Funds",
    description: "You don't have enough funds to complete this transaction",
    suggestion: "Add more funds to your wallet or try a smaller amount",
    icon: "AlertCircle"
  },
  GAS_LIMIT_EXCEEDED: {
    title: "Gas Limit Exceeded",
    description: "The transaction requires more gas than the network allows",
    suggestion: "Try a smaller transaction or wait for network congestion to decrease",
    icon: "AlertCircle"
  },
  REJECTED_BY_USER: {
    title: "Transaction Rejected",
    description: "You or another signer rejected this transaction",
    suggestion: "If this was unintentional, you can try submitting the transaction again",
    icon: "AlertCircle"
  },
  NETWORK_ERROR: {
    title: "Network Error",
    description: "Unable to connect to the blockchain network",
    suggestion: "Check your internet connection and try again later",
    icon: "AlertCircle"
  },
  TRANSACTION_UNDERPRICED: {
    title: "Transaction Underpriced",
    description: "The gas price is too low for the current network conditions",
    suggestion: "Increase the gas price and try again",
    icon: "AlertCircle"
  },
  NONCE_TOO_LOW: {
    title: "Nonce Too Low",
    description: "The transaction nonce is too low",
    suggestion: "Wait for your pending transactions to confirm first",
    icon: "AlertCircle"
  },
  TIMEOUT: {
    title: "Transaction Timeout",
    description: "The transaction took too long to confirm",
    suggestion: "Check the network status and try again",
    icon: "Clock"
  },
  UNKNOWN: {
    title: "Error",
    description: "An unexpected error occurred",
    suggestion: "Try again or contact support if the problem persists",
    icon: "AlertCircle"
  }
};

export interface ErrorDisplayProps {
  error?: Error | string;
  errorCode?: keyof typeof ERROR_CODES;
  title?: string;
  description?: string;
  suggestion?: string;
  onRetry?: () => void;
  onBack?: () => void;
  compact?: boolean;
  showHelp?: boolean;
}

export function ErrorDisplay({
  error,
  errorCode = "UNKNOWN",
  title,
  description,
  suggestion,
  onRetry,
  onBack,
  compact = false,
  showHelp = true
}: ErrorDisplayProps) {
  const errorInfo = ERROR_CODES[errorCode] || ERROR_CODES.UNKNOWN;
  
  const errorTitle = title || errorInfo.title;
  const errorDescription = description || (error ? error.toString() : errorInfo.description);
  const errorSuggestion = suggestion || errorInfo.suggestion;
  
  const errorDetails = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  
  if (compact) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{errorTitle}</AlertTitle>
        <AlertDescription>
          {errorDescription}
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2 mt-2" 
              onClick={onRetry}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle>{errorTitle}</CardTitle>
        </div>
        <CardDescription>
          {errorDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {errorSuggestion && (
            <div className="bg-muted p-4 rounded-md">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm mb-1">Suggestion</h4>
                  <p className="text-sm text-muted-foreground">{errorSuggestion}</p>
                </div>
              </div>
            </div>
          )}
          
          {errorDetails && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-xs">
                  <HelpCircle className="h-3 w-3" />
                  Show Technical Details
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 p-3 bg-muted rounded-md text-xs font-mono overflow-auto max-h-[150px] whitespace-pre-wrap">
                  {errorDetails}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
          
          {showHelp && (
            <>
              <Separator />
              
              <div className="mt-2">
                <h3 className="font-medium text-sm mb-2">Common Solutions</h3>
                
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-sm">Check your wallet connection</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                        <li>Make sure your wallet is connected to the correct network</li>
                        <li>Try unlocking your wallet and reconnecting</li>
                        <li>Check if you need to approve the transaction in your wallet extension</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-sm">Network related issues</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                        <li>The network might be congested, try again later</li>
                        <li>You might need to increase gas fees during high demand</li>
                        <li>Check if there are known issues with the selected network</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-sm">Transaction problems</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                        <li>Check if you have enough funds for the transaction and gas fees</li>
                        <li>Make sure the recipient address is valid</li>
                        <li>Try a smaller transaction to test if it works</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                
                <div className="mt-4 flex items-center justify-center">
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => window.open('https://help.chaincapital.com/wallet-support', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Visit Support Center
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        )}
        
        {onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 