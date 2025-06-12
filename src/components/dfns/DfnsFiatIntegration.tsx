/**
 * DFNS Fiat Integration Component
 * 
 * Provides comprehensive fiat on/off-ramp functionality with
 * Ramp Network and Mt Pelerin integration through DFNS infrastructure.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  CreditCard, 
  Banknote, 
  ArrowRightLeft, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Quote,
  Activity,
  Zap
} from 'lucide-react';

import type {
  FiatProvider,
  FiatTransactionResponse,
  FiatOnRampRequest,
  FiatOffRampRequest,
  SupportedCurrency,
  PaymentMethod,
  FiatTransactionStatus,
  BankAccountInfo,
  FiatQuoteRequest,
  FiatQuoteResponse
} from '@/types/dfns/fiat';
import type { Wallet } from '@/types/dfns';
import { DfnsFiatManager, RampNetworkManager } from '@/infrastructure/dfns';

export interface DfnsFiatIntegrationProps {
  wallet: Wallet;
  fiatManager?: DfnsFiatManager;
  onTransactionCreated?: (transaction: FiatTransactionResponse) => void;
  onError?: (error: string) => void;
  onQuoteReceived?: (quote: FiatQuoteResponse) => void;
  enableQuotes?: boolean;
  enableNativeFlow?: boolean;
  className?: string;
}

interface FiatTransaction {
  id: string;
  type: 'onramp' | 'offramp';
  status: FiatTransactionStatus;
  amount: string;
  currency: string;
  cryptoAsset: string;
  provider: FiatProvider;
  createdAt: string;
  paymentUrl?: string;
  rampPurchaseId?: string;
  rampSaleId?: string;
}

interface EnhancedAssetInfo {
  symbol: string;
  name: string;
  chain: string;
  logoUrl: string;
  enabled: boolean;
  price: Record<string, number>;
  minAmount: number;
  maxAmount: number;
}

export const DfnsFiatIntegration: React.FC<DfnsFiatIntegrationProps> = ({
  wallet,
  fiatManager,
  onTransactionCreated,
  onError,
  onQuoteReceived,
  enableQuotes = true,
  enableNativeFlow = true,
  className
}) => {
  // ===== State Management =====
  const [activeTab, setActiveTab] = useState<'onramp' | 'offramp'>('onramp');
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [supportedCurrencies, setSupportedCurrencies] = useState<SupportedCurrency[]>([]);
  const [supportedPaymentMethods, setSupportedPaymentMethods] = useState<PaymentMethod[]>([]);
  const [supportedAssets, setSupportedAssets] = useState<EnhancedAssetInfo[]>([]);
  const [transactions, setTransactions] = useState<FiatTransaction[]>([]);
  const [currentQuote, setCurrentQuote] = useState<FiatQuoteResponse | null>(null);
  const [rampManager, setRampManager] = useState<RampNetworkManager | null>(null);

  // ===== Enhanced Form State =====
  const [onRampForm, setOnRampForm] = useState<Partial<FiatOnRampRequest>>({
    amount: '',
    currency: 'USD',
    cryptoAsset: 'ETH',
    walletAddress: wallet.address,
    paymentMethod: 'card',
    provider: 'ramp_network'
  });

  // ===== Off-Ramp Form State =====
  const [offRampForm, setOffRampForm] = useState<Partial<FiatOffRampRequest>>({
    amount: '',
    currency: 'USD',
    cryptoAsset: 'ETH',
    walletAddress: wallet.address,
    provider: 'ramp_network'
  });

  const [bankAccount, setBankAccount] = useState<Partial<BankAccountInfo>>({
    accountNumber: '',
    routingNumber: '',
    accountHolderName: '',
    bankName: '',
    country: 'US',
    currency: 'USD'
  });

  // ===== Effects =====
  useEffect(() => {
    initializeComponent();
  }, [fiatManager]);

  useEffect(() => {
    // Set up quote polling if quote is active
    if (currentQuote && enableQuotes) {
      const quoteRefreshInterval = setInterval(() => {
        refreshQuote();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(quoteRefreshInterval);
    }
  }, [currentQuote, enableQuotes]);

  // ===== Enhanced Initialization =====
  const initializeComponent = async () => {
    try {
      await Promise.all([
        loadSupportedOptions(),
        loadSupportedAssets(),
        loadTransactionHistory(),
        initializeRampManager()
      ]);
    } catch (error) {
      onError?.('Failed to initialize fiat integration');
    }
  };

  const initializeRampManager = async () => {
    if (fiatManager) {
      const manager = fiatManager.getRampNetworkManager();
      setRampManager(manager);

      // Set up event listeners
      manager.addEventListener('purchase_created', handleRampPurchaseCreated);
      manager.addEventListener('offramp_sale_created', handleRampSaleCreated);
      manager.addEventListener('widget_close', handleWidgetClose);
      manager.addEventListener('send_crypto_request', handleSendCryptoRequest);
    }
  };

  // ===== Enhanced API Functions =====
  const loadSupportedAssets = async () => {
    if (fiatManager) {
      try {
        const [onrampAssets, offrampAssets] = await Promise.all([
          fiatManager.getEnhancedSupportedAssets(),
          fiatManager.getEnhancedSupportedOffRampAssets()
        ]);

        const allAssets = new Map<string, EnhancedAssetInfo>();
        
        // Process on-ramp assets
        if (onrampAssets.data) {
          onrampAssets.data.forEach((asset: any) => {
            allAssets.set(asset.symbol, {
              symbol: asset.symbol,
              name: asset.name,
              chain: asset.chain || 'ETH',
              logoUrl: asset.logoUrl,
              enabled: asset.enabled,
              price: asset.price || {},
              minAmount: asset.minPurchaseAmount || 0,
              maxAmount: asset.maxPurchaseAmount || Infinity
            });
          });
        }

        // Process off-ramp assets
        if (offrampAssets.data) {
          offrampAssets.data.forEach((asset: any) => {
            if (!allAssets.has(asset.symbol)) {
              allAssets.set(asset.symbol, {
                symbol: asset.symbol,
                name: asset.name,
                chain: asset.chain || 'ETH',
                logoUrl: asset.logoUrl,
                enabled: asset.enabled,
                price: asset.price || {},
                minAmount: asset.minPurchaseAmount || 0,
                maxAmount: asset.maxPurchaseAmount || Infinity
              });
            }
          });
        }

        setSupportedAssets(Array.from(allAssets.values()));
      } catch (error) {
        console.error('Failed to load supported assets:', error);
      }
    } else {
      // Fallback to default assets
      setSupportedAssets([
        { symbol: 'ETH', name: 'Ethereum', chain: 'ETH', logoUrl: '/crypto-icons/eth.svg', enabled: true, price: { USD: 2000 }, minAmount: 20, maxAmount: 10000 },
        { symbol: 'BTC', name: 'Bitcoin', chain: 'BTC', logoUrl: '/crypto-icons/btc.svg', enabled: true, price: { USD: 45000 }, minAmount: 20, maxAmount: 10000 },
        { symbol: 'USDC', name: 'USD Coin', chain: 'ETH', logoUrl: '/crypto-icons/usdc.svg', enabled: true, price: { USD: 1 }, minAmount: 20, maxAmount: 10000 },
        { symbol: 'USDT', name: 'Tether', chain: 'ETH', logoUrl: '/crypto-icons/usdt.svg', enabled: true, price: { USD: 1 }, minAmount: 20, maxAmount: 10000 }
      ]);
    }
  };

  const getQuote = async (request: Omit<FiatQuoteRequest, 'type'> & { type: 'onramp' | 'offramp' }) => {
    if (!fiatManager || !enableQuotes) return;

    setQuoteLoading(true);
    try {
      const quoteRequest: FiatQuoteRequest = {
        ...request,
        provider: 'ramp_network'
      };

      const response = await fiatManager.getQuote(quoteRequest);
      
      if (response.data) {
        setCurrentQuote(response.data);
        onQuoteReceived?.(response.data);
      } else {
        onError?.(response.error?.message || 'Failed to get quote');
      }
    } catch (error) {
      onError?.('Failed to get quote');
    } finally {
      setQuoteLoading(false);
    }
  };

  const refreshQuote = useCallback(async () => {
    if (!currentQuote) return;

    const request: FiatQuoteRequest = {
      amount: currentQuote.fromAmount,
      fromCurrency: currentQuote.fromCurrency,
      toCurrency: currentQuote.toCurrency,
      type: currentQuote.type,
      paymentMethod: currentQuote.paymentMethod,
      provider: currentQuote.provider
    };

    await getQuote(request);
  }, [currentQuote, fiatManager, enableQuotes]);

  // ===== Event Handlers =====
  const handleRampPurchaseCreated = (data: any) => {
    console.log('RAMP purchase created:', data);
    
    const transaction: FiatTransaction = {
      id: data.purchase.id,
      type: 'onramp',
      status: 'pending',
      amount: data.purchase.fiatValue.toString(),
      currency: data.purchase.fiatCurrency,
      cryptoAsset: data.purchase.asset.symbol,
      provider: 'ramp_network',
      createdAt: data.purchase.createdAt,
      rampPurchaseId: data.purchase.id
    };

    setTransactions(prev => [transaction, ...prev]);
    
    onTransactionCreated?.({
      id: transaction.id,
      provider: 'ramp_network',
      type: 'onramp',
      status: 'pending',
      amount: transaction.amount,
      currency: transaction.currency,
      cryptoAsset: transaction.cryptoAsset,
      walletAddress: wallet.address,
      providerTransactionId: data.purchase.id,
      createdAt: transaction.createdAt,
      updatedAt: transaction.createdAt
    });
  };

  const handleRampSaleCreated = (data: any) => {
    console.log('RAMP sale created:', data);
    
    const transaction: FiatTransaction = {
      id: data.sale.id,
      type: 'offramp',
      status: 'pending',
      amount: data.sale.crypto.amount,
      currency: data.sale.fiat.currencySymbol,
      cryptoAsset: data.sale.crypto.assetInfo.symbol,
      provider: 'ramp_network',
      createdAt: data.sale.createdAt,
      rampSaleId: data.sale.id
    };

    setTransactions(prev => [transaction, ...prev]);
    
    onTransactionCreated?.({
      id: transaction.id,
      provider: 'ramp_network',
      type: 'offramp',
      status: 'pending',
      amount: transaction.amount,
      currency: transaction.currency,
      cryptoAsset: transaction.cryptoAsset,
      walletAddress: wallet.address,
      providerTransactionId: data.sale.id,
      createdAt: transaction.createdAt,
      updatedAt: transaction.createdAt
    });
  };

  const handleWidgetClose = () => {
    console.log('RAMP widget closed');
    setLoading(false);
  };

  const handleSendCryptoRequest = (data: any) => {
    console.log('RAMP send crypto request:', data);
    // This would trigger the native flow crypto sending
    // Implementation depends on wallet integration
    if (enableNativeFlow) {
      // Handle native flow crypto sending
      // This would typically call wallet.sendTransaction()
    }
  };
  const loadSupportedOptions = async () => {
    try {
      // Mock data - replace with actual DFNS API calls
      setSupportedCurrencies([
        { code: 'USD', name: 'US Dollar', decimals: 2, symbol: '$' },
        { code: 'EUR', name: 'Euro', decimals: 2, symbol: '€' },
        { code: 'GBP', name: 'British Pound', decimals: 2, symbol: '£' },
        { code: 'CAD', name: 'Canadian Dollar', decimals: 2, symbol: 'C$' }
      ]);

      setSupportedPaymentMethods([
        { id: 'card', name: 'Credit/Debit Card', type: 'instant' },
        { id: 'bank_transfer', name: 'Bank Transfer', type: 'standard' },
        { id: 'sepa', name: 'SEPA Transfer', type: 'standard' },
        { id: 'apple_pay', name: 'Apple Pay', type: 'instant' },
        { id: 'google_pay', name: 'Google Pay', type: 'instant' }
      ]);
    } catch (error) {
      onError?.('Failed to load supported options');
    }
  };

  const loadTransactionHistory = async () => {
    try {
      // Mock data - replace with actual DFNS API calls
      setTransactions([
        {
          id: 'tx_1',
          type: 'onramp',
          status: 'completed',
          amount: '500.00',
          currency: 'USD',
          cryptoAsset: 'ETH',
          provider: 'ramp_network',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'tx_2',
          type: 'offramp',
          status: 'processing',
          amount: '250.00',
          currency: 'EUR',
          cryptoAsset: 'USDC',
          provider: 'mt_pelerin',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ]);
    } catch (error) {
      console.error('Failed to load transaction history:', error);
    }
  };

  const createOnRampTransaction = async () => {
    if (!onRampForm.amount || !onRampForm.currency || !onRampForm.cryptoAsset) {
      onError?.('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      if (fiatManager) {
        // Use enhanced DFNS fiat manager with RAMP Network integration
        const response = await fiatManager.createOnRampTransaction({
          amount: onRampForm.amount,
          currency: onRampForm.currency,
          cryptoAsset: onRampForm.cryptoAsset,
          walletAddress: onRampForm.walletAddress!,
          paymentMethod: onRampForm.paymentMethod,
          provider: onRampForm.provider as FiatProvider,
          userEmail: onRampForm.userEmail,
          metadata: {
            enableNativeFlow,
            source: 'dfns_integration'
          }
        });

        if (response.data) {
          onTransactionCreated?.(response.data);
          
          // Reset form
          setOnRampForm({
            ...onRampForm,
            amount: ''
          });

          // Clear current quote
          setCurrentQuote(null);
        } else {
          onError?.(response.error?.message || 'Failed to create on-ramp transaction');
        }
      } else {
        // Fallback to legacy implementation
        await legacyCreateOnRampTransaction();
      }

      // Refresh transaction history
      loadTransactionHistory();

    } catch (error) {
      onError?.('Failed to create on-ramp transaction');
    } finally {
      setLoading(false);
    }
  };

  const createOffRampTransaction = async () => {
    if (!offRampForm.amount || !offRampForm.currency || !offRampForm.cryptoAsset || !bankAccount.accountNumber) {
      onError?.('Please fill in all required fields including bank account information');
      return;
    }

    setLoading(true);
    try {
      if (fiatManager) {
        // Use enhanced DFNS fiat manager with RAMP Network integration
        const response = await fiatManager.createOffRampTransaction({
          amount: offRampForm.amount,
          currency: offRampForm.currency,
          cryptoAsset: offRampForm.cryptoAsset,
          walletAddress: offRampForm.walletAddress!,
          bankAccount: bankAccount as BankAccountInfo,
          provider: offRampForm.provider as FiatProvider,
          userEmail: offRampForm.userEmail,
          metadata: {
            enableNativeFlow,
            source: 'dfns_integration'
          }
        });

        if (response.data) {
          onTransactionCreated?.(response.data);
          
          // Reset form
          setOffRampForm({
            ...offRampForm,
            amount: ''
          });
          setBankAccount({
            accountNumber: '',
            routingNumber: '',
            accountHolderName: '',
            bankName: '',
            country: 'US',
            currency: 'USD'
          });

          // Clear current quote
          setCurrentQuote(null);
        } else {
          onError?.(response.error?.message || 'Failed to create off-ramp transaction');
        }
      } else {
        // Fallback to legacy implementation
        await legacyCreateOffRampTransaction();
      }

      // Refresh transaction history
      loadTransactionHistory();

    } catch (error) {
      onError?.('Failed to create off-ramp transaction');
    } finally {
      setLoading(false);
    }
  };

  // ===== Quote Handling =====
  const handleGetQuote = async () => {
    if (activeTab === 'onramp') {
      if (!onRampForm.amount || !onRampForm.currency || !onRampForm.cryptoAsset) {
        onError?.('Please fill in amount, currency, and crypto asset to get a quote');
        return;
      }

      await getQuote({
        amount: onRampForm.amount,
        fromCurrency: onRampForm.currency,
        toCurrency: onRampForm.cryptoAsset,
        type: 'onramp',
        paymentMethod: onRampForm.paymentMethod,
        provider: onRampForm.provider as FiatProvider
      });
    } else {
      if (!offRampForm.amount || !offRampForm.currency || !offRampForm.cryptoAsset) {
        onError?.('Please fill in amount, currency, and crypto asset to get a quote');
        return;
      }

      await getQuote({
        amount: offRampForm.amount,
        fromCurrency: offRampForm.cryptoAsset,
        toCurrency: offRampForm.currency,
        type: 'offramp',
        paymentMethod: offRampForm.paymentMethod,
        provider: offRampForm.provider as FiatProvider
      });
    }
  };

  // ===== Legacy Methods (Fallback) =====
  const legacyCreateOnRampTransaction = async () => {
    if (!onRampForm.amount || !onRampForm.currency || !onRampForm.cryptoAsset) {
      onError?.('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Mock API call - replace with actual DFNS fiat manager integration
      await new Promise(resolve => setTimeout(resolve, 2000));

      const transaction: FiatTransactionResponse = {
        id: `onramp_${Date.now()}`,
        provider: onRampForm.provider as FiatProvider,
        type: 'onramp',
        status: 'pending',
        amount: onRampForm.amount,
        currency: onRampForm.currency,
        cryptoAsset: onRampForm.cryptoAsset,
        walletAddress: onRampForm.walletAddress!,
        paymentMethod: onRampForm.paymentMethod,
        providerTransactionId: `${onRampForm.provider}_${Date.now()}`,
        paymentUrl: `https://app.ramp.network/?userAddress=${onRampForm.walletAddress}&swapAsset=${onRampForm.cryptoAsset}&fiatCurrency=${onRampForm.currency}&fiatValue=${onRampForm.amount}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      onTransactionCreated?.(transaction);

      // Open payment URL in new window
      if (transaction.paymentUrl) {
        window.open(transaction.paymentUrl, '_blank');
      }

      // Reset form
      setOnRampForm({
        ...onRampForm,
        amount: ''
      });

      // Refresh transaction history
      loadTransactionHistory();

    } catch (error) {
      onError?.('Failed to create on-ramp transaction');
    } finally {
      setLoading(false);
    }
  };

  const legacyCreateOffRampTransaction = async () => {
    if (!offRampForm.amount || !offRampForm.currency || !offRampForm.cryptoAsset || !bankAccount.accountNumber) {
      onError?.('Please fill in all required fields including bank account information');
      return;
    }

    setLoading(true);
    try {
      // Mock API call - replace with actual DFNS fiat manager integration
      await new Promise(resolve => setTimeout(resolve, 2000));

      const transaction: FiatTransactionResponse = {
        id: `offramp_${Date.now()}`,
        provider: offRampForm.provider as FiatProvider,
        type: 'offramp',
        status: 'pending',
        amount: offRampForm.amount,
        currency: offRampForm.currency,
        cryptoAsset: offRampForm.cryptoAsset,
        walletAddress: offRampForm.walletAddress!,
        providerTransactionId: `${offRampForm.provider}_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        bankAccount: bankAccount as BankAccountInfo
      };

      onTransactionCreated?.(transaction);

      // Reset forms
      setOffRampForm({
        ...offRampForm,
        amount: ''
      });
      setBankAccount({
        accountNumber: '',
        routingNumber: '',
        accountHolderName: '',
        bankName: '',
        country: 'US',
        currency: 'USD'
      });

      // Refresh transaction history
      loadTransactionHistory();

    } catch (error) {
      onError?.('Failed to create off-ramp transaction');
    } finally {
      setLoading(false);
    }
  };

  // Duplicate function declaration removed - createOffRampTransaction already defined above

  // ===== Quote Display Component =====
  const renderQuoteSection = () => {
    if (!enableQuotes) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Quote className="h-5 w-5" />
            Real-time Quote
          </CardTitle>
          <CardDescription>
            Get instant pricing before completing your transaction
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentQuote ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">You {currentQuote.type === 'onramp' ? 'pay' : 'send'}</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(currentQuote.fromAmount, currentQuote.fromCurrency)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">You {currentQuote.type === 'onramp' ? 'receive' : 'get'}</div>
                  <div className="text-2xl font-bold">
                    {currentQuote.type === 'onramp' 
                      ? `${parseFloat(currentQuote.toAmount).toFixed(6)} ${currentQuote.toCurrency}`
                      : formatCurrency(currentQuote.toAmount, currentQuote.toCurrency)
                    }
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Exchange Rate</span>
                  <span>{currentQuote.exchangeRate.toFixed(6)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Provider Fee</span>
                  <span>{formatCurrency(currentQuote.fees.providerFee.toString(), currentQuote.fees.currency)}</span>
                </div>
                {currentQuote.fees.networkFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Network Fee</span>
                    <span>{formatCurrency(currentQuote.fees.networkFee.toString(), currentQuote.fees.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-medium border-t pt-2">
                  <span>Total Fees</span>
                  <span>{formatCurrency(currentQuote.fees.totalFee.toString(), currentQuote.fees.currency)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Estimated time: {currentQuote.estimatedProcessingTime}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={refreshQuote} disabled={quoteLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${quoteLoading ? 'animate-spin' : ''}`} />
                  Refresh Quote
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentQuote(null)}>
                  Clear Quote
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Quote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Fill in the transaction details above to get a real-time quote</p>
              <Button 
                onClick={handleGetQuote} 
                disabled={quoteLoading}
                variant="outline"
              >
                {quoteLoading ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Getting Quote...
                  </>
                ) : (
                  <>
                    <Quote className="mr-2 h-4 w-4" />
                    Get Quote
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // ===== Enhanced Asset Selection =====
  const renderAssetSelector = (value: string, onChange: (value: string) => void, label: string) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {supportedAssets.filter(asset => asset.enabled).map((asset) => (
            <SelectItem key={asset.symbol} value={asset.symbol}>
              <div className="flex items-center gap-2">
                <img src={asset.logoUrl} alt={asset.name} className="w-4 h-4" />
                <span>{asset.name} ({asset.symbol})</span>
                {asset.price.USD && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    ${asset.price.USD.toFixed(2)}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  // ===== Enhanced Status Badge =====
  const getStatusIcon = (status: FiatTransactionStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: FiatTransactionStatus) => {
    const variants = {
      completed: 'default',
      failed: 'destructive',
      cancelled: 'destructive',
      processing: 'secondary',
      pending: 'secondary'
    } as const;

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const formatCurrency = (amount: string, currency: string) => {
    const currencySymbols = { USD: '$', EUR: '€', GBP: '£', CAD: 'C$' };
    const symbol = currencySymbols[currency as keyof typeof currencySymbols] || currency;
    return `${symbol}${amount}`;
  };

  // ===== Legacy Methods (Fallback) =====
  // Duplicate function declaration removed - legacyCreateOnRampTransaction already defined above

  // Duplicate function declaration removed - legacyCreateOffRampTransaction already defined above

  // Duplicate function declaration removed - loadSupportedOptions already defined above
  // Duplicate function declaration removed - loadTransactionHistory already defined above

  // ===== Cleanup Effect =====
  useEffect(() => {
    return () => {
      // Cleanup event listeners on unmount
      if (rampManager) {
        rampManager.removeEventListener('purchase_created', handleRampPurchaseCreated);
        rampManager.removeEventListener('offramp_sale_created', handleRampSaleCreated);
        rampManager.removeEventListener('widget_close', handleWidgetClose);
        rampManager.removeEventListener('send_crypto_request', handleSendCryptoRequest);
        rampManager.closeWidget();
      }
    };
  }, [rampManager]);

  // ===== Render =====
  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Fiat Integration
          </CardTitle>
          <CardDescription>
            Convert between fiat currencies and crypto through Ramp Network and Mt Pelerin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'onramp' | 'offramp')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="onramp" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Buy Crypto
                {enableNativeFlow && <Zap className="h-3 w-3 text-green-500" aria-label="Native Flow Enabled" />}
              </TabsTrigger>
              <TabsTrigger value="offramp" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Sell Crypto
                {enableNativeFlow && <Zap className="h-3 w-3 text-green-500" aria-label="Native Flow Enabled" />}
              </TabsTrigger>
            </TabsList>

            {/* On-Ramp Tab */}
            <TabsContent value="onramp" className="space-y-6">
              {renderQuoteSection()}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="onramp-amount">Amount</Label>
                  <Input
                    id="onramp-amount"
                    type="number"
                    placeholder="100.00"
                    value={onRampForm.amount}
                    onChange={(e) => {
                      setOnRampForm({ ...onRampForm, amount: e.target.value });
                      setCurrentQuote(null); // Clear quote when amount changes
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="onramp-currency">Fiat Currency</Label>
                  <Select
                    value={onRampForm.currency}
                    onValueChange={(value) => {
                      setOnRampForm({ ...onRampForm, currency: value });
                      setCurrentQuote(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedCurrencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.name} ({currency.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {renderAssetSelector(
                  onRampForm.cryptoAsset || '',
                  (value) => {
                    setOnRampForm({ ...onRampForm, cryptoAsset: value });
                    setCurrentQuote(null);
                  },
                  'Crypto Asset'
                )}

                <div className="space-y-2">
                  <Label htmlFor="onramp-payment">Payment Method</Label>
                  <Select
                    value={onRampForm.paymentMethod}
                    onValueChange={(value) => {
                      setOnRampForm({ ...onRampForm, paymentMethod: value });
                      setCurrentQuote(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedPaymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center gap-2">
                            <span>{method.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {method.type}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="onramp-provider">Provider</Label>
                  <Select
                    value={onRampForm.provider}
                    onValueChange={(value) => setOnRampForm({ ...onRampForm, provider: value as FiatProvider })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ramp_network">
                        <div className="flex items-center gap-2">
                          <span>Ramp Network</span>
                          <Badge variant="default" className="text-xs">Enhanced</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="mt_pelerin">Mt Pelerin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="onramp-wallet">Wallet Address</Label>
                  <Input
                    id="onramp-wallet"
                    value={onRampForm.walletAddress}
                    onChange={(e) => setOnRampForm({ ...onRampForm, walletAddress: e.target.value })}
                    placeholder="0x..."
                  />
                </div>

                {/* Enhanced Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="onramp-email">Email (Optional)</Label>
                  <Input
                    id="onramp-email"
                    type="email"
                    value={onRampForm.userEmail || ''}
                    onChange={(e) => setOnRampForm({ ...onRampForm, userEmail: e.target.value })}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {enableQuotes && (
                  <Button
                    variant="outline"
                    onClick={handleGetQuote}
                    disabled={quoteLoading || !onRampForm.amount || !onRampForm.currency || !onRampForm.cryptoAsset}
                  >
                    {quoteLoading ? (
                      <>
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                        Getting Quote...
                      </>
                    ) : (
                      <>
                        <Quote className="mr-2 h-4 w-4" />
                        Get Quote
                      </>
                    )}
                  </Button>
                )}

                <Button
                  onClick={createOnRampTransaction}
                  disabled={loading || !onRampForm.amount}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Creating Transaction...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Buy Crypto
                      {enableNativeFlow && <Zap className="ml-2 h-4 w-4" />}
                    </>
                  )}
                </Button>
              </div>

              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  {fiatManager ? (
                    <>
                      Enhanced integration with {onRampForm.provider === 'ramp_network' ? 'Ramp Network' : 'Mt Pelerin'}.
                      {enableNativeFlow ? ' Native flow enabled for seamless experience.' : ''}
                      {enableQuotes ? ' Real-time quotes available.' : ''}
                    </>
                  ) : (
                    <>
                      You'll be redirected to {onRampForm.provider === 'ramp_network' ? 'Ramp Network' : 'Mt Pelerin'} to complete your purchase.
                      The crypto will be sent directly to your wallet address.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            </TabsContent>

            {/* Off-Ramp Tab */}
            <TabsContent value="offramp" className="space-y-6">
              {renderQuoteSection()}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="offramp-amount">Crypto Amount</Label>
                  <Input
                    id="offramp-amount"
                    type="number"
                    placeholder="0.1"
                    value={offRampForm.amount}
                    onChange={(e) => {
                      setOffRampForm({ ...offRampForm, amount: e.target.value });
                      setCurrentQuote(null);
                    }}
                  />
                </div>

                {renderAssetSelector(
                  offRampForm.cryptoAsset || '',
                  (value) => {
                    setOffRampForm({ ...offRampForm, cryptoAsset: value });
                    setCurrentQuote(null);
                  },
                  'Crypto Asset'
                )}

                <div className="space-y-2">
                  <Label htmlFor="offramp-currency">Fiat Currency</Label>
                  <Select
                    value={offRampForm.currency}
                    onValueChange={(value) => {
                      setOffRampForm({ ...offRampForm, currency: value });
                      setCurrentQuote(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedCurrencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.name} ({currency.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offramp-provider">Provider</Label>
                  <Select
                    value={offRampForm.provider}
                    onValueChange={(value) => setOffRampForm({ ...offRampForm, provider: value as FiatProvider })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ramp_network">
                        <div className="flex items-center gap-2">
                          <span>Ramp Network</span>
                          <Badge variant="default" className="text-xs">Enhanced</Badge>
                          {enableNativeFlow && <Zap className="h-3 w-3 text-green-500" />}
                        </div>
                      </SelectItem>
                      <SelectItem value="mt_pelerin">Mt Pelerin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offramp-email">Email (Optional)</Label>
                  <Input
                    id="offramp-email"
                    type="email"
                    value={offRampForm.userEmail || ''}
                    onChange={(e) => setOffRampForm({ ...offRampForm, userEmail: e.target.value })}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  Bank Account Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="account-holder">Account Holder Name</Label>
                    <Input
                      id="account-holder"
                      value={bankAccount.accountHolderName}
                      onChange={(e) => setBankAccount({ ...bankAccount, accountHolderName: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bank-name">Bank Name</Label>
                    <Input
                      id="bank-name"
                      value={bankAccount.bankName}
                      onChange={(e) => setBankAccount({ ...bankAccount, bankName: e.target.value })}
                      placeholder="Chase Bank"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account-number">Account Number</Label>
                    <Input
                      id="account-number"
                      value={bankAccount.accountNumber}
                      onChange={(e) => setBankAccount({ ...bankAccount, accountNumber: e.target.value })}
                      placeholder="1234567890"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="routing-number">Routing Number / IBAN</Label>
                    <Input
                      id="routing-number"
                      value={bankAccount.routingNumber || bankAccount.iban}
                      onChange={(e) => setBankAccount({ ...bankAccount, routingNumber: e.target.value, iban: e.target.value })}
                      placeholder="021000021 or GB29 NWBK 6016 1331 9268 19"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select
                      value={bankAccount.country}
                      onValueChange={(value) => setBankAccount({ ...bankAccount, country: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">🇺🇸 United States</SelectItem>
                        <SelectItem value="GB">🇬🇧 United Kingdom</SelectItem>
                        <SelectItem value="DE">🇩🇪 Germany</SelectItem>
                        <SelectItem value="FR">🇫🇷 France</SelectItem>
                        <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                        <SelectItem value="AU">🇦🇺 Australia</SelectItem>
                        <SelectItem value="CH">🇨🇭 Switzerland</SelectItem>
                        <SelectItem value="NL">🇳🇱 Netherlands</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bank-currency">Bank Currency</Label>
                    <Select
                      value={bankAccount.currency}
                      onValueChange={(value) => setBankAccount({ ...bankAccount, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {supportedCurrencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.name} ({currency.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {enableQuotes && (
                  <Button
                    variant="outline"
                    onClick={handleGetQuote}
                    disabled={quoteLoading || !offRampForm.amount || !offRampForm.currency || !offRampForm.cryptoAsset}
                  >
                    {quoteLoading ? (
                      <>
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                        Getting Quote...
                      </>
                    ) : (
                      <>
                        <Quote className="mr-2 h-4 w-4" />
                        Get Quote
                      </>
                    )}
                  </Button>
                )}

                <Button
                  onClick={createOffRampTransaction}
                  disabled={loading || !offRampForm.amount || !bankAccount.accountNumber}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Creating Transaction...
                    </>
                  ) : (
                    <>
                      <Banknote className="mr-2 h-4 w-4" />
                      Sell Crypto
                      {enableNativeFlow && <Zap className="ml-2 h-4 w-4" />}
                    </>
                  )}
                </Button>
              </div>

              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  {fiatManager ? (
                    <>
                      Enhanced off-ramp with {offRampForm.provider === 'ramp_network' ? 'Ramp Network' : 'Mt Pelerin'}.
                      {enableNativeFlow ? ' Native flow enabled - crypto will be sent directly from your wallet.' : ' You\'ll need to send crypto to the provided address.'}
                      {enableQuotes ? ' Real-time quotes available.' : ''}
                    </>
                  ) : (
                    <>
                      You'll need to send your crypto to the provided address. The fiat will be transferred to your bank account within the estimated timeframe.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>

          {/* Enhanced Transaction History */}
          {transactions.length > 0 && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Transactions
                </h3>
                <Button variant="outline" size="sm" onClick={loadTransactionHistory}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <Card key={transaction.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(transaction.status)}
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {transaction.type === 'onramp' ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              )}
                              {transaction.type === 'onramp' ? 'Buy' : 'Sell'} {transaction.cryptoAsset}
                              {fiatManager && transaction.provider === 'ramp_network' && (
                                <Badge variant="default" className="text-xs">Enhanced</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(transaction.amount, transaction.currency)} via {transaction.provider}
                            </div>
                            {(transaction.rampPurchaseId || transaction.rampSaleId) && (
                              <div className="text-xs text-muted-foreground">
                                ID: {transaction.rampPurchaseId || transaction.rampSaleId}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(transaction.status)}
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(transaction.createdAt).toLocaleDateString()} {new Date(transaction.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      {transaction.paymentUrl && (
                        <div className="mt-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={transaction.paymentUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Complete Payment
                            </a>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DfnsFiatIntegration;
