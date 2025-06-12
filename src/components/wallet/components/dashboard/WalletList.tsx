import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet as WalletType } from "@/services/wallet/WalletContext";
import { ChevronRight, UserPlus, Copy, Info, Wallet, Users, Shield } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface WalletListProps {
  wallets: WalletType[];
  selectedWalletId: string | undefined;
  onSelectWallet: (walletId: string) => void;
  loading?: boolean;
}

export const WalletList: React.FC<WalletListProps> = ({
  wallets,
  selectedWalletId,
  onSelectWallet,
  loading = false,
}) => {
  const { toast } = useToast();

  // Function to copy wallet address to clipboard
  const copyAddress = (address: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    toast({
      title: "Address copied",
      description: "Wallet address copied to clipboard",
    });
  };

  // Format address for display
  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Format balance with commas and currency symbol
  const formatBalance = (balance: string | undefined) => {
    if (!balance) return "$0";
    
    const numericBalance = parseFloat(balance);
    return numericBalance.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Render loading skeletons when data is loading
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Wallets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-[100px] mb-2" />
                  <Skeleton className="h-4 w-[70px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state if no wallets
  if (wallets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Wallets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No wallets found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              You haven't created any wallets yet. Create your first wallet to get started.
            </p>
            <Button className="mt-4">
              <UserPlus className="mr-2 h-4 w-4" />
              Create Wallet
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Wallets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {wallets.map((wallet) => (
            <div
              key={wallet.id}
              className={`flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                wallet.id === selectedWalletId ? "bg-muted/50 border-primary" : ""
              }`}
              onClick={() => onSelectWallet(wallet.id)}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">{wallet.name}</h3>
                  {wallet.type === "multisig" && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-50">
                      <Users className="h-3 w-3 mr-1" />
                      MultiSig
                    </Badge>
                  )}
                  {wallet.type === "eoa" && (
                    <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50">
                      <Shield className="h-3 w-3 mr-1" />
                      EOA
                    </Badge>
                  )}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <p className="mr-2">{formatAddress(wallet.address)}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={(e) => copyAddress(wallet.address, e)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground capitalize">
                  {wallet.network}
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex justify-between items-end md:flex-col md:items-end">
                <div className="text-xl font-bold">
                  {formatBalance(wallet.balance)}
                </div>
                <div className="flex items-center">
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <Info className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};