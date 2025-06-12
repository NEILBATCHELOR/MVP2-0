// TokenDistributionDialogs.tsx
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, UserPlus } from "lucide-react";
import { FactoringToken, TokenDistributionFormData } from "./types";
import { Investor } from "./TokenDistributionHooks";
import { calculateTokenStats, formatCurrency, formatNumber, calculateInvestmentAmount } from "./TokenDistributionUtils";

interface CreateAllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokens: FactoringToken[];
  investors: Investor[];
  selectedToken: FactoringToken | null;
  selectedInvestor: Investor | null;
  allocationFormData: TokenDistributionFormData;
  allocationMode: 'tokens' | 'investment';
  allocating: boolean;
  allocations: any[];
  handleTokenSelect: (tokenId: string) => void;
  handleInvestorSelect: (investorId: string) => void;
  handlePctToggle: (pct: number) => void;
  handleTokenAmountChange: (value: string) => void;
  handleInvestmentAmountChange: (value: string) => void;
  setAllocationMode: (mode: 'tokens' | 'investment') => void;
  handleCreateAllocation: () => Promise<void>;
}

export function CreateAllocationDialog({
  open,
  onOpenChange,
  tokens,
  investors,
  selectedToken,
  selectedInvestor,
  allocationFormData,
  allocationMode,
  allocating,
  allocations,
  handleTokenSelect,
  handleInvestorSelect,
  handlePctToggle,
  handleTokenAmountChange,
  handleInvestmentAmountChange,
  setAllocationMode,
  handleCreateAllocation
}: CreateAllocationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Allocate Tokens to Investor</DialogTitle>
          <DialogDescription>
            Allocate receivables tokens to an investor.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tokenId">Select Token</Label>
            <Select
              value={allocationFormData.tokenId}
              onValueChange={handleTokenSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a token" />
              </SelectTrigger>
              <SelectContent>
                {tokens.map((token) => {
                  const stats = calculateTokenStats(token.id, allocations, tokens);
                  return (
                    <SelectItem 
                      key={token.id} 
                      value={token.id}
                      disabled={stats.remainingTokens <= 0}
                    >
                      {token.tokenName} - {stats.remainingTokens.toLocaleString()} available
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          {selectedToken && (
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Token Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div>
                      <strong>Investment Information</strong>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Token Value:</span>{" "}
                      {selectedToken ? formatCurrency(selectedToken.tokenValue, 4, 4) : "$0.0000"}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Discount Rate:</span>{" "}
                      {(allocationFormData.discountRate || 0).toFixed(4)}%
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Tokens Allocated:</span>{" "}
                      {allocationFormData.tokenAmount.toLocaleString()}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Investment Amount:</span>{" "}
                      {formatCurrency(allocationFormData.investmentAmount)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <strong>Token Information</strong>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Token Name:</span>{" "}
                      {selectedToken ? selectedToken.tokenName : ""}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Token Symbol:</span>{" "}
                      {selectedToken ? selectedToken.tokenSymbol : ""}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Total Token Supply:</span>{" "}
                      {selectedToken ? formatNumber(selectedToken.totalTokens) : "0"}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Total Value:</span>{" "}
                      {selectedToken ? formatCurrency(selectedToken.totalValue) : "$0.00"}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Allocation Progress</span>
                    <span>
                      {formatNumber(calculateTokenStats(selectedToken.id, allocations, tokens).totalAllocated)} / {formatNumber(selectedToken.totalTokens)} Tokens
                    </span>
                  </div>
                  <Progress value={calculateTokenStats(selectedToken.id, allocations, tokens).allocationPercentage} />
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="investorId">Select Investor</Label>
            <Select
              value={allocationFormData.investorId}
              onValueChange={handleInvestorSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an investor" />
              </SelectTrigger>
              <SelectContent>
                {investors.map((investor) => (
                  <SelectItem key={investor.id} value={investor.id}>
                    {investor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedInvestor && (
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Investor Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedInvestor.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Wallet Address</p>
                    <p className="font-medium">
                      {selectedInvestor.walletAddress ? (
                        selectedInvestor.walletAddress.slice(0, 6) + '...' + selectedInvestor.walletAddress.slice(-4)
                      ) : (
                        <span className="text-red-500">No wallet address</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="py-4 flex items-center space-x-2">
            <Label>Adjust Allocation (%)</Label>
            {[5, 10, 20, 25, 50, 75, 100].map(pct => (
              <Button
                key={pct}
                size="sm"
                variant={(() => {
                  if (!selectedToken) return "outline";
                  const stats = calculateTokenStats(selectedToken.id, allocations, tokens);
                  const remaining = stats.remainingTokens;
                  const rate = allocationFormData.discountRate;
                  if (allocationMode === 'tokens') {
                    const pctCurrent = remaining > 0 ? Math.round(allocationFormData.tokenAmount / remaining * 100) : 0;
                    return pctCurrent === pct ? "default" : "outline";
                  } else {
                    const maxInvest = calculateInvestmentAmount(remaining, rate);
                    const pctCurrent = maxInvest > 0 ? Math.round(allocationFormData.investmentAmount / maxInvest * 100) : 0;
                    return pctCurrent === pct ? "default" : "outline";
                  }
                })()}
                onClick={() => handlePctToggle(pct)}
              >
                {pct}%
              </Button>
            ))}
          </div>
          
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label>Allocation Method</Label>
              <div className="flex items-center space-x-2">
                <Button 
                  size="sm" 
                  variant={allocationMode === 'tokens' ? "default" : "outline"}
                  onClick={() => setAllocationMode('tokens')}
                >
                  Tokens
                </Button>
                <Button 
                  size="sm" 
                  variant={allocationMode === 'investment' ? "default" : "outline"}
                  onClick={() => setAllocationMode('investment')}
                >
                  Investment Amount
                </Button>
              </div>
            </div>
            
            {allocationMode === 'tokens' ? (
              <div className="space-y-2">
                <Label htmlFor="tokenAmount">Token Amount</Label>
                <Input
                  id="tokenAmount"
                  type="number"
                  value={allocationFormData.tokenAmount}
                  onChange={(e) => handleTokenAmountChange(e.target.value)}
                  placeholder="Enter amount to allocate"
                  disabled={!selectedToken || !selectedInvestor}
                />
                
                {selectedToken && (
                  <div className="flex justify-between text-sm">
                    <span>Available: {formatNumber(calculateTokenStats(selectedToken.id, allocations, tokens).remainingTokens)} tokens</span>
                    <span>Value: {formatCurrency((allocationFormData.tokenAmount * selectedToken.tokenValue))}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="investmentAmount">Investment Amount ($)</Label>
                <Input
                  id="investmentAmount"
                  type="number"
                  step="0.01"
                  value={allocationFormData.investmentAmount}
                  onChange={(e) => handleInvestmentAmountChange(e.target.value)}
                  placeholder="Enter investment amount"
                  disabled={!selectedToken || !selectedInvestor}
                />
                
                {selectedToken && (
                  <div className="flex justify-between text-sm">
                    <span>Discount Rate: {(allocationFormData.discountRate || 0).toFixed(4)}%</span>
                    <span>Tokens to Receive: {formatNumber(allocationFormData.tokenAmount)}</span>
                  </div>
                )}
              </div>
            )}
            
            {selectedToken && allocationFormData.tokenAmount > 0 && (
              <Card className="bg-muted/50">
                <CardContent>
                  <h4 className="font-medium mb-2">Allocation Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Token Amount:</span>
                      <span className="font-medium">{formatNumber(allocationFormData.tokenAmount)} tokens</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Investment Amount:</span>
                      <span className="font-medium">{formatCurrency(allocationFormData.investmentAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Face Value:</span>
                      <span className="font-medium">{formatCurrency(allocationFormData.tokenAmount * selectedToken.tokenValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount Rate:</span>
                      <span className="font-medium">{(allocationFormData.discountRate || 0).toFixed(4)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expected Return:</span>
                      <span className="font-medium">{formatCurrency((allocationFormData.tokenAmount * selectedToken.tokenValue) - (allocationFormData.investmentAmount || 0))}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="discountRate">Discount Rate (%)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  disabled
                  type="text"
                  value={(allocationFormData.discountRate || 0).toFixed(4)}
                />
                <span>%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Discount rate from the token's metadata
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateAllocation}
            disabled={
              allocating || 
              !selectedToken || 
              !selectedInvestor || 
              allocationFormData.tokenAmount <= 0 ||
              (selectedToken && allocationFormData.tokenAmount > calculateTokenStats(selectedToken.id, allocations, tokens).remainingTokens)
            }
          >
            {allocating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Create Allocation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}