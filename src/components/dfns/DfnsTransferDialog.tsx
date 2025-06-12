/**
 * DFNS Transfer Dialog Component
 * 
 * Provides a comprehensive interface for transferring assets between DFNS wallets
 * with advanced features like gas estimation, policy validation, and approval workflows.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowRight,
  Send,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  Shield,
  Calculator,
  Clock,
  Wallet
} from 'lucide-react';

import type { DfnsWallet, DfnsWalletBalance, DfnsTransfer, DfnsCreateTransferRequest } from '@/types/dfns';
import { dfnsService } from '@/services/dfns/dfnsService';
import { formatBalance } from '@/utils/shared/formatting/formatters';
import { validateAddressForNetwork as isValidAddress } from '@/utils/shared/addressValidation';

interface DfnsTransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: DfnsWallet;
  onTransferInitiated: (transfer: DfnsTransfer) => void;
}

interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  estimatedFee: string;
  estimatedFeeUsd: string;
}

export function DfnsTransferDialog({
  isOpen,
  onClose,
  wallet,
  onTransferInitiated
}: DfnsTransferDialogProps) {
  // Form state
  const [formData, setFormData] = useState({
    toAddress: '',
    amount: '',
    asset: '',
    memo: '',
    gasLimit: '',
    gasPrice: '',
    maxFeePerGas: '',
    maxPriorityFeePerGas: '',
    customGas: false
  });

  // Data state
  const [balances, setBalances] = useState<DfnsWalletBalance[]>([]);
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [loadingGasEstimate, setLoadingGasEstimate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<'transfer' | 'gas' | 'review'>('transfer');

  // Load wallet balances when dialog opens
  useEffect(() => {
    if (isOpen && wallet) {
      loadWalletBalances();
      resetForm();
    }
  }, [isOpen, wallet]);

  // Auto-estimate gas when form changes
  useEffect(() => {
    if (formData.toAddress && formData.amount && formData.asset && !formData.customGas) {
      const timer = setTimeout(() => {
        estimateGas();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData.toAddress, formData.amount, formData.asset, formData.customGas]);

  const resetForm = () => {
    setFormData({
      toAddress: '',
      amount: '',
      asset: '',
      memo: '',
      gasLimit: '',
      gasPrice: '',
      maxFeePerGas: '',
      maxPriorityFeePerGas: '',
      customGas: false
    });
    setStep('transfer');
    setError(null);
    setSuccess(null);
    setGasEstimate(null);
  };

  const loadWalletBalances = async () => {
    try {
      setLoadingBalances(true);
      const walletBalances = await dfnsService.getWalletBalances(wallet.walletId);
      setBalances(walletBalances.filter(b => parseFloat(b.balance) > 0));
    } catch (err) {
      console.error('Failed to load wallet balances:', err);
      setError('Failed to load wallet balances');
    } finally {
      setLoadingBalances(false);
    }
  };

  const estimateGas = async () => {
    try {
      setLoadingGasEstimate(true);
      setError(null);

      if (!isValidAddress(formData.toAddress, wallet.network)) {
        return;
      }

      const estimate = await dfnsService.estimateTransferFee({
        walletId: wallet.walletId,
        to: formData.toAddress,
        amount: formData.amount,
        asset: formData.asset || undefined
      });

      setGasEstimate(estimate);
    } catch (err) {
      console.error('Failed to estimate gas:', err);
      // Don't show error for gas estimation as it's auto-triggered
    } finally {
      setLoadingGasEstimate(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const validateTransferForm = (): string | null => {
    if (!formData.toAddress.trim()) {
      return 'Recipient address is required';
    }

    if (!isValidAddress(formData.toAddress, wallet.network)) {
      return 'Invalid recipient address for this network';
    }

    if (!formData.amount.trim()) {
      return 'Amount is required';
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      return 'Amount must be a positive number';
    }

    // Check balance
    const selectedBalance = balances.find(b => b.asset.symbol === formData.asset);
    if (selectedBalance && parseFloat(selectedBalance.balance) < amount) {
      return `Insufficient balance. Available: ${selectedBalance.balance} ${selectedBalance.asset.symbol}`;
    }

    return null;
  };

  const handleInitiateTransfer = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate form
      const validationError = validateTransferForm();
      if (validationError) {
        setError(validationError);
        return;
      }

      // Prepare transfer request
      const transferRequest: DfnsCreateTransferRequest = {
        to: formData.toAddress.trim(),
        amount: formData.amount,
        asset: formData.asset || undefined,
        memo: formData.memo.trim() || undefined,
        gasLimit: formData.customGas ? formData.gasLimit : gasEstimate?.gasLimit,
        gasPrice: formData.customGas ? formData.gasPrice : gasEstimate?.gasPrice,
        maxFeePerGas: formData.customGas ? formData.maxFeePerGas : gasEstimate?.maxFeePerGas,
        maxPriorityFeePerGas: formData.customGas ? formData.maxPriorityFeePerGas : gasEstimate?.maxPriorityFeePerGas
      };

      // Initiate transfer
      const transfer = await dfnsService.createTransfer(transferRequest);

      setSuccess(`Transfer initiated successfully! Transaction ID: ${transfer.transferId}`);
      
      // Notify parent component
      onTransferInitiated(transfer);

      // Close dialog after a brief delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Failed to initiate transfer:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to initiate transfer. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedBalance = balances.find(b => b.asset.symbol === formData.asset);

  const renderTransferStep = () => (
    <div className="space-y-6">
      {/* Wallet Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{wallet.name || 'Unnamed Wallet'}</p>
              <p className="text-sm text-muted-foreground">
                {wallet.network} • {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {/* Recipient Address */}
        <div>
          <Label htmlFor="toAddress">Recipient Address *</Label>
          <Input
            id="toAddress"
            placeholder={`Enter ${wallet.network} address`}
            value={formData.toAddress}
            onChange={(e) => handleInputChange('toAddress', e.target.value)}
            className="mt-1"
          />
          {formData.toAddress && !isValidAddress(formData.toAddress, wallet.network) && (
            <p className="text-sm text-destructive mt-1">
              Invalid address format for {wallet.network}
            </p>
          )}
        </div>

        {/* Asset Selection */}
        <div>
          <Label htmlFor="asset">Asset</Label>
          <Select value={formData.asset} onValueChange={(value) => handleInputChange('asset', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select asset to transfer" />
            </SelectTrigger>
            <SelectContent>
              {loadingBalances ? (
                <SelectItem value="loading" disabled>
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading balances...
                  </div>
                </SelectItem>
              ) : balances.length === 0 ? (
                <SelectItem value="empty" disabled>
                  No assets with balance found
                </SelectItem>
              ) : (
                balances.map((balance) => (
                  <SelectItem key={balance.asset.symbol} value={balance.asset.symbol}>
                    <div className="flex items-center justify-between w-full">
                      <span>{balance.asset.symbol}</span>
                      <span className="text-muted-foreground text-sm">
                        {formatBalance(balance.balance)} 
                        {balance.valueInUSD && ` ($${balance.valueInUSD})`}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          
          {selectedBalance && (
            <div className="mt-2 p-2 bg-muted rounded-lg">
              <p className="text-sm">
                Available: <span className="font-medium">
                  {formatBalance(selectedBalance.balance)} {selectedBalance.asset.symbol}
                </span>
                {selectedBalance.valueInUSD && (
                  <span className="text-muted-foreground"> (${selectedBalance.valueInUSD})</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Amount */}
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="amount">Amount *</Label>
            {selectedBalance && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleInputChange('amount', selectedBalance.balance)}
                className="text-xs h-auto p-1"
              >
                Max
              </Button>
            )}
          </div>
          <Input
            id="amount"
            type="number"
            step="any"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Memo */}
        <div>
          <Label htmlFor="memo">Memo (Optional)</Label>
          <Textarea
            id="memo"
            placeholder="Optional note for this transfer"
            value={formData.memo}
            onChange={(e) => handleInputChange('memo', e.target.value)}
            className="mt-1"
            rows={2}
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={() => setStep('gas')}
          disabled={!formData.toAddress || !formData.amount || !formData.asset}
        >
          Next: Gas Settings
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderGasStep = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Gas Estimate */}
        {gasEstimate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Gas Estimation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Gas Limit</p>
                  <p className="font-medium">{gasEstimate.gasLimit}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gas Price</p>
                  <p className="font-medium">{gasEstimate.gasPrice} Gwei</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estimated Fee</p>
                  <p className="font-medium">{gasEstimate.estimatedFee} ETH</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fee (USD)</p>
                  <p className="font-medium">${gasEstimate.estimatedFeeUsd}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {loadingGasEstimate && (
          <Card>
            <CardContent className="p-6 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Estimating gas fees...</p>
            </CardContent>
          </Card>
        )}

        {/* Custom Gas Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Custom Gas Settings
            </Label>
            <p className="text-sm text-muted-foreground">
              Override automatic gas estimation
            </p>
          </div>
          <Button
            variant={formData.customGas ? "default" : "outline"}
            size="sm"
            onClick={() => handleInputChange('customGas', !formData.customGas)}
          >
            {formData.customGas ? 'Enabled' : 'Disabled'}
          </Button>
        </div>

        {/* Custom Gas Fields */}
        {formData.customGas && (
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gasLimit">Gas Limit</Label>
                <Input
                  id="gasLimit"
                  placeholder="21000"
                  value={formData.gasLimit}
                  onChange={(e) => handleInputChange('gasLimit', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="gasPrice">Gas Price (Gwei)</Label>
                <Input
                  id="gasPrice"
                  placeholder="20"
                  value={formData.gasPrice}
                  onChange={(e) => handleInputChange('gasPrice', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="maxFeePerGas">Max Fee Per Gas (Gwei)</Label>
                <Input
                  id="maxFeePerGas"
                  placeholder="30"
                  value={formData.maxFeePerGas}
                  onChange={(e) => handleInputChange('maxFeePerGas', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="maxPriorityFeePerGas">Max Priority Fee (Gwei)</Label>
                <Input
                  id="maxPriorityFeePerGas"
                  placeholder="2"
                  value={formData.maxPriorityFeePerGas}
                  onChange={(e) => handleInputChange('maxPriorityFeePerGas', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Custom gas settings may result in failed transactions if set too low, 
                or unnecessary fees if set too high.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('transfer')}>
          Back
        </Button>
        <Button onClick={() => setStep('review')}>
          Review Transfer
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Review Transfer</CardTitle>
          <CardDescription>
            Please review the transfer details before proceeding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">From Wallet</Label>
              <p className="text-sm font-medium">{wallet.name || 'Unnamed Wallet'}</p>
              <p className="text-xs text-muted-foreground">{wallet.address}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">To Address</Label>
              <p className="text-sm font-medium break-all">{formData.toAddress}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
              <p className="text-sm font-medium">{formData.amount} {formData.asset}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Network</Label>
              <p className="text-sm font-medium">{wallet.network}</p>
            </div>
            {formData.memo && (
              <div className="col-span-2">
                <Label className="text-sm font-medium text-muted-foreground">Memo</Label>
                <p className="text-sm font-medium">{formData.memo}</p>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Gas Settings</Label>
            {gasEstimate && !formData.customGas ? (
              <div className="text-sm">
                <p>Estimated Fee: <span className="font-medium">{gasEstimate.estimatedFee} ETH</span></p>
                <p className="text-muted-foreground">≈ ${gasEstimate.estimatedFeeUsd} USD</p>
              </div>
            ) : (
              <p className="text-sm">Custom gas settings configured</p>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('gas')} disabled={loading}>
          Back
        </Button>
        <Button onClick={handleInitiateTransfer} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Initiating Transfer...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Initiate Transfer
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Transfer Assets
          </DialogTitle>
          <DialogDescription>
            Transfer assets from your DFNS wallet to another address
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'transfer' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                1
              </div>
              <div className="w-8 h-0.5 bg-muted"></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'gas' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
              <div className="w-8 h-0.5 bg-muted"></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'review' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Step Content */}
          {step === 'transfer' && renderTransferStep()}
          {step === 'gas' && renderGasStep()}
          {step === 'review' && renderReviewStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export the Props interface
export type { DfnsTransferDialogProps };

export default DfnsTransferDialog;