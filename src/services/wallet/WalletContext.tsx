/// <reference types="vite/client" />

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WalletAddressReceiver, WalletAddressMessage } from '@/services/wallet/WalletAddressReceiver';
import { ETHWalletGenerator, GeneratedWallet } from '@/services/wallet/generators/ETHWalletGenerator';
import { EthereumProvider, getEthereumProvider } from '@/types/domain/blockchain/ethereum';
import { detectWallets } from "@/infrastructure/web3/wallet/walletDetector";
import { useToast } from '@/components/ui/use-toast';
import { balanceService } from '@/services/wallet/balances/BalanceService';

// Wallet types
export type WalletType = 'eoa' | 'multisig';

export interface Wallet {
  id: string;
  name: string;
  address: string;
  type: WalletType;
  network: string;
  balance?: string;
  owners?: string[];
  threshold?: number;
  createdAt: Date;
}

// Context interface
interface WalletContextProps {
  wallets: Wallet[];
  loading: boolean;
  error: string | null;
  selectedWallet: Wallet | null;
  receivedAddresses: WalletAddressMessage[];
  wsConnected: boolean;
  
  // Actions
  createWallet: (name: string, type: WalletType, network: string) => Promise<Wallet>;
  selectWallet: (walletId: string) => void;
  generateNewAddress: () => GeneratedWallet;
  importWallet: (privateKey: string, name: string, network: string) => Promise<Wallet>;
  clearReceivedAddresses: () => void;
  reconnectWebSocket: () => void;
  connectWallet: () => Promise<void>;
  refreshBalances: () => Promise<void>;
}

// Default context value
const defaultContextValue: WalletContextProps = {
  wallets: [],
  loading: false,
  error: null,
  selectedWallet: null,
  receivedAddresses: [],
  wsConnected: false,
  
  createWallet: async () => {
    throw new Error('Not implemented');
  },
  selectWallet: () => {},
  generateNewAddress: () => {
    throw new Error('Not implemented');
  },
  importWallet: async () => {
    throw new Error('Not implemented');
  },
  clearReceivedAddresses: () => {},
  reconnectWebSocket: () => {},
  connectWallet: async () => {
    throw new Error('Not implemented');
  },
  refreshBalances: async () => {
    throw new Error('Not implemented');
  },
};

// Create the context
const WalletContext = createContext<WalletContextProps>(defaultContextValue);

// WebSocket URL for receiving addresses
const WS_URL = import.meta.env.VITE_WALLET_WS_URL || 
  (import.meta.env.MODE === 'development' ? null : 'ws://localhost:8080/ws');

// Provider component
export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [receivedAddresses, setReceivedAddresses] = useState<WalletAddressMessage[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [addressReceiver, setAddressReceiver] = useState<WalletAddressReceiver | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    // Skip WebSocket initialization if URL is not provided
    if (!WS_URL) {
      setWsConnected(false);
      setError('WebSocket disabled in development mode');
      return;
    }

    const receiver = new WalletAddressReceiver(WS_URL);
    
    receiver.onConnected(() => {
      setWsConnected(true);
      setError(null);
    });
    
    receiver.onNewAddress((address) => {
      setReceivedAddresses(prev => [...prev, address]);
    });
    
    receiver.onError(() => {
      setWsConnected(false);
      setError('WebSocket connection disabled in development mode');
    });
    
    receiver.connect();
    setAddressReceiver(receiver);
    
    return () => {
      receiver.disconnect();
    };
  }, []);

  // Load wallets from storage/API
  useEffect(() => {
    const loadWallets = async () => {
      setLoading(true);
      try {
        // Try to load wallets from localStorage first
        const storedWallets = localStorage.getItem('userWallets');
        let loadedWallets: Wallet[] = [];
        
        if (storedWallets) {
          loadedWallets = JSON.parse(storedWallets).map((w: any) => ({
            ...w,
            createdAt: new Date(w.createdAt)
          }));
        }
        
        setWallets(loadedWallets);
        
        // Select the first wallet by default if none selected
        if (loadedWallets.length > 0 && !selectedWallet) {
          setSelectedWallet(loadedWallets[0]);
        }
      } catch (err) {
        setError('Failed to load wallets');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadWallets();
  }, []);

  // Helper function to save wallets to localStorage
  const saveWalletsToStorage = (wallets: Wallet[]) => {
    try {
      localStorage.setItem('userWallets', JSON.stringify(wallets));
    } catch (error) {
      console.error('Failed to save wallets to storage:', error);
    }
  };

  // Create a new wallet
  const createWallet = async (name: string, type: WalletType, network: string): Promise<Wallet> => {
    setLoading(true);
    try {
      let newWallet: Wallet;
      
      if (type === 'eoa') {
        // Generate a new EOA wallet using the appropriate generator based on network
        let generated: any;
        
        if (network === 'ethereum' || network === 'polygon' || network === 'arbitrum' || network === 'optimism' || network === 'avalanche') {
          generated = ETHWalletGenerator.generateMultipleWallets(1, { includePrivateKey: false })[0];
        } else {
          // For other networks, use ETH generator as fallback (most are EVM compatible)
          generated = ETHWalletGenerator.generateMultipleWallets(1, { includePrivateKey: false })[0];
        }
        
        newWallet = {
          id: Date.now().toString(),
          name,
          address: generated.address,
          type,
          network,
          balance: '0',
          createdAt: new Date(),
        };
      } else {
        // For MultiSig, generate a real wallet and then we'd deploy a multisig contract
        // For now, generate an EOA that will become a multisig
        const generated = ETHWalletGenerator.generateMultipleWallets(1, { includePrivateKey: false })[0];
        
        newWallet = {
          id: Date.now().toString(),
          name,
          address: generated.address,
          type,
          network,
          balance: '0',
          owners: [generated.address], // The generated address is the first owner
          threshold: 1, // Default threshold
          createdAt: new Date(),
        };
      }
      
      // Update the wallets state and save to storage
      const updatedWallets = [...wallets, newWallet];
      setWallets(updatedWallets);
      saveWalletsToStorage(updatedWallets);
      
      toast({
        title: "Wallet Created",
        description: `${name} has been successfully created`,
      });
      
      return newWallet;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create wallet';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Select a wallet
  const selectWallet = (walletId: string) => {
    const wallet = wallets.find(w => w.id === walletId) || null;
    setSelectedWallet(wallet);
  };

  // Generate a new ETH address
  const generateNewAddress = (): GeneratedWallet => {
    try {
      return ETHWalletGenerator.generateMultipleWallets(1, { includePrivateKey: true })[0];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate address';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Import a wallet using private key
  const importWallet = async (privateKey: string, name: string, network: string): Promise<Wallet> => {
    setLoading(true);
    try {
      const imported = ETHWalletGenerator.fromPrivateKey(privateKey, { includePrivateKey: false });
      
      const newWallet: Wallet = {
        id: Date.now().toString(),
        name,
        address: imported.address,
        type: 'eoa',
        network,
        balance: '0',
        createdAt: new Date(),
      };
      
      // Update the wallets state and save to storage
      const updatedWallets = [...wallets, newWallet];
      setWallets(updatedWallets);
      saveWalletsToStorage(updatedWallets);
      
      toast({
        title: "Wallet Imported",
        description: `${name} has been successfully imported`,
      });
      
      return newWallet;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import wallet';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Clear received addresses
  const clearReceivedAddresses = () => {
    setReceivedAddresses([]);
  };

  // Reconnect to WebSocket
  const reconnectWebSocket = () => {
    if (addressReceiver) {
      addressReceiver.disconnect();
      addressReceiver.connect();
    }
  };

  // Connect a wallet (for web3 providers like MetaMask)
  const connectWallet = async (): Promise<void> => {
    try {
      setLoading(true);
      // This would connect to MetaMask or another browser wallet
      const ethereumProvider = getEthereumProvider();
      if (ethereumProvider) {
        await ethereumProvider.request({ method: 'eth_requestAccounts' });
        const address = (await ethereumProvider.request({ method: 'eth_accounts' }))[0];
        
        // Check if this wallet already exists in our list
        const existingWallet = wallets.find(w => w.address.toLowerCase() === address.toLowerCase());
        
        if (existingWallet) {
          setSelectedWallet(existingWallet);
        } else {
          // Create a new wallet entry for this address
          const connectedWallet: Wallet = {
            id: Date.now().toString(),
            name: 'Connected Wallet',
            address,
            type: 'eoa',
            network: 'ethereum',
            balance: '0', // This would be updated with a real balance check
            createdAt: new Date(),
          };
          
          const updatedWallets = [...wallets, connectedWallet];
          setWallets(updatedWallets);
          saveWalletsToStorage(updatedWallets);
          setSelectedWallet(connectedWallet);
        }
        
        toast({
          title: "Wallet Connected",
          description: "Your wallet has been successfully connected",
        });
      } else {
        throw new Error('No wallet provider found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Add wallet detection when the context initializes
  useEffect(() => {
    // Pre-detect wallet availability for the entire app
    const preDetectWallets = async () => {
      try {
        await detectWallets();
      } catch (error) {
        console.error('Error pre-detecting wallets:', error);
      }
    };
    
    preDetectWallets();
  }, []);

  // Refresh wallet balances
  const refreshBalances = async () => {
    if (!wallets.length) return;
    
    setLoading(true);
    try {
      // Fetch updated balances for all wallets
      const balancePromises = wallets.map(wallet => 
        balanceService.fetchWalletBalance(wallet.address, wallet.network)
      );
      
      const balances = await Promise.all(balancePromises);
      
      // Update wallets with new balances
      const updatedWallets = wallets.map((wallet, index) => ({
        ...wallet,
        balance: balances[index].totalValueUsd.toFixed(2),
      }));
      
      setWallets(updatedWallets);
      saveWalletsToStorage(updatedWallets);
      
      toast({
        title: "Balances Updated",
        description: "All wallet balances have been refreshed",
      });
    } catch (error) {
      console.error('Error refreshing balances:', error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to refresh wallet balances",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallets,
        loading,
        error,
        selectedWallet,
        receivedAddresses,
        wsConnected,
        createWallet,
        selectWallet,
        generateNewAddress,
        importWallet,
        clearReceivedAddresses,
        reconnectWebSocket,
        connectWallet,
        refreshBalances,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

// Hook to use the wallet context
export const useWallet = () => useContext(WalletContext);