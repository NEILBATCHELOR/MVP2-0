import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CreditCard, TrendingUp, TrendingDown, ExternalLink, CheckCircle, AlertCircle, Info, Banknote, ArrowUpDown, Image as ImageIcon, BarChart3, Users } from "lucide-react";
import { 
  moonPayServices,
  OnRampCurrency as MoonpayCurrency,
  PaymentMethod as MoonpayPaymentMethod,
  OnRampLimits as MoonpayLimits
} from "@/services/wallet/moonpay";
import type { 
  MoonpayQuote, 
  MoonpayTransaction
} from "@/services/wallet/moonpay/types";
import { 
  getQuoteDisplayAmount as getDisplayAmount,
  normalizeTransaction as normalizeTransactionData
} from "@/services/wallet/moonpay/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWallet } from "@/services/wallet/WalletContext";

// Import the new enhanced components
import NFTMarketplace from "./NFTMarketplace";
import SwapInterface from "./SwapInterface";
import AnalyticsDashboard from "./AnalyticsDashboard";
import CustomerManagement from "./CustomerManagement";

interface MoonpayIntegrationProps {
  onTransactionComplete?: (transaction: MoonpayTransaction) => void;
}

type TransactionType = 'buy' | 'sell';
type IntegrationStep = 'form' | 'quote' | 'payment' | 'processing' | 'success' | 'error';
type ActiveTab = 'trade' | 'swap' | 'nft' | 'analytics' | 'customers';

const POPULAR_CRYPTO_CURRENCIES = [
  { code: 'btc', name: 'Bitcoin', symbol: '₿', icon: '🟠' },
  { code: 'eth', name: 'Ethereum', symbol: 'Ξ', icon: '🔷' },
  { code: 'usdc', name: 'USD Coin', symbol: 'USDC', icon: '🔵' },
  { code: 'usdt', name: 'Tether', symbol: 'USDT', icon: '🟢' },
  { code: 'ada', name: 'Cardano', symbol: 'ADA', icon: '🔵' },
  { code: 'dot', name: 'Polkadot', symbol: 'DOT', icon: '🔴' },
  { code: 'matic', name: 'Polygon', symbol: 'MATIC', icon: '🟣' },
  { code: 'sol', name: 'Solana', symbol: 'SOL', icon: '🟢' }
];

const FIAT_CURRENCIES = [
  { code: 'usd', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'eur', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'gbp', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'cad', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'aud', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'jpy', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' }
];

export const MoonpayIntegration: React.FC<MoonpayIntegrationProps> = ({ onTransactionComplete }) => {
  const { wallets } = useWallet();
  
  // State management
  const [activeTab, setActiveTab] = useState<ActiveTab>('trade');
  const [step, setStep] = useState<IntegrationStep>('form');
  const [transactionType, setTransactionType] = useState<TransactionType>('buy');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [cryptoCurrency, setCryptoCurrency] = useState<string>('btc');
  const [fiatCurrency, setFiatCurrency] = useState<string>('usd');
  const [amount, setAmount] = useState<string>('');
  const [amountType, setAmountType] = useState<'fiat' | 'crypto'>('fiat');
  const [walletAddress, setWalletAddress] = useState<string>('');

  // Data state
  const [supportedCurrencies, setSupportedCurrencies] = useState<MoonpayCurrency[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<MoonpayPaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [quote, setQuote] = useState<MoonpayQuote | null>(null);
  const [limits, setLimits] = useState<MoonpayLimits | null>(null);
  const [transaction, setTransaction] = useState<MoonpayTransaction | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (amount && cryptoCurrency && fiatCurrency) {
      debouncedGetQuote();
    }
  }, [amount, cryptoCurrency, fiatCurrency, transactionType, amountType]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [currencies, methods] = await Promise.all([
        moonPayServices.onRamp.getSupportedCurrencies(),
        moonPayServices.onRamp.getPaymentMethods(fiatCurrency, cryptoCurrency)
      ]);
      
      setSupportedCurrencies(currencies);
      setPaymentMethods(methods);
      
      if (methods.length > 0) {
        setSelectedPaymentMethod(methods[0].id);
      }
    } catch (err) {
      setError('Failed to load Moonpay data');
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedGetQuote = debounce(getQuote, 1000);

  async function getQuote() {
    if (!amount || parseFloat(amount) <= 0) return;

    setIsLoading(true);
    setError('');

    try {
      let quoteResult: MoonpayQuote;
      
      if (transactionType === 'buy') {
        if (amountType === 'fiat') {
          quoteResult = await moonPayServices.onRamp.getBuyQuote(fiatCurrency, cryptoCurrency, parseFloat(amount));
        } else {
          quoteResult = await moonPayServices.onRamp.getBuyQuote(fiatCurrency, cryptoCurrency, undefined, parseFloat(amount));
        }
      } else {
        if (amountType === 'crypto') {
          quoteResult = await moonPayServices.offRamp.getSellQuote(cryptoCurrency, fiatCurrency, parseFloat(amount));
        } else {
          quoteResult = await moonPayServices.offRamp.getSellQuote(cryptoCurrency, fiatCurrency, undefined, parseFloat(amount));
        }
      }
      
      setQuote(quoteResult);
      
      // Get limits for the selected currency pair
      const limitsResult = await moonPayServices.onRamp.getCustomerLimits(
        transactionType === 'buy' ? fiatCurrency : cryptoCurrency,
        transactionType === 'buy' ? cryptoCurrency : fiatCurrency,
        selectedPaymentMethod
      );
      setLimits(limitsResult);
      
    } catch (err) {
      setError(err.message);
      setQuote(null);
    } finally {
      setIsLoading(false);
    }
  }

  const handleProceedToPayment = async () => {
    if (!walletAddress) {
      setError('Please enter a wallet address');
      return;
    }
    
    // Import validators to check wallet address
    const { validateWalletAddress } = await import('@/services/wallet/moonpay/utils/validators');
    if (!validateWalletAddress(walletAddress, cryptoCurrency)) {
      setError('Invalid wallet address for selected cryptocurrency');
      return;
    }

    setStep('payment');
  };

  const handleExecuteTransaction = async () => {
    if (!quote || !walletAddress) return;

    setIsLoading(true);
    setStep('processing');

    try {
      let result: MoonpayTransaction;
      
      if (transactionType === 'buy') {
        result = await moonPayServices.onRamp.createBuyTransaction(
          cryptoCurrency,
          fiatCurrency,
          quote.baseAmount,
          walletAddress,
          window.location.origin + '/wallet?tab=moonpay&status=complete'
        );
      } else {
        result = await moonPayServices.offRamp.createSellTransaction(
          fiatCurrency,
          cryptoCurrency,
          quote.baseAmount,
          walletAddress,
          window.location.origin + '/wallet?tab=moonpay&status=complete'
        );
      }

      setTransaction(result);
      setStep('success');
      
      if (onTransactionComplete) {
        onTransactionComplete(result);
      }
    } catch (err) {
      setError(err.message);
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenWidget = () => {
    if (!walletAddress) {
      setError('Please enter a wallet address');
      return;
    }

    const widgetUrl = moonPayServices.onRamp.generateWidgetUrl(
      cryptoCurrency,
      walletAddress,
      quote?.baseAmount,
      fiatCurrency,
      '#6366f1', // Indigo color
      'en',
      window.location.origin + '/wallet?tab=moonpay&status=complete'
    );

    window.open(widgetUrl, '_blank', 'width=800,height=600');
  };

  const resetForm = () => {
    setStep('form');
    setAmount('');
    setWalletAddress('');
    setQuote(null);
    setTransaction(null);
    setError('');
  };

  const getCryptoInfo = (code: string) => {
    return POPULAR_CRYPTO_CURRENCIES.find(c => c.code === code) || 
           { code, name: code.toUpperCase(), symbol: code.toUpperCase(), icon: '🪙' };
  };

  const getFiatInfo = (code: string) => {
    return FIAT_CURRENCIES.find(f => f.code === code) || 
           { code, name: code.toUpperCase(), symbol: code.toUpperCase(), flag: '💰' };
  };

  const renderTransactionTypeSelector = () => (
    <Tabs value={transactionType} onValueChange={(value: TransactionType) => setTransactionType(value)}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="buy" className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Buy Crypto
        </TabsTrigger>
        <TabsTrigger value="sell" className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4" />
          Sell Crypto
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );

  const renderCurrencySelector = () => (
    <div className="space-y-4">
      {/* Crypto Currency */}
      <div className="space-y-2">
        <Label>Cryptocurrency</Label>
        <Select value={cryptoCurrency} onValueChange={setCryptoCurrency}>
          <SelectTrigger>
            <SelectValue>
              <div className="flex items-center gap-2">
                <span>{getCryptoInfo(cryptoCurrency).icon}</span>
                <span>{getCryptoInfo(cryptoCurrency).symbol}</span>
                <span className="text-muted-foreground">{getCryptoInfo(cryptoCurrency).name}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {POPULAR_CRYPTO_CURRENCIES.map((crypto) => (
              <SelectItem key={crypto.code} value={crypto.code}>
                <div className="flex items-center gap-2">
                  <span>{crypto.icon}</span>
                  <span>{crypto.symbol}</span>
                  <span className="text-muted-foreground">{crypto.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Fiat Currency */}
      <div className="space-y-2">
        <Label>Fiat Currency</Label>
        <Select value={fiatCurrency} onValueChange={setFiatCurrency}>
          <SelectTrigger>
            <SelectValue>
              <div className="flex items-center gap-2">
                <span>{getFiatInfo(fiatCurrency).flag}</span>
                <span>{getFiatInfo(fiatCurrency).symbol}</span>
                <span className="text-muted-foreground">{getFiatInfo(fiatCurrency).name}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {FIAT_CURRENCIES.map((fiat) => (
              <SelectItem key={fiat.code} value={fiat.code}>
                <div className="flex items-center gap-2">
                  <span>{fiat.flag}</span>
                  <span>{fiat.symbol}</span>
                  <span className="text-muted-foreground">{fiat.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderAmountInput = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          Amount
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter amount in {amountType === 'fiat' ? 'fiat' : 'crypto'} currency</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Select value={amountType} onValueChange={(value: 'fiat' | 'crypto') => setAmountType(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fiat">
                {getFiatInfo(fiatCurrency).symbol}
              </SelectItem>
              <SelectItem value="crypto">
                {getCryptoInfo(cryptoCurrency).symbol}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Limits Display */}
      {limits && (
        <div className="text-sm text-muted-foreground space-y-1">
          <div>Daily limits: {getFiatInfo(fiatCurrency).symbol}{limits.daily.min} - {getFiatInfo(fiatCurrency).symbol}{limits.daily.max}</div>
          <div>Monthly limits: {getFiatInfo(fiatCurrency).symbol}{limits.monthly.min} - {getFiatInfo(fiatCurrency).symbol}{limits.monthly.max}</div>
        </div>
      )}
    </div>
  );

  const renderWalletInput = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Wallet Address</Label>
        <div className="space-y-2">
          <Input
            placeholder={`Enter your ${getCryptoInfo(cryptoCurrency).name} address`}
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
          />
          
          {/* Quick select from connected wallets */}
          {wallets.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Or select from your wallets:</Label>
              <div className="grid grid-cols-1 gap-2">
                {wallets.slice(0, 3).map((wallet) => (
                  <Button
                    key={wallet.id}
                    variant="outline"
                    size="sm"
                    onClick={() => setWalletAddress(wallet.address)}
                    className="justify-start text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{wallet.name}</span>
                      <span className="text-muted-foreground font-mono text-xs">
                        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPaymentMethodSelector = () => (
    <div className="space-y-2">
      <Label>Payment Method</Label>
      <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {paymentMethods.map((method) => (
            <SelectItem key={method.id} value={method.id}>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>{method.name}</span>
                {method.limits && (
                  <Badge variant="outline" className="text-xs">
                    ${method.limits.daily.min}-${method.limits.daily.max}/day
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderFormStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Moonpay</span>
          <Badge variant="secondary">Fiat Gateway</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderTransactionTypeSelector()}
        {renderCurrencySelector()}
        {renderAmountInput()}
        {renderWalletInput()}
        {transactionType === 'buy' && renderPaymentMethodSelector()}

        {/* Quote Preview */}
        {quote && (
          <div className="bg-muted p-4 rounded-lg space-y-2">
            {(() => {
              const display = getDisplayAmount(quote, transactionType);
              return (
                <>
                  <div className="flex justify-between text-sm">
                    <span>You {transactionType === 'buy' ? 'pay' : 'sell'}</span>
                    <span className="font-medium">
                      {display.youPay.amount} {display.youPay.currency.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>You {transactionType === 'buy' ? 'receive' : 'receive'}</span>
                    <span className="font-medium">
                      {display.youReceive.amount} {display.youReceive.currency.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Network fee</span>
                    <span>{getFiatInfo(fiatCurrency).symbol}{quote.fees.network}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Moonpay fee</span>
                    <span>{getFiatInfo(fiatCurrency).symbol}{quote.fees.moonpay}</span>
                  </div>
                  {display.total.amount !== undefined && (
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>{display.total.amount} {display.total.currency.toUpperCase()}</span>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleProceedToPayment}
            disabled={!quote || !walletAddress || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              'Continue'
            )}
          </Button>
          <Button 
            variant="outline"
            onClick={handleOpenWidget}
            disabled={!walletAddress}
            className="px-3"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderPaymentStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Transaction Type</span>
            <Badge variant={transactionType === 'buy' ? 'default' : 'secondary'}>
              {transactionType === 'buy' ? 'Buy' : 'Sell'} {getCryptoInfo(cryptoCurrency).symbol}
            </Badge>
          </div>
          {quote && (() => {
            const display = getDisplayAmount(quote, transactionType);
            return (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">
                    {display.youReceive.amount} {display.youReceive.currency.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost</span>
                  <span className="font-medium">
                    {display.total.amount !== undefined 
                      ? `${display.total.amount} ${display.total.currency.toUpperCase()}`
                      : `${display.youPay.amount} ${display.youPay.currency.toUpperCase()}`
                    }
                  </span>
                </div>
              </>
            );
          })()}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Wallet</span>
            <span className="font-mono text-sm">
              {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
            </span>
          </div>
          {selectedPaymentMethod && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="font-medium">
                {paymentMethods.find(p => p.id === selectedPaymentMethod)?.name}
              </span>
            </div>
          )}
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You will be redirected to Moonpay to complete the payment securely.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep('form')} className="flex-1">
            Back
          </Button>
          <Button onClick={handleExecuteTransaction} className="flex-1">
            <Banknote className="mr-2 h-4 w-4" />
            Pay with Moonpay
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderProcessingStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Processing Transaction</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-4 py-6">
          <Loader2 className="h-12 w-12 animate-spin" />
          <div className="text-center">
            <div className="font-medium">Creating transaction...</div>
            <div className="text-sm text-muted-foreground mt-1">
              Please wait while we set up your transaction
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
          Transaction Created
          <CheckCircle className="h-5 w-5 text-green-500" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
          <div className="text-center">
            <div className="font-medium">Transaction successfully created!</div>
            <div className="text-sm text-muted-foreground mt-1">
              Complete your payment on Moonpay
            </div>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Transaction ID</span>
          </div>
          <div className="font-mono text-sm break-all">
            {transaction?.id}
          </div>
          {transaction && (() => {
            const normalizedTx = normalizeTransactionData(transaction);
            return (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline">{normalizedTx.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <Badge variant={transactionType === 'buy' ? 'default' : 'secondary'}>
                    {transactionType}
                  </Badge>
                </div>
              </>
            );
          })()}
        </div>

        {transaction && (() => {
          const normalizedTx = normalizeTransactionData(transaction);
          return normalizedTx.redirectUrl ? (
            <Button asChild className="w-full">
              <a href={normalizedTx.redirectUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Complete Payment
              </a>
            </Button>
          ) : null;
        })()}

        <Button variant="outline" onClick={resetForm} className="w-full">
          Start New Transaction
        </Button>
      </CardContent>
    </Card>
  );

  const renderErrorStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Transaction Failed
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
    <div className="w-full max-w-7xl mx-auto p-4">
      {/* Main Navigation */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Moonpay Integration</h1>
            <p className="text-muted-foreground">Complete cryptocurrency and NFT platform</p>
          </div>
          <Badge variant="secondary" className="px-3 py-1">
            🌙 Powered by Moonpay
          </Badge>
        </div>
        
        <Tabs value={activeTab} onValueChange={(value: ActiveTab) => setActiveTab(value)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="trade" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Buy/Sell
            </TabsTrigger>
            <TabsTrigger value="swap" className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4" />
              Swap
            </TabsTrigger>
            <TabsTrigger value="nft" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              NFTs
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Customers
            </TabsTrigger>
          </TabsList>
          
          {/* Buy/Sell Tab */}
          <TabsContent value="trade" className="mt-6">
            {activeTab === 'trade' && (
              <>
                {step === 'form' && renderFormStep()}
                {step === 'payment' && renderPaymentStep()}
                {step === 'processing' && renderProcessingStep()}
                {step === 'success' && renderSuccessStep()}
                {step === 'error' && renderErrorStep()}
              </>
            )}
          </TabsContent>
          
          {/* Swap Tab */}
          <TabsContent value="swap" className="mt-6">
            <SwapInterface 
              onSwapCompleted={(swapTransaction) => {
                console.log('Swap completed:', swapTransaction);
                // Handle swap completion
              }}
            />
          </TabsContent>
          
          {/* NFT Tab */}
          <TabsContent value="nft" className="mt-6">
            <NFTMarketplace 
              onPassMinted={(pass) => {
                console.log('Pass minted:', pass);
                // Handle NFT pass minting
              }}
              onPassTransferred={(pass) => {
                console.log('Pass transferred:', pass);
                // Handle NFT pass transfer
              }}
            />
          </TabsContent>
          
          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <AnalyticsDashboard />
          </TabsContent>
          
          {/* Customer Management Tab */}
          <TabsContent value="customers" className="mt-6">
            <CustomerManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export default MoonpayIntegration;
