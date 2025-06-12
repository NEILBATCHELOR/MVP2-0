import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/infrastructure/database/client";
import { useToast } from "@/components/ui/use-toast";
import { Investor } from "@/types/core/centralModels";
import { Wallet } from "lucide-react";

interface WalletConfigurationSectionProps {
  investor: Investor;
  onUpdate: () => void;
}

const WalletConfigurationSection: React.FC<WalletConfigurationSectionProps> = ({
  investor,
  onUpdate,
}) => {
  const [walletAddress, setWalletAddress] = useState(investor.walletAddress || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleWalletConnect = async () => {
    // This would typically integrate with a web3 wallet like MetaMask
    // For this example, we'll use the manual entry
    if (!window.ethereum) {
      toast({
        title: "Web3 wallet not detected",
        description: "Please install MetaMask or another web3 wallet to connect automatically.",
      });
      return;
    }

    try {
      // Request wallet connection
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        await updateWalletAddress(accounts[0]);
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection failed",
        description: "There was an error connecting to your wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletAddress) {
      toast({
        title: "Invalid wallet address",
        description: "Please enter a valid wallet address.",
        variant: "destructive",
      });
      return;
    }
    
    await updateWalletAddress(walletAddress);
  };

  const updateWalletAddress = async (address: string) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("investors")
        .update({ wallet_address: address })
        .eq("investor_id", investor.id);
      
      if (error) throw error;
      
      toast({
        title: "Wallet connected",
        description: "Your wallet has been successfully connected to your investor profile.",
      });
      
      onUpdate();
    } catch (error) {
      console.error("Error updating wallet address:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your wallet address. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasWallet = !!investor.walletAddress;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Wallet Configuration</CardTitle>
        <CardDescription>
          Connect your wallet to receive investments
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasWallet ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-6 text-center">
              <div className="mb-4">
                <Wallet className="h-12 w-12 mx-auto text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Wallet Connected</h3>
              <p className="text-sm text-muted-foreground break-all mb-4">
                {investor.walletAddress}
              </p>
              <Button variant="outline" onClick={() => setWalletAddress("")}>
                Change Wallet
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg border-2 border-dashed p-6 text-center">
              <div className="mb-4">
                <Wallet className="h-12 w-12 mx-auto text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Wallet Setup Required</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your wallet to participate in investments
              </p>
              <Button onClick={handleWalletConnect} className="mb-2 w-full">
                Connect Wallet
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Or enter wallet address manually</h3>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="wallet-address">Wallet Address</Label>
                  <Input
                    id="wallet-address"
                    placeholder="0x..."
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !walletAddress}
                  className="w-full"
                >
                  Save Wallet Address
                </Button>
              </form>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletConfigurationSection; 