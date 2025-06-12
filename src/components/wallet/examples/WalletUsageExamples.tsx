/**
 * Enterprise Blockchain Wallet - Usage Examples
 * 
 * This file demonstrates how to use the newly implemented wallet features
 * in your application.
 */

import React from 'react';

// Import the main enhanced wallet interface
import { EnhancedWalletInterface } from '@/components/wallet/EnhancedWalletInterface';

// Import individual components if needed
import {
  BlockchainTransfer,
  UniswapV4Swap,
  RipplePayments,
  MoonpayIntegration
} from '@/components/wallet/components';

// Import services for programmatic usage
import {
  transferService,
  swapService,
  ripplePaymentsService,
  moonpayService
} from '@/services/wallet';

// Example 1: Complete Wallet Interface
export const WalletPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <EnhancedWalletInterface defaultTab="transfer" />
    </div>
  );
};

// Example 2: Individual Transfer Component
export const TransferPage: React.FC = () => {
  const handleTransferComplete = (result) => {
    console.log('Transfer completed:', result);
    // Handle success (e.g., show notification, update UI)
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Send Cryptocurrency</h1>
      <BlockchainTransfer onTransferComplete={handleTransferComplete} />
    </div>
  );
};

// Example 3: Swap Integration
export const SwapPage: React.FC = () => {
  const handleSwapComplete = (txHash) => {
    console.log('Swap completed:', txHash);
    // Track transaction, update balances, etc.
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Uniswap V4 Trading</h1>
      <UniswapV4Swap onSwapComplete={handleSwapComplete} />
    </div>
  );
};

// Example 4: Cross-Border Payments
export const PaymentsPage: React.FC = () => {
  const handlePaymentComplete = (result) => {
    console.log('Payment completed:', result);
    // Handle international payment completion
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Cross-Border Payments</h1>
      <RipplePayments onPaymentComplete={handlePaymentComplete} />
    </div>
  );
};

// Example 5: Fiat Gateway
export const BuySellPage: React.FC = () => {
  const handleTransactionComplete = (transaction) => {
    console.log('Moonpay transaction:', transaction);
    // Handle fiat transaction completion
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Buy & Sell Crypto</h1>
      <MoonpayIntegration onTransactionComplete={handleTransactionComplete} />
    </div>
  );
};

// Example 6: Programmatic Service Usage
export const ProgrammaticExamples = {
  
  // Execute a blockchain transfer programmatically
  async executeTransfer() {
    try {
      const estimate = await transferService.estimateTransfer({
        fromWallet: '0x1234...5678',
        toAddress: '0xabcd...efgh',
        amount: '1.0',
        asset: 'ETH',
        blockchain: 'ethereum',
        gasOption: 'standard'
      });

      console.log('Transfer estimate:', estimate);

      const result = await transferService.executeTransfer({
        fromWallet: '0x1234...5678',
        toAddress: '0xabcd...efgh',
        amount: '1.0',
        asset: 'ETH',
        blockchain: 'ethereum',
        gasOption: 'standard'
      });

      console.log('Transfer result:', result);
      return result;
    } catch (error) {
      console.error('Transfer failed:', error);
      throw error;
    }
  },

  // Execute a swap programmatically
  async executeSwap() {
    try {
      const fromToken = {
        address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        logoURI: 'https://example.com/eth.png'
      };

      const toToken = {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        logoURI: 'https://example.com/usdc.png'
      };

      const quote = await swapService.getQuoteWithVersion(
        fromToken,
        toToken,
        '1.0',
        0.5, // 0.5% slippage
        'v4' // Use Uniswap V4
      );

      console.log('Swap quote:', quote);

      const txHash = await swapService.executeSwapWithVersion(
        fromToken,
        toToken,
        '1.0',
        0.5,
        '0x1234...5678', // wallet address
        'v4'
      );

      console.log('Swap transaction:', txHash);
      return txHash;
    } catch (error) {
      console.error('Swap failed:', error);
      throw error;
    }
  },

  // Execute cross-border payment
  async executeCrossBorderPayment() {
    try {
      const quote = await ripplePaymentsService.instance.getPaymentQuote(
        'USD',
        'MXN',
        '100',
        'US',
        'MX'
      );

      console.log('Payment quote:', quote);

      const payment = await ripplePaymentsService.instance.createCrossBorderPayment(
        'US',
        'MX',
        'USD',
        'MXN',
        '100',
        {
          name: 'John Doe',
          address: '123 Main St, Mexico City',
          accountNumber: '1234567890',
          routingCode: 'ABCDMXMM'
        }
      );

      console.log('Payment created:', payment);
      return payment;
    } catch (error) {
      console.error('Payment failed:', error);
      throw error;
    }
  },

  // Buy crypto with fiat
  async buyCrypto() {
    try {
      const quote = await moonpayService.getBuyQuote('usd', 'btc', 100);
      console.log('Buy quote:', quote);

      const transaction = await moonpayService.createBuyTransaction(
        'btc',
        'usd',
        100,
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' // Bitcoin address
      );

      console.log('Buy transaction:', transaction);
      return transaction;
    } catch (error) {
      console.error('Buy failed:', error);
      throw error;
    }
  }
};

// Example 7: Next.js Page Integration
export default function WalletDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold">Enterprise Wallet</h1>
          <p className="text-muted-foreground mt-2">
            Complete blockchain operations with real integrations
          </p>
        </div>
        
        <EnhancedWalletInterface />
      </div>
    </div>
  );
}

// Example 8: Custom Hook for Wallet Operations
export const useWalletOperations = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const executeOperation = async (operation: () => Promise<any>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await operation();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    executeTransfer: (params) => executeOperation(() => transferService.executeTransfer(params)),
    executeSwap: (params) => executeOperation(() => {
      const { fromToken, toToken, amount, slippage, walletAddress } = params;
      return swapService.executeSwap(fromToken, toToken, amount, slippage, walletAddress);
    }),
    executePayment: (params) => executeOperation(() => ripplePaymentsService.instance.executePayment(params)),
    buyWithMoonpay: (params) => executeOperation(() => {
      const { quoteCurrency, baseCurrency, baseAmount, walletAddress } = params;
      return moonpayService.createBuyTransaction(quoteCurrency, baseCurrency, baseAmount, walletAddress);
    })
  };
};
