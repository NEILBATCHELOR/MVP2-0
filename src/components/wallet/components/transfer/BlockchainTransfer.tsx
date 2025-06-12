import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowRight, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { transferService, TransferParams, TransferEstimate, TransferResult } from "@/services/wallet/TransferService";
import { useWallet } from "@/services/wallet/WalletContext";
import { TransferConfirmation } from "./TransferConfirmation";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BlockchainTransferProps {
  onTransferComplete?: (result: TransferResult) => void;
}

type TransferStep = 'form' | 'estimate' | 'confirm' | 'executing' | 'success' | 'error';

export const BlockchainTransfer: React.FC<BlockchainTransferProps> = ({
  onTransferComplete
}) => {
  const { wallets } = useWallet();
  const [step, setStep] = useState<TransferStep>('form');
  const [transferParams, setTransferParams] = useState<TransferParams>({
    fromWallet: '',
    toAddress: '',
    amount: '',
    asset: 'ETH',
    blockchain: 'ethereum',
    gasOption: 'standard',
    memo: ''
  });
  
  const [estimate, setEstimate] = useState<TransferEstimate | null>(null);
  const [result, setResult] = useState<TransferResult | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Available assets per blockchain
  const assetsByBlockchain = {
    ethereum: ['ETH', 'USDC', 'USDT', 'WBTC', 'UNI', 'LINK'],
    polygon: ['MATIC', 'USDC', 'USDT', 'WETH', 'AAVE'],
    arbitrum: ['ETH', 'USDC', 'ARB', 'GMX'],
    optimism: ['ETH', 'OP', 'USDC', 'SNX'],
    avalanche: ['AVAX', 'USDC', 'USDT', 'JOE'],
    solana: ['SOL', 'USDC', 'RAY', 'SRM'],
    near: ['NEAR', 'USDC', 'wNEAR'],
  };

  const blockchainOptions = [
    { value: 'ethereum', label: 'Ethereum', icon: '⟠' },
    { value: 'polygon', label: 'Polygon', icon: '⬟' },
    { value: 'arbitrum', label: 'Arbitrum', icon: '🔵' },
    { value: 'optimism', label: 'Optimism', icon: '🔴' },
    { value: 'avalanche', label: 'Avalanche', icon: '🔺' },
    { value: 'solana', label: 'Solana', icon: '◎' },
    { value: 'near', label: 'NEAR', icon: '🌐' },
  ];

  const gasOptions = [
    { value: 'slow', label: 'Slow', description: 'Lower fees, longer confirmation' },
    { value: 'standard', label: 'Standard', description: 'Balanced fees and speed' },
    { value: 'fast', label: 'Fast', description: 'Higher fees, faster confirmation' },
  ];

  useEffect(() => {
    // Update asset when blockchain changes
    const availableAssets = assetsByBlockchain[transferParams.blockchain] || ['ETH'];
    if (!availableAssets.includes(transferParams.asset)) {
      setTransferParams(prev => ({ ...prev, asset: availableAssets[0] }));
    }
  }, [transferParams.blockchain]);

  const handleGetEstimate = async () => {
    if (!transferParams.fromWallet || !transferParams.toAddress || !transferParams.amount) {
      setError('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const estimateResult = await transferService.estimateTransfer(transferParams);
      setEstimate(estimateResult);
      setStep('estimate');
    } catch (err) {
      setError(err.message);
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmTransfer = async () => {
    setIsLoading(true);
    setStep('executing');

    try {
      const transferResult = await transferService.executeTransfer(transferParams);
      setResult(transferResult);
      setStep('success');
      
      if (onTransferComplete) {
        onTransferComplete(transferResult);
      }
    } catch (err) {
      setError(err.message);
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('form');
    setTransferParams({
      fromWallet: '',
      toAddress: '',
      amount: '',
      asset: 'ETH',
      blockchain: 'ethereum',
      gasOption: 'standard',
      memo: ''
    });
    setEstimate(null);
    setResult(null);
    setError('');
  };

  const renderFormStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Send Crypto
          <span className="text-2xl">💸</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* From Wallet Selection */}
        <div className="space-y-2">
          <Label htmlFor="fromWallet">From Wallet</Label>
          <Select
            value={transferParams.fromWallet}
            onValueChange={(value) => setTransferParams(prev => ({ ...prev, fromWallet: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select wallet" />
            </SelectTrigger>
            <SelectContent>
              {wallets.map((wallet) => (
                <SelectItem key={wallet.id} value={wallet.address}>
                  <div className="flex items-center gap-2">
                    <span>{wallet.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({wallet.address.slice(0, 6)}...{wallet.address.slice(-4)})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Blockchain Selection */}
        <div className="space-y-2">
          <Label htmlFor="blockchain">Blockchain</Label>
          <Select
            value={transferParams.blockchain}
            onValueChange={(value) => setTransferParams(prev => ({ ...prev, blockchain: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select blockchain" />
            </SelectTrigger>
            <SelectContent>
              {blockchainOptions.map((blockchain) => (
                <SelectItem key={blockchain.value} value={blockchain.value}>
                  <div className="flex items-center gap-2">
                    <span>{blockchain.icon}</span>
                    <span>{blockchain.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Asset Selection */}
        <div className="space-y-2">
          <Label htmlFor="asset">Asset</Label>
          <Select
            value={transferParams.asset}
            onValueChange={(value) => setTransferParams(prev => ({ ...prev, asset: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select asset" />
            </SelectTrigger>
            <SelectContent>
              {(assetsByBlockchain[transferParams.blockchain] || ['ETH']).map((asset) => (
                <SelectItem key={asset} value={asset}>
                  {asset}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            placeholder="0.00"
            value={transferParams.amount}
            onChange={(e) => setTransferParams(prev => ({ ...prev, amount: e.target.value }))}
          />
        </div>

        {/* To Address */}
        <div className="space-y-2">
          <Label htmlFor="toAddress">To Address</Label>
          <Input
            id="toAddress"
            placeholder="0x..."
            value={transferParams.toAddress}
            onChange={(e) => setTransferParams(prev => ({ ...prev, toAddress: e.target.value }))}
          />
        </div>

        {/* Gas Option */}
        <div className="space-y-2">
          <Label htmlFor="gasOption">Speed & Fees</Label>
          <Select
            value={transferParams.gasOption}
            onValueChange={(value: 'slow' | 'standard' | 'fast') => 
              setTransferParams(prev => ({ ...prev, gasOption: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gas option" />
            </SelectTrigger>
            <SelectContent>
              {gasOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Memo (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="memo">Memo (Optional)</Label>
          <Input
            id="memo"
            placeholder="Transaction note..."
            value={transferParams.memo}
            onChange={(e) => setTransferParams(prev => ({ ...prev, memo: e.target.value }))}
          />
        </div>

        <Button 
          onClick={handleGetEstimate} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Getting Estimate...
            </>
          ) : (
            <>
              Get Estimate
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );

  const renderEstimateStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Transfer Estimate
          <span className="text-2xl">📊</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-medium">{transferParams.amount} {transferParams.asset}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Network Fee</span>
            <span className="font-medium">{estimate?.gasFee} ETH (${estimate?.gasFeeUsd})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="font-bold">{estimate?.totalAmount} {transferParams.asset}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Est. Time</span>
            <span className="font-medium">{estimate?.estimatedConfirmationTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Network</span>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${
                estimate?.networkCongestion === 'low' ? 'bg-green-500' :
                estimate?.networkCongestion === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="font-medium capitalize">{estimate?.networkCongestion} congestion</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep('form')} className="flex-1">
            Back
          </Button>
          <Button onClick={handleConfirmTransfer} className="flex-1">
            Confirm Transfer
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderExecutingStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Processing Transfer
          <Clock className="h-5 w-5" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-4 py-6">
          <Loader2 className="h-12 w-12 animate-spin" />
          <div className="text-center">
            <div className="font-medium">Broadcasting transaction...</div>
            <div className="text-sm text-muted-foreground mt-1">
              This may take a few moments
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSuccessStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Transfer Successful
          <CheckCircle className="h-5 w-5 text-green-500" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
          <div className="text-center">
            <div className="font-medium">Transaction submitted!</div>
            <div className="text-sm text-muted-foreground mt-1">
              Your transfer is being processed
            </div>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Transaction Hash</span>
          </div>
          <div className="font-mono text-sm break-all">
            {result?.txHash}
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium capitalize">{result?.status}</span>
          </div>
        </div>

        <Button onClick={resetForm} className="w-full">
          Send Another Transfer
        </Button>
      </CardContent>
    </Card>
  );

  const renderErrorStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Transfer Failed
          <AlertCircle className="h-5 w-5 text-red-500" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button variant="outline" onClick={resetForm} className="flex-1">
            Start Over
          </Button>
          <Button onClick={() => setStep('form')} className="flex-1">
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {step === 'form' && renderFormStep()}
      {step === 'estimate' && renderEstimateStep()}
      {step === 'executing' && renderExecutingStep()}
      {step === 'success' && renderSuccessStep()}
      {step === 'error' && renderErrorStep()}
    </div>
  );
};

export default BlockchainTransfer;
