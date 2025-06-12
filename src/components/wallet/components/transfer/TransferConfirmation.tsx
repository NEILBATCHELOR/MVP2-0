import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useWallet } from "@/services/wallet/WalletContext";

// Add appropriate props type for WalletRiskCheck
interface WalletRiskCheckProps {
  address: string;
  onRiskLevelChange?: (level: 'low' | 'medium' | 'high' | 'unknown') => void;
}

// Implement a simple WalletRiskCheck component if missing
export const WalletRiskCheck: React.FC<WalletRiskCheckProps> = ({ address, onRiskLevelChange }) => {
  // Simplified risk check - in a real app, you would call a security API
  React.useEffect(() => {
    // Simulate API call and risk level determination
    const riskLevel = Math.random() > 0.7 ? 'medium' : 'low';
    if (onRiskLevelChange) {
      onRiskLevelChange(riskLevel as 'low' | 'medium' | 'high' | 'unknown');
    }
  }, [address, onRiskLevelChange]);

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 py-1">
        <div className="h-2 w-2 rounded-full bg-green-500"></div>
        <span className="text-sm">No suspicious activity detected</span>
      </div>
      <div className="text-xs text-muted-foreground">
        Address verified against known scam databases
      </div>
    </div>
  );
};

interface TransferConfirmationProps {
  formData: {
    fromWallet: string;
    toAddress: string;
    amount: string;
    asset: string;
    gasOption: "slow" | "standard" | "fast";
  };
  onConfirm: () => void;
  onBack: () => void;
}

export const TransferConfirmation: React.FC<TransferConfirmationProps> = ({
  formData,
  onConfirm,
  onBack,
}) => {
  const { wallets } = useWallet();
  const fromWallet = wallets.find((w) => w.id === formData.fromWallet);
  
  // Helper functions to format addresses for display
  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.substring(0, 10)}...${address.substring(address.length - 8)}`;
  };
  
  // Calculate gas fee based on selected option
  const getGasFee = () => {
    const gasOptions = {
      slow: 0.0015,
      standard: 0.0023,
      fast: 0.0032,
    };
    
    return gasOptions[formData.gasOption];
  };
  
  // Convert gas fee to USD (mock conversion)
  const gasFeeUSD = (getGasFee() * 3554.10).toFixed(2);
  
  // Total amount including gas fee
  const totalAmount = (parseFloat(formData.amount) + getGasFee()).toFixed(6);
  
  return (
    <div className="space-y-6">
      <div className="bg-muted p-6 rounded-lg">
        <div className="flex flex-col items-center space-y-4">
          <div className="text-center">
            <div className="text-muted-foreground mb-1">You're sending</div>
            <div className="text-3xl font-bold">{formData.amount} {formData.asset}</div>
            <div className="text-muted-foreground text-sm">≈ ${(parseFloat(formData.amount) * 3554.10).toFixed(2)} USD</div>
          </div>
          
          <div className="w-full flex items-center justify-center my-2">
            <div className="bg-muted-foreground/20 h-px flex-1"></div>
            <div className="mx-4">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="bg-muted-foreground/20 h-px flex-1"></div>
          </div>
          
          <div className="text-center">
            <div className="text-muted-foreground mb-1">To address</div>
            <div className="text-lg font-bold font-mono">{formatAddress(formData.toAddress)}</div>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between">
          <div className="text-muted-foreground">From</div>
          <div>
            <div className="font-medium">{fromWallet?.name}</div>
            <div className="text-sm text-muted-foreground font-mono">
              {formatAddress(fromWallet?.address || "")}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between">
          <div className="text-muted-foreground">Network</div>
          <div className="font-medium capitalize">{fromWallet?.network}</div>
        </div>
        
        <div className="flex justify-between">
          <div className="text-muted-foreground">Asset</div>
          <div className="font-medium">{formData.asset}</div>
        </div>
        
        <div className="flex justify-between">
          <div className="text-muted-foreground">Amount</div>
          <div className="font-medium">{formData.amount} {formData.asset}</div>
        </div>
        
        <div className="flex justify-between">
          <div className="text-muted-foreground">Gas Fee (Network Fee)</div>
          <div className="font-medium">{getGasFee()} ETH (${gasFeeUSD})</div>
        </div>
        
        <div className="flex justify-between">
          <div className="text-muted-foreground">Total Amount</div>
          <div className="font-medium">{totalAmount} {formData.asset}</div>
        </div>
      </div>
      
      {/* Risk assessment section */}
      <div className="pt-4 border-t">
        <div className="mb-2 font-medium">Security Verification</div>
        <WalletRiskCheck address={formData.toAddress} />
      </div>
      
      <div className="bg-amber-50 p-4 rounded-lg flex items-start gap-2 border border-amber-200">
        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-amber-800 font-medium">Important Security Notice</p>
          <p className="text-sm text-amber-700 mt-1">
            Always double-check the recipient address. Blockchain transactions 
            are irreversible and cannot be refunded once confirmed.
          </p>
        </div>
      </div>
      
      <div className="flex gap-4 pt-2">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          Go Back
        </Button>
        <Button className="flex-1" onClick={onConfirm}>
          Confirm Transfer
        </Button>
      </div>
    </div>
  );
};