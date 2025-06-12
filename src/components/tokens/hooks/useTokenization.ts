import { useState, useCallback, useEffect } from 'react';
import { TokenizationManager } from '@/components/tokens/services/TokenizationManager';
import { NetworkEnvironment } from '@/infrastructure/web3/ProviderManager';
import { useToast } from '@/components/ui/use-toast';

export interface TokenizationHookReturn {
  // Environment
  environment: NetworkEnvironment;
  setEnvironment: (env: NetworkEnvironment) => Promise<void>;
  
  // Blockchain methods
  getSupportedBlockchains: () => string[];
  getEVMChains: () => string[];
  getNonEVMChains: () => string[];
  isWalletConnected: (blockchain: string) => Promise<boolean>;
  
  // Token operations
  deployToken: (
    blockchain: string,
    tokenConfig: any,
    walletAddress: string,
    privateKey: string
  ) => Promise<string>;
  getTokenDetails: (blockchain: string, tokenAddress: string) => Promise<any>;
  mintTokens: (
    blockchain: string,
    tokenAddress: string,
    toAddress: string,
    amount: string,
    walletAddress: string,
    privateKey: string,
    tokenId?: string,
    data?: string
  ) => Promise<string>;
  
  // Transaction status
  getTransactionStatus: (blockchain: string, txHash: string) => any;
  pendingTransactions: Record<string, any>;
  
  // State
  isLoading: boolean;
  error: Error | null;
}

/**
 * React hook for interacting with the tokenization manager
 */
export const useTokenization = (): TokenizationHookReturn => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [environment, setEnvironmentState] = useState<NetworkEnvironment>(
    NetworkEnvironment.TESTNET
  );
  const [pendingTransactions, setPendingTransactions] = useState<Record<string, any>>({});
  
  // Get tokenization manager instance
  const tokenizationManager = TokenizationManager.getInstance();
  
  // Set environment
  const setEnvironment = useCallback(async (env: NetworkEnvironment) => {
    try {
      await tokenizationManager.setEnvironment(env);
      setEnvironmentState(env);
    } catch (error) {
      console.error('Error changing environment:', error);
      toast({
        title: 'Environment Change Failed',
        description: `Failed to set environment to ${env}`,
        variant: 'destructive',
      });
    }
  }, [toast]);
  
  // Get supported blockchains
  const getSupportedBlockchains = useCallback(() => {
    return tokenizationManager.getSupportedBlockchains();
  }, []);
  
  // Get EVM chains
  const getEVMChains = useCallback(() => {
    return tokenizationManager.getEVMChains();
  }, []);
  
  // Get non-EVM chains
  const getNonEVMChains = useCallback(() => {
    return tokenizationManager.getNonEVMChains();
  }, []);
  
  // Check if wallet is connected
  const isWalletConnected = useCallback(async (blockchain: string) => {
    try {
      return await tokenizationManager.isWalletConnected(blockchain);
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return false;
    }
  }, []);
  
  // Deploy token
  const deployToken = useCallback(async (
    blockchain: string,
    tokenConfig: any,
    walletAddress: string,
    privateKey: string
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await tokenizationManager.deployToken(
        blockchain,
        tokenConfig,
        walletAddress,
        privateKey
      );
      
      toast({
        title: 'Token Deployed',
        description: `Token successfully deployed at ${result}`,
      });
      
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      toast({
        title: 'Deployment Failed',
        description: error.message,
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  // Get token details
  const getTokenDetails = useCallback(async (
    blockchain: string,
    tokenAddress: string
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      return await tokenizationManager.getTokenDetails(blockchain, tokenAddress);
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Mint tokens
  const mintTokens = useCallback(async (
    blockchain: string,
    tokenAddress: string,
    toAddress: string,
    amount: string,
    walletAddress: string,
    privateKey: string,
    tokenId?: string,
    data?: string
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const txHash = await tokenizationManager.mintTokens(
        blockchain,
        tokenAddress,
        toAddress,
        amount,
        walletAddress,
        privateKey,
        tokenId,
        data
      );
      
      toast({
        title: 'Transaction Submitted',
        description: `Minting transaction submitted with hash: ${txHash.substring(0, 10)}...`,
      });
      
      // Add to pending transactions
      setPendingTransactions(prev => ({
        ...prev,
        [txHash]: {
          type: 'mint',
          blockchain,
          token: tokenAddress,
          to: toAddress,
          amount,
          status: 'pending'
        }
      }));
      
      return txHash;
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      toast({
        title: 'Minting Failed',
        description: error.message,
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  // Get transaction status
  const getTransactionStatus = useCallback((blockchain: string, txHash: string) => {
    return tokenizationManager.getTransactionStatus(blockchain, txHash);
  }, []);
  
  // Periodically update pending transaction statuses
  useEffect(() => {
    if (Object.keys(pendingTransactions).length === 0) return;
    
    const interval = setInterval(() => {
      const updatedTransactions = { ...pendingTransactions };
      let hasChanges = false;
      
      Object.entries(pendingTransactions).forEach(([txHash, tx]) => {
        if (tx.status === 'pending') {
          const status = tokenizationManager.getTransactionStatus(tx.blockchain, txHash);
          
          if (status && status !== 'pending') {
            updatedTransactions[txHash] = {
              ...tx,
              status
            };
            hasChanges = true;
            
            if (status === 'confirmed') {
              toast({
                title: 'Transaction Confirmed',
                description: `Transaction ${txHash.substring(0, 10)}... has been confirmed`,
              });
            } else if (status === 'failed') {
              toast({
                title: 'Transaction Failed',
                description: `Transaction ${txHash.substring(0, 10)}... has failed`,
                variant: 'destructive',
              });
            }
          }
        }
      });
      
      if (hasChanges) {
        setPendingTransactions(updatedTransactions);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [pendingTransactions, toast]);
  
  return {
    // Environment
    environment,
    setEnvironment,
    
    // Blockchain methods
    getSupportedBlockchains,
    getEVMChains,
    getNonEVMChains,
    isWalletConnected,
    
    // Token operations
    deployToken,
    getTokenDetails,
    mintTokens,
    
    // Transaction status
    getTransactionStatus,
    pendingTransactions,
    
    // State
    isLoading,
    error
  };
};