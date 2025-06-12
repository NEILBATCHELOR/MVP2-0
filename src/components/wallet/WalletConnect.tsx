import React, { useState, useEffect, useCallback } from 'react';
import { WagmiProvider, useAccount, useConnect, useDisconnect, useEnsName, useEnsAvatar } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { createWalletConfig } from '@/infrastructure/web3/wallet/walletConnectors';
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Loader2 } from "lucide-react";
import { Wallet } from "lucide-react";
import type { WalletError } from "@/types/domain/wallet/wallet";
import { getDetectedWallets, DetectedWallet } from '@/infrastructure/web3/wallet/walletDetector';

// Create a client for React Query
const queryClient = new QueryClient();

// Create wagmi config with wallet connections
const wagmiConfig = createWalletConfig();

interface WalletConnectProps {
  children?: React.ReactNode;
}

export const WalletConnectProvider: React.FC<WalletConnectProps> = ({ children }) => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
};

interface WalletConnectButtonProps {
  onConnect?: (address: string) => void;
}

export const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({ onConnect }) => {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! });
  const [isOpen, setIsOpen] = useState(false);
  const [connectingConnector, setConnectingConnector] = useState<string | null>(null);
  const [walletDetection, setWalletDetection] = useState<DetectedWallet[]>([]);
  const { toast } = useToast();

  // Detect available wallets when component mounts
  useEffect(() => {
    detectAvailableWallets();
  }, []);

  // Detect available wallets when dialog opens
  useEffect(() => {
    if (isOpen) {
      detectAvailableWallets();
    }
  }, [isOpen]);

  const detectAvailableWallets = async () => {
    try {
      const detection = getDetectedWallets();
      setWalletDetection(detection);
    } catch (error) {
      console.error('Failed to detect wallets:', error);
    }
  };

  useEffect(() => {
    if (isConnected && address && onConnect) {
      onConnect(address);
    }
  }, [isConnected, address, onConnect]);

  useEffect(() => {
    if (error) {
      const walletError = error as WalletError;
      toast({
        title: "Connection Error",
        description: walletError.message || "Failed to connect wallet",
        variant: "destructive",
      });
      setConnectingConnector(null);
    }
  }, [error, toast]);

  const handleConnect = async (connector: any) => {
    // Prevent multiple simultaneous connection attempts
    if (connectingConnector) {
      console.log(`Connection to ${connectingConnector} already in progress. Please wait.`);
      return;
    }
    
    try {
      setConnectingConnector(connector.id);
      
      // Special handling for Chain Capital which is your internal wallet
      if (connector.name === 'Chain Capital') {
        // This simulates connecting to your internal wallet
        // In production, you would integrate with your actual wallet system
        const dummyAddress = "0x7Fc98a135E7107396C53f3aFbBe271ab82A54D8F";
        
        // Call the onConnect callback with the address
        if (onConnect) {
          onConnect(dummyAddress);
        }
        
        // Close the dialog
        setIsOpen(false);
        
        // Show success toast
        toast({
          title: "Connected",
          description: "Successfully connected to Chain Capital wallet",
        });
        
        return;
      }
      
      // Regular wallet connection for other wallets
      try {
        console.log(`Connecting to ${connector.name}...`);
        await connect({ connector });
        console.log(`Successfully connected to ${connector.name}`);
        setIsOpen(false);
      } catch (err) {
        console.error(`Error connecting to ${connector.name}:`, err);
        toast({
          title: "Connection Failed",
          description: err instanceof Error ? err.message : "Failed to connect wallet",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
      toast({
        title: "Connection Failed",
        description: err instanceof Error ? err.message : "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setConnectingConnector(null);
    }
  };

  const displayAddress = address ? 
    `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : 
    '';

  const displayName = ensName || displayAddress;

  // Filter to only show MetaMask and Chain Capital connectors
  const availableConnectors = connectors
    .filter(c => c.name === 'MetaMask' || c.name === 'Chain Capital' || c.name === 'Injected')
    .map(connector => {
      // Rename 'Injected' to 'Browser' in the UI
      if (connector.name === 'Injected') {
        return { ...connector, name: 'Browser' };
      }
      return connector;
    });

  const getWalletInstallUrl = (walletName: string) => {
    switch (walletName) {
      case 'MetaMask':
        return 'https://metamask.io/download/';
      case 'Chain Capital':
        return 'https://chaincapital.com/wallet';
      case 'Browser':
      case 'Injected':
        return 'https://metamask.io/download/';
      default:
        return '';
    }
  };

  const getWalletIcon = (walletName: string) => {
    switch (walletName) {
      case 'Chain Capital':
        return '/assets/chain-capital-wallet.svg';
      case 'MetaMask':
        return 'https://cdn.iconscout.com/icon/free/png-256/free-metamask-2728406-2261817.png';
      case 'Browser':
      case 'Injected':
        return 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg';
      default:
        return '';
    }
  };

  const getWalletDescription = (walletName: string) => {
    switch (walletName) {
      case 'Chain Capital':
        return 'Chain Capital\'s secure internal institutional wallet with multi-signature support';
      case 'MetaMask':
        return 'Popular browser extension for accessing Ethereum and other networks';
      case 'Browser':
      case 'Injected':
        return 'Use browser wallet extension';
      default:
        return '';
    }
  };

  // Check if a wallet is installed based on the wallet name
  const isWalletInstalled = (walletName: string): boolean => {
    const wallet = walletDetection.find(w => 
      w.name.toLowerCase() === walletName.toLowerCase() || 
      w.id === walletName.toLowerCase()
    );
    return wallet?.installed || false;
  };

  return (
    <>
      {isConnected ? (
        <div className="flex items-center space-x-2">
          {ensAvatar && (
            <img 
              src={ensAvatar} 
              alt="ENS Avatar" 
              className="h-6 w-6 rounded-full"
            />
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => disconnect()}
            className="flex items-center gap-2"
          >
            {displayName}
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          </Button>
        </div>
      ) : (
        <Button 
          onClick={() => {
            setIsOpen(true);
            detectAvailableWallets();
          }}
          disabled={isPending}
          className="flex items-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </>
          )}
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
            <DialogDescription>
              Select a wallet to connect to the platform. 
              <span className="font-medium text-primary"> Chain Capital is our recommended internal wallet.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Add a note explaining what's happening if no connectors are available */}
            {availableConnectors.length === 0 && (
              <Alert>
                <AlertDescription>
                  No wallet connectors are available. Please check your browser settings or try refreshing the page.
                </AlertDescription>
              </Alert>
            )}
            
            {availableConnectors.map((connector) => (
              <Card 
                key={connector.uid} 
                className={`p-4 cursor-pointer transition-all ${
                  isWalletInstalled(connector.name) 
                    ? "hover:border-primary hover:shadow-sm" 
                    : "opacity-70"
                }`}
                onClick={() => {
                  if (!connectingConnector && isWalletInstalled(connector.name)) {
                    handleConnect(connector);
                  }
                }}
              >
                <div className="flex items-center gap-3 w-full relative">
                  <div className="flex-shrink-0 w-8 h-8 relative">
                    <img 
                      src={getWalletIcon(connector.name)} 
                      alt={`${connector.name} icon`} 
                      className="h-8 w-8"
                    />
                    {connectingConnector === connector.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-start flex-grow">
                    <span className="font-medium">{connector.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getWalletDescription(connector.name)}
                    </span>
                  </div>
                  {isWalletInstalled(connector.name) ? (
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      Available
                    </div>
                  ) : (
                    <div className="bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs font-medium">
                      Not available
                    </div>
                  )}
                </div>
                
                {/* Installation guidance for non-installed wallets */}
                {!isWalletInstalled(connector.name) && (
                  <div className="mt-2 px-1">
                    <Alert>
                      <AlertDescription className="flex items-center justify-between">
                        <span>This wallet needs to be installed first</span>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0"
                          asChild
                        >
                          <a 
                            href={getWalletInstallUrl(connector.name)}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Install <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WalletConnectButton;